#! /usr/bin/env bash
# Prepending to the path so last location will be first

# npm-global
# Better installs than `npm install -g`
# because "global" here persists across node versions
NPM_GLOBAL="$HOME/npm-global"
if [[ -d "$NPM_GLOBAL/node_modules/.bin" ]]; then
    export PATH="$NPM_GLOBAL/node_modules/.bin:$PATH"
fi

# Personal commands
if [[ -d "$HOME/bin" ]]; then
    export PATH="$HOME/bin:$PATH"
fi
