/**
 * Repository-wide import restriction tests
 *
 * Validates that deprecated or forbidden packages are not imported
 * across the entire codebase:
 * - @forge/ui (deprecated, use @forge/react instead)
 * - storage from @forge/api (deprecated, use @forge/kvs instead)
 *
 * @see {@link https://developer.atlassian.com/platform/forge/ui-kit/overview/|Forge UI Kit overview}
 * @see {@link https://developer.atlassian.com/platform/forge/ui-kit-2/compare/|Migration and comparison guidance}
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/|Legacy storage API}
 */

import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { findImports, parseSourceFile } from "./ast-helpers";
import { getAllTypeScriptFiles } from "./filesystem-helpers";

describe("Import Restrictions", () => {
  const srcPath = path.join(process.cwd(), "src");

  it("source files should not import from deprecated @forge/ui package", () => {
    const files = getAllTypeScriptFiles(srcPath);

    for (const file of files) {
      const sourceFile = parseSourceFile(file);
      const forgeUiImports = findImports(sourceFile, "@forge/ui");

      expect(
        forgeUiImports,
        `File ${file} should not import from '@forge/ui' (deprecated package)`,
      ).toEqual([]);
    }
  });

  it("source files should not import deprecated storage from @forge/api", () => {
    const files = getAllTypeScriptFiles(srcPath);
    const violations = files.flatMap((file) => {
      const sourceFile = parseSourceFile(file);
      const imports = findImports(sourceFile, "@forge/api");

      return imports
        .filter((entry) => entry.specifiers.includes("storage"))
        .map(
          (entry) =>
            `${file}: line ${entry.line} imports deprecated storage from @forge/api`,
        );
    });

    expect(
      violations,
      `Found deprecated storage imports from @forge/api:\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});
