#!/bin/sh

# https://github.com/travis-ci/travis-ci/issues/938#issuecomment-16336150
# fix permission
sudo chmod 1777 /dev/shm

echo "Getting $VERSION of　Chrome-stable"
export CHROME=google-chrome-stable_current_amd64.deb
wget https://dl.google.com/linux/direct/$CHROME
sudo dpkg --install $CHROME || sudo apt-get -f install
ls -l /usr/bin/google-chrome