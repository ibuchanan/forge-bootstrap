/**
 * Repository-wide import restriction tests
 *
 * Validates that deprecated or forbidden packages are not imported
 * across the entire codebase:
 * - @forge/ui (deprecated, use @forge/react instead)
 *
 * @see {@link https://developer.atlassian.com/platform/forge/ui-kit/|Forge UI Kit}
 */

import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { findImports, parseSourceFile } from "./ast-helpers";
import { getAllTypeScriptFiles } from "./filesystem-helpers";

describe("Import Restrictions", () => {
  it("source files should not import from deprecated @forge/ui package", () => {
    const srcPath = path.join(process.cwd(), "src");
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
});
