/**
 * Normally this would be placed in main ARC application body.
 * However, because <iron-backdrop> element is placed in the body without using
 * tricks this logic is moved to the main app body.
 */
class RequestBackdropsSupport {
  constructor() {
    this._saveRequestHandler = this._saveRequestHandler.bind(this);
    this._requestDetailsHandler = this._requestDetailsHandler.bind(this);
    this._renderCodeSnippets = this._renderCodeSnippets.bind(this);
    this._resizeSheetContent = this._resizeSheetContent.bind(this);
    this._cancelRequestEdit = this._cancelRequestEdit.bind(this);
    this._saveRequestEdit = this._saveRequestEdit.bind(this);
    this._deleteRequestDetails = this._deleteRequestDetails.bind(this);
    this._editRequestDetails = this._editRequestDetails.bind(this);
    this._collectIds();
  }

  _collectIds() {
    this.$ = {
      editorSheet: document.getElementById('editorSheet'),
      detailsSheet: document.getElementById('detailsSheet'),
      snippetsSheet: document.getElementById('snippetsSheet'),
      requestEditor: document.getElementById('requestEditor'),
      requestDetails: document.getElementById('requestDetails'),
      requestSnippets: document.getElementById('requestSnippets'),
    };
  }

  set editorOpened(value) {
    this.$.editorSheet.opened = value;
  }

  get editorOpened() {
    return this.$.editorSheet.opened;
  }

  set detailsOpened(value) {
    this.$.detailsSheet.opened = value;
  }

  get detailsOpened() {
    return this.$.detailsSheet.opened;
  }

  set snippetsOpened(value) {
    this.$.snippetsSheet.opened = value;
  }

  get snippetsOpened() {
    return this.$.snippetsSheet.opened;
  }

  set snippetRequest(request) {
    request = request || {};
    this.$.requestSnippets.url = request.url;
    this.$.requestSnippets.method = request.method;
    this.$.requestSnippets.headers = request.headers;
    this.$.requestSnippets.payload = request.payload;
  }

  get snippetRequest() {}

  observe() {
    window.addEventListener('request-save-state', this._saveRequestHandler);
    window.addEventListener('request-details', this._requestDetailsHandler);
    window.addEventListener('request-code-snippets', this._renderCodeSnippets);
    this.$.editorSheet.addEventListener('iron-overlay-opened', this._resizeSheetContent);
    this.$.detailsSheet.addEventListener('iron-overlay-opened', this._resizeSheetContent);
    this.$.requestSnippets.addEventListener('iron-overlay-opened', this._resizeSheetContent);
    this.$.requestEditor.addEventListener('cancel-request-edit', this._cancelRequestEdit);
    this.$.requestEditor.addEventListener('save-request', this._saveRequestEdit);
    this.$.requestDetails.addEventListener('delete-request', this._deleteRequestDetails);
    this.$.requestDetails.addEventListener('edit-request', this._editRequestDetails);
  }

  _resizeSheetContent(e) {
    const panel = e.target.querySelector(
        'saved-request-editor,saved-request-detail,http-code-snippets');
    if (panel && panel.notifyResize) {
      panel.notifyResize();
    }
  }

  _saveRequestHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    this.$.requestEditor.request = e.detail.request;
    this.editorOpened = true;
  }

  _cancelRequestEdit(e) {
    e.stopPropagation();
    this.editorOpened = false;
    this.$.requestEditor.request = undefined;
  }

  _saveRequestEdit(e) {
    this.editorOpened = false;
    this.$.requestEditor.request = undefined;
  }

  _requestDetailsHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    this.$.requestDetails.request = e.detail.request;
    this.detailsOpened = true;
  }

  _deleteRequestDetails(e) {
    e.stopPropagation();
    this.detailsOpened = false;
    const request = e.target.request;
    e.target.request = undefined;
    if (!request._rev || !request._id) {
      return;
    }
    document.body.dispatchEvent(new CustomEvent('request-object-deleted', {
      detail: {
        type: request.type,
        id: request._id
      },
      bubbles: true,
      cancelable: true
    }));
  }

  _editRequestDetails(e) {
    e.stopPropagation();
    const request = this.$.requestDetails.request;
    this.detailsOpened = false;
    this.$.requestEditor.request = request;
    this.editorOpened = true;
  }

  _renderCodeSnippets(e) {
    e.preventDefault();
    e.stopPropagation();
    this.snippetRequest = e.detail.request;
    this.snippetsOpened = true;
  }
}
const requestBackdrops = new RequestBackdropsSupport();
requestBackdrops.observe();
