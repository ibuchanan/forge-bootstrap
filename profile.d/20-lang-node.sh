#! /usr/bin/env bash
# [Node.js](https://nodejs.org/)
# export NODE_ENV=development
# Forge doesn't like NODE_ENV

# [fnm](https://fnm.vercel.app/)
# brew install fnm
export FNM_DIR="$HOME/.fnm"
if [[ -d "$FNM_DIR" ]] && [[ -x "$(command -v fnm)" ]]; then
    eval "$(fnm env --use-on-cd)"
fi

# [Node Version Manager](https://github.com/nvm-sh/nvm)
# brew install nvm
# Works but complains
export NVM_DIR="$HOME/.nvm"
if [[ -d "$NVM_DIR" ]] && [[ -x "$(command -v nvm)" ]]; then
    source "$(brew --prefix nvm)/nvm.sh"
fi
