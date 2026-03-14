/**
 * Filesystem helper utilities for Forge tests
 */

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Recursively find all TypeScript files in a directory
 *
 * @param dir - Directory to scan
 * @returns Array of absolute file paths to .ts and .tsx files
 */
export function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other build directories
        if (
          entry.name === "node_modules" ||
          entry.name === "dist" ||
          entry.name === "coverage" ||
          entry.name === ".git"
        ) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        // Skip .d.ts files (type definitions only)
        if (!entry.name.endsWith(".d.ts")) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}
