/**
 * Shared helpers for parsing and working with manifest.yml
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export interface ManifestFunction {
  key: string;
  handler: string;
}

export interface AssetsImportTypeModule {
  key: string;
  resolver?: {
    function: string;
  };
}

export interface ConsumerModule {
  key: string;
  queue: string;
  function: string;
}

export interface ScheduledTriggerModule {
  key: string;
  function: string;
  interval: string;
}

export interface WebTriggerModule {
  key: string;
  function: string;
  response?: {
    type: string;
  };
}

export interface TriggerModule {
  key: string;
  function?: string;
  endpoint?: string;
  events?: Array<{
    listen: string;
  }>;
}

export interface RovoActionModule {
  key: string;
  function: string;
  name: string;
  actionVerb: string;
  description: string;
}

export interface JiraWorkflowAutomationModule {
  key: string;
  function: string;
  name: string;
  description: string;
}

export interface ParsedManifest {
  modules: {
    function?: ManifestFunction[];
    consumer?: ConsumerModule[];
    scheduledTrigger?: ScheduledTriggerModule[];
    webtrigger?: WebTriggerModule[];
    trigger?: TriggerModule[];
    action?: RovoActionModule[];
    "jira:workflowValidator"?: JiraWorkflowAutomationModule[];
    "jira:workflowCondition"?: JiraWorkflowAutomationModule[];
    "jira:workflowPostFunction"?: JiraWorkflowAutomationModule[];
    "jiraServiceManagement:assetsImportType"?: AssetsImportTypeModule[];
  };
}

export function loadManifest(): ParsedManifest {
  const manifestPath = join(process.cwd(), "manifest.yml");
  const manifestContent = readFileSync(manifestPath, "utf-8");
  return parseYaml(manifestContent) as ParsedManifest;
}

export function getModuleResolvers(
  manifest: ParsedManifest,
): AssetsImportTypeModule[] {
  return manifest.modules["jiraServiceManagement:assetsImportType"] || [];
}

export function getConsumerQueueNames(manifest: ParsedManifest): string[] {
  return (manifest.modules.consumer || []).map((consumer) => consumer.queue);
}

export function getManifestScopes(manifest: ParsedManifest): string[] {
  const permissions = (
    manifest as ParsedManifest & {
      permissions?: { scopes?: string[] | Record<string, unknown> };
    }
  ).permissions;
  const scopes = permissions?.scopes;

  if (!scopes) {
    return [];
  }

  if (Array.isArray(scopes)) {
    return scopes;
  }

  return Object.keys(scopes);
}

export function getManifestHandlerReferences(
  manifest: ParsedManifest,
): Array<{ moduleType: string; key: string; handler: string }> {
  const refs: Array<{ moduleType: string; key: string; handler: string }> = [];

  for (const func of manifest.modules.function || []) {
    refs.push({ moduleType: "function", key: func.key, handler: func.handler });
  }

  for (const consumer of manifest.modules.consumer || []) {
    refs.push({
      moduleType: "consumer",
      key: consumer.key,
      handler: `src/index.ts#${consumer.function}`,
    });
  }

  for (const trigger of manifest.modules.scheduledTrigger || []) {
    refs.push({
      moduleType: "scheduledTrigger",
      key: trigger.key,
      handler: `src/index.ts#${trigger.function}`,
    });
  }

  for (const trigger of manifest.modules.webtrigger || []) {
    refs.push({
      moduleType: "webtrigger",
      key: trigger.key,
      handler: `src/index.ts#${trigger.function}`,
    });
  }

  for (const trigger of manifest.modules.trigger || []) {
    // Skip triggers that use remote endpoints instead of local functions
    if (trigger.function) {
      refs.push({
        moduleType: "trigger",
        key: trigger.key,
        handler: `src/index.ts#${trigger.function}`,
      });
    }
  }

  for (const action of manifest.modules.action || []) {
    refs.push({
      moduleType: "action",
      key: action.key,
      handler: `src/index.ts#${action.function}`,
    });
  }

  for (const validator of manifest.modules["jira:workflowValidator"] || []) {
    refs.push({
      moduleType: "jira:workflowValidator",
      key: validator.key,
      handler: `src/index.ts#${validator.function}`,
    });
  }

  for (const condition of manifest.modules["jira:workflowCondition"] || []) {
    refs.push({
      moduleType: "jira:workflowCondition",
      key: condition.key,
      handler: `src/index.ts#${condition.function}`,
    });
  }

  for (const postFunction of manifest.modules["jira:workflowPostFunction"] ||
    []) {
    refs.push({
      moduleType: "jira:workflowPostFunction",
      key: postFunction.key,
      handler: `src/index.ts#${postFunction.function}`,
    });
  }

  for (const module of manifest.modules[
    "jiraServiceManagement:assetsImportType"
  ] || []) {
    if (module.resolver) {
      refs.push({
        moduleType: "jiraServiceManagement:assetsImportType",
        key: module.key,
        handler: `src/resolvers/index.ts#${module.resolver.function}`,
      });
    }
  }

  return refs;
}

export function getProjectPaths() {
  const root = process.cwd();
  return {
    manifest: join(root, "manifest.yml"),
    srcIndex: join(root, "src/index.ts"),
    resolversIndex: join(root, "src/resolvers/index.ts"),
    frontendIndex: join(root, "src/frontend/index.tsx"),
  };
}
