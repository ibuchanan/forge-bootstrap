# Forge & Node Developer Utilities

Run this file with [Mask](https://github.com/jacobdeichert/mask),
a CLI task runner defined by a simple markdown file.
These tasks are for bootstrapping new projects;
hence, should be run with the `--maskfile` option
from [a different directory](https://github.com/jacobdeichert/mask?tab=readme-ov-file#running-mask-with-a-different-maskfile).

## prereq

> Install required tools via `brew`
and Node LTS versions via `fnm`

Requires [`brew`](https://brew.sh/),
which in turn requires `curl`, `file`, and `git`.

```sh
brew_packages=(
  fnm
  jq
  yq
)
brew install ${brew_packages[@]}
node_lts=(
  lts/latest
  lts/iron
  lts/hydrogen
)
fnm install ${node_lts[@]}
```

## update-node-lts

> Update Node LTS versions via `fnm`

```sh
node_lts=(
  lts/latest
  lts/iron
  lts/hydrogen
)
fnm install ${node_lts[@]}
```

## create-node

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

## init-package

> Initialize default values for `package.json`

```sh
tmp=$(mktemp) && \
  jq \
    '.version |= "0.0.0" | .license |= "Apache-2.0" | .private |= true' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```

## pin-node-version

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

## init-gitignore

> Initialize a `.gitignore` file.

```sh
gitignore=(
  code
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

## init-biome

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

## init-typescript

> Initialize TypeScript for a Node project

[TypeScript](https://www.typescriptlang.org/)
is JavaScript with syntax for types.

```sh
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

## format-forge

> Initialize a freshly created Forge project

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

## init-config

> Initialize Node project with standard env var configuration

## init-oss

> Initialize the project with Atlassian OSS scaffolding

```sh
files=(
  CODE_OF_CONDUCT.md
  CONTRIBUTING.md
  LICENSE
)
cp $MASKFILE_DIR/${files[@]} .
cp -R $MASKFILE_DIR/.atlassian .
tmp=$(mktemp) && \
  jq \
    '.license = "Apache-2.0"' \
    package.json \
    > "$tmp" && \
  mv "$tmp" package.json
```
