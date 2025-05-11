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
because "global" here persists across node versions

```sh
# Path set in 10-env-bin.sh
fnm install lts/$lts
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
    '.dependencies += { "@forge/cli": "*","knip": "*","tsx": "*", "yarn": "*" }' \
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

Requires [`brew`](https://brew.sh/).

```bash
brew_packages=(
  fastfetch
  starship
)
brew install ${brew_packages[@]}
```


## home-update

> Update global home configuration

### home-update defaults

> Default post-creation configuration for Forge Rovo agents

```sh
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

```bash
brew_packages=(
  fnm
  git-cliff
  jq
  yq
)
brew install ${brew_packages[@]}
```

### home-update node-lts

> Update Node LTS versions via `fnm`

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
```

### home-update npm-global

> Update versions of packages in npm-global

```sh
cd "$HOME/npm-global"
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

### repo-init defaults

> Default post-creation configuration for Forge Rovo agents

```sh
echo "repo-init biome"
$MASK repo-init biome
echo "repo-init changelog"
$MASK repo-init changelog
echo "repo-init format-forge"
$MASK repo-init format-forge
echo "repo-init gitignore"
$MASK repo-init gitignore
echo "repo-init oss"
$MASK repo-init oss
echo "repo-init package"
$MASK repo-init package
echo "repo-init rovo"
$MASK repo-init rovo
echo "repo-init typescript"
$MASK repo-init typescript
```

### repo-init format-forge

> Format the `manifest.yml` for a freshly created Forge project

```sh
modules_pick='.modules |= pick( (["rovo:agent"] + keys) | unique)'
submodules_pick='.modules[][] |= pick( (["key", "name", "title", "description"] + keys) | unique)'
inputs_pick='.modules.action[].inputs[] |= pick( (["key", "name", "title", "description"] + keys) | unique)'
yq \
  --inplace \
  --prettyPrint \
  "sort_keys(..) | $modules_pick | $submodules_pick | $inputs_pick" \
  manifest.yml
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
)
query=$(IFS=, ; echo "${gitignore[*]}")
curl \
  --silent \
  --location \
  https://www.gitignore.io/api/$query \
  > .gitignore
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
    '.scripts += { "check":"check --write","format":"biome format --write","lint":"biome lint" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

### repo-init typescript

> Initialize TypeScript for a Node project

[TypeScript](https://www.typescriptlang.org/)
is JavaScript with syntax for types.

```bash
modules=(
  typescript
  @types/node
)
npm install --save-dev ${modules[@]}
tmp=$(mktemp) && \
  jq \
    '.scripts += { "build":"tsc","clean":"rm -rf ./dist" }' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
cp $MASKFILE_DIR/tsconfig.json .
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

### repo-init rovo

> Initialize Forge project with standard directory structure

```sh
mkdir -p prompts
touch prompts/agent-prompt.md
yq \
  --inplace \
  --prettyPrint \
  '.resources = [{ "key": "agent-prompts", "path": "prompts" }]' \
  manifest.yml
yq \
  --inplace \
  --prettyPrint \
  '.modules["rovo:agent"][].prompt = "resource:agent-prompts;agent-prompt.md"' \
  manifest.yml
```

### repo-init changelog

> Initialize changelog with git-cliff

```sh
git cliff --init github
```

### repo-init config

> Initialize Node project with standard env var configuration

Not yet implemented.


## repo-update

> Update existing project configurations

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
