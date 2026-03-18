/**
 * AST Helper Functions for Forge Tests
 */

import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";

// ============================================================================
// Core Parsing Functions
// ============================================================================

/**
 * Parse a TypeScript/TSX file into an AST
 *
 * @param filePath - Path to .ts or .tsx file
 * @returns TypeScript AST (SourceFile)
 */
export function parseSourceFile(filePath: string): ts.SourceFile {
  const absolutePath = path.resolve(filePath);
  const content = fs.readFileSync(absolutePath, "utf-8");

  return ts.createSourceFile(
    absolutePath,
    content,
    ts.ScriptTarget.Latest,
    true, // setParentNodes - necessary for finding parent nodes
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

/**
 * Get line number from AST node
 *
 * @param sourceFile - The parsed source file
 * @param node - The AST node
 * @returns 1-based line number
 */
export function getLineNumber(
  sourceFile: ts.SourceFile,
  node: ts.Node,
): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

/**
 * Get column number from AST node
 */
export function getColumnNumber(
  sourceFile: ts.SourceFile,
  node: ts.Node,
): number {
  return (
    sourceFile.getLineAndCharacterOfPosition(node.getStart()).character + 1
  );
}

/**
 * Get text of node with context (5 lines before/after)
 */
export function getNodeContext(
  sourceFile: ts.SourceFile,
  node: ts.Node,
): string {
  const lineNumber = getLineNumber(sourceFile, node);
  const lines = sourceFile.getText().split("\n");
  const startLine = Math.max(0, lineNumber - 6);
  const endLine = Math.min(lines.length, lineNumber + 4);

  const contextLines = lines
    .slice(startLine, endLine)
    .map((line, i) => {
      const lineNum = startLine + i + 1;
      const marker = lineNum === lineNumber ? "→ " : "  ";
      return `${marker}${lineNum.toString().padStart(4)} | ${line}`;
    })
    .join("\n");

  return contextLines;
}

// ============================================================================
// JSX Element Utilities
// ============================================================================

/**
 * Get the tag name from a JSX element or self-closing element
 *
 * Example:
 *   <Button onClick={...}> → "Button"
 *   <div> → "div"
 */
export function getJsxTagName(
  node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxOpeningElement,
): string {
  const tagName = node.tagName;

  if (ts.isIdentifier(tagName)) {
    return tagName.text;
  }

  if (ts.isPropertyAccessExpression(tagName)) {
    // For <Foo.Bar> elements
    return "PropertyAccessExpression";
  }

  return "Unknown";
}

/**
 * Get attributes of a JSX element
 *
 * Returns a Map of attribute names to their values/existence
 *
 * Example:
 *   <Button appearance="primary" disabled>
 *   → Map { "appearance" => "primary", "disabled" => true }
 */
export function getJsxAttributes(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
): Map<string, string | boolean> {
  const attributes = new Map<string, string | boolean>();
  const openingElement = ts.isJsxElement(node) ? node.openingElement : node;

  if (
    openingElement.attributes &&
    ts.isJsxAttributes(openingElement.attributes)
  ) {
    for (const attr of openingElement.attributes.properties) {
      if (ts.isJsxAttribute(attr)) {
        const name = attr.name.text;
        const value = attr.initializer;

        if (!value) {
          // Boolean attribute: <Button disabled>
          attributes.set(name, true);
        } else if (ts.isStringLiteral(value)) {
          // String literal: appearance="primary"
          attributes.set(name, value.text);
        } else if (ts.isJsxExpression(value)) {
          // Expression: disabled={isDisabled}
          attributes.set(name, `{...}`);
        }
      }
    }
  }

  return attributes;
}

/**
 * Find all JSX elements matching a predicate
 *
 * Example:
 *   findJsxElements(sourceFile, (tagName) => tagName === "div")
 *   → Returns all <div> elements
 */
export function findJsxElements(
  sourceFile: ts.SourceFile,
  predicate: (tagName: string) => boolean,
): Array<{
  tagName: string;
  line: number;
  column: number;
  attributes: Map<string, string | boolean>;
}> {
  const results: Array<{
    tagName: string;
    line: number;
    column: number;
    attributes: Map<string, string | boolean>;
  }> = [];

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node)) {
      const tagName = getJsxTagName(node.openingElement);
      if (predicate(tagName)) {
        results.push({
          tagName,
          line: getLineNumber(sourceFile, node),
          column: getColumnNumber(sourceFile, node),
          attributes: getJsxAttributes(node),
        });
      }
    } else if (ts.isJsxSelfClosingElement(node)) {
      const tagName = getJsxTagName(node);
      if (predicate(tagName)) {
        results.push({
          tagName,
          line: getLineNumber(sourceFile, node),
          column: getColumnNumber(sourceFile, node),
          attributes: getJsxAttributes(node),
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

// ============================================================================
// Import/Export Utilities
// ============================================================================

/**
 * Find all import declarations in a file
 *
 * Example:
 *   import { Button } from "@forge/react"
 *   → { source: "@forge/react", specifiers: ["Button"], line: 5 }
 */
export function findImports(
  sourceFile: ts.SourceFile,
  sourceFilter?: string | RegExp,
): Array<{
  source: string;
  specifiers: string[];
  line: number;
  type: "named" | "default" | "namespace";
}> {
  const results: Array<{
    source: string;
    specifiers: string[];
    line: number;
    type: "named" | "default" | "namespace";
  }> = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;

      if (!ts.isStringLiteral(moduleSpecifier)) {
        continue;
      }

      const source = moduleSpecifier.text;

      // Filter by source if provided
      if (sourceFilter) {
        const matches =
          typeof sourceFilter === "string"
            ? source === sourceFilter
            : sourceFilter.test(source);
        if (!matches) {
          continue;
        }
      }

      const specifiers: string[] = [];
      let type: "named" | "default" | "namespace" = "named";

      if (statement.importClause) {
        // import Foo from "bar"
        if (statement.importClause.name) {
          specifiers.push(statement.importClause.name.text);
          type = "default";
        }

        // import * as Foo from "bar"
        if (statement.importClause.namedBindings) {
          if (ts.isNamespaceImport(statement.importClause.namedBindings)) {
            specifiers.push(statement.importClause.namedBindings.name.text);
            type = "namespace";
          } else if (ts.isNamedImports(statement.importClause.namedBindings)) {
            // import { Foo, Bar } from "baz"
            for (const element of statement.importClause.namedBindings
              .elements) {
              specifiers.push(element.propertyName?.text || element.name.text);
            }
          }
        }
      }

      results.push({
        source,
        specifiers,
        line: getLineNumber(sourceFile, statement),
        type,
      });
    }
  }

  return results;
}

/**
 * Find all export declarations in a file
 *
 * Example:
 *   export const myFunction = () => {}
 *   → { name: "myFunction", type: "variable", line: 10 }
 */

// ============================================================================
// Function Call Utilities
// ============================================================================

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a node has an export modifier
 */
function _hasExportModifier(node: ts.Node): boolean {
  return !!(
    ts.getCombinedModifierFlags(node as ts.Declaration) &
    ts.ModifierFlags.Export
  );
}

/**
 * Get the first argument from a call expression
 */
export function getFirstArgument(
  node: ts.CallExpression,
): ts.Expression | undefined {
  return node.arguments[0];
}

/**
 * Extract literal text from string literals or template literals
 * Returns null if the node is not a literal or contains substitutions
 */
export function getLiteralText(node: ts.Expression): string | null {
  if (ts.isStringLiteral(node)) {
    return node.text;
  }

  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  return null;
}

/**
 * Check if a call expression is a call to assumeTrustedRoute
 */
export function isAssumeTrustedRouteCall(node: ts.CallExpression): boolean {
  if (ts.isIdentifier(node.expression)) {
    return node.expression.text === "assumeTrustedRoute";
  }
  return false;
}

/**
 * Check if an expression is a route`` tagged template expression
 */
export function isRouteTemplateExpression(node: ts.Expression): boolean {
  return (
    ts.isTaggedTemplateExpression(node) &&
    ts.isIdentifier(node.tag) &&
    node.tag.text === "route"
  );
}

/**
 * Check if a call expression is calling requestJira, requestBitbucket, or requestConfluence
 */
export function isApiRequestCall(node: ts.CallExpression): boolean {
  if (ts.isPropertyAccessExpression(node.expression)) {
    const methodName = node.expression.name.text;
    return (
      methodName === "requestJira" ||
      methodName === "requestBitbucket" ||
      methodName === "requestConfluence"
    );
  }
  if (ts.isIdentifier(node.expression)) {
    const methodName = node.expression.text;
    return (
      methodName === "requestJira" ||
      methodName === "requestBitbucket" ||
      methodName === "requestConfluence"
    );
  }
  return false;
}

/**
 * Check if a string value is an absolute URL
 */
export function isAbsoluteUrl(value: string): boolean {
  return /^(https?:)?\/\//i.test(value);
}

/**
 * Get imported component/specifier names from a specific module
 * Filters out common keywords and namespace imports
 *
 * @param sourceFile - The TypeScript source file to analyze
 * @param moduleName - The module to get imports from (e.g., "@forge/react")
 * @param excludeKeywords - Keywords to exclude (default: React, type, default, const)
 * @returns Array of imported specifier names
 */
export function getImportedNames(
  sourceFile: ts.SourceFile,
  moduleName: string,
  excludeKeywords: string[] = ["React", "type", "default", "const"],
): string[] {
  const imports = findImports(sourceFile, moduleName);
  const names: string[] = [];

  for (const imp of imports) {
    for (const specifier of imp.specifiers) {
      // Skip excluded keywords
      if (excludeKeywords.includes(specifier)) {
        continue;
      }
      names.push(specifier);
    }
  }

  return names;
}

/**
 * Check if a function name is exported from a source file
 * Handles named exports, re-exports, and aliased exports
 */
export function findLocalImports(sourceFile: ts.SourceFile): string[] {
  return findImports(sourceFile)
    .map((entry) => entry.source)
    .filter((source) => source.startsWith("./") || source.startsWith("../"));
}

export function findCallExpressions(
  sourceFile: ts.SourceFile,
  predicate: (callName: string, node: ts.CallExpression) => boolean,
): Array<{ node: ts.CallExpression; line: number; column: number }> {
  const results: Array<{
    node: ts.CallExpression;
    line: number;
    column: number;
  }> = [];

  function getCallName(expression: ts.Expression): string | null {
    if (ts.isIdentifier(expression)) {
      return expression.text;
    }
    if (ts.isPropertyAccessExpression(expression)) {
      return expression.name.text;
    }
    return null;
  }

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callName = getCallName(node.expression);
      if (callName && predicate(callName, node)) {
        results.push({
          node,
          line: getLineNumber(sourceFile, node),
          column: getColumnNumber(sourceFile, node),
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

export function findExportedNames(sourceFile: ts.SourceFile): Set<string> {
  const results = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      const exportClause = statement.exportClause;
      if (exportClause && ts.isNamedExports(exportClause)) {
        for (const element of exportClause.elements) {
          results.add(element.name.text);
        }
      }
      continue;
    }

    const isExported = Boolean(
      ts.getCombinedModifierFlags(statement as ts.Declaration) &
        ts.ModifierFlags.Export,
    );

    if (!isExported) {
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      results.add(statement.name.text);
      continue;
    }

    if (ts.isClassDeclaration(statement) && statement.name) {
      results.add(statement.name.text);
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          results.add(declaration.name.text);
        }
      }
    }
  }

  return results;
}

export function isFunctionExported(
  sourceFile: ts.SourceFile,
  functionName: string,
): boolean {
  let isExported = false;

  function visit(node: ts.Node) {
    // Check for named function declarations or const declarations that are exported
    if (ts.isExportDeclaration(node)) {
      // Handle: export { functionName } or export { handler as functionName }
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          // Check the exported name (the alias if it exists, otherwise the original name)
          const exportedName = element.name.text;
          if (exportedName === functionName) {
            isExported = true;
          }
        }
      }
    }

    // Check for: export const functionName = ...
    if (ts.isVariableStatement(node)) {
      const hasExportModifier = ts
        .getModifiers(node)
        ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (hasExportModifier) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && decl.name.text === functionName) {
            isExported = true;
          }
        }
      }
    }

    // Check for: export function functionName() { ... }
    if (ts.isFunctionDeclaration(node)) {
      const hasExportModifier = ts
        .getModifiers(node)
        ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (hasExportModifier && node.name?.text === functionName) {
        isExported = true;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return isExported;
}

/**
 * Find all queue keys instantiated via `new Queue({ key: ... })` where Queue
 * is imported from `@forge/events`.
 */
export function findForgeQueueKeys(sourceFile: ts.SourceFile): Array<{
  key: string;
  line: number;
  column: number;
}> {
  const queueImportNames = new Set<string>();
  const results: Array<{
    key: string;
    line: number;
    column: number;
  }> = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    if (statement.moduleSpecifier.text !== "@forge/events") {
      continue;
    }

    const importClause = statement.importClause;
    const namedBindings = importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      continue;
    }

    for (const element of namedBindings.elements) {
      if (element.propertyName?.text === "Queue") {
        queueImportNames.add(element.name.text);
      } else if (!element.propertyName && element.name.text === "Queue") {
        queueImportNames.add("Queue");
      }
    }
  }

  function visit(node: ts.Node) {
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      queueImportNames.has(node.expression.text)
    ) {
      const [firstArg] = node.arguments || [];
      if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
        const keyProperty = firstArg.properties.find(
          (property): property is ts.PropertyAssignment =>
            ts.isPropertyAssignment(property) &&
            ((ts.isIdentifier(property.name) && property.name.text === "key") ||
              (ts.isStringLiteral(property.name) &&
                property.name.text === "key")),
        );

        if (keyProperty && ts.isStringLiteral(keyProperty.initializer)) {
          results.push({
            key: keyProperty.initializer.text,
            line: getLineNumber(sourceFile, keyProperty.initializer),
            column: getColumnNumber(sourceFile, keyProperty.initializer),
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

// ============================================================================
// API Usage Validation Utilities
// ============================================================================

/**
 * Scan a file for API usage violations.
 * Checks for:
 * - Absolute URLs passed to requestJira/requestConfluence/requestBitbucket
 * - Absolute URLs passed to assumeTrustedRoute
 * - Missing route templates or assumeTrustedRoute
 *
 * @param filePath - Path to the TypeScript file to scan
 * @returns Array of violation descriptions
 */
export function scanFileForApiViolations(filePath: string): string[] {
  const sourceFile = parseSourceFile(filePath);
  const violations: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && isApiRequestCall(node)) {
      checkRequestJiraArguments(sourceFile, node, violations);
    }

    if (ts.isCallExpression(node) && isAssumeTrustedRouteCall(node)) {
      checkAssumeTrustedRouteArgument(sourceFile, node, violations);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

/**
 * Check assumeTrustedRoute call arguments for absolute URLs
 *
 * @param sourceFile - The parsed source file
 * @param node - The call expression node
 * @param violations - Array to accumulate violation messages
 */
export function checkAssumeTrustedRouteArgument(
  sourceFile: ts.SourceFile,
  node: ts.CallExpression,
  violations: string[],
): void {
  const innerArg = getFirstArgument(node);
  if (!innerArg) {
    return;
  }

  const literalText = getLiteralText(innerArg);
  if (literalText && isAbsoluteUrl(literalText)) {
    violations.push(
      `assumeTrustedRoute should not be called with absolute URLs. ${describeCallsite(sourceFile, node)}`,
    );
  }

  if (ts.isCallExpression(innerArg)) {
    const innerLiteral = getLiteralText(innerArg);
    if (innerLiteral && isAbsoluteUrl(innerLiteral)) {
      violations.push(
        `assumeTrustedRoute should receive a relative path. ${describeCallsite(sourceFile, node)}`,
      );
    }
  }
}

/**
 * Check requestJira/requestConfluence call arguments for absolute URLs
 *
 * @param sourceFile - The parsed source file
 * @param node - The call expression node
 * @param violations - Array to accumulate violation messages
 */
export function checkRequestJiraArguments(
  sourceFile: ts.SourceFile,
  node: ts.CallExpression,
  violations: string[],
): void {
  const firstArg = getFirstArgument(node);
  if (!firstArg) {
    return;
  }

  if (ts.isCallExpression(firstArg) && isAssumeTrustedRouteCall(firstArg)) {
    checkAssumeTrustedRouteArgument(sourceFile, firstArg, violations);
    return;
  }

  if (isRouteTemplateExpression(firstArg)) {
    return;
  }

  const literalText = getLiteralText(firstArg);
  if (literalText && isAbsoluteUrl(literalText)) {
    const methodName = ts.isPropertyAccessExpression(node.expression)
      ? node.expression.name.text
      : ts.isIdentifier(node.expression)
        ? node.expression.text
        : "API request";
    violations.push(
      `${methodName} should not be called with absolute URLs. ${describeCallsite(sourceFile, node)}`,
    );
  }
}

/**
 * Format a callsite for error messages with line number and context
 *
 * @param sourceFile - The parsed source file
 * @param node - The AST node
 * @returns Formatted string with line number and code context
 */
export function describeCallsite(
  sourceFile: ts.SourceFile,
  node: ts.CallExpression,
): string {
  return `Line ${getLineNumber(sourceFile, node)}\n${getNodeContext(sourceFile, node)}`;
}
