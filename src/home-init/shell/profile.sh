#! /usr/bin/env sh
# On MacOS $HOME/.zshrc: Loaded only for interactive shell sessions.
# It is loaded whenever you open a new terminal window
# or launch a subshell from a terminal window.
# For more see: https://mac.install.guide/terminal/zshrc-zprofile
#
# On Linux $HOME/.bash_profile: Loaded only for interactive shell sessions.
# It is loaded whenever you open a new terminal window
# or launch a subshell from a terminal window.
# For more see: https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html
#
# This script further delegates configuration to files in ~/profile.d
# The numeric prefix is used to control the order in which the files are loaded.
# Change file extension from .sh to skip on startup.
for FILE in "$HOME/profile.d"/*.sh; do
    source $FILE
done
