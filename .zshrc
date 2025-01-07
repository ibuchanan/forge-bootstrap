#! /usr/bin/env sh
# Initialize shell from files in ~/profile.d
# Order matters
# Change file extension from .sh to skip on startup
for FILE in "$HOME/profile.d"/*.sh; do
    source $FILE
done
