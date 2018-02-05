#!/usr/bin/env bash

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  export DISPLAY=:99.0
  sh -e /etc/init.d/xvfb start
  sleep 3
fi

node --version
npm --version

export PATH=$PATH:./node_modules/.bin/

# npm install
cd components/anypoint
../../node_modules/.bin/bower update
cd ../default
bower update
cd ../../
npm test
