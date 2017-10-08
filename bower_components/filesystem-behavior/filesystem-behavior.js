(function() {
  'use strict';

  window.FileBehaviors = window.FileBehaviors || {};
  /**
   * A base behavior for filesystem.
   * This behavior is a base behavior for `local-`, `sync-` and `web-` filesystem behaviors.
   *
   * @polymerBehavior FileBehaviors.FilesystemBehavior
   * @hero hero.svg
   */
  FileBehaviors.FilesystemBehavior = {
    /**
     * Fired when error occured.
     *
     * @event error
     * @param {Error} error An error object.
     */
    /**
     * Fired when file has been read.
     *
     * @event file-read
     * @param {String} content Content of the file.
     */
    /**
     * Fired when the content has been written to the file.
     *
     * @event file-write
     */
    properties: {
      /**
       * Name of the file.
       * In local filesystem API, when prompting for a file to save it will be used as
       * a suggested name.
       * It will be set to opened file name when the file is opened.
       *
       * @type {String}
       */
      filename: {
        type: String,
        notify: true
      },
      /**
       * The content of the file.
       * If auto attribute is true it will write content to file each time
       * it change (not applicable for local filesystem).
       *
       * It will be set to file content when called `read()` function. You can set this
       * property with any value that should be written to the file using `save()` function.
       * The type of the `content` attribute is depended of the `readAs` attribute or string
       * if the element wasn't able to parse the content according to set type.
       *
       * TODO: add support for other types than String.
       *
       * @type String|ArrayBuffer|Blob
       */
      content: {
        type: Object,
        notify: true
      },
      /**
       * Set a type of the content to perform auto parsing. By default text will be used.
       * If there is error while parsing the data it will set file content as string.
       * Currently only `text` and `json` values are supported.
       *
       * @type {String}
       */
      readAs: {
        type: String,
        value: 'text'
      },
      /**
       * A mime type of the file content.
       */
      mime: {
        type: String,
        value: 'text/pain'
      },
      /**
       * If true the file will be read from the filesystem as soon as
       * filename attribute change.
       *
       * @type Boolean
       */
      auto: {
        type: Boolean,
        value: false
      }
    },
    /**
     * Get a file from the filesystem.
     */
    getFile: function() {
      throw new Error('Method not yet implemented.');
    },
    /**
     * Read file content.
     * Result will be filled to `content` attribute.
     * This function will trigger "file-read" event with file contents.
     *
     * Example:
     *  <web-filesystem id="filesystem" file="names.json" on-file-read="{{onFileRead}}">
     *  </web-filesystem>
     *
     *  this.$.filesystem.readFile();
     *  //...
     *  onFileRead: function(event, details){
     *    //... details.content;
     *  }
     */
    read: function() {
      this.getFile()
        .then(this._getContent.bind(this))
        .then(this._prepareContent.bind(this))
        .then((result) => {
          if (this.auto) {
            let auto = this.auto;
            this.auto = false;
            this.async(() => {
              this.auto = auto;
            });
          }
          this.content = result;
          this.fire('file-read', {
            content: result
          });
        })
        .catch((reason) => {
          this.fire('error', reason);
        });
    },
    /**
     * Write `this.content` to the file.
     * A `file-write` event will be fired when ready.
     */
    write: function() {
      throw new Error('Method not yet implemented.');
    },
    /**
     * Get the file content from the entry.
     *
     * @param {FileEntry} fileEntry File entry to read from.
     */
    _getContent: function(fileEntry) {
      return new Promise((resolve, reject) => {
        fileEntry.file((file) => {
          var reader = new FileReader();
          reader.onloadend = function() {
            resolve(this.result);
          };
          reader.onerror = function(error) {
            reject(error);
          };
          reader.readAsText(file);
        }, (error) => {
          reject(error);
        });
      });
    },
    /**
     * After file read use `readAs` attribute and try to parse file content.
     * Finally the contant will be set to `content` attribute.
     */
    _prepareContent: function(content) {
      if (!content) {
        return content;
      }
      switch (this.readAs) {
        case 'json':
          try {
            content = JSON.parse(content);
          } catch (e) {
            console.warn('The content wasn\'t a JSON value.');
          }
          break;
        default:
          // nothing
          break;
      }
      return content;
    },
    /**
     * Truncate the file.
     * To override the file content it must be truncated first.
     * Note that the file must be closed and re-opened to write to the file again.
     *
     * @return {Promise} Fulfilled promise with {FileEntry} when the file has been truncated.
     */
    _truncate: function(fileEntry) {
      return new Promise(function(resolve, reject) {
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.addEventListener('writeend', function() {
            resolve(fileEntry);
          });
          fileWriter.addEventListener('error', function(e) {
            reject(e);
          });
          fileWriter.truncate(0);
        }, reject);
      });
    },
    /**
     * Wrtite `content` to the file.
     */
    _writeFileEntry: function(fileEntry) {
      var toWrite = this._getWriteableContent();
      if (typeof toWrite === 'string') {
        toWrite = [toWrite];
      }
      return new Promise((resolve, reject) => {
        fileEntry.createWriter((fileWriter) => {
          fileWriter.seek(fileWriter.length);
          fileWriter.addEventListener('writeend', function() {
            resolve(fileEntry);
          });
          fileWriter.addEventListener('error', function(e) {
            reject(e);
          });
          let blob;
          if (toWrite instanceof Blob) {
            blob = toWrite;
          } else {
            blob = new Blob(toWrite, {
              type: this.mime
            });
          }
          fileWriter.write(blob);
        }, reject);
      });
    },
    /**
     * Get a content to write to the file.
     */
    _getWriteableContent: function() {
      var content = '';
      switch (this.readAs) {
        case 'json':
          content = JSON.stringify(this.content);
          break;
        default:
          content = this.content;
          break;
      }
      return content;
    }
  };
})();
