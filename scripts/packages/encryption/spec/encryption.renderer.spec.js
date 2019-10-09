const { assert } = require('chai');
const { EncryptionService } = require('../renderer');

describe('EncryptionService', function() {
  describe('Encrypting content', () => {
    let instance;
    before(() => {
      instance = new EncryptionService();
      instance.listen();
    });

    after(() => {
      instance.unlisten();
    });

    it('encodes a content using AES.encrypt', async () => {
      const e = new CustomEvent('encryption-encode', {
        bubbles: true,
        cancelable: true,
        detail: {
          method: 'aes',
          data: 'test-data',
          passphrase: 'test'
        }
      });
      document.body.dispatchEvent(e);
      const result = await e.detail.result;
      assert.typeOf(result, 'string');
      assert.notEqual(result, 'test-data');
    });
  });


  describe('Decrypting content', () => {
    const encoded = 'U2FsdGVkX19MRBu8liXK/sbNBOQWG1mewbjEBb8cTAw=';
    let instance;
    before(() => {
      instance = new EncryptionService();
      instance.listen();
    });

    after(() => {
      instance.unlisten();
    });

    it('decodes a content using AES.decrypt and provided password', async () => {
      const e = new CustomEvent('encryption-decode', {
        bubbles: true,
        cancelable: true,
        detail: {
          method: 'aes',
          data: encoded,
          passphrase: 'test'
        }
      });
      document.body.dispatchEvent(e);
      const result = await e.detail.result;
      assert.typeOf(result, 'string');
      assert.equal(result, 'test-data');
    });
  });
});
