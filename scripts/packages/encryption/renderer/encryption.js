const AES = require('crypto-js/aes.js');
const CryptoJS = require('crypto-js/crypto-js.js');
/**
 * A class that handles `encryption-*` web events in the renderer process
 * and performs data encryption/decryption.
 *
 * TODO: consider spawning another process for data encryption / decryption.
 * Compare gain/loss on running encryption/decryption in separate process
 * and check whether data passing from process to another process is more costly.
 */
class EncryptionService {
  constructor() {
    this._decodeHandler = this._decodeHandler.bind(this);
    this._encodeHandler = this._encodeHandler.bind(this);
  }

  listen() {
    window.addEventListener('encryption-decode', this._decodeHandler);
    window.addEventListener('encryption-encode', this._encodeHandler);
  }

  unlisten() {
    window.removeEventListener('encryption-decode', this._decodeHandler);
    window.removeEventListener('encryption-encode', this._encodeHandler);
  }

  _decodeHandler(e) {
    const { method } = e.detail;
    e.detail.result = this.decode(method, e.detail);
  }

  _encodeHandler(e) {
    const { method } = e.detail;
    e.detail.result = this.encode(method, e.detail);
  }

  async encode(method, opts) {
    switch (method) {
      case 'aes': return await this.encodeAes(opts.data, opts.passphrase);
      default: throw new Error(`Unknown encryption method`);
    }
  }

  async encodeAes(data, passphrase) {
    // Todo: this looks really dangerous to run file encryption in the main
    // thread (of the renderer process). Consider other options.
    const encrypted = AES.encrypt(data, passphrase);
    return encrypted.toString();
  }

  async decode(method, opts) {
    switch (method) {
      case 'aes': return await this.decodeAes(opts.data, opts.passphrase);
      default: throw new Error(`Unknown decryption method`);
    }
  }

  async decodeAes(data, passphrase) {
    if (!passphrase === undefined) {
      passphrase = prompt('Enter password to open the file.');
    }
    const bytes = AES.decrypt(data, passphrase);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
exports.EncryptionService = EncryptionService;
