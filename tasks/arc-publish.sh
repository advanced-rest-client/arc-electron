if [ $TRAVIS_BRANCH != 'develop' ] && [ $TRAVIS_BRANCH != 'master' ] && [ $TRAVIS_BRANCH != 'beta' ]; then
  echo "Skipping ARC build. Incompatible branch."
  exit 0
fi
if [ "$TRAVIS_OS_NAME" == "linux" ]; then
  docker run --rm \
    --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS|APPVEYOR_|CSC_|_TOKEN|_KEY|AWS_|STRIP|BUILD_') \
    -v ${PWD}:/project \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    electronuserland/builder:wine \
    /bin/bash -c "./node_modules/.bin/electron-builder --linux --win"
else
  /bin/bash -c "./node_modules/.bin/electron-builder --mac"
fi
