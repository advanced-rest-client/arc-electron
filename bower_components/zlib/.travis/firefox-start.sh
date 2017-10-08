#!/bin/bash

# Variables
USER_DIR=/tmp/firefox
MAC_CMD="/Applications/Firefox.app/Contents/MacOS/firefox"
UBUNTU_CMD="firefox"

# Test OS
if [ -f "$MAC_CMD" ]
then
	CMD="$MAC_CMD"
else
	CMD="$UBUNTU_CMD"
fi

$CMD -CreateProfile "TravisUser $USER_DIR"
echo "user_pref(\"dom.max_script_run_time\", 10*60);" >> $USER_DIR/prefs.js
exec "$CMD" -P "TravisUser" "$@"