/**
 * Frontend UI Kit tests
 *
 * Validates UI Kit component usage and frontend entry point setup:
 * - UI Kit component usage restrictions (no native HTML, only @forge/react)
 * - Frontend entry point setup (ForgeReconciler.render, React.StrictMode)
 * - Correct import patterns for UI components
 *
 * @see {@link https://developer.atlassian.com/platform/forge/ui-kit/overview/|UI Kit overview}
 * @see {@link https://developer.atlassian.com/platform/forge/ui-kit/components/|UI Kit components}
 * @see {@link https://developer.atlassian.com/platform/forge/ui-kit/use-ui-kit/|Use UI Kit}
 */

import * as path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  findCallExpressions,
  findImports,
  findJsxElements,
  getImportedNames,
  parseSourceFile,
} from "./ast-helpers";
import { getAllTypeScriptFiles } from "./filesystem-helpers";

describe("Frontend UI Kit", () => {
  const frontendDir = path.join(process.cwd(), "src/frontend");
  const frontendFiles = getAllTypeScriptFiles(frontendDir);

  function getFrontendSourceFiles() {
    return frontendFiles.map((filePath) => ({
      filePath,
      sourceFile: parseSourceFile(filePath),
    }));
  }

  describe("Component Usage", () => {
    it("should not use native HTML elements like div, span, strong, etc", () => {
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

      const violations = getFrontendSourceFiles().flatMap(
        ({ filePath, sourceFile }) =>
          findJsxElements(sourceFile, (tagName) => {
            const lowerTag = tagName.toLowerCase();
            return nativeElements.includes(lowerTag) && tagName === lowerTag;
          }).map((v) => ({ ...v, filePath })),
      );

      const violationMessages = violations
        .map(
          (v) =>
            `${path.relative(process.cwd(), v.filePath)}:${v.line} <${v.tagName}>`,
        )
        .join(", ");

      expect(
        violations,
        `Found native HTML elements (use UI Kit components instead): ${violationMessages}`,
      ).toEqual([]);
    });

    it("should use DynamicTable instead of Table", () => {
      const tableElements = getFrontendSourceFiles().flatMap(
        ({ filePath, sourceFile }) =>
          findJsxElements(sourceFile, (tagName) => tagName === "Table").map(
            (v) => ({
              ...v,
              filePath,
            }),
          ),
      );

      expect(
        tableElements,
        tableElements.length
          ? `Should not use <Table> directly; use <DynamicTable> instead. Found: ${tableElements
              .map(
                (v) => `${path.relative(process.cwd(), v.filePath)}:${v.line}`,
              )
              .join(", ")}`
          : undefined,
      ).toEqual([]);
    });

    it("should only import UI Kit components from @forge/react", () => {
      const forgeReactImportCount = getFrontendSourceFiles().reduce(
        (count, { sourceFile }) =>
          count + findImports(sourceFile, "@forge/react").length,
        0,
      );
      expect(
        forgeReactImportCount,
        "Must import UI Kit components from @forge/react somewhere in src/frontend/**",
      ).toBeGreaterThan(0);

      // Note: Importing React hooks (useState, useEffect) from 'react' is allowed
      // since Forge UI Kit is built on React. The restriction is on importing
      // UI components from react package or other sources, not React itself.
    });

    it("should only use components exported from @forge/react", () => {
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

      const importedComponents = getFrontendSourceFiles().flatMap(
        ({ filePath, sourceFile }) =>
          getImportedNames(sourceFile, "@forge/react").map((component) => ({
            component,
            filePath,
          })),
      );

      expect(
        importedComponents.length,
        "Must import UI Kit components from @forge/react",
      ).toBeGreaterThan(0);

      const invalidImports = importedComponents.filter(
        ({ component }) => !allowedComponents.has(component),
      );

      expect(
        invalidImports,
        invalidImports.length > 0
          ? `The following imports are not from @forge/react UI Kit: ${invalidImports
              .map(
                (item) =>
                  `${item.component} (${path.relative(process.cwd(), item.filePath)})`,
              )
              .join(", ")}. Check the @forge/react package documentation.`
          : undefined,
      ).toEqual([]);
    });
  });

  describe("Entry Point Registration", () => {
    it("should call ForgeReconciler.render() to register the UI", () => {
      const renderCalls = getFrontendSourceFiles().flatMap(
        ({ filePath, sourceFile }) =>
          findCallExpressions(sourceFile, (callName, node) => {
            return (
              callName === "render" &&
              ts.isPropertyAccessExpression(node.expression) &&
              node.expression.expression.getText(sourceFile) ===
                "ForgeReconciler"
            );
          }).map((call) => ({ ...call, filePath })),
      );

      expect(
        renderCalls.length,
        "ForgeReconciler.render() must be called to register the UI",
      ).toBeGreaterThan(0);
    });

    it("should wrap App with React.StrictMode in ForgeReconciler.render()", () => {
      const strictModeRenderCalls = getFrontendSourceFiles().flatMap(
        ({ filePath, sourceFile }) =>
          findCallExpressions(sourceFile, (callName, node) => {
            if (
              callName !== "render" ||
              !ts.isPropertyAccessExpression(node.expression) ||
              node.expression.expression.getText(sourceFile) !==
                "ForgeReconciler"
            ) {
              return false;
            }

            const [firstArg] = node.arguments;
            return !!(
              firstArg &&
              ts.isJsxElement(firstArg) &&
              firstArg.openingElement.tagName.getText(sourceFile) ===
                "React.StrictMode"
            );
          }).map((call) => ({ ...call, filePath })),
      );

      expect(
        strictModeRenderCalls.length,
        "App should be wrapped with <React.StrictMode> in ForgeReconciler.render() to enable development-time checks for common React mistakes (Forge best practice)",
      ).toBeGreaterThan(0);
    });

    it("should not use render() from @forge/react directly", () => {
      const renderImports = getFrontendSourceFiles().flatMap(
        ({ filePath, sourceFile }) =>
          findImports(sourceFile, "@forge/react")
            .filter((imp) => imp.specifiers.includes("render"))
            .map((imp) => ({ ...imp, filePath })),
      );

      expect(
        renderImports,
        renderImports.length
          ? `Should not import 'render' from @forge/react; use ForgeReconciler.render() instead. Found: ${renderImports
              .map(
                (imp) =>
                  `${path.relative(process.cwd(), imp.filePath)}:${imp.line}`,
              )
              .join(", ")}`
          : undefined,
      ).toEqual([]);
    });
  });
});
