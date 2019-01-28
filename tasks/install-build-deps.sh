#!/bin/bash

if [[ $TRAVIS_OS_NAME == 'linux' ]]; then
    sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 762E3157
    # curl https://packagecloud.io/github/git-lfs/gpgkey | sudo apt-key add -
    sudo apt-get update
    sudo -E apt-get -yq --no-install-suggests --no-install-recommends $(travis_apt_get_options) install gcc-multilib g++-multilib rpm libopenjp2-tools
    curl https://dl.winehq.org/wine-builds/winehq.key | sudo apt-key add -
    echo "deb https://dl.winehq.org/wine-builds/ubuntu/ trusty main" | sudo tee -a /etc/apt/sources.list
    sudo apt-get update
    sudo apt install --install-recommends -y wine
fi
