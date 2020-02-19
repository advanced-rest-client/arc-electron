const convertToWindowsStore = require('electron-windows-store');
const ebuilder = require('electron-builder');
const path = require('path');
const fs = require('fs-extra');

/**
 * A script that performs Windows build and signing then it converts
 * the build into APPX package that can be ditributed in Windows store.
 *
 * The build script assumes the following variables are set:
 * - CSC_NAME
 * - CSC_LINK
 * - WIN_CSC_LINK
 * - CSC_KEY_PASSWORD
 * - WIN_CSC_KEY_PASSWORD
 */
class WindowsStoreBuild {
  async getConverterOpts() {
    const version = await this.getVersion();
    return {
      inputDirectory: path.join(__dirname, '..', 'dist', 'win-unpacked'),
      outputDirectory: path.join(__dirname, '..', 'dist', 'win-store'),
      packageVersion: version,
      packageName: 'AdvancedRestClient',
      packageDisplayName: 'Advanced REST Client',
      packageDescription: 'The Advanced REST Client desktop application.',
      assets: path.join(__dirname, '..', 'build', 'appx'),
      deploy: false,
      publisher: 'CN=D213CA20-88CE-42AC-A9F2-C5D41BF04550',
      publisherDisplayName: 'Pawel Psztyc',
      identityName: '48695PawelPsztyc.advanced-rest-client',
    };
  }

  async getVersion() {
    const file = path.join(__dirname, '..', 'package.json');
    const pkg = await fs.readJson(file);
    return `${pkg.version}.0`;
  }

  async getWinConfig() {
    const file = path.join(__dirname, '..', 'package.json');
    const pkg = await fs.readJson(file);
    return pkg.build;
  }

  async buildWindows() {
    const config = await this.getWinConfig();
    const Platform = ebuilder.Platform;
    const opts = {
      targets: Platform.WINDOWS.createTarget('nsis'),
      config,
    };
    return await ebuilder.build(opts);
  }

  async convert() {
    const options = await this.getConverterOpts();
    await convertToWindowsStore(options);
  }

  async build() {
    await this.buildWindows();
    await this.convert();
  }
}

new WindowsStoreBuild().build();
