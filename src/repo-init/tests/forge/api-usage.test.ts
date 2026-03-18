/**
 * Backend API usage pattern tests
 *
 * Validates that backend code follows Forge API best practices:
 * - Uses route template macro or assumeTrustedRoute for API endpoints
 * - Uses api.asUser() or api.asApp() for authorization
 * - Uses relative paths, not absolute URLs
 * - Declares `storage:app` when `@forge/kvs` is used
 *
 * @see {@link https://developer.atlassian.com/platform/forge/apis-reference/product-rest-api-reference/|REST API Reference}
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/product-fetch-api/|Product fetch API}
 * @see {@link https://developer.atlassian.com/platform/forge/add-scopes-to-call-an-atlassian-rest-api/|Add scopes}
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-custom-entities/|Hosted storage overview}
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  findImports,
  parseSourceFile,
  scanFileForApiViolations,
} from "./ast-helpers";
import { getAllTypeScriptFiles } from "./filesystem-helpers";
import { getManifestScopes, loadManifest } from "./manifest-helpers";

describe("API Usage Patterns", () => {
  const srcPath = path.join(process.cwd(), "src");

  it("should use route template macro for backend API requests", () => {
    const files = getAllTypeScriptFiles(srcPath);

    for (const file of files) {
      // Skip frontend files - they use @forge/bridge, not @forge/api
      if (file.includes("/frontend/")) {
        continue;
      }

      const content = fs.readFileSync(file, "utf-8");

      // Check for requestJira, requestConfluence, requestGraph usage from @forge/api
      const hasApiRequest =
        (content.includes("requestJira") ||
          content.includes("requestConfluence") ||
          content.includes("requestGraph")) &&
        content.includes("@forge/api");

      if (hasApiRequest) {
        // File should import 'route' or 'assumeTrustedRoute' from @forge/api
        expect(
          content,
          `File ${file} uses API requests but doesn't import 'route' or 'assumeTrustedRoute' from @forge/api`,
        ).toMatch(
          /import.*(route|assumeTrustedRoute).*from\s+["']@forge\/api["']/,
        );

        // Should use route template (backticks with route prefix) or assumeTrustedRoute
        expect(
          content,
          `File ${file} should use route template macro (route\`...\`) or assumeTrustedRoute(...) for API endpoints`,
        ).toMatch(/(route`|assumeTrustedRoute\()/);
      }
    }
  });

  it("should use api.asUser() or api.asApp() for backend API requests", () => {
    const files = getAllTypeScriptFiles(srcPath);

    for (const file of files) {
      // Skip frontend files - they use @forge/bridge with requestJira directly
      if (file.includes("/frontend/")) {
        continue;
      }

      const content = fs.readFileSync(file, "utf-8");

      // Skip files that don't use @forge/api
      if (!content.includes("@forge/api")) {
        continue;
      }

      // Check that API requests use .asUser() or .asApp()
      // This is whitespace-insensitive by normalizing whitespace before checking

      // Get all method calls (both valid and invalid)
      const allMethodCalls = Array.from(
        content.matchAll(/request(Jira|Confluence)/g),
      );

      for (const methodMatch of allMethodCalls) {
        const methodName = `request${methodMatch[1]}`;
        const matchIndex = methodMatch.index || 0;

        // Get the line number for error reporting
        const lineNum = content.substring(0, matchIndex).split("\n").length;
        const lineContent = content.split("\n")[lineNum - 1];

        // Skip comments and imports
        if (
          lineContent.trim().startsWith("//") ||
          lineContent.includes("import")
        ) {
          continue;
        }

        // Check if this method call is preceded by .asUser() or .asApp()
        // Use normalized whitespace for the check (remove all whitespace)
        const contextStart = Math.max(0, matchIndex - 200);
        const context = content.substring(
          contextStart,
          matchIndex + methodName.length,
        );
        const normalizedContext = context.replace(/\s+/g, "");

        const hasValidAuth =
          normalizedContext.includes(`.asUser().${methodName}`) ||
          normalizedContext.includes(`.asApp().${methodName}`);

        expect(
          hasValidAuth,
          `File ${file}, line ${lineNum}: Use api.asUser().${methodName}() or api.asApp().${methodName}() - whitespace between method calls is allowed.\nLine: ${lineContent.trim()}`,
        ).toBe(true);
      }
    }
  });

  it("should use relative paths, not absolute URLs", () => {
    const files = getAllTypeScriptFiles(srcPath).filter(
      (file) => !file.includes(`${path.sep}frontend${path.sep}`),
    );
    const violations = files.flatMap(scanFileForApiViolations);

    expect(
      violations,
      `Found absolute URLs passed to requestJira/requestBitbucket/requestConfluence or assumeTrustedRoute:\n${violations.join("\n\n")}`,
    ).toEqual([]);
  });

  it("should declare storage:app when @forge/kvs is used", () => {
    const manifest = loadManifest();
    const manifestScopes = new Set(getManifestScopes(manifest));
    const files = getAllTypeScriptFiles(srcPath);

    const kvsImports = files.flatMap((file) => {
      const sourceFile = parseSourceFile(file);
      const imports = findImports(sourceFile, "@forge/kvs");

      return imports.map((entry) => ({
        file,
        line: entry.line,
      }));
    });

    if (kvsImports.length === 0) {
      expect(kvsImports).toEqual([]);
      return;
    }

    expect(
      manifestScopes.has("storage:app"),
      `The manifest must declare storage:app when @forge/kvs is used. Found @forge/kvs imports at:\n${kvsImports
        .map((entry) => `${entry.file}: line ${entry.line}`)
        .join("\n")}`,
    ).toBe(true);
  });
});
