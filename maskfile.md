# Forge & Node Developer Utilities

Run this file with [Mask](https://github.com/jacobdeichert/mask),
a CLI task runner defined by a simple markdown file.
These tasks are for bootstrapping new projects;
hence, should be run with the `--maskfile` option
from [a different directory](https://github.com/jacobdeichert/mask?tab=readme-ov-file#running-mask-with-a-different-maskfile).


## home-init

> One-time, global home directory setup

### home-init shell

> Setup shell initialization

Saves the old shell initialization script with `.old` suffix.
Copies the standard `profile.sh` to the right script for the shell.
In effect, this moves all shell initialization to the scripts in `profile.d`.

```bash
cp -R "$MASKFILE_DIR/profile.d" "$HOME/profile.d"
case "$SHELL" in
  */bash)
    SHELL_PROFILE_INTERACTIVE=".bash_profile"
    ;;
  */zsh)
    SHELL_PROFILE_INTERACTIVE=".zshrc"
    ;;
  *)
    echo "Unsupported shell: $SHELL"
    echo "Manually copy the profile.sh to the appropriate shell profile"
    ;;
esac
if [[ -x "$HOME/$SHELL_PROFILE_INTERACTIVE" ]]; then
  mv "$HOME/$SHELL_PROFILE_INTERACTIVE" "$HOME/$SHELL_PROFILE_INTERACTIVE.old"
fi
cp "$MASKFILE_DIR/profile.sh" "$HOME/$SHELL_PROFILE_INTERACTIVE"
```

### home-init npm-global

> Setup home directory for managing global npm packages

Better installs than `npm install -g`
because "global" here persists across managed node versions.
The libraries we use are:
* [`@forge/cli`](https://developer.atlassian.com/platform/forge/cli-reference/)
* [`corepack`](https://github.com/nodejs/corepack): Zero-runtime-dependency package acting as bridge between Node projects and their package managers
* [`knip`](https://knip.dev/): find & remove unused npm libraries from repos
* [`promptfoo`](https://www.promptfoo.dev/): test/evaluate prompts
* [`sort-package-json`](https://github.com/keithamus/sort-package-json#readme): sort keys in the package.json
* [`tsx`](https://tsx.is/): run TypeScript code without configuration or compilation
* [`turbo`](https://turborepo.com/): the build system for JavaScript and TypeScript codebases (esp monorepos)
* [`yarn`](https://yarnpkg.com/): a package manager used by many Atlassian repos

Note: `yarn` is used in many Atlassian internal repos and even in some public examples
(out of habit).
To install `yarn`, use `yarn set version stable` via `corepack`.
Then use `yarn init -2` to setup a new repo.
We prefer `npm` for customer-facing repos
because it's 1 less thing for new Node developers to learn.

```sh
eval "$(fnm env --use-on-cd)"
fnm install --lts
fnm use default
# Path set in 10-env-bin.sh
mkdir "$HOME/npm-global"
cd "$HOME/npm-global"
node --version > .nvmrc
npm init --yes
tmp=$(mktemp) && \
  jq \
    '.name |= "npm-global" | .version |= "0.0.0" | .license |= "Apache-2.0" | .private |= true' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
tmp=$(mktemp) && \
  jq \
    '.description |= "A better way to manage global package that supports node version switching"' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
tmp=$(mktemp) && \
  jq \
    '.scripts = {}' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
tmp=$(mktemp) && \
  jq \
    '.dependencies += {
      "@forge/cli":"*",
      "corepack":"*",
      "knip":"*",
      "promptfoo":"*",
      "sort-package-json":"*",
      "tsx":"*",
      "turbo":"*" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
npm install
```

### home-init bin

> Setup home directory path for user-defined scripts

```sh
# Path set in 10-env-bin.sh
mkdir "$HOME/bin"
```

### home-init beautification

> Install shell beautification tools via `brew`

These are simply cosmetic
and aren't strictly required for Forge development.
Requires [`brew`](https://brew.sh/).
Beautification adds:
* [`macchina`](https://github.com/Macchina-CLI/macchina): print system info when starting a new shell
* [`starship`](https://starship.rs/): a "batteries included" shell prompt

```bash
brew_packages=(
  macchina
  starship
)
brew install ${brew_packages[@]}
```


## home-update

> Update global home configuration

### home-update defaults

> Default post-creation configuration for Forge Rovo agents

```sh
echo "home-update brew"
$MASK home-update brew
echo "home-update node-lts"
$MASK home-update node-lts
echo "home-update npm-global"
$MASK home-update npm-global
```

### home-update prereq

> Install required tools via `brew`
and Node LTS versions via `fnm`

Requires [`brew`](https://brew.sh/),
which in turn requires `curl`, `file`, and `git`.
The packages we use are:
* [`fnm`](https://github.com/Schniz/fnm): install, maintain, and switch between different versions of node.js
* [`git-cliff`](https://git-cliff.org/): generate changelogs from git commits using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
* [`jq`](https://jqlang.org/): command-line JSON processing used in these scripts
* [`yq`](https://mikefarah.gitbook.io/yq): command-line YAML processing used in these scripts

```bash
brew_packages=(
  fnm
  git-cliff
  jq
  yq
)
brew install ${brew_packages[@]}
```

### home-update brew

> Update versions of brew packages with `brew update`.

```bash
brew upgrade
```

### home-update node-lts

> Update Node LTS versions via `fnm`

Manages LTS versions of Node.js
corresponding to [what's available from Forge](https://developer.atlassian.com/platform/forge/function-reference/nodejs-runtime/).

```bash
node_lts=(
  hydrogen
  iron
  jod
  latest
)
for lts in "${node_lts[@]}"; do
  fnm install lts/$lts
done
fnm default lts/jod
fnm use default
```

### home-update npm-global

> Update libraries and versions of npm global packages in npm-global

The libraries we use are:
* [`@forge/cli`](https://developer.atlassian.com/platform/forge/cli-reference/)
* [`corepack`](https://github.com/nodejs/corepack): Zero-runtime-dependency package acting as bridge between Node projects and their package managers
* [`knip`](https://knip.dev/): find & remove unused npm libraries from repos
* [`promptfoo`](https://www.promptfoo.dev/): test/evaluate prompts
* [`sort-package-json`](https://github.com/keithamus/sort-package-json#readme): sort keys in the package.json
* [`tsx`](https://tsx.is/): run TypeScript code without configuration or compilation
* [`turbo`](https://turborepo.com/): the build system for JavaScript and TypeScript codebases (esp monorepos)
* [`yarn`](https://yarnpkg.com/): a package manager used by many Atlassian repos

Note: `yarn` is used in many Atlassian internal repos and even in some public examples
(out of habit).
To install `yarn`, use `yarn set version stable` via `corepack`.
Then use `yarn init -2` to setup a new repo.
We prefer `npm` for customer-facing repos
because it's 1 less thing for new Node developers to learn.

```bash
cd "$HOME/npm-global"
npm_globals=(
  @forge/cli
  corepack
  knip
  promptfoo
  sort-package-json
  tsx
  turbo
)
for lib in "${npm_globals[@]}"; do
  tmp=$(mktemp) && \
    jq \
      --arg lib "$lib" \
      '.dependencies += { $lib:"*" }' \
      package.json \
      > "$tmp" && \
    mv "$tmp" package.json
done
npm update
```


## repo-create

> Create new projects

### repo-create node

> Create a new Node project

```sh
npm init --yes
tmp=$(mktemp) && \
  jq \
    --arg node_version ">=`node --version | cut -c2-`" \
    --arg npm_version ">=`npm --version`" \
    '.engines = { "node":$node_version, "npm":$npm_version }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

### repo-create forge

> Create a new Forge project

```sh
forge create
```


## repo-init

> One-time, post-creation configuration of new projects

These subcommands are expected to be run only once
because they are not idempotent.
Multiple executions may be distructive,
or duplicative.

### repo-init all

> Run all post-creation configuration for Forge Rovo agents

```sh
echo "## node.js options"
echo "repo-init biome"
$MASK repo-init biome
echo "repo-init changelog"
$MASK repo-init changelog
echo "repo-init gitignore"
$MASK repo-init gitignore
echo "repo-init oss"
$MASK repo-init oss
echo "repo-init package"
$MASK repo-init package
echo "repo-init promptfoo"
$MASK repo-init promptfoo
echo "repo-init typescript"
$MASK repo-init typescript
echo "repo-init vitest"
$MASK repo-init vitest
echo "## forge options"
echo "repo-init dev-trigger"
$MASK repo-init dev-trigger
echo "repo-init lifecycle-trigger"
$MASK repo-init lifecycle-trigger
echo "repo-init rovo"
$MASK repo-init rovo
echo "repo-update format-forge"
$MASK repo-update format-forge
echo "repo-update pin-node-version"
$MASK repo-update pin-node-version
```

### repo-init defaults

> Default post-creation configuration for Forge Rovo agents

```sh
echo "## node.js options"
echo "repo-init gitignore"
$MASK repo-init gitignore
echo "repo-init oss"
$MASK repo-init oss
echo "repo-init package"
$MASK repo-init package
echo "repo-init typescript"
$MASK repo-init typescript
echo "## forge options"
echo "repo-init lifecycle-trigger"
$MASK repo-init lifecycle-trigger
echo "repo-init rovo"
$MASK repo-init rovo
echo "repo-update format-forge"
$MASK repo-update format-forge
```

### repo-init biome

> Initialize linting & formatting with Biome

[Biome](https://biomejs.dev/).

```sh
npm install --save-dev --save-exact @biomejs/biome
chmod +x node_modules/@biomejs/cli-darwin-arm64/biome
npx @biomejs/biome init
tmp=$(mktemp) && \
  jq \
    '.vcs.enabled |= true | .vcs.useIgnoreFile |= true | .vcs.defaultBranch = "main"' \
    biome.json \
    > "$tmp" && \
  mv "$tmp" biome.json
tmp=$(mktemp) && \
  jq \
    '.formatter.indentStyle |= "space"' \
    biome.json \
    > "$tmp" && \
  mv "$tmp" biome.json
tmp=$(mktemp) && \
  jq \
    '.scripts += { "check":"biome check --write", "format":"biome format --write", "lint":"biome lint" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

### repo-init changelog

> Initialize changelog with [`git-cliff`](https://git-cliff.org/)

```sh
git cliff --init github
tmp=$(mktemp) && \
  jq \
    '.scripts += { "changelog":"git cliff" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

### repo-init gitignore

> Initialize a `.gitignore` file.

```bash
gitignore=(
  visualstudiocode
  linux
  macos
  windows
  node
  turbo
  yarn
)
query=$(IFS=, ; echo "${gitignore[*]}")
curl \
  --silent \
  --location \
  https://www.gitignore.io/api/$query \
  > .gitignore
```

### repo-init oss

> Initialize the project with Atlassian OSS scaffolding

```bash
files=(
  CODE_OF_CONDUCT.md
  CONTRIBUTING.md
  LICENSE
)
for file in "${files[@]}"; do
  cp $MASKFILE_DIR/$file .
done
touch README.md
cp -R $MASKFILE_DIR/.atlassian .
tmp=$(mktemp) && \
  jq \
    '.license = "Apache-2.0"' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

### repo-init package

> Initialize default values for `package.json`

```sh
tmp=$(mktemp) && \
  jq \
    '.version |= "0.0.0" | .license |= "Apache-2.0" | .private |= true' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
tmp=$(mktemp) && \
  jq \
    --arg name `basename "$(pwd)"` \
    '.name = $name' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

### repo-init promptfoo

> Initialize Node project with standard [`promptfoo`](https://www.promptfoo.dev/) configuration

This is compatible with the Rovo configuration (`repo-init rovo`).

```sh
npm install --save-dev promptfoo
npx promptfoo init
cp $MASKFILE_DIR/promptfooconfig.yaml .
cp -R $MASKFILE_DIR/test .
mkdir -p prompts
touch prompts/agent-instructions.md
tmp=$(mktemp) && \
  jq \
    '.scripts += { "eval":"promptfoo eval", "view":"promptfoo view" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

### repo-init rovo

> Initialize Forge project with standard prompt configuration

```sh
yq \
  --inplace \
  --prettyPrint \
  '.modules["rovo:agent"] = (.modules["rovo:agent"] // [{"key": "rovo-agent", "name": "Rovo Agent"}])' \
  manifest.yml
mkdir -p prompts
touch prompts/agent-instructions.md
yq \
  --inplace \
  --prettyPrint \
  '.resources += [{ "key":"agent-prompts", "path":"prompts" }]' \
  manifest.yml
yq \
  --inplace \
  --prettyPrint \
  '.modules["rovo:agent"][].prompt = "resource:agent-prompts;agent-instructions.md"' \
  manifest.yml
  modules=(
    @biomejs/biome
    tsx
    typescript
    yaml
  )
  npm install --save-dev ${modules[@]}
tmp=$(mktemp) && \
  jq \
    '.scripts += { "actiontypes":"tsx ./scripts/actiontypes.ts && biome format --write" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
cp $MASKFILE_DIR/tsconfig.json .
mkdir -p src/rovo
cp $MASKFILE_DIR/src/rovo/action.ts src/rovo
mkdir -p scripts
cp $MASKFILE_DIR/scripts/actiontypes.ts scripts
```

### repo-init typescript

> Initialize TypeScript for a Node project

[TypeScript](https://www.typescriptlang.org/)
is JavaScript with syntax for types.

```bash
modules=(
  tsx
  typescript
  @types/node
)
npm install --save-dev ${modules[@]}
tmp=$(mktemp) && \
  jq \
    '.scripts += { "build":"tsc", "clean":"rm -rf ./dist" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
cp $MASKFILE_DIR/tsconfig.json .
```

### repo-init vitest

> Initialize linting & formatting with Vitest

[Vitest](https://vitest.dev/).

```sh
npm install --save-dev vitest
tmp=$(mktemp) && \
  jq \
    '.scripts += { "test":"vitest" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

### repo-init dev-trigger

> Initialize Forge project with webtrigger configuration for testing

```sh
yq \
  --inplace \
  --prettyPrint \
  '.modules.webtrigger += [{ "key":"dev-trigger", "function":"trigger", "response":{ "type":"dynamic" }}]' \
  manifest.yml
yq \
  --inplace \
  --prettyPrint \
  '.modules.function += [{ "key":"trigger", "handler":"index.trigger" }]' \
  manifest.yml
mkdir -p src/forge
cp $MASKFILE_DIR/src/forge/events.ts src/forge
cp $MASKFILE_DIR/src/forge/trigger.ts src/forge
echo 'export { trigger } from "./forge/trigger";' >> src/index.ts
```

### repo-init lifecycle-trigger

> Initialize Forge project with lifecycle for observability

```sh
yq \
  --inplace \
  --prettyPrint \
  '.modules.trigger += [{ "key":"trigger-lifecycle", "function":"lifecycle-handler", "events":[ "avi:forge:installed:app", "avi:forge:upgraded:app"] }]' \
  manifest.yml
yq \
  --inplace \
  --prettyPrint \
  '.modules.function += [{ "key":"lifecycle-handler", "handler":"index.lifecycle" }]' \
  manifest.yml
mkdir -p src/forge
cp $MASKFILE_DIR/src/forge/events.ts src/forge
cp $MASKFILE_DIR/src/forge/lifecycle.ts src/forge
echo 'export { lifecycle } from "./forge/lifecycle";' >> src/index.ts
```

### repo-init config

> Initialize Node project with standard env var configuration

Not yet implemented.


## repo-update

> Update existing project configurations

These subcommands are expected to be run at regular intervals
because they are idempotent.
These commands should not destroy any existing code or configuration.

### repo-update format-forge

> Format the `manifest.yml` for a freshly created Forge project

```sh
modules_pick='.modules |= pick( (["rovo:agent", "action"] + keys - ["function"]) | unique + ["function"])'
submodules_pick='.modules[][] |= pick( (["key", "name", "title", "description"] + keys) | unique)'
inputs_pick='.modules.action[].inputs[] |= pick( (["key", "name", "title", "description"] + keys) | unique)'
yq \
  --inplace \
  --prettyPrint \
  "sort_keys(..) | $modules_pick | $submodules_pick | $inputs_pick" \
  manifest.yml
yq \
  --inplace \
  --prettyPrint \
  "del(.. | select(length == 0))" \
  manifest.yml
```

### repo-update pin-node-version

> Pin the project's Node version to what is currently available

```sh
node --version > .nvmrc
tmp=$(mktemp) && \
  jq \
    --arg node_version "$(node --version | cut -c2-)" \
    '.engines = { "node":$node_version }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```
