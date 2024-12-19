#! /usr/bin/env bash
# [Homebrew](https://brew.sh/)
# Install
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
if [[ "$(uname)" = "Darwin" ]]; then
    BREWCMD=/opt/homebrew/bin/brew
else
    BREWCMD=/home/linuxbrew/.linuxbrew/bin/brew
fi
if [[ -x "$(command -v "$BREWCMD")" ]]; then
    eval "$("$BREWCMD" shellenv)"
    export HOMEBREW_NO_ENV_HINTS=1
    export HOMEBREW_NO_INSECURE_REDIRECT=1
    FPATH="$(brew --prefix)/share/zsh/site-functions:${FPATH}"
fi
