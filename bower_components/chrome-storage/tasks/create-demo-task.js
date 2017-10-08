'use strict';

const fs = require('fs');

const chromeAppTpl = {
  main: `/**
 * Listens for the app launching then creates the window
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('components/_element_/_type_/index.html', {
    bounds: {
      width: 1024,
      height: 800
    }
  });
});
`,
  manifest: function(permissions) {
    let str;
    let permBlock = '';
    if (!permissions) {
      str = '';
    } else if (typeof permissions === 'string') {
      str = '"' + permissions + '"';
    } else {
      str = permissions.join('","');
    }
    if (str) {
      permBlock = `,
      "permissions": ["${str}"]`;
    }
    return `{
  "manifest_version": 2,
  "name": "_element_ _type_",
  "version": "0.0.1",
  "minimum_chrome_version": "34",
  "app": {
    "background": {
      "scripts": ["main.js"]
    }
  }${permBlock}
}
`;
  }
};

module.exports = (elementName) => {
  return {
    createDemo: () => {

    },
    createTests: () => {

    },
    createApp: (permissions) => {
      fs.writeFileSync('./chrome-app/main.js', chromeAppTpl.main);
      fs.writeFileSync('./chrome-app/manifest.json', chromeAppTpl.manifest(permissions));
    }
  };
};
