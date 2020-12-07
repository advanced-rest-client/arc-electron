// import prompt from 'electron-prompt';
import { EncryptionEventTypes } from '@advanced-rest-client/arc-events';

/** @typedef {import('@advanced-rest-client/arc-events').ArcEncryptEvent} ArcEncryptEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ArcDecryptEvent} ArcDecryptEvent */

/**
 * A class that handles DOM events to perform data encryption/decryption.
 */
export class EncryptionService {
  constructor() {
    this._decodeHandler = this._decodeHandler.bind(this);
    this._encodeHandler = this._encodeHandler.bind(this);
  }

  listen() {
    window.addEventListener(EncryptionEventTypes.decrypt, this._decodeHandler);
    window.addEventListener(EncryptionEventTypes.encrypt, this._encodeHandler);
  }

  unlisten() {
    window.removeEventListener(EncryptionEventTypes.decrypt, this._decodeHandler);
    window.removeEventListener(EncryptionEventTypes.encrypt, this._encodeHandler);
  }

  /**
   * @param {ArcDecryptEvent} e 
   */
  _decodeHandler(e) {
    const { method, data, passphrase } = e;
    e.preventDefault();
    e.detail.result = this.decode(method, data, passphrase);
  }

  /**
   * @param {ArcEncryptEvent} e 
   */
  _encodeHandler(e) {
    const { method, passphrase, data } = e;
    e.preventDefault();
    e.detail.result = this.encode(method, data, passphrase);
  }

  /**
   * @param {string} method The method to use. Currently only eas is supported.
   * @param {string} data The data to encrypt
   * @param {string} passphrase THe password to use
   * @returns {Promise<string>} Encoded string.
   */
  async encode(method, data, passphrase) {
    switch (method) {
      case 'aes': return this.encodeAes(data, passphrase);
      default: throw new Error(`Unknown encryption method`);
    }
  }

  /**
   * @param {string} data The data to encode
   * @param {string} passphrase THe password to use to encode the data
   * @returns {Promise<string>}
   */
  async encodeAes(data, passphrase) {
    // see https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a
    const pwUtf8 = new TextEncoder().encode(passphrase);
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const alg = { name: 'AES-GCM', iv };
    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);
    const ptUint8 = new TextEncoder().encode(data);
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);
    const ctArray = Array.from(new Uint8Array(ctBuffer));
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');
    const ctBase64 = btoa(ctStr);
    const ivHex = Array.from(iv).map(b => (`00${b.toString(16)}`).slice(-2)).join('');
    return ivHex+ctBase64;
  }

  /**
   * Decodes previously encoded data
   * @param {string} method 
   * @param {string} data 
   * @param {string=} passphrase 
   * @returns {Promise<string>} The decoded data
   */
  async decode(method, data, passphrase) {
    switch (method) {
      case 'aes': return this.decodeAes(data, passphrase);
      default: throw new Error(`Unknown decryption method`);
    }
  }

  /**
   * Decodes previously encoded data with AES method.
   * @param {string} data The data to decrypt
   * @param {string=} passphrase When not provided it asks the user for the password.
   * @returns {Promise<string>} The decoded data
   */
  async decodeAes(data, passphrase) {
    if (passphrase === undefined) {
      // eslint-disable-next-line no-param-reassign
      // passphrase = await prompt({
      //   title: 'File password',
      //   label: 'Enter password to open the file',
      // });
      // if (passphrase === null) {
      //   throw new Error('Password is required to open the file.');
      // }
      throw new Error('Implement me.');
    }
    try {
      const pwUtf8 = new TextEncoder().encode(passphrase);
      const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
      const iv = data.slice(0,24).match(/.{2}/g).map(byte => parseInt(byte, 16));
      const alg = { name: 'AES-GCM', iv: new Uint8Array(iv) };
      const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);
      const ctStr = atob(data.slice(24));
      const ctUint8 = new Uint8Array(ctStr.match(/[\s\S]/g).map(ch => ch.charCodeAt(0)));
      const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);
      const plaintext = new TextDecoder().decode(plainBuffer);
      return plaintext;
    } catch (_) {
      throw new Error('Invalid password.');
    }
  }
}
