const path = require('path');
const Application = require('spectron').Application;

const getElectronPath = () => {
  if (process.platform === 'win32') {
    return path.resolve(__dirname, '../dist/win-unpacked/arc.exe');
  } else if (process.platform === 'darwin') {
    return path.resolve(__dirname, '../dist/mac/arc.app/Contents/MacOS/arc');
  }
  return path.resolve(__dirname, '../dist/linux-unpacked/arc');
};

module.exports.getApp = () => {
  return new Application({
    path: getElectronPath(),
    args: ['./main.js'],
    startTimeout: 50000,
    waitTimeout: 50000,
  });
};

// function setupRequire(app) {
//   const _orig = require;
//   global.require = function(name) {
//     switch (name) {
//       case 'electron':
//         console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
//         return app.electron;
//       default: return _orig(name);
//     }
//   };
// }
//
// module.exports.setupApis = (app) => {
//   setupRequire(app);
// };
