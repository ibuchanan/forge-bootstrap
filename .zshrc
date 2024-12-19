#! /usr/bin/env sh
# Initialize shell from files in ~/zshrc.d
# Order matters
# Change file extension from .sh to skip on startup
for FILE in "$HOME/zshrc.d"/*.sh; do
    source $FILE
done
