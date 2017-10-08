#!/bin/bash

#Variables
USER_DIR=/tmp/buster
MAC_CMD="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
UBUNTU_CMD="google-chrome"

# Test OS
if [ -f "$MAC_CMD" ]
then
	CMD="$MAC_CMD"
else
	CMD="$UBUNTU_CMD"
fi

# Execute the command
which $CMD > /dev/null 2>&1
if [ $? -eq 0 ] ; then
	$CMD --no-default-browser-check --no-first-run --disable-default-apps --no-sandbox "$@" &
fi