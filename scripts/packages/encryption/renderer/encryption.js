const prompt = require('electron-prompt');
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
    e.preventDefault();
    e.detail.result = this.decode(method, e.detail);
  }

  _encodeHandler(e) {
    const { method } = e.detail;
    e.preventDefault();
    e.detail.result = this.encode(method, e.detail);
  }

  async encode(method, opts) {
    switch (method) {
      case 'aes': return await this.encodeAes(opts.data, opts.passphrase);
      default: throw new Error(`Unknown encryption method`);
    }
  }

  async encodeAes(data, passphrase) {
    // see https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a
    const pwUtf8 = new TextEncoder().encode(passphrase);
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const alg = { name: 'AES-GCM', iv: iv };
    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);
    const ptUint8 = new TextEncoder().encode(data);
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);
    const ctArray = Array.from(new Uint8Array(ctBuffer));
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');
    const ctBase64 = btoa(ctStr);
    const ivHex = Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return ivHex+ctBase64;
  }

  async decode(method, opts) {
    switch (method) {
      case 'aes': return await this.decodeAes(opts.data, opts.passphrase);
      default: throw new Error(`Unknown decryption method`);
    }
  }

  async decodeAes(ciphertext, passphrase) {
    if (passphrase === undefined) {
      const win = require('electron').remote.getCurrentWindow();
      passphrase = await prompt({
        title: 'File password',
        label: 'Enter password to open the file',
      }, win);
      if (passphrase === null) {
        throw new Error('Password is required to open the file.');
      }
    }
    try {
      const pwUtf8 = new TextEncoder().encode(passphrase);
      const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
      const iv = ciphertext.slice(0,24).match(/.{2}/g).map(byte => parseInt(byte, 16));
      const alg = { name: 'AES-GCM', iv: new Uint8Array(iv) };
      const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);
      const ctStr = atob(ciphertext.slice(24));
      const ctUint8 = new Uint8Array(ctStr.match(/[\s\S]/g).map(ch => ch.charCodeAt(0)));
      const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);
      const plaintext = new TextDecoder().decode(plainBuffer);
      return plaintext;
    } catch (_) {
      throw new Error('Invalid password.');
    }
  }
}
exports.EncryptionService = EncryptionService;
