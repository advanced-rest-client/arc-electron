require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return undefined;
  }

  const appName = context.packager.appInfo.productFilename;

  /* eslint-disable-next-line no-console */
  console.log('Notarizing macOS application...');

  return notarize({
    appBundleId: 'com.mulesoft.arc',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  });
};
