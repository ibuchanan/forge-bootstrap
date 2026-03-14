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
  function: string;
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

export function getProjectPaths() {
  const root = process.cwd();
  return {
    manifest: join(root, "manifest.yml"),
    srcIndex: join(root, "src/index.ts"),
    resolversIndex: join(root, "src/resolvers/index.ts"),
    frontendIndex: join(root, "src/frontend/index.tsx"),
  };
}
