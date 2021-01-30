if [ $TRAVIS_BRANCH != 'alpha' ] && [ $TRAVIS_BRANCH != 'master' ] && [ $TRAVIS_BRANCH != 'beta' ]; then
  echo "Skipping ARC build. Incompatible branch."
  exit 0
fi

if [ "$TRAVIS_PULL_REQUEST" = "true" ]; then 
  echo "Skipping ARC build. This is a PR request."
  exit 0
fi

# Fails the build when the publishing process fails.
set -e

echo "Decrypting secrets..."
openssl aes-256-cbc -K $encrypted_2038aea4e984_key -iv $encrypted_2038aea4e984_iv -in secrets.tar.enc -out secrets.tar -d

echo "Extracting secrets..."
tar xvf secrets.tar

echo "Copying .env file..."
cp secrets/.env .

export CSC_NAME="Pawel Psztyc"
export WIN_CSC_LINK="secrets/advancedrestclient.pfx"
export CSC_LINK="secrets/arc-mac-certs.p12"

if [ -f "$WIN_CSC_LINK" ]; then
  echo "Windows sign key ready."
else
  echo "Windows key is not ready."
  exit -1
fi

if [ -f "$CSC_LINK" ]; then
  echo "Mac sign key ready."
else
  echo "Mac key is not ready."
  exit -1
fi

if [ "$TRAVIS_OS_NAME" == "linux" ]; then
  docker run --rm \
    --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS|APPVEYOR_|CSC_|WIN_|_TOKEN|_KEY|AWS_|STRIP|BUILD_') \
    -v ${PWD}:/project \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    electronuserland/builder:wine \
    /bin/bash -c "./node_modules/.bin/electron-builder --linux --win --publish always"
else
  /bin/bash -c "./node_modules/.bin/electron-builder --mac --publish always"
fi
