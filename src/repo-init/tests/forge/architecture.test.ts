/**
 * Forge Architecture Tests
 *
 * - Transitive dependency rules: Frontend shouldn't import modules that depend on @forge/api
 * - Transitive dependency rules: Resolvers shouldn't import modules that depend on @forge/bridge
 * - General separation of concerns between frontend and backend
 * - Circular dependency prevention
 * - Runtime boundary checks for fetch and storage usage
 *
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/|Forge resolver}
 * @see {@link https://developer.atlassian.com/platform/forge/apis-reference/ui-api-bridge/bridge/|Forge bridge}
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/fetch-api/|Fetch API}
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/|Storage API}
 * @see {@link https://developer.atlassian.com/platform/forge/add-content-security-and-egress-controls/|Permissions and security}
 */

import { type ProjectFiles, projectFiles } from "archunit";
import ts from "typescript";
import { beforeAll, describe, expect, it } from "vitest";
import {
  findCallExpressions,
  findImports,
  findLocalImports,
  parseSourceFile,
} from "./ast-helpers";

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
          const importedModules = findLocalImports(parseSourceFile(file.path));

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
          const importedModules = findLocalImports(parseSourceFile(file.path));

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
          if (file.path.includes(".test.") || file.path.includes(".spec.")) {
            return true;
          }

          const sourceFile = parseSourceFile(file.path);
          const nativeFetchCalls = findCallExpressions(
            sourceFile,
            (callName, node) => {
              if (callName !== "fetch") {
                return false;
              }
              return !(
                ts.isPropertyAccessExpression(node.expression) &&
                node.expression.expression.getText(sourceFile) === "api"
              );
            },
          );

          return nativeFetchCalls.length === 0;
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
          const sourceFile = parseSourceFile(file.path);
          const forgeApiImports = findImports(sourceFile, "@forge/api");
          const forgeKvsImports = findImports(sourceFile, "@forge/kvs");

          return forgeApiImports.length === 0 && forgeKvsImports.length === 0;
        }, "Frontend should not access Forge storage APIs (@forge/api storage, Forge SQL, KV, Custom Entities)");

      await expect(rule).toPassAsync();
    });
  });
});
