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
mkdir -p "$HOME/profile.d"
cp "$MASKFILE_DIR/src/home-init/shell/profile.d/*" "$HOME/profile.d"
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
if [[ -f "$HOME/$SHELL_PROFILE_INTERACTIVE" ]]; then
  BACKUP_SUFFIX=".backup.$(date +%Y%m%d_%H%M%S)"
  cp "$HOME/$SHELL_PROFILE_INTERACTIVE" "$HOME/$SHELL_PROFILE_INTERACTIVE.$BACKUP_SUFFIX"
  if [[ -f "$HOME/$SHELL_PROFILE_INTERACTIVE.$BACKUP_SUFFIX" ]]; then
    cp "$MASKFILE_DIR/src/home-init/shell/profile.sh" "$HOME/$SHELL_PROFILE_INTERACTIVE"
  fi
fi
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
* [`vskill`](https://verified-skill.com/): a package manager & builder for securing the AI skills supply chain
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
      "turbo":"*",
      "vskill":"*"
      }' \
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

### home-init bun

> Install [`bun`](https://bun.sh/) via the official install script

Uses the official `curl`-to-shell install method documented at
[bun.sh/docs/installation](https://bun.sh/docs/installation).

```bash
curl -fsSL https://bun.sh/install | bash
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
echo "home-update bun"
$MASK home-update bun
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
  iron
  jod
  krypton
  latest
)
for lts in "${node_lts[@]}"; do
  fnm install lts/$lts
done
fnm default lts/krypton
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
* [`vskill`](https://verified-skill.com/): a package manager & builder for securing the AI skills supply chain
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
  vskill
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

### home-update bun

> Update [`bun`](https://bun.sh/) to the latest version

Uses `bun upgrade` to update an existing install to the latest version.
See `home-init bun` for the initial install.

```bash
bun upgrade
```

### home-update rovo-dev

> Configure Rovo Dev CLI with bash commands for Forge dev

```sh
commands=(
  'tree'
  'jq'
  'yq'
  'npm run'
  'npm test'
  'forge --help'
  'forge environments'
  'forge lint'
  'forge logs'
  'forge version'
  'forge whoami'
  'knip'
  'sort-package-json'
)
for cmd in "${commands[@]}"; do
  export cmd
  yq \
    --inplace \
    --prettyPrint \
    '.toolPermissions.bash.commands += [{"command": (strenv(cmd) + "(\s.*)?"), "permission": "allow"}]' \
    "$HOME/.rovodev/config.yml"
done
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
echo "## git options"
echo "repo-init gitignore"
$MASK repo-init gitignore
echo "repo-init oss"
$MASK repo-init oss
echo "repo-init changelog"
$MASK repo-init changelog

echo "## node.js options"
rm -Rf node_modules
rm package-lock.json
echo "repo-init package"
$MASK repo-init package
echo "repo-init typescript"
$MASK repo-init typescript
echo "repo-init biome"
$MASK repo-init biome

echo "## forge options"
echo "repo-init aidev"
$MASK repo-init aidev
echo "repo-init dev-trigger"
$MASK repo-init dev-trigger
echo "repo-init lifecycle-trigger"
$MASK repo-init lifecycle-trigger
echo "repo-init rovo"
$MASK repo-init rovo
echo "repo-init test"
$MASK repo-init test
echo "repo-init promptfoo"
$MASK repo-init promptfoo
echo "repo-update format-forge"
$MASK repo-update format-forge
echo "repo-update pin-node-version"
$MASK repo-update pin-node-version
```

### repo-init defaults

> Default post-creation configuration for typical Forge apps

```sh
echo "## git options"
echo "repo-init gitignore"
$MASK repo-init gitignore
echo "repo-init oss"
$MASK repo-init oss
echo "repo-init changelog"
$MASK repo-init changelog

echo "## node.js options"
rm -Rf node_modules
rm package-lock.json
echo "repo-init package"
$MASK repo-init package
echo "repo-init typescript"
$MASK repo-init typescript

echo "## forge options"
echo "repo-init aidev"
$MASK repo-init aidev
echo "repo-init test"
$MASK repo-init test
echo "repo-update format-forge"
$MASK repo-update format-forge
echo "repo-update pin-node-version"
$MASK repo-update pin-node-version
```

### repo-init aidev

> Initialize repo with skills, agents instructions, etc used by AI coding agents.

```sh
cp $MASKFILE_DIR/src/repo-init/aidev/AGENTS.md .
cp -R $MASKFILE_DIR/src/repo-init/aidev/.agents .
```

### repo-init biome

> Initialize linting & formatting with Biome

[Biome](https://biomejs.dev/).

```sh
npm install --save-dev --save-exact @biomejs/biome
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
    '.scripts += { 
      "format":"biome format --write", 
      "format:check":"biome format", 
      "lint:check":"biome lint", 
      "lint:fix":"biome lint --write"
      }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
cp $MASKFILE_DIR/src/repo-init/format/.editorconfig .
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
  cp $MASKFILE_DIR/src/repo-init/oss/$file .
done
touch README.md
cp -R $MASKFILE_DIR/src/repo-init/oss/.atlassian .
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
tmp=$(mktemp) &&
	jq \
		'.version |= "0.0.0" | .license |= "Apache-2.0" | .private |= true' \
		package.json \
		>"$tmp" &&
	mv "$tmp" package.json
tmp=$(mktemp) &&
	jq \
		--arg name "$(basename "$(pwd)")" \
		'.name = $name' \
		package.json \
		>"$tmp" &&
	mv "$tmp" package.json
common_scripts=(
	build
	changelog
	check
	clean
	dev
	forge:deploy
	forge:install
	forge:uninstall
	forge:upgrade
	format
	format:check
	generate
	generate:openapi
	generate:rovo
	lint
	lint:check
	lint:fix
	test
	test:coverage
	test:watch
	prepare
	preview
	start
	todo
	typecheck
)
for script in "${common_scripts[@]}"; do
	tmp=$(mktemp) &&
		jq \
			--arg script "$script" \
			--arg not_implemented "echo 'Not implemented'" \
			'.scripts += { ($script):$not_implemented }' \
			package.json \
			>"$tmp" &&
		mv "$tmp" package.json
done
tmp=$(mktemp) &&
	jq \
		--arg name "$(basename "$(pwd)")" \
		'.name = $name' \
		package.json \
		>"$tmp" &&
	mv "$tmp" package.json
tmp=$(mktemp) &&
	jq \
		--arg todo "'TODO'" \
		--arg package_json "'package.json'" \
		--arg message "'No TODOs found!'" \
		'.scripts += {
      "check":"npm run lint && npm run format:check && npm run typecheck",
      "clean":"rm -rf ./dist",
      "forge:deploy": "source .env && forge deploy --environment development",
      "forge:install": "source .env && forge install --site \"$SITENAME.atlassian.net\" --product $PRODUCT --environment development --non-interactive",
      "forge:uninstall": "source .env && forge uninstall --site \"$SITENAME.atlassian.net\" --product $PRODUCT",
      "forge:upgrade": "source .env && forge install --upgrade --site \"$SITENAME.atlassian.net\" --product $PRODUCT --environment development --non-interactive",
      "generate":"npm run generate:openapi && npm run generate:rovo",
      "lint":"npm run lint:check && forge lint",
      "todo":"grep -rn \($todo) --exclude=\($package_json) . --color=auto || echo \($message)",
      }' \
		package.json \
		>"$tmp" &&
	mv "$tmp" package.json
sort-package-json
```

### repo-init promptfoo

> Initialize Node project with standard [`promptfoo`](https://www.promptfoo.dev/) configuration

This is compatible with the Rovo configuration (`repo-init rovo`).

```sh
$MASK repo-init test
npm install --save-dev promptfoo
npx promptfoo init
cp $MASKFILE_DIR/src/repo-init/promptfoo/promptfooconfig.yaml .
cp -R $MASKFILE_DIR/src/repo-init/promptfoo/tests .
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
$MASK repo-init typescript
npm install --save-dev yaml
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
tmp=$(mktemp) && \
  jq \
    '.scripts += { "generate:rovo":"tsx ./scripts/actiontypes.ts && npm run format" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
mkdir -p src/rovo
cp $MASKFILE_DIR/src/rovo/src/rovo/action.ts src/rovo
mkdir -p scripts
cp $MASKFILE_DIR/src/rovo/scripts/actiontypes.ts scripts
```

### repo-init typescript

> Initialize TypeScript for a Node project

* [TypeScript](https://www.typescriptlang.org/)
is JavaScript with syntax for types.
* [`tsx`](https://tsx.is/)
runs TypeScript code without configuration or compilation.
* [openapi-typescript](https://openapi-ts.dev/)
is a library for converting OpenAPI 3.0/3.1 schemas to TypeScript types 
and type-safe fetching.

```bash
modules=(
  openapi-typescript
  tsx
  typescript@5
  @types/node
)
npm install --save-dev ${modules[@]}
tmp=$(mktemp) && \
  jq \
    '.scripts += { 
      "build":"tsc", 
      "generate:openapi":"openapi-typescript", 
      "typecheck":"tsc --noEmit", 
      }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
cp $MASKFILE_DIR/src/repo-init/typescript/tsconfig.json .
cp $MASKFILE_DIR/src/repo-init/typescript/redocly.yaml .
for file in $(find src -name "*.jsx"); do mv "$file" "${file%.jsx}.tsx"; done
for file in $(find src -name "*.js"); do mv "$file" "${file%.js}.ts"; done
```

### repo-init test

> Initialize testing with Vitest, ArchUnitTS, and initial Forge tests

* [Vitest](https://vitest.dev/)
* [ArchUnitTS](https://lukasniessen.github.io/ArchUnitTS/)

With [configuration for Vitest](https://lukasniessen.github.io/ArchUnitTS/#md:vitest)

```sh
$MASK repo-init typescript
modules=(
  vitest
  archunit
)
npm install --save-dev ${modules[@]}
tmp=$(mktemp) && \
  jq \
    '.scripts += { 
      "test": "vitest run",
      "test:watch": "vitest watch",
      "test:coverage": "vitest run --coverage",
      }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
cat << 'EOF' > vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
    },
});
EOF
cp -R $MASKFILE_DIR/src/repo-init/tests .
```

### repo-init dev-trigger

> Initialize Forge project with webtrigger configuration for testing

```sh
$MASK repo-init typescript
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
$MASK repo-init typescript
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
