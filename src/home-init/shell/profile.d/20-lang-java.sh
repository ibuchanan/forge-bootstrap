#! /usr/bin/env bash
# [Java](https://www.java.com/)
# Install
# brew install openjdk
# brew install jenv

JAVACMD="$(brew --prefix openjdk)/bin/java"
if [[ -x "$(command -v "$JAVACMD")" ]]; then
    if [[ -x "$(command -v jenv)" ]]; then
        # export PATH="$HOME/.jenv/bin:$PATH"
        eval "$(jenv init -)"
        # jenv init, via homegrown brew plugin,
        # jenv will make sure brew versions get added
    fi
fi
