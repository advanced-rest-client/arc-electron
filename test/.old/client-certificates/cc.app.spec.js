const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const bootstrap = require('../test-bootstrap.js');

describe('Client certificates', function() {
  let app;
  before(async () => {
    app = await bootstrap.runAppDeffered(2000);
  });

  after(async () => {
    if (app && app.isRunning()) {
      await app.stop();
    }
    const basePath = path.join('test', 'playground');
    await fs.remove(basePath);
  });

  it('has clientCertificateImport set', async () => {
    const result = await app.client.execute(async () => {
      const arc = document.querySelector('arc-electron');
      return arc.clientCertificateImport;
    });
    assert.isTrue(result.value);
  });

  it('opens certificates panel', async () => {
    const result = await app.client.execute(async () => {
      const arc = document.querySelector('arc-electron');
      arc.openClientCertificates();
      await arc.updateComplete;
      const panel = arc.shadowRoot.querySelector('client-certificates-panel');
      return {
        panel: panel.localName,
        page: arc.page,
      };
    });
    const { value } = result;
    assert.equal(value.panel, 'client-certificates-panel', 'panel is inserted into the DOM');
    assert.equal(value.page, 'client-certificates', 'page is set');
  });

  it('inserts <client-certificates-panel> into the DOM', async () => {
    const result = await app.client.execute(async () => {
      const arc = document.querySelector('arc-electron');
      arc.page = 'client-certificates';
      await arc.updateComplete;
      const panel = arc.shadowRoot.querySelector('client-certificates-panel');
      return panel.localName;
    });
    assert.equal(result.value, 'client-certificates-panel');
  });

  it('has CC import dialog by default', async () => {
    const result = await app.client.execute(async () => {
      const arc = document.querySelector('arc-electron');
      const dialog = arc.shadowRoot.querySelector('#ccImportDialog');
      return dialog.localName;
    });
    assert.equal(result.value, 'anypoint-dialog');
  });

  it('opend CC dialog on client-certificate-import event', async () => {
    const result = await app.client.execute(async () => {
      window.dispatchEvent(new CustomEvent('client-certificate-import'));
      const arc = document.querySelector('arc-electron');
      await arc.updateComplete;
      const dialog = arc.shadowRoot.querySelector('#ccImportDialog');
      return {
        opened: dialog.opened,
        ccImportOpened: arc.ccImportOpened,
      };
    });
    const { value } = result;
    assert.isTrue(value.opened, 'dialog is opened');
    assert.isTrue(value.ccImportOpened, 'ccImportOpened is set');
  });

  it('re-sets ccImportOpened when import dialog is closed', async () => {
    const result = await app.client.execute(async () => {
      window.dispatchEvent(new CustomEvent('client-certificate-import'));
      const arc = document.querySelector('arc-electron');
      await arc.updateComplete;
      const panel = arc.shadowRoot.querySelector('#ccImportDialog certificate-import');
      panel.cancel();
      await arc.updateComplete;
      const dialog = arc.shadowRoot.querySelector('#ccImportDialog');
      return {
        opened: dialog.opened,
        ccImportOpened: arc.ccImportOpened,
      };
    });
    const { value } = result;
    assert.isFalse(value.opened, 'dialog is not opened');
    assert.isFalse(value.ccImportOpened, 'ccImportOpened is re-set');
  });
});
