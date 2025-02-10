#! /usr/bin/env bash
# [Atlassian Forge](https://go.atlassian.com/forge)
# Install
# cd npm-global && npm install
# Or:
# npm install -g @forge/cli
if [[ -x "$(command -v forge)" ]]; then
    #. <(forge --completion)
    eval "$(forge --completion)"
fi

# [Using env vars to login](https://developer.atlassian.com/platform/forge/getting-started/#using-environment-variables-to-login)
# Uncomment and fill in if `forge login` does not work.
# export FORGE_EMAIL=""
# export FORGE_API_TOKEN=""

# [Forge Bootstrap](https://github.com/ibuchanan/forge-bootstrap)
# Utilities for bootstrapping new Node and Atlassian Forge apps
export FORGE_BOOTSTRAP_HOME="$HOME/dev/git/github.com/ibuchanan/forge-bootstrap"
alias forge-bootstrap="mask --maskfile $FORGE_BOOTSTRAP_HOME/maskfile.md"
