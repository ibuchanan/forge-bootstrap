#! /usr/bin/env bash
# Setup for the command prompt

# History
[ -z "$HISTFILE" ] && HISTFILE="$HOME/.zsh_history"
export HISTSIZE=100000
export SAVEHIST=$HISTSIZE
setopt extended_history       # record timestamp of command in HISTFILE
setopt hist_expire_dups_first # delete duplicates first when HISTFILE size exceeds HISTSIZE
setopt hist_ignore_all_dups   # ignore duplicated commands history list
setopt hist_ignore_space      # ignore commands that start with space
setopt hist_verify            # show command with history expansion to user before running it
setopt inc_append_history     # add commands to HISTFILE in order of execution
setopt share_history          # share command history data
setopt always_to_end          # cursor moved to the end in full completion
setopt hash_list_all          # hash everything before completion
setopt list_ambiguous         # complete as much of a completion until it gets ambiguous.

# [Starship](https://starship.rs/)
# brew install starship
export STARSHIP_CONFIG=$HOME/.starship.toml
if [[ -x "$(command -v starship)" ]]; then
    eval "$(starship init zsh)"
fi

# [Fastfetch](https://github.com/fastfetch-cli/fastfetch)
# display fastfetch on terminal start for context
if [[ -x "$(command -v fastfetch)" ]]; then
    fastfetch
fi
