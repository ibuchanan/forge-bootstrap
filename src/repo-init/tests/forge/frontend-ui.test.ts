/**
 * Frontend UI Kit tests
 *
 * Validates UI Kit component usage and frontend entry point setup:
 * - UI Kit component usage restrictions (no native HTML, only @forge/react)
 * - Frontend entry point setup (ForgeReconciler.render, React.StrictMode)
 * - Correct import patterns for UI components
 *
 * @see {@link https://developer.atlassian.com/platform/forge/ui-kit/|Forge UI Kit}
 * @see {@link https://developer.atlassian.com/platform/forge/user-interface/|Forge User Interface}
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  findImports,
  findJsxElements,
  getImportedNames,
  parseSourceFile,
} from "./ast-helpers";

describe("Frontend UI Kit", () => {
  const frontendPath = path.join(process.cwd(), "src/frontend/index.tsx");

  describe("Component Usage", () => {
    it("should not use native HTML elements like div, span, strong, etc", () => {
      const sourceFile = parseSourceFile(frontendPath);

      // These native HTML elements should not appear as JSX
      // Note: Capitalized versions (Button, Form) are UI Kit components, not native HTML
      const nativeElements = [
        "div",
        "span",
        "strong",
        "em",
        "p",
        "a",
        "button", // lowercase = native HTML
        "form", // lowercase = native HTML
        "input",
        "table",
        "tr",
        "td",
      ];

      const violations = findJsxElements(sourceFile, (tagName) => {
        // Only match lowercase elements (native HTML)
        // Capitalized elements are UI Kit components
        const lowerTag = tagName.toLowerCase();
        return nativeElements.includes(lowerTag) && tagName === lowerTag;
      });

      const violationMessages = violations
        .map((v) => `Line ${v.line}: <${v.tagName}>`)
        .join(", ");

      expect(
        violations,
        `Found native HTML elements (use UI Kit components instead): ${violationMessages}`,
      ).toEqual([]);
    });

    it("should use DynamicTable instead of Table", () => {
      const sourceFile = parseSourceFile(frontendPath);

      // Check for <Table> JSX elements (should use DynamicTable instead)
      const tableElements = findJsxElements(
        sourceFile,
        (tagName) => tagName === "Table",
      );

      expect(
        tableElements,
        "Should not use <Table> component directly; use <DynamicTable> instead",
      ).toEqual([]);
    });

    it("should only import UI Kit components from @forge/react", () => {
      const sourceFile = parseSourceFile(frontendPath);

      // Check for forbidden imports from @forge/ui
      const forgeUiImports = findImports(sourceFile, "@forge/ui");
      expect(
        forgeUiImports,
        "Cannot import from '@forge/ui' (deprecated), use @forge/react instead",
      ).toEqual([]);

      // Verify @forge/react is imported for UI components
      const forgeReactImports = findImports(sourceFile, "@forge/react");
      expect(
        forgeReactImports.length,
        "Must import UI Kit components from @forge/react",
      ).toBeGreaterThan(0);

      // Note: Importing React hooks (useState, useEffect) from 'react' is allowed
      // since Forge UI Kit is built on React. The restriction is on importing
      // UI components from react package or other sources, not React itself.
    });

    it("should only use components exported from @forge/react", () => {
      const sourceFile = parseSourceFile(frontendPath);

      // List of allowed UI Kit components from @forge/react
      // Derived from the official Forge UI Kit documentation
      // See: https://developer.atlassian.com/platform/forge/ui-kit/components/
      const allowedComponents = new Set([
        // Layout components
        "Box",
        "Inline",
        "Stack",
        "Grid",
        "Flex",
        // Typography
        "Text",
        "Heading",
        "Em",
        "Strong",
        "Strike",
        "Code",
        "CodeBlock",
        // Form components
        "Form",
        "FormSection",
        "FormHeader",
        "FormFooter",
        "Label",
        "Textfield",
        "TextArea",
        "Checkbox",
        "CheckboxGroup",
        "Radio",
        "RadioGroup",
        "Select",
        "Toggle",
        "Range",
        "DatePicker",
        "TimePicker",
        "Calendar",
        "UserPicker",
        // Buttons
        "Button",
        "LinkButton",
        "LoadingButton",
        "ButtonGroup",
        // Data display
        "DynamicTable",
        "List",
        "ListItem",
        "Badge",
        "Lozenge",
        "Tag",
        "TagGroup",
        // Charts
        "BarChart",
        "LineChart",
        "PieChart",
        "SingleValueChart",
        "HorizontalBarChart",
        "HorizontalStackBarChart",
        "StackBarChart",
        "DonutChart",
        // Feedback
        "Modal",
        "ModalHeader",
        "ModalTitle",
        "ModalBody",
        "ModalFooter",
        "ModalTransition",
        "SectionMessage",
        "SectionMessageAction",
        "ErrorMessage",
        "HelperMessage",
        "ValidMessage",
        "EmptyState",
        "Spinner",
        "ProgressBar",
        "ProgressTracker",
        // Other
        "Icon",
        "Image",
        "Link",
        "Tooltip",
        "Popup",
        "User",
        "UserGroup",
        "Frame",
        "InlineEdit",
        "Comment",
        "AdfRenderer",
        "ForgeReconciler",
        "RequiredAsterisk",
        "FileCard",
        "FilePicker",
        // Utilities
        "xcss",
        // Hooks and contexts (also exported from @forge/react)
        "useProductContext",
        "useConfig",
        "useTheme",
        "usePermissions",
        "useContentProperty",
        "useSpaceProperty",
        "useIssueProperty",
        "useTranslation",
        "useForm",
        "useObjectStore",
        // Type exports
        "I18nProvider",
        "replaceUnsupportedDocumentNodes",
        "Global",
      ]);

      // Extract all imported component names from @forge/react using AST
      const importedComponents = getImportedNames(sourceFile, "@forge/react");

      expect(
        importedComponents.length,
        "Must import UI Kit components from @forge/react",
      ).toBeGreaterThan(0);

      // Verify all imported components are allowed
      const invalidImports: string[] = [];
      for (const component of importedComponents) {
        if (!allowedComponents.has(component)) {
          invalidImports.push(component);
        }
      }

      expect(
        invalidImports,
        invalidImports.length > 0
          ? `The following imports are not from @forge/react UI Kit: ${invalidImports.join(", ")}. Check the @forge/react package documentation.`
          : undefined,
      ).toEqual([]);
    });
  });

  describe("Entry Point Registration", () => {
    it("should call ForgeReconciler.render() to register the UI", () => {
      const content = fs.readFileSync(frontendPath, "utf-8");

      expect(
        content,
        "ForgeReconciler.render() must be called to register the UI",
      ).toMatch(/ForgeReconciler\.render\(/);
    });

    it("should wrap App with React.StrictMode in ForgeReconciler.render()", () => {
      const content = fs.readFileSync(frontendPath, "utf-8");

      // Extract the ForgeReconciler.render call
      const renderMatch = content.match(
        /ForgeReconciler\.render\(\s*<React\.StrictMode>[\s\S]*?<\/React\.StrictMode>\s*,\s*\);/,
      );

      expect(
        renderMatch,
        "App should be wrapped with <React.StrictMode> in ForgeReconciler.render() to enable development-time checks for common React mistakes (Forge best practice)",
      ).not.toBeNull();
    });

    it("should not use render() from @forge/react directly", () => {
      const sourceFile = parseSourceFile(frontendPath);

      // Should not import render from @forge/react
      const imports = findImports(sourceFile, "@forge/react");
      const hasRenderImport = imports.some((imp) =>
        imp.specifiers.includes("render"),
      );

      expect(
        hasRenderImport,
        "Should not import 'render' from @forge/react; use ForgeReconciler.render() instead",
      ).toBe(false);
    });
  });
});
