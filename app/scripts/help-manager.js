const {shell} = require('electron');
const {app} = require('electron');

class HelpManager {
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
    }
  }

  static openFaq() {
    shell.openExternal('https://github.com/advanced-rest-client/arc-electron/wiki/FAQ');
  }

  static openDiscussions() {
    shell.openExternal('https://groups.google.com/forum/#!forum/advanced-rest-client-discussions');
  }

  static searchIssues() {
    var url = 'https://github.com/search';
    url += '?q=+is%3Aissue+user%3Aadvanced-rest-client&type=Issues';
    shell.openExternal(url);
  }

  static openDocumentation() {
    shell.openExternal('https://github.com/advanced-rest-client/arc-electron/wiki');
  }

  static reportIssue() {
    const version = app.getVersion();
    var message = 'Your description here\n\n';
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
    var url = 'https://github.com/advanced-rest-client/arc-electron/issues/new';
    url += '?body=' + message;
    shell.openExternal(url);
  }

  static openPrivacyPolicy() {
    let url = 'https://docs.google.com/document/d/';
    url += '1BzrKQ0NxFXuDIe2zMA-0SZBNU0P46MHr4GftZmoLUQU/edit';
    shell.openExternal(url);
  }
}
exports.HelpManager = HelpManager;
