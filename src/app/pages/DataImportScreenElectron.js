import { DataImportScreen, html, Events } from '../../../web_modules/index.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */

export class DataImportScreenElectron extends DataImportScreen {
  async selectArcHandler() {
    const info = await ArcEnvironment.openDialog('arc');
    if (info.canceled || !info.filePaths || !info.filePaths.length) {
      return;
    }
    const buffer = await ArcEnvironment.fs.readFile(info.filePaths[0]);
    this.processArcData(buffer);
  }

  async selectPostmanHandler() {
    const info = await ArcEnvironment.openDialog('postman');
    if (info.canceled || !info.filePaths || !info.filePaths.length) {
      return;
    }
    const buffer = await ArcEnvironment.fs.readFile(info.filePaths[0]);
    this.processPostmanData(buffer);
  }

  /**
   * Selects am API file.
   */
  async selectApiHandler() {
    const info = await ArcEnvironment.openDialog('api');
    if (info.canceled || !info.filePaths || !info.filePaths.length) {
      return;
    }
    const buffer = await ArcEnvironment.fs.readFile(info.filePaths[0]);
    this.processApiData(buffer);
  }

  /**
   * Starts a flow of importing an API file to the application.
   * 
   * @param {Buffer} buffer
   */
  async processApiData(buffer) {
    Events.RestApiLegacy.processFile(document.body, buffer);
  }

  // @ts-ignore
  importApiAdditionalInfo() {
    return html`
    <p class="api-info">
      Please, select a zip file only with the API project.
    </p>
    `;
  }
}
