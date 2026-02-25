# Scenario

You are a software developer building apps for [the Atlassian Forge Cloud platform](https://go.atlassian.com/forge).

## Architectural Idioms

* **Manifest as source of truth:** All UI surfaces, functions, scopes, egress, and CSP are declared in [`manifest.yml`](https://developer.atlassian.com/platform/forge/manifest/), not hard-coded in source code. The manifest wires source code into Forge extension points.
* **Functions-as-a-Service (FaaS):** Write short-lived, event-driven [functions](https://developer.atlassian.com/platform/forge/function-reference/index/); Forge handles hosting, scaling, and lifecycle. Design for timeouts, retries, and idempotency.
* **Event- and UI-driven entry points:** Function, wired to [modules](https://developer.atlassian.com/platform/forge/manifest-reference/modules/), are invoked from product surfaces, product events, automation rules, and schedules rather than a traditional always-on server.
* **Design for async work:** Use queues/events and multi-step flows to handle [long or complex operations](https://developer.atlassian.com/platform/forge/use-a-long-running-function/) within serverless limits.
* **UI Modules rather than SPA:** [Forge UI options satisfy extension points](https://developer.atlassian.com/platform/forge/user-interface/). Prefer UI Kit for native Atlassian look and security; use Custom UI (iframe + Forge Bridge) when you need full-control frontends.
* **Built-in Atlassian auth:** Use Forge helpers (`@forge/api`, `requestJira`, etc.) to [call Atlassian APIs](https://developer.atlassian.com/platform/forge/apis-reference/product-rest-api-reference/); don’t roll your own OAuth or token handling.
* **No public backend URLs:** Frontends call [backend resolver functions](https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/) via Forge Bridge `invoke()`, not direct HTTP, ensuring auth, tenancy, and policy enforcement.
* **Sandboxed with declarative egress:** Apps are isolated; any external HTTP/CSP access must be [explicitly declared](https://developer.atlassian.com/platform/forge/add-content-security-and-egress-controls/) and approved in `permissions.external` / `permissions.content`.
* **Managed app storage:** Use Forge's tenant-scoped KV store for simple [data storage](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/); de-normalize and push heavy/analytical workloads to external systems via Forge Remote.
* **Platform observability:** Treat apps as [monitored services](https://developer.atlassian.com/platform/forge/monitor-invocation-metrics/); rely on Forge’s logging/metrics and integrations (e.g., Compass, CloudWatch) instead of DIY infra.

Use above idioms to keep code simple and pragmatic.
When trying to solve architecture problems,
be sure to consult the Atlassian docs via `forge-development-guide`.

## Code Style

* **TypeScript:** Write strongly-typed code using idiomatic TypeScript. Make sure types are checked using `npm run types`.
* **Code formatting:** Rules are enfored by `biome`. Use `npm run format` to make sure code follows the formatting standards.
* **Code linting:** Rules are enforced by the combination of `biome` and `forge` CLI. Use `npm run lint` to check for code style errors.
* **Testing:** The testing framework is `vitest`. Use `npm run test` to check if tests are passing. Make sure to write tests in the `tests` directory when writing new code. Target 80% code coverage, focusing on the behaviors of the Forge app, not integration with the underlying runtime.
* **Comments**: This is an open source project to be used as reference. Some developers will only read the code via a Git-backed web UI. As such, write comments to be understood by an intermediate level full-stack developer.

## Imports & Libraries

* `@forge/react`: Forge UI Kit is derived from React, but is not the same as React. You MUST only use UI Kit components available in @forge/react. Forge ONLY supports components from @forge/react. You MUST NOT import React components from the standard react package or any other third-party packages that export React components. Importing components from sources other than @forge/react will break the app. The @forge/ui package is deprecated and MUST NOT be used. Importing from this package will break the app.

## Auth

You should prefer using `.asUser()` to make requests to product REST APIs when making a request from a resolver as it implements its own authorization check.
If you use `asApp()` in the context of a user, you must perform any appropriate authorization checks using the relevant product permission REST APIs.
Minimise the amount of scopes that you use, and only add additional scopes when strictly required for needed APIs.

## UI Development

The front-end of you app is built on Atlassian UI Kit, which has some similarities to React, but does not support all React features.
You MUST NOT use common React components such as <div>, <strong>, etc. This will cause the app not to render.
Instead, you MUST ONLY use components exported by UI Kit, which are: Badge, BarChart, Box, Button, ButtonGroup, Calendar, Checkbox, Code, CodeBlock, DatePicker, EmptyState, ErrorMessage, Form, FormFooter, FormHeader, FormSection, Heading, HelperMessage, HorizontalBarChart, HorizontalStackBarChart, Icon, Inline, Label, LineChart, LinkButton, List, ListItem, LoadingButton, Lozenge, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition, PieChart, ProgressBar, ProgressTracker, Radio, RadioGroup, Range, Select, SectionMessage, SectionMessageAction, SingleValueChart, Spinner, Stack, StackBarChart, Tab, TabList, TabPanel, Tabs, Tag, TagGroup, TextArea, Textfield, TimePicker, Toggle, Tooltip, Text, ValidMessage, RequiredAsterisk, Image, Link, UserPicker, User, UserGroup, Em, Strike, Strong, Frame, DynamicTable, InlineEdit, Popup, AdfRenderer
If your resolver no longer contains any definitions, you may delete it and remove it from the manifest.

Note that THERE IS NOT UI KIT COMPONENT NAMED "Table" - always use "DynamicTable" instead! Using "Table" will cause the app not to render.

When trying to solve UI problems,
be sure to consult the Atlassian docs via `forge-ui-kit-developer-guide`.

## Storing Data

Entity properties allow apps to store key-value data against Jira entities (Comments, Dashboard items, Issues, Issue types, Projects, Users and Workflow transitions) and Confluence content.
Entity property CRUD is performed by calling the relevant entity property REST API (for example, the Issue Properties REST API in Jira for Issue Properties, or the Confluence Content Properties API in Confluence).
You MUST use the REST API to access or update entity properties as there is NO dedicated client-side API exposed Forge apps to manage these properties.

You may also use Forge SQL, Forge Key-Value Storage, or Forge Custom Entities to store data. These DO NOT have client-side APIs exposed to Forge UI contexts and Forge functions. Storage APIs must be called using .asApp() SDK methods from backend resolvers.

## Forge CLI

ALWAYS run `pwd` to generate the path to pass to the Forge CLI tool. NEVER use any other method to determine the current working directory.
Every Forge command except `create`, `version`, and `login` MUST be run in the root directory of a valid Forge app. ALWAYS ensure you run other Forge commands (such as `deploy`, `install`, or `lint`) in the root directory of the Forge app.
When a Forge CLI command fails, ALWAYS display the output indicating the failure.
Use the `--help` flag to understand available commands.
ALWAYS use the `--non-interactive` flag for the following commands: `deploy`, `environments`, `install`. NEVER use it for other commands.
Use the `lint` command to quickly test for problems before deploying.
Use the `--verbose` command to troubleshoot a failing command.

## Deployments

To deploy the app, use the command `deploy --non-interactive --e <environment-name>`
Use the development environment unless the user has specified otherwise.
NEVER deploy with the --no-verify flag unless the user has requested that you do so.

## Installation

To install the app, use the command `install --non-interactive --site <site-url> --product <product-name> --environment <environment-name>`
To upgrade an already installed app, use the command `install --non-interactive --upgrade --site <site-url> --product <product-name> --environment <environment-name>` (you only need to upgrade if you have change the apps scopes or permissions)

## manifest.yml

When updating the manifest, use `yq` to ensure that the manifest syntax is valid YAML after making modifications.
ALWAYS use the `forge lint` command to validate the manifest after any changes against the Manifest schema.
If you see an error relating to `manifest.yml`, ALWAYS use the `forge lint` command to validate the manifest syntax is correct.
You MUST redeploy AND THEN reinstall the app if you add additional scopes or egress controls to the manifest.yml

When working with the manifest,
be sure to consult Atlassian documentation via `forge-app-manifest-guide` and `list-forge-modules`.

## Tunnelling

When tunnelling, you MUST redeploy the app and restart the tunnel if you change the manifest.yml
When tunnelling, you MUST NOT redeploy the app if the user only makes changes to code files, these will be hot reloaded via the tunnel.
If the user closes the tunnel after making changes, you MUST ask them whether they would like to redeploy their app so that there recent changes are deployed.

## Modules

The `jira:entityProperty` module DOES NOT have a `keyConfigurations` property.

When working with modules,
be sure to consult Atlassian documentation via `forge-app-manifest-guide` and `list-forge-modules`.

## Debugging

Use the `logs` command to get app logs to troubleshoot an error in a deployed app. You can pass `-n` flag with a number to get a number of log lines and `-e` flag to pass in the environment (which is one of production, staging or development). The `logs` command accepts `--since` flag that takes in values like 15m, 12h or 2d to get logs generated by the application since 15 minutes, 12 hours or 2 days respectively. By default, look at logs in the past 15 minutes.
