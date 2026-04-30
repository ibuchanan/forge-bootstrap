---
name: forge-cli
description: A skill for Atlassian Forge CLI usage, covering commands, workflows, troubleshooting, and common gotchas. Use this skill whenever a user is working with Forge apps — whether they're setting up for the first time, deploying, installing, tunneling for local dev, managing environments, setting up CI/CD, or running into errors with any forge command. Don't wait for the user to say "forge CLI" explicitly — if they're building or deploying an Atlassian Forge app and asking about commands, permissions, tunnel issues, scope changes, or environment setup, this skill applies.
---

# Forge CLI

The Forge CLI is the command line interface for building and deploying
Atlassian Forge apps. In this bootstrap, install and upgrade it with
bun-managed global CLIs: `bun add --global @forge/cli@latest`, or run
`forge-bootstrap home-update bun-global` to refresh the canonical CLI set. CLI
versions are supported for 6 months after release.

## Quick start workflow

```bash
forge login                                  # authenticate
forge create my-app --template hello-world   # scaffold a new app
cd my-app && npm install                     # install dependencies
forge deploy                                 # deploy to default environment
forge install                                # install on a site (interactive)
forge tunnel                                 # local dev with live reload
```

## ⚠️ Common gotchas

These are the issues that trip up most developers — worth checking before anything else.

**1. Scoped API token required (not your regular API token)**
`forge login` requires an Atlassian *scoped* API token, which is a different thing from the classic Atlassian API token. Create one at https://id.atlassian.com/manage-profile/security/api-tokens (select "Create API token" → choose scopes). Using a classic API token will fail with an auth error.

**2. Adding scopes to your app requires `forge install --upgrade`**
When you add new permission scopes to `manifest.yml` (like a new `read:jira-user` scope), deploying alone isn't enough. After `forge deploy`, you must run `forge install --upgrade` on every existing installation. Without this step, users will get permission errors even though the code was redeployed.

**3. `forge tunnel` only works in the development environment**
You cannot use `forge tunnel` with staging or production. It connects to the development environment only. If you're testing on staging, you must `forge deploy -e staging` for each change.

**4. Keychain errors in WSL or Docker**
If the CLI can't access your keychain (common in WSL2 and Docker containers), `forge login` will fail. Use environment variables instead:
```bash
export FORGE_EMAIL="user@example.com"
export FORGE_API_TOKEN="your-scoped-api-token"
```

**5. `forge register` resets your app's connection**
Running `forge register` more than once creates a new app ID and disconnects the app from its previous environments, environment variables, provider secrets, and Forge Storage data. Only run it once per project, when you first clone a repo that doesn't have your app ID registered yet.

## Authentication

### forge login
Log in to your Atlassian account. Stores credentials in local keychain.

```
Usage: forge login [options]
  --verbose                    enable verbose mode
  -u, --email <user email>     specify the email to use
  -t, --token <api token>      specify the API token to use
  --non-interactive            run without input prompts
```

Examples:
```bash
forge login                                          # interactive
forge login --email USER@example.com                 # prompts for token
forge login --email USER@example.com --token TOKEN   # fully non-interactive
```

Requires an Atlassian **scoped** API token — not the classic API token. If your keychain is unavailable (WSL, Docker), use `FORGE_EMAIL` and `FORGE_API_TOKEN` env vars instead (see CI/CD section).

### forge logout / forge whoami
```bash
forge logout    # clear stored credentials
forge whoami    # show authenticated user
```

## App creation

### forge create
Create a new Forge app.

```
Usage: forge create [options] [name]
  -t, --template <template name>         specify the template to use
  -d, --directory <directory name>       specify the directory to create
  -s, --developer-space-id <id>          specify the Developer Space id
  -y, --accept-terms                     auto-accept terms (non-interactive)
```

Examples:
```bash
forge create my-jira-app
forge create my-app --template hello-world
forge create my-app --template hello-world --directory my-custom-dir
```

### forge register
Register an app you didn't create (e.g., a cloned repo) so you can run commands for it. Updates the manifest with a new app ID and sets your account as owner.

⚠️ Only run this once per repo. Running it again creates a new app ID and disconnects from all existing environments, variables, provider secrets, and storage.

```
Usage: forge register [options] [name]
  -s, --developer-space-id <id>          specify the Developer Space id
  -y, --accept-terms                     auto-accept terms
```

## Building and deploying

### forge build
Package and upload your app code. Builds are environment-agnostic and can be deployed to any environment.

```
Usage: forge build [options] [command]
  --verbose                enable verbose mode
  -f, --no-verify          disable pre-build checks
  -t, --tag <tag>          specify a custom build tag
  --non-interactive        run without input prompts

Commands:
  list [options]           list builds for your app
```

Examples:
```bash
forge build                  # auto-generates a UUID tag
forge build --tag v1.2.3     # custom tag (alphanumeric, up to 64 chars)
```

Build tag constraints: unique per app, up to 64 chars, case-insensitive, must start alphanumeric, allows hyphens/underscores/periods.

### forge deploy
Deploy your app to an environment. Runs pre-deployment checks (lint) by default.

```
Usage: forge deploy [options] [command]
  --verbose                          enable verbose mode
  -f, --no-verify                    disable pre-deployment checks
  -v, --major-version [version]      specify major version to update (Preview)
  -t, --tag <tag>                    specify a build tag to deploy (from forge build)
  -e, --environment [environment]    specify environment (default: see forge settings list)
  --non-interactive                  run without input prompts

Commands:
  list [options]                     list app deployments
```

Examples:
```bash
forge deploy                               # deploy to default environment
forge deploy -e staging --no-verify        # deploy to staging, skip lint
forge deploy --tag 3f6f3d                  # deploy a specific build
forge deploy --tag 3f6f3d -e production    # deploy specific build to production
```

Use `--major-version` to backport minor version upgrades to older major versions.

### forge lint
Check source files for common errors. Runs automatically before deploy/build.

```
Usage: forge lint [options]
  --verbose                          enable verbose mode
  --fix                              attempt to auto-fix issues (default: false)
  -e, --environment [environment]    specify the environment
```

## Installation management

### forge install
Install/manage app installations on Atlassian sites.

```
Usage: forge install [options] [command]
  --verbose                              enable verbose mode
  -e, --environment [environment]        specify the environment
  -s, --site [site]                      site URL (example.atlassian.net)
  -p, --product [product]               Atlassian app (Jira, Confluence, Compass, Bitbucket)
  --upgrade [target]                     upgrade existing installation (values: all, code)
  --confirm-scopes                       skip scope confirmation
  -l, --license [license]               license value (active, standard, advanced, inactive, trial)
  --license-modes [modes...]             license mode (user-access)
  --users-with-access [user...]          Atlassian Account IDs for user access
  --major-version <version>             major version to install
  --non-interactive                      run without input prompts

Commands:
  list [options]                         list app installations
```

After adding new scopes to `manifest.yml`, always run `forge install --upgrade` on each installed site — deploying alone doesn't propagate new permission consent to existing installs.

### forge uninstall
Uninstall the app from an Atlassian site.

```
Usage: forge uninstall [options]
  --verbose                          enable verbose mode
  -s, --site [site]                  site URL (example.atlassian.net)
  -p, --product [product]           Atlassian app (Jira, Confluence, Compass, Bitbucket)
  -e, --environment [environment]    specify the environment
  --batch                            select up to 10 installations to uninstall
```

Examples:
```bash
forge uninstall --site example.atlassian.net
forge uninstall --batch                          # batch uninstall from non-production
forge uninstall --batch --environment staging     # batch uninstall from staging only
```

## Local development

### forge tunnel
Start a tunnel connecting local code with the app running in the **development environment only**. Enables live code changes without redeploying.

⚠️ `forge tunnel` does not work with staging or production — it is development-only. Use `forge deploy -e staging` for staging testing.

```
Usage: forge tunnel [options]
  --verbose                                          enable verbose mode
  -e, --environment [environment]                    specify the environment
  -d, --debug                                        enable debugger mode
  -f, --debugFunctionHandlers <handlers...>          function handlers to debug (Node runtime)
  -p, --debugStartingPort [port]                     starting debug port (default: 9229)
  -n, --no-verify                                    disable pre-tunnel checks
```

For CLI >= 10.1.0, tunnels via Cloudflare require no additional setup.

Debugging: supports IntelliJ and VS Code debuggers for Node.js Forge functions.

## Environment management

### forge environments
Manage app environments (development, staging, production).

```
Usage: forge environments [options] [command]

Commands:
  create [options]    create a new development environment
  delete [options]    delete an existing development environment
  list [options]      view all environments for this app
```

## Configuration

### forge variables
Manage app-specific environment variables per environment (development, staging, production).

```
Usage: forge variables [options] [command]

Commands:
  list [options]              list environment variables
  set [options] [key] [value] set an environment variable
  unset [options] <key>       remove an environment variable
```

### forge settings
Manage Forge CLI settings.

```
Usage: forge settings [options] [command]

Commands:
  list [options]                              list Forge CLI settings
  set [options] <setting> <boolean|string>    update a setting
```

Available settings: `usage-analytics`, `default-environment`, `seasonal-effects`.

### forge storage
Manage storage for your app.

```
Usage: forge storage [options] [command]

Commands:
  entities [options]    manage indexes for custom entities
```

## App information

### forge show
Display information about the current app.

### forge version
Display the Forge CLI version.

### forge eligibility
Check app eligibility status.

## Other commands

### forge providers
Manage external authentication providers for your app.

### forge repositories
Manage app source code repositories.

### forge containers
Manage app containers.

### forge webtrigger
Manage web triggers for your app.

### forge assistant
AI assistant for Forge development.

### forge autocomplete
Configure shell autocompletion for the Forge CLI.

### forge feedback
Submit feedback about the Forge CLI.

## Common patterns

### CI/CD automation
`FORGE_API_TOKEN` must be a **scoped** API token — the CI secret can't be a classic API token.

```bash
export FORGE_EMAIL="user@example.com"
export FORGE_API_TOKEN="your-scoped-api-token"
forge deploy -e production --non-interactive
```

### Environment promotion workflow
```bash
forge deploy -e development       # test in dev (can use forge tunnel here)
forge deploy -e staging           # promote to staging (no tunnel — must deploy)
forge deploy -e production        # promote to production
```

### Adding or changing permissions (scopes)
When you add new scopes to `manifest.yml`, a plain `forge deploy` is not enough for existing installs — the permission consent hasn't been accepted yet. You need to upgrade each installation:

```bash
# Edit manifest.yml to add new scopes, then:
forge deploy
forge install --upgrade          # accept new scopes on all existing installs
forge install --upgrade --site example.atlassian.net --non-interactive   # CI-friendly
```

### Build-then-deploy workflow
```bash
forge build --tag $(git rev-parse --short HEAD)    # build with git hash tag
forge deploy --tag abc1234 -e staging              # deploy specific build
forge deploy --tag abc1234 -e production           # promote same build to prod
```

### Cloning someone else's Forge app repo
```bash
git clone <repo-url> && cd <repo>
npm install
forge register       # ⚠️ run only ONCE — gives this clone its own app ID
forge deploy
forge install
```

## Global options
Most commands support:
- `--verbose` — enable verbose output
- `-h, --help` — display help for command
- `--non-interactive` — run without input prompts (useful for CI/CD)
- `-e, --environment [env]` — specify target environment

## References
- Official CLI reference: https://developer.atlassian.com/platform/forge/cli-reference/
- Getting started: https://developer.atlassian.com/platform/forge/getting-started/
- Environments and versions: https://developer.atlassian.com/platform/forge/environments-and-versions/
- Tunneling guide: https://developer.atlassian.com/platform/forge/tunneling/
- Create a scoped API token: https://id.atlassian.com/manage-profile/security/api-tokens
