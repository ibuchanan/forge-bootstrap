#! /usr/bin/env sh
# $HOME/.zshrc: Loaded only for interactive shell sessions.
# It is loaded whenever you open a new terminal window
# or launch a subshell from a terminal window.
# For more see: https://mac.install.guide/terminal/zshrc-zprofile
#
# This script further delegates configuration to files in ~/profile.d
# The numeric prefix is used to control the order in which the files are loaded.
# Change file extension from .sh to skip on startup.
for FILE in "$HOME/profile.d"/*.sh; do
    source $FILE
done
