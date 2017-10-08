(function() {
  'use strict';

  window.FileBehaviors = window.FileBehaviors || {};
  /**
   * A behavior to serve files from local filesystem using Chrome filesystem API.
   *
   * @polymerBehavior FileBehaviors.FilesystemAppBehavior
   */
  FileBehaviors.FilesystemAppBehaviorImpl = {
    properties: {
      /**
       * The optional list of accept options for file opener. Each option will be presented as a
       * unique group to the end-user.
       * Each group definition can be defines as an object with following properties:
       * description {string} This is the optional text description for this option.
       * mimeTypes {Array<String>} Mime-types to accept, e.g. "image/jpeg" or "audio/*". One of
       *  mimeTypes or extensions must contain at least one valid element.
       * extensions {Array<String>} Extensions to accept, e.g. "jpg", "gif", "crx".
       *
       * @type {Array<String>}
       */
      accepts: {
        type: Array
      },
      /**
       * Whether to accept multiple files. This is only supported for openFile and openWritableFile.
       */
      acceptsMultiple: Boolean,
    },

    /**
     * Write `this.content` to the file.
     * A `file-write` event will be fired when ready.
     */
    write: function() {
      this.getFile({
          type: 'saveFile'
        })
        .then(this._truncate.bind(this))
        .then(this._writeFileEntry.bind(this))
        .then(() => this.fire('file-write'))
        .catch((reason) => this.fire('error', reason));
    },
    /**
     * Open the file using file picker and Chrome api.
     * By default this will open a file in read only mode.
     */
    getFile: function(opts) {
      opts = opts || {};
      if (this.filename) {
        opts.suggestedName = this.filename;
      }
      if (this.accepts) {
        opts.accepts = this.accepts;
      }
      if (typeof this.acceptsMultiple !== 'undefined') {
        opts.acceptsMultiple = this.acceptsMultiple;
      }
      return new Promise(function(resolve, reject) {
        chrome.fileSystem.chooseEntry(opts, function(entry) {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve(entry);
        }.bind(this));
      }.bind(this));
    }
  };

  /** @polymerBehavior */
  FileBehaviors.FilesystemAppBehavior = [
    FileBehaviors.FilesystemBehavior,
    FileBehaviors.FilesystemAppBehaviorImpl
  ];
})();
