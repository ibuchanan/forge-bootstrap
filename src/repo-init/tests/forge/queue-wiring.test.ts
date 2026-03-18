/**
 * Forge queue wiring architecture tests
 *
 * Ensures that queue keys instantiated in code are declared in manifest consumer modules.
 * In Forge Async Events, the queue key used in `new Queue({ key })` must align with
 * the manifest consumer `queue` name or runtime queue operations can fail.
 *
 * @see {@link https://developer.atlassian.com/platform/forge/runtime-reference/async-events-api/|Async Events API}
 * @see {@link https://developer.atlassian.com/platform/forge/manifest-reference/modules/consumer/|Consumer module}
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import { findForgeQueueKeys, parseSourceFile } from "./ast-helpers";
import { getAllTypeScriptFiles } from "./filesystem-helpers";
import { getConsumerQueueNames, loadManifest } from "./manifest-helpers";

function getSourceFiles(): string[] {
  return getAllTypeScriptFiles(path.join(process.cwd(), "src"));
}

describe("Forge queue wiring", () => {
  it("should only instantiate queues that are declared in manifest consumer modules", () => {
    const manifest = loadManifest();
    const manifestQueueNames = new Set(getConsumerQueueNames(manifest));

    const queueUsages = getSourceFiles().flatMap((filePath) => {
      const sourceFile = parseSourceFile(filePath);
      return findForgeQueueKeys(sourceFile).map((usage) => ({
        ...usage,
        filePath,
      }));
    });

    const undeclaredQueues = queueUsages.filter(
      (usage) => !manifestQueueNames.has(usage.key),
    );

    expect(
      undeclaredQueues,
      undeclaredQueues.length
        ? `Found Queue keys in code that are not declared in manifest consumer modules:\n${undeclaredQueues
            .map(
              (usage) =>
                `- ${usage.key} at ${path.relative(process.cwd(), usage.filePath)}:${usage.line}:${usage.column}`,
            )
            .join("\n")}\n\nManifest consumer queues:\n${Array.from(
            manifestQueueNames,
          )
            .sort()
            .map((name) => `- ${name}`)
            .join("\n")}`
        : undefined,
    ).toEqual([]);
  });
});
