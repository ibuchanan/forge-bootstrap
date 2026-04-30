# Forge Bootstrap

Forge Bootstrap is a Mask-powered toolkit for setting up and refreshing an
Atlassian Forge development environment. It is optimized for occasional Forge
and Rovo developers who want repeatable setup, easy refresh commands, and
generated project defaults.

The home-directory tooling is moving away from `npm install --global` and
npm-global state. Use:

- [`bun`](https://bun.sh/) for global JavaScript CLIs such as `@forge/cli`,
  `promptfoo`, `tsx`, and `turbo`.
- [`uv`](https://docs.astral.sh/uv/) for Python-based tools installed with
  `uv tool`.
- [`fnm`](https://github.com/Schniz/fnm) for Node.js runtime versions used by
  Forge projects.

## What this repo provides

- Shell profile snippets that put `$HOME/.bun/bin`, `$HOME/.local/bin`, and
  `$HOME/bin` on `PATH`.
- Mask commands for one-time home setup and ongoing tool updates.
- Mask commands for adding common Forge/Rovo project defaults after
  `forge create`.
- Starter files for TypeScript, promptfoo, Biome, AI-agent instructions, OSS
  boilerplate, and Forge tests.

## Prerequisites

These instructions assume macOS with `zsh`. The scripts are mostly shell-based
and may work on Linux, but Linux setup is not documented here.

Install Homebrew first. On locked-down macOS machines where admin access is
unavailable, use Homebrew's untar-anywhere installation pattern:

```bash
mkdir "$HOME/homebrew"
cd "$HOME"
curl -L https://github.com/Homebrew/brew/tarball/master \
  | tar xz --strip-components 1 -C homebrew
eval "$("$HOME/homebrew/bin/brew" shellenv)"
brew update --force --quiet
chmod -R go-w "$(brew --prefix)/share/zsh"
```

Then install Mask:

```bash
brew install mask
mask --version
```

## Quickstart: set up a Forge workstation

Clone this repo into the path expected by the shell profile snippet:

```bash
mkdir -p "$HOME/dev/git/github.com/ibuchanan"
cd "$HOME/dev/git/github.com/ibuchanan"
git clone https://github.com/ibuchanan/forge-bootstrap.git
cd forge-bootstrap
```

Run the one-time bootstrap commands:

```bash
mask home-update prereq
mask home-init shell
mask home-init bin
mask home-init beautification
mask home-update node-lts
mask home-init bun
mask home-init uv
mask home-init bun-global
```

Open a new terminal window, then verify the tools are on `PATH`:

```bash
fnm --version
node --version
bun --version
uv --version
forge --version
forge-bootstrap --help
```

`forge-bootstrap` is an alias installed by
`src/home-init/shell/profile.d/92-shell-forge.sh`. If you clone the repo
somewhere else, set `FORGE_BOOTSTRAP_HOME` in
`~/profile.d/92-shell-forge.sh`.

## Refresh global tooling

Use the default update command to keep Homebrew packages, Node LTS versions,
bun, bun-managed global CLIs, and uv-managed tools current:

```bash
forge-bootstrap home-update defaults
```

This runs the update path defined in `maskfile.md`:

- `home-update brew`
- `home-update node-lts`
- `home-update bun`
- `home-update bun-global`
- `home-update uv-tool`

## Forge login

Create an Atlassian API token, then log in with the Forge CLI:

```bash
forge login
forge whoami
```

If interactive login does not work, uncomment and set the Forge environment
variables in `~/profile.d/92-shell-forge.sh`:

```bash
export FORGE_EMAIL=""
export FORGE_API_TOKEN=""
```

## Create and initialize a Forge/Rovo project

Create a Forge app with the standard Forge CLI:

```bash
forge create
```

Then apply the default repo initialization from inside the new app directory:

```bash
forge-bootstrap repo-init defaults
```

The default init layers in common repository files and project conventions,
including:

- expanded `.gitignore` entries
- Atlassian OSS boilerplate
- changelog configuration
- `package.json` defaults and common scripts
- TypeScript configuration
- AI-agent instructions and Forge CLI skill guidance
- Forge test helpers
- manifest formatting and Node runtime pinning

For optional init commands such as Biome, promptfoo, Rovo prompt extraction,
and trigger helpers, see `maskfile.md`.

Verify a generated Forge project with:

```bash
forge lint
```

## Common workflows

### Update this repo

```bash
cd "$FORGE_BOOTSTRAP_HOME"
git pull
forge-bootstrap --version
```

### Install or update global JavaScript CLIs

Global JavaScript CLIs should be managed by bun, not npm-global:

```bash
forge-bootstrap home-init bun-global
forge-bootstrap home-update bun-global
```

### Update uv-managed tools

```bash
forge-bootstrap home-update uv-tool
```

## Important files

- `maskfile.md` — command reference and implementation for home and repo setup.
- `src/home-init/shell/profile.d/` — shell snippets copied into `~/profile.d`.
- `src/repo-init/` — files copied into generated Forge/Rovo projects.
- `.devcontainer/devcontainer.json` — development container bootstrap.

## Notes and caveats

- The bootstrap command replaces your interactive shell profile after backing up
  the existing file.
- Forge project package scripts may still use `npm run` because Forge templates
  and many Node projects continue to expose npm-compatible scripts. That is
  separate from global CLI installation, which is now bun-managed.
- `home-init bun` and `home-init uv` use the official curl-to-shell installers
  documented by those projects.
