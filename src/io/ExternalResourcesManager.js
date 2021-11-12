import { app, ipcMain, shell } from 'electron';
import { logger } from './Logger.js';

const ARC_REPO_URI = 'https://github.com/advanced-rest-client/arc-electron/';
const ARC_DOCS_URI = 'https://docs.advancedrestclient.com/';

const openExternalHandler = Symbol('openExternalHandler');
const openHelpTopicHandler = Symbol('openHelpTopicHandler');

export class ExternalResourcesManager {
  listen() {
    ipcMain.on('open-external-url', this[openExternalHandler].bind(this));
    ipcMain.on('help-topic', this[openHelpTopicHandler].bind(this));
  }

  [openExternalHandler](e, url) {
    this.openUrl(url);
  }

  /**
   * @param {string} url
   */
  openUrl(url) {
    shell.openExternal(url);
  }

  /**
   * @param {string} topic
   */
  openHelpTopic(topic) {
    logger.info(`Handling help topic: ${topic}`);
    switch (topic) {
      case 'open-faq':
        this.openFaq();
      break;
      case 'open-discussions':
        this.openDiscussions();
      break;
      case 'report-issue':
        this.reportIssue();
      break;
      case 'search-issues':
        this.searchIssues();
      break;
      case 'open-documentation':
        this.openDocumentation();
      break;
      case 'open-privacy-policy':
        this.openPrivacyPolicy();
      break;
      case 'web-session-help':
        this.openWebSessionDocs();
      break;
      default:
    }
  }

  /**
   * Opens application FAQ in default browser tab.
   */
  openFaq() {
    logger.debug('Opening app FAQ in default browser.');
    shell.openExternal(`${ARC_DOCS_URI}using-arc/frequently-asked-questions`);
  }

  /**
   * Opens application forum in new tab.
   */
  openDiscussions() {
    logger.debug('Opening app forum in default browser.');
    shell.openExternal('https://groups.google.com/forum/#!forum/advanced-rest-client-discussions');
  }

  /**
   * Opens issue tracker with predefined filter.
   */
  searchIssues() {
    logger.debug('Opening issue search in default browser.');
    let url = 'https://github.com/search';
    url += '?q=+is%3Aissue+user%3Aadvanced-rest-client&type=Issues';
    shell.openExternal(url);
  }

  /**
   * Opens ARC (non-existing yet) documentation in new window.
   */
  openDocumentation() {
    logger.debug('Opening ARC documentation pages.');
    shell.openExternal(ARC_DOCS_URI);
  }

  /**
   * Opens new issue report on GitHub.
   */
  reportIssue() {
    logger.debug('Opening issue report in default browser.');
    const version = app.getVersion();
    let message = 'Your description here\n\n';
    message += '## Expected outcome\nWhat should happen?\n\n';
    message += '## Actual outcome\nWhat happened?\n\n';
    message += `## Versions\nApp: ${version}\n`;
    message += `Platform: ${process.platform}\n`;
    message += `Electron: ${process.versions.electron}\n`;
    message += `Chrome: ${process.versions.chrome}\n`;
    message += `V8: ${process.versions.v8}\n`;
    message += `Node: ${process.versions.node}\n\n`;
    message += '## Steps to reproduce\n1. \n2. \n3. ';
    message = encodeURIComponent(message);
    const url = `${ARC_REPO_URI}issues/new?body=${message}`;
    shell.openExternal(url);
  }

  /**
   * Opens privacy policy file.
   */
  openPrivacyPolicy() {
    logger.debug('Opening Privacy policy in default browser.');
    let url = 'https://docs.google.com/document/d/';
    url += '1BzrKQ0NxFXuDIe2zMA-0SZBNU0P46MHr4GftZmoLUQU/edit';
    shell.openExternal(url);
  }

  /**
   * Opens documentation for web session menu.
   */
  openWebSessionDocs() {
    logger.debug('Opening Web Session docs in default browser.');
    const url = `${ARC_DOCS_URI}using-arc/cookies-and-session-management`;
    shell.openExternal(url);
  }

  /**
   * @param {Electron.IpcMainEvent} e
   * @param {string} topic
   */
  [openHelpTopicHandler](e, topic) {
    this.openNavigationHelpTopic(topic);
  }

  /**
   * @param {string} topic
   */
  openNavigationHelpTopic(topic) {
    let url;
    switch (topic) {
      case 'history':
        url = `${ARC_DOCS_URI}using-arc/history`;
        break;
      case 'saved':
        url = `${ARC_DOCS_URI}using-arc/saved`;
        break;
      case 'projects':
        url = `${ARC_DOCS_URI}using-arc/legacy-projects`;
        break;
      case 'rest-api-docs':
        url = `${ARC_DOCS_URI}using-arc/api-console`;
        break;
      case 'search-docs':
        url = `${ARC_DOCS_URI}using-arc/search`;
        break;
      default:
        logger.error(`Unknown help topic to open: ${topic}`);
        return;
    }
    logger.debug(`Opening help topic at ${url}.`);
    shell.openExternal(url);
  }
}
