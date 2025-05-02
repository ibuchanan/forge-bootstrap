# Forge Onboarding

[Forge getting started instructions](https://developer.atlassian.com/platform/forge/getting-started/)
are solid for the range of newbies and experts
because they embrace the "least common denominator" options.
These instruction target the occasional developer within Atlassian,
optimizing for:
* rapid spin-up of [a Forge dev configuration](https://www.atlassian.com/blog/it-teams/configuration-management-for-dev-environments)
* potentially long times of inactivity, and a need to refresh the configuration

Follow the steps below instead of running Forge getting started.
They are longer, but will make it easier to maintain over time.

Use the test subsections to check
if the step was performed correctly.
All test commands should return obvious results,
like a version number.
An error is a test failure.

## 1. Atlassian default is MacOS

These instructions assume running on MacOS.
The general configuration works on Linux
but no instructions have been written to explain that variation.
On MacOS, [the default shell](https://support.apple.com/en-gb/guide/terminal/trml113/mac)
is already `zsh`.

### Test

```bash
echo $SHELL
```

## 2. Homebrew

[Homebrew](https://brew.sh/) is,
"The Missing Package Manager for macOS"
(and also works on Linux).
Because Atlassian no longer allows users to be admins on their own machines,
please use the [untar anywhere](https://docs.brew.sh/Installation#untar-anywhere-unsupported)
method of installation.

```bash
mkdir $HOME/homebrew
cd $HOME
curl -L https://github.com/Homebrew/brew/tarball/master | tar xz --strip-components 1 -C homebrew
eval "$($HOME/homebrew/bin/brew shellenv)"
brew update --force --quiet
chmod -R go-w "$(brew --prefix)/share/zsh"
```

You may need to confirm the installation of Xcode CLI tools.
Once homebrew is installed,
restart the shell.

### Test

```bash
brew -—version
```

## 3. Mask

```bash
brew install mask
```

### Test

```bash
mask --version
```

## 4. Git

[Git](https://git-scm.com/) comes preinstalled on MacOS.
And will be installed by Brew if it was not installed.
As such the following is more a matter of configuration.

### Standard dir structure

Over time, you may accumulate many cloned Git repos.
It helps to have some directory structure to help manage them.
For now, we only need the structure for cloning this repo.
If you vary from this structure,
you'll have to modify configuration in a later step.

```bash
mkdir -p $HOME/dev/git/github.com/ibuchanan
```

### Clone the forge-bootstrap helper

```bash
cd $HOME/dev/git/github.com/ibuchanan
git clone https://github.com/ibuchanan/forge-bootstrap.git
```

### Test

```bash
git --version
dir $HOME/dev/git/github.com/ibuchanan/forge-bootstrap
```

## 5. Bootstrapping

In the `forge-bootstrap` dir:
```bash
mask home-update prereq
mask home-init shell
mask home-init bin
mask home-init npm-global
mask home-init beautification
```

Restart your shell.

### Test

Upon restart, you should see a pretty shell.

```bash
fnm --version
forge-bootstrap --help
```

## 6. Global Node commands

```bash
forge-bootstrap home-update node-lts
forge-bootstrap home-update npm-global
```

Restart your shell.

### Test

```bash
node --version
fnm ls
forge --version
```

## 7. Forge Login

[Obtain an API Token and use it to login to Forge](https://developer.atlassian.com/platform/forge/getting-started/#log-in-with-an-atlassian-api-token).

```bash
forge login
```

### Test

```bash
forge whoami
```

## 8. Install VS Code

```bash
brew install visual-studio-code
```

### Test

```bash
cd $HOME/dev/git/github.com/ibuchanan/forge-bootstrap
code .
```

## 9. Other configuration

After the Bootstrapping step,
the home directory should have a `profile.d` subdirectory.
The headers below explain where some additional configuration may be necessary
if defaults above do not work.

### 10-env-vars.sh

Set the following variables:

```bash
export GITHUB_USER=""
export EMAIL=""
export NAME=""
```

### 92-shell-forge.sh

If `forge login` does not work,
uncomment and set the following variables:
```bash
export FORGE_EMAIL=""
export FORGE_API_TOKEN=""
```

If the git repo was cloned into a different path,
set the following variable accordingly:
```bash
export FORGE_BOOTSTRAP_HOME="$HOME/dev/git/github.com/ibuchanan/forge-bootstrap"
```

## 10. Forge away!

You will need a site as a development environment.
For Atlassians,
a [One Atlassian](https://hello.atlassian.net/wiki/spaces/ONEATLAS/overview)
environment is a good start because it has existing data.
Use [go/one-atlas-request](http://go.atlassian.com/one-atlas-request)
to provision one automatically.
Alternatively,
use [go/cloud-dev](http://go.atlassian.com/cloud-dev).

To start learning about Forge,
make the [Forge Quest](https://developer.atlassian.com/platform/tool/forge-quest/forge-novice/about-forge/).

## 11. Standard configuration for new Forge Rovo projects

Create new apps with the standard [`forge create`](https://developer.atlassian.com/platform/forge/cli-reference/create/) command.
Then layer the following into the project:
* biome: a tool for linting & formatting
* changelog: use the conventional commit notation and `git-cliff` to help manage versions
* format-forge: order keys in the manifest for better walk-through explanation
* gitignore: expand files & directories that will be ignored by git
* oss: add Atlassian open-source boilerplate
* package: set better defaults in the `package.json`
* rovo: move the prompt module into a file
* typescript: initialize TypeScript for the project

For more details on all these options,
see the `maskfile.md`.
Feel free to apply configuration more selectively.

```bash
forge-bootstrap repo-init defaults
```

### Test

```bash
forge lint
```


## 12. Keeping up with changes

From time to time,
keep the environment configured with latest versions of the tooling.

### Update brew packages

```bash
brew upgrade
```

### Test

```bash
fnm --version
```

### Update the forge-bootstrap repo

```bash
cd $FORGE_BOOTSTRAP_HOME
git pull
```

### Test

```bash
forge-bootstrap --version
```

### Update the home directory tooling

Installs latest LTS versions of Node
and makes sure global Node libs,
including Forge,
are up-to-date.

```bash
forge-bootstrap home-update defaults
```

### Test

```bash
node --version
forge --version
```
