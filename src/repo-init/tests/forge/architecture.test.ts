/**
 * Forge Architecture Tests
 *
 * - Transitive dependency rules: Frontend shouldn't import modules that depend on @forge/api
 * - Transitive dependency rules: Resolvers shouldn't import modules that depend on @forge/bridge
 * - General separation of concerns between frontend and backend
 * - Circular dependency prevention
 * - Storage API boundaries: Frontend cannot access Forge storage APIs (must use REST APIs)
 *
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/|Forge Resolver}
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/forge-bridge/|Forge Bridge}
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/|Storage API}
 * @see {@link https://developer.atlassian.com/platform/forge/add-content-security-and-egress-controls/|Permissions & Security}
 */

import { type ProjectFiles, projectFiles } from "archunit";
import { beforeAll, describe, expect, it } from "vitest";

describe("Forge Architecture", () => {
  // Cache projectFiles() result to speed up tests
  // This scans the filesystem once instead of per-test
  let cachedProjectFiles: ProjectFiles;

  beforeAll(() => {
    cachedProjectFiles = projectFiles();
  });

  describe("transitive dependencies on @forge libraries", () => {
    it("frontend should not import any local modules that use @forge/api", async () => {
      // General rule: Frontend files shouldn't import from any module that
      // depends on @forge/api (backend-only package). This prevents frontend
      // from accidentally importing server-side code that won't be available in the browser.
      const rule = cachedProjectFiles
        .inFolder("src/frontend/**")
        .should()
        .adhereTo((file) => {
          // Check if frontend imports any local modules (relative paths)
          const importedModules = extractLocalImports(file.content);

          // Frontend should only import from itself or shared UI utilities
          // Any import that goes up to parent directories could import backend code
          for (const importedModule of importedModules) {
            if (importedModule.startsWith("../")) {
              // Allow imports from src/util/** (shared utilities)
              if (importedModule.startsWith("../util/")) {
                continue;
              }
              // Importing from parent directory - potential backend code
              return false;
            }
          }

          return true;
        }, "Frontend should not import from modules outside src/frontend/** (may depend on @forge/api)");

      await expect(rule).toPassAsync();
    });

    it("resolvers should not import any modules that use @forge/bridge", async () => {
      // General rule: Resolver files shouldn't import from any module that
      // depends on @forge/bridge (client-side only package). This prevents
      // resolvers from accidentally importing client-side code.
      const rule = cachedProjectFiles
        .inFolder("src/resolvers/**")
        .should()
        .adhereTo((file) => {
          // Check if resolvers import from frontend directory
          const importedModules = extractLocalImports(file.content);

          for (const importedModule of importedModules) {
            // Resolvers should never import from frontend
            if (importedModule.includes("frontend")) {
              return false;
            }
          }

          return true;
        }, "Resolvers should not import from frontend modules (may depend on @forge/bridge)");

      await expect(rule).toPassAsync();
    });
  });

  describe("structural rules", () => {
    it("source code should be cycle free", async () => {
      // General rule: No circular dependencies in source code
      const rule = cachedProjectFiles
        .inFolder("src/**")
        .should()
        .haveNoCycles();

      await expect(rule).toPassAsync();
    });

    it("frontend should not import from resolvers", async () => {
      // General rule: Frontend code (UI Kit) should never import from
      // resolver functions (backend)
      const rule = cachedProjectFiles
        .inFolder("src/frontend/**")
        .shouldNot()
        .dependOnFiles()
        .inFolder("src/resolvers/**");

      await expect(rule).toPassAsync();
    });

    it("resolvers should not import from frontend", async () => {
      // General rule: Resolver functions (backend) should never import
      // from frontend code (UI Kit)
      const rule = cachedProjectFiles
        .inFolder("src/resolvers/**")
        .shouldNot()
        .dependOnFiles()
        .inFolder("src/frontend/**");

      await expect(rule).toPassAsync();
    });
  });

  describe("egress and fetch boundaries", () => {
    it("backend code should use api.fetch() for external HTTP calls", async () => {
      // General rule: Backend functions (resolvers, queue consumers) that make
      // external HTTP calls must use api.fetch() from @forge/api, not the
      // native fetch() API. The native fetch() is not available in the Forge
      // runtime and will cause failures at runtime.
      //
      // This rule applies to:
      // - src/resolvers/** (resolver functions)
      // - src/external/** (external API clients used by resolvers/queue consumers)
      // - src/import-lifecycle/** (import lifecycle functions running on Forge runtime)
      const rule = cachedProjectFiles
        .inFolder("src/{resolvers,external,import-lifecycle}/**")
        .should()
        .adhereTo((file) => {
          const content = file.content;

          // Skip test files
          if (file.path.includes(".test.") || file.path.includes(".spec.")) {
            return true;
          }

          // Check if file makes HTTP calls using native fetch()
          // Pattern: "await fetch(" or "fetch(" not preceded by "api."
          const nativeFetchPattern = /(?<!api\.)fetch\s*\(/g;

          if (nativeFetchPattern.test(content)) {
            return false;
          }

          return true;
        }, "Backend code should use api.fetch() from @forge/api for external HTTP calls, not native fetch()");

      await expect(rule).toPassAsync();
    });
  });

  describe("storage API boundaries", () => {
    it("frontend should not access Forge storage APIs", async () => {
      // General rule: Client-side code (frontend) cannot use Forge storage APIs.
      // Storage APIs (Forge SQL, Key-Value Storage, Custom Entities) are
      // backend-only and must be called with .asApp() from resolvers.
      // Frontend must use REST APIs instead.
      const rule = cachedProjectFiles
        .inFolder("src/frontend/**")
        .should()
        .adhereTo((file) => {
          const content = file.content;

          // Check for forbidden Forge storage API patterns
          const forbiddenPatterns = [
            /storage\./,
            /Storage\./,
            /@forge\/api.*storage/,
            /from\s+["']@forge\/api["']/,
          ];

          for (const pattern of forbiddenPatterns) {
            if (pattern.test(content)) {
              return false;
            }
          }

          return true;
        }, "Frontend should not access Forge storage APIs (@forge/api storage, Forge SQL, KV, Custom Entities)");

      await expect(rule).toPassAsync();
    });
  });
});

/**
 * Helper function to extract local import paths from file content
 * Returns an array of relative import paths like "../assets", "./types", etc.
 */
function extractLocalImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;

  let match: RegExpExecArray | null = importRegex.exec(content);
  while (match !== null) {
    imports.push(match[1]);
    match = importRegex.exec(content);
  }

  return imports;
}
