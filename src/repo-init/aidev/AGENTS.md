# Scenario

You are a software developer building apps for [the Atlassian Forge Cloud platform](https://go.atlassian.com/forge).
You must use tools from the Forge MCP server (prefixed with forge- ) where possible before the CLI ones

## Architectural Idioms

* **Manifest as source of truth:** All UI surfaces, functions, scopes, egress, and CSP are declared in [`manifest.yml`](https://developer.atlassian.com/platform/forge/manifest/), not hard-coded in source code. The manifest wires source code into Forge extension points.
* **Functions-as-a-Service (FaaS):** Write short-lived, event-driven [functions](https://developer.atlassian.com/platform/forge/function-reference/index/); Forge handles hosting, scaling, and lifecycle. Design for timeouts, retries, and idempotency.
* **Event- and UI-driven entry points:** Function, wired to [modules](https://developer.atlassian.com/platform/forge/manifest-reference/modules/), are invoked from product surfaces, product events, automation rules, and schedules rather than a traditional always-on server.
* **Design for async work:** Use queues/events and multi-step flows to handle [long or complex operations](https://developer.atlassian.com/platform/forge/use-a-long-running-function/) within serverless limits.
* **UI Modules rather than SPA:** [Forge UI options satisfy extension points](https://developer.atlassian.com/platform/forge/user-interface/). Prefer UI Kit for native Atlassian look and security; use Custom UI (iframe + Forge Bridge) when you need full-control frontends.
* **Built-in Atlassian auth:** Use Forge helpers (`@forge/api`, `requestJira`, etc.) to [call Atlassian APIs](https://developer.atlassian.com/platform/forge/apis-reference/product-rest-api-reference/); don't roll your own OAuth or token handling.
* **No public backend URLs:** Frontends call [backend resolver functions](https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/) via Forge Bridge `invoke()`, not direct HTTP, ensuring auth, tenancy, and policy enforcement.
* **Sandboxed with declarative egress:** Apps are isolated; any external HTTP/CSP access must be [explicitly declared](https://developer.atlassian.com/platform/forge/add-content-security-and-egress-controls/) and approved in `permissions.external` / `permissions.content`.
* **Managed app storage:** Use Forge's tenant-scoped KV store for simple [data storage](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/); de-normalize and push heavy/analytical workloads to external systems via Forge Remote.
* **Platform observability:** Treat apps as [monitored services](https://developer.atlassian.com/platform/forge/monitor-invocation-metrics/); rely on Forge's logging/metrics and integrations (e.g., Compass, CloudWatch) instead of DIY infra.

Use above idioms to keep code simple and pragmatic.
When trying to solve architecture problems,
be sure to consult the Atlassian docs via `forge-development-guide`.

## Auth

You should prefer using `.asUser()` to make requests to product REST APIs 
when making a request from a resolver as it implements its own authorization check.
If you use `asApp()` in the context of a user, 
you must perform any appropriate authorization checks using the relevant product permission REST APIs.
Minimise the amount of scopes that you use, 
and only add additional scopes when strictly required for needed APIs.

## Storing Data

Storage API boundaries are enforced by tests in `tests/forge-architecture.test.ts`.
Frontend cannot access Forge storage APIs (must use REST APIs with appropriate auth).
Storage APIs must be called using .asApp() SDK methods from backend resolvers.

## Forge CLI

Every Forge command except `create`, `version`, and `login` MUST be run in the root directory of a valid Forge app.
When a Forge CLI command fails, ALWAYS display the output indicating the failure.
ALWAYS use the `--non-interactive` flag for: `deploy`, `environments`, `install`. NEVER use it for other commands.
Use `lint` to validate before deploying and `--verbose` to troubleshoot failures.

## Deployments

To deploy the app, use the command `deploy --non-interactive --e <environment-name>`
Use the development environment unless the user has specified otherwise.
ALWAYS run `npm run types`, `npm run format`, `npm run lint`, `npm run test`, and then fix errors before deploying.
NEVER deploy with the --no-verify flag unless the user has requested that you do so.

## Installation

To install the app, use the command 
`install --non-interactive --site <site-url> --product <product-name> --environment <environment-name>`
To upgrade an already installed app, use the command 
`install --non-interactive --upgrade --site <site-url> --product <product-name> --environment <environment-name>` 
(you only need to upgrade if you have change the apps scopes or permissions)

## manifest.yml

When updating the manifest, use `yq` to ensure syntax is valid YAML 
and `forge lint` to validate against the Manifest schema.
You MUST redeploy AND THEN reinstall the app if you add additional scopes or egress controls.

## Tunnelling

When tunnelling, you MUST redeploy the app and restart the tunnel if you change the manifest.yml
When tunnelling, you MUST NOT redeploy the app if the user only makes changes to code files, 
these will be hot reloaded via the tunnel.
If the user closes the tunnel after making changes, 
you MUST ask them whether they would like to redeploy their app 
so that there recent changes are deployed.

## Modules

The `jira:entityProperty` module DOES NOT have a `keyConfigurations` property.

## Debugging

Use the `logs` command to get app logs. 
Pass `-n` for line count, 
`-e` for environment (production, staging, development), 
and `--since` for time range (e.g., 15m, 12h, 2d).
