const {shell} = require('electron');
const {app} = require('electron');
const log = require('./logger');
const ARC_REPO_URI = 'https://github.com/advanced-rest-client/arc-electron/';
/**
 * Class that handles help topics in the Help menu.
 */
class HelpManager {
  /**
   * Runs help menu action.
   * @param {String} action Acction associated with the menu.
   */
  static helpWith(action) {
    switch (action) {
      case 'open-faq':
        HelpManager.openFaq();
      break;
      case 'open-discussions':
        HelpManager.openDiscussions();
      break;
      case 'report-issue':
        HelpManager.reportIssue();
      break;
      case 'search-issues':
        HelpManager.searchIssues();
      break;
      case 'open-documentation':
        HelpManager.openDocumentation();
      break;
      case 'open-privacy-policy':
        HelpManager.openPrivacyPolicy();
      break;
      case 'web-session-help':
        HelpManager.openWebSessionDocs();
      break;
    }
  }
  /**
   * Opens application FAQ in default browser tab.
   */
  static openFaq() {
    log.debug('Opening app FAQ in default browser.');
    shell.openExternal(ARC_REPO_URI + 'wiki/FAQ');
  }
  /**
   * Opens application formu in new tab.
   */
  static openDiscussions() {
    log.debug('Opening app forum in default browser.');
    shell.openExternal('https://groups.google.com/forum/#!forum/advanced-rest-client-discussions');
  }
  /**
   * Opens issue tracker with predefined filter.
   */
  static searchIssues() {
    log.debug('Opening issue search in default browser.');
    let url = 'https://github.com/search';
    url += '?q=+is%3Aissue+user%3Aadvanced-rest-client&type=Issues';
    shell.openExternal(url);
  }
  /**
   * Opens ARC (non-existing yet) documentation in new window.
   */
  static openDocumentation() {
    log.debug('Opening app wiki in default browser.');
    shell.openExternal(ARC_REPO_URI + 'wiki');
  }
  /**
   * Opens new issue report on GitHub.
   */
  static reportIssue() {
    log.debug('Opening issue report in default browser.');
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
    let url = ARC_REPO_URI + 'issues/new?body=' + message;
    shell.openExternal(url);
  }
  /**
   * Opens privacy policy file.
   */
  static openPrivacyPolicy() {
    log.debug('Opening Privacy policy in default browser.');
    let url = 'https://docs.google.com/document/d/';
    url += '1BzrKQ0NxFXuDIe2zMA-0SZBNU0P46MHr4GftZmoLUQU/edit';
    shell.openExternal(url);
  }
  /**
   * Opens documentation for web session menu.
   */
  static openWebSessionDocs() {
    log.debug('Opening Web Session docs in default browser.');
    let url = ARC_REPO_URI + 'wiki/Session-management-in-ARC';
    shell.openExternal(url);
  }
}
exports.HelpManager = HelpManager;
