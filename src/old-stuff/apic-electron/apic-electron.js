/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement, html } from '../../web_modules/lit-element/lit-element.js';
import { AmfHelperMixin } from '../../web_modules/@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '../../web_modules/@api-components/api-documentation/api-documentation.js';
import '../../web_modules/@api-components/api-navigation/api-navigation.js';
import '../../web_modules/@polymer/paper-spinner/paper-spinner.js';
import '../../web_modules/@polymer/paper-toast/paper-toast.js';
import '../../web_modules/@api-components/raml-aware/raml-aware.js';
import { ArcFileDropMixin } from '../../web_modules/@advanced-rest-client/arc-file-drop-mixin/arc-file-drop-mixin.js';
import styles from './styles.js';
/**
 * It'a a wrapper for API console to render the console from unresolved
 * AMF model.
 *
 * ARC stores unresolved ld+json model of AMF so it is possible to generate
 * RAML/OAS files from it later. Before API console can be used with data model
 * it has to be resolved.
 *
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 */
class ApicElectron extends ArcFileDropMixin(AmfHelperMixin(LitElement)) {
  static get styles() {
    return styles;
  }

  _docsTemplate() {
    const {
      amf,
      selected,
      selectedType,
      narrow,
      scrollTarget,
      apiProcessing
    } = this;
    return html`
    <raml-aware scope="apic" .api="${amf}"></raml-aware>
    <api-documentation
      .amf="${amf}"
      .selected="${selected}"
      .selectedType="${selectedType}"
      handlenavigationevents
      inlinemethods
      redirecturi="https://auth.advancedrestclient.com/oauth-popup.html"
      ?narrow="${narrow}"
      .scrollTarget="${scrollTarget}"
      ?hidden="${apiProcessing}"
    ></api-documentation>
    `;
  }

  _busyTemplate() {
    if (!this.apiProcessing) {
      return '';
    }
    return html`<div class="loader">
      <p class="wait-message">Preparing your API experience</p>
      <paper-progress indeterminate></paper-progress>
    </div>`;
  }

  render() {
    return html`
    ${this._docsTemplate()}
    ${this._busyTemplate()}
    <paper-toast id="errorToast" class="error-toast" duration="5000"></paper-toast>
    <section class="drop-target">
      <p class="drop-message">Drop API file here</p>
    </section>`;
  }

  static get properties() {
    return {
      /**
       * Unresolved AMF model.
       */
      unresolvedAmf: { type: String },
      /**
       * API original type.
       */
      apiType: { type: String },
      /**
       * Resolved AMF model.
       */
      amf: { type: Object },
      /**
       * Passed to API console's `selected` property.
       */
      selected: { type: String },
      /**
       * Passed to API console's `selectedType` property.
       */
      selectedType: { type: String },
      narrow: { type: Boolean },
      scrollTarget: { type: Object },

      baseUri: { type: String },

      apiVersion: { type: String, notify: true },

      apiInfo: { type: Object, notify: true },

      versions: { type: Array, notify: true },

      multiVersion: { type: Boolean, notify: true },

      saved: { type: Boolean, notify: true },

      canSave: { type: Boolean, notify: true },

      versionSaved: { type: Boolean, notify: true, },
      /**
       * When set the API is being processed.
       */
      apiProcessing: { type: Boolean, notify: true }
    };
  }

  get unresolvedAmf() {
    return this._unresolvedAmf;
  }

  set unresolvedAmf(value) {
    const old = this._unresolvedAmf;
    if (old === value) {
      return;
    }
    this._unresolvedAmf = value;
    this._unprocessedChanged();
  }

  get apiType() {
    return this._apiType;
  }

  set apiType(value) {
    const old = this._apiType;
    if (old === value) {
      return;
    }
    this._apiType = value;
    this._unprocessedChanged();
  }

  constructor() {
    super();
    this._indexChangeHandler = this._indexChangeHandler.bind(this);
    /* global log */
    this.log = log;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    window.addEventListener('api-index-changed', this._indexChangeHandler);
    // window.addEventListener('api-version-deleted', this._indexChangeHandler);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    window.removeEventListener('api-index-changed', this._indexChangeHandler);
  }

  updated(changedProperties) {
    const props = ApicElectron.properties;
    changedProperties.forEach((old, key) => {
      const def = props[key] || {};
      if (def.notify) {
        this.dispatchEvent(new CustomEvent(`${key.toLowerCase()}-changed`, {
          detail: {
            value: this[key]
          }
        }));
      }
    });
  }

  _unprocessedChanged() {
    const { unresolvedAmf, apiType } = this;
    if (!unresolvedAmf || typeof unresolvedAmf !== 'string' || !apiType) {
      this.amf = undefined;
      return;
    }
    if (this.__processingResolve) {
      clearTimeout(this.__processingResolve);
    }
    this.__processingResolve = setTimeout(() => {
      this.__processingResolve = undefined;
      this._processApi(unresolvedAmf, apiType);
    });
  }

  async _processApi(unresolvedAmf, type) {
    this.apiProcessing = true;
    const e = this._dispatchResolve(unresolvedAmf, type);

    try {
      const model = await e.detail.result;
      this.amf = JSON.parse(model);
      this._resolvedAmfChanged();
    } catch (e) {
      this._notifyError(e.message);
    }
    this.apiProcessing = false;
  }

  _dispatchResolve(model, type) {
    const e = new CustomEvent('api-resolve-model', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        model,
        type
      }
    });
    this.dispatchEvent(e);
    return e;
  }

  _notifyError(message) {
    const toast = this.shadowRoot.querySelector('#errorToast');
    toast.text = message;
    toast.opened = true;
  }

  _resolvedAmfChanged() {
    const { amf } = this;
    this.baseUri = this._computeBaseUri(amf);
    this._baseUriChanged();
    this.apiVersion = this._getApiVersion(amf);
    this.canSave = this._computeCanSave(this.baseUri, this.apiVersion);
  }

  _compteVersionProperties() {
    this.versions = this._computeVersionsList();
    this.multiVersion = this._computeIsMultiVersion(this.versions);
    this.versionSaved = this._computeIsVersionSaved(this.versions, this.apiVersion);
  }
  /**
   * Computes model's base Uri
   * @param {Object|Array} model AMF data model
   * @return {String}
   */
  _computeBaseUri(model) {
    if (!model) {
      return;
    }
    const server = this._computeServer(model);
    const protocols = this._computeProtocols(model);
    return this._getAmfBaseUri(server, protocols);
  }

  _getApiVersion(amf) {
    let version = this._computeApiVersion(amf);
    if (!version) {
      version = '1';
    }
    return String(version);
  }

  async _baseUriChanged() {
    const { baseUri } = this;
    this.saved = false;
    this.apiInfo = undefined;
    if (!baseUri) {
      return;
    }
    try {
      const apiInfo = await this._getApiInfo(baseUri);
      const saved = !!apiInfo;
      this.saved = saved;
      if (saved) {
        this.apiInfo = apiInfo;
        // this._compteVersionProperties();
      }
    } catch (cause) {
      this.log.error(cause);
    }
    this._compteVersionProperties();
  }

  _computeCanSave(baseUri, apiVersion) {
    if (!baseUri || !apiVersion) {
      return false;
    }
    return true;
  }

  _getApiInfo(baseUri) {
    const e = new CustomEvent('api-index-read', {
      detail: {
        baseUri
      },
      bubbles: true,
      cancelable: true,
      composed: true
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      return Promise.reject(new Error('APIs model is not in the DOM'));
    }
    return e.detail.result;
  }

  _computeIsVersionSaved(versions, apiVersion) {
    if (!versions || !versions.length || !apiVersion) {
      return;
    }
    return versions.indexOf(apiVersion) !== -1;
  }

  _computeIsMultiVersion(versions) {
    if (!versions) {
      return false;
    }
    return versions.length > 1;
  }
  /**
   * Opens previously saved API.
   * @param {String} id API database ID
   * @param {?String} version API version. Default to latest version
   * @return {Prommise} Promise resolved when API unresolved data are set.
   * Note, property change observers will run model resolving API when
   * unresolved model and type is set.
   */
  async open(id, version) {
    this.unresolvedAmf = undefined;
    this.amf = undefined;
    this.apiProcessing = true;
    try {
      const result = await this.getApi(id, version);
      let api = result.api;
      if (api && typeof api !== 'string') {
        api = JSON.stringify(api);
      }
      this.unresolvedAmf = api;
      this.apiType = result.type;
      this.apiProcessing = false;
    } catch (e) {
      this.apiProcessing = false;
      this.log.error(e);
      throw e;
    }
  }

  async save() {
    if (!this.amf) {
      throw new Error('AMF model not set');
    }
    if (!this.canSave) {
      throw new Error('API version is missing.');
    }
    const apiInfo = this.apiInfo;
    if (!apiInfo) {
      return await this._saveApi();
    }
    return await this._saveVersion(Object.assign({}, apiInfo));
  }

  async _saveApi() {
    const baseUri = this.baseUri;
    if (!baseUri) {
      throw new Error('API base URI is missing.');
    }
    const webApi = this._computeWebApi(this.amf);
    const title = this._getValue(webApi, this.ns.schema.schemaName);
    if (!title) {
      throw new Error('API title is missing.');
    }
    const info = {
      _id: baseUri,
      title,
      order: 0,
      type: this.apiType
    };
    return await this._saveVersion(info);
  }

  async _saveVersion(apiInfo) {
    const version = this.apiVersion;
    if (!version) {
      throw new Error('API version is missing.');
    }
    await this._updateVersionInfo(apiInfo, version);
    this._compteVersionProperties();
    return await this._updateDataObject(apiInfo._id, version);
  }

  async _updateVersionInfo(apiInfo, version) {
    if (!(apiInfo.versions instanceof Array)) {
      apiInfo.versions = [];
    } else {
      apiInfo.versions = Array.from(apiInfo.versions);
    }
    if (apiInfo.versions.indexOf(version) === -1) {
      apiInfo.versions.push(version);
    }
    apiInfo.latest = version;
    if (!this.apiInfo) {
      this.apiInfo = apiInfo;
    }
    const e = new CustomEvent('api-index-changed', {
      detail: {
        apiInfo
      },
      bubbles: true,
      cancelable: true,
      composed: true
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw new Error('APIs model is not in the DOM');
    }
    return await e.detail.result;
  }

  async _updateDataObject(id, version) {
    const e = new CustomEvent('api-data-changed', {
      detail: {
        indexId: id,
        version,
        data: this.unresolvedAmf
      },
      bubbles: true,
      cancelable: true,
      composed: true
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw new Error('APIs model is not in the DOM');
    }
    return await e.detail.result;
  }

  _indexChangeHandler(e) {
    if (e.cancelable || !this.apiInfo) {
      return;
    }
    const changed = e.detail.apiInfo;
    if (this.apiInfo._id !== changed._id) {
      return;
    }
    this.apiInfo = changed;
    if (!this.saved) {
      this.saved = true;
    }
    this._compteVersionProperties();
  }
  /**
   * Requests to delete current API from the data store.
   * It removes all versions of the API data and then the API index.
   * @return {Promise}
   */
  async delete() {
    if (!this.saved) {
      throw new Error('This API is not yet saved');
    }
    const info = this.apiInfo;
    if (!info) {
      throw new Error('API data not restored');
    }
    const e = new CustomEvent('api-deleted', {
      detail: {
        id: info._id
      },
      bubbles: true,
      cancelable: true,
      composed: true
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw new Error('APIs model is not in the DOM');
    }
    return await e.detail.result;
  }
  /**
   * Removes given version of the API.
   *
   * @param {String} version
   * @return {Promise}
   */
  async deleteVersion(version) {
    if (!this.saved) {
      throw new Error('This API is not yet saved');
    }
    const info = this.apiInfo;
    if (!info) {
      throw new Error('API data not restored');
    }
    const e = new CustomEvent('api-version-deleted', {
      detail: {
        id: info._id,
        version
      },
      bubbles: true,
      cancelable: true,
      composed: true
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw new Error('APIs model is not in the DOM');
    }
    return await e.detail.result;
  }

  async getApi(id, version) {
    if (!id) {
      throw new Error('No API id given');
    }
    const doc = await this._getApiInfo(id);
    const type = doc.type;
    if (!version) {
      version = doc.latest;
    }
    const api = await this._requestApiVersion(id + '|' + version);
    return {
      api,
      type
    };
  }

  async _requestApiVersion(versionId) {
    const e = new CustomEvent('api-data-read', {
      detail: {
        id: versionId
      },
      bubbles: true,
      cancelable: true,
      composed: true
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw new Error('APIs model is not in the DOM');
    }
    const doc = await e.detail.result;
    return doc.data;
  }

  _computeVersionsList() {
    const { apiInfo } = this;
    if (!apiInfo) {
      return;
    }
    if (!apiInfo.versions) {
      apiInfo.versions = [];
    }
    return apiInfo.versions;
  }
}
window.customElements.define('apic-electron', ApicElectron);
