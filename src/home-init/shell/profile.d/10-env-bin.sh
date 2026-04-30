#! /usr/bin/env bash
# Prepending to the path so last location will be first

# bun
# Used as the global CLI installer (`bun add --global ...`)
# so global CLIs persist across managed node versions.
export BUN_INSTALL="$HOME/.bun"
if [[ -d "$BUN_INSTALL/bin" ]]; then
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# uv and other user-installed commands
if [[ -d "$HOME/.local/bin" ]]; then
    export PATH="$HOME/.local/bin:$PATH"
fi

# Personal commands
if [[ -d "$HOME/bin" ]]; then
    export PATH="$HOME/bin:$PATH"
fi
