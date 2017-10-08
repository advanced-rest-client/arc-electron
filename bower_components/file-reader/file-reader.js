(function() {
  'use strict';
  /* global Blob, FileReader */
  Polymer({
    is: 'file-reader',
    /**
     * Fired when read operation failed.
     *
     * @event file-error
     * @param {Event} error An event thrown by the reader.
     */
    /**
     * Fired when read operation finish.
     * The format of the data depends on which of the methods was used to initiate
     * the read operation - see `readAs` for more information.
     *
     * @event file-read
     * @param {String|ArrayBuffer} result A string or an ArrayBuffer which depends on `readAs`.
     */
    /**
     * Fired when read operation has been aborted by calling `abort` method.
     *
     * @event file-abort
     */
    properties: {
      /**
       * A Blob to read. File object (the one you can get from the `<input type="file">`)
       * is a sub type of Blob.
       */
      blob: {
        type: Blob
      },
      /**
       * Automatically read file after setting up `blob` attribute.
       * If the value of this attribute is `false` you need to call `read()` manually.
       */
      auto: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },
      /**
       * Sets how the input data should be read.
       * Result format depends on this setting.
       * Possible values are: `arrayBuffer`, `binaryString`, `dataURL`, `text`.
       */
      readAs: {
        type: String,
        value: 'text',
        reflectToAttribute: true
      },
      /**
       * Read-only value that is true when the data is read.
       */
      loaded: {
        notify: true,
        readOnly: true,
        type: Boolean,
        value: false
      },
      /**
       * Read-only value that tracks the loading state of the data.
       */
      loading: {
        notify: true,
        readOnly: true,
        type: Boolean,
        value: false
      },
      /**
       * Read-only value that indicates that the last set `blob` failed to load.
       */
      error: {
        notify: true,
        readOnly: true,
        type: Boolean,
        value: false
      },
      /**
       * Current progress of file read.
       * This is set only if the browser is able to determine length of the file.
       * The value is in range from 0 to 1.
       */
      progress: {
        type: Number,
        readOnly: true,
        notify: true,
        value: 0
      },
      /**
       * A file encoding for `readAs` set to `text`.
       * If not provided UTF-8 will be used.
       */
      encoding: String,
      /**
       * Current reader.
       */
      _reader: FileReader,
      _errorObserver: {
        type: Function,
        value: function() {
          return this._readError.bind(this);
        }
      },
      _loadObserver: {
        type: Function,
        value: function() {
          return this._readResult.bind(this);
        }
      },
      _abortObserver: {
        type: Function,
        value: function() {
          return this._readAbort.bind(this);
        }
      },
      _progressObserver: {
        type: Function,
        value: function() {
          return this._readProgress.bind(this);
        }
      }
    },
    observers: [
      '_autoChanged(auto, blob, readAs)'
    ],
    /**
     * Supports auto read function.
     * Called when one of `auto`, `blob` or `readAs` change and when all of them are set.
     */
    _autoChanged: function() {
      if (!this.auto || !this.blob) {
        return;
      }
      this.read();
    },
    /**
     * Read the blob.
     */
    read: function() {
      this.abort();
      this._setLoaded(false);
      this._setLoading(true);
      this._setError(false);
      this._setProgress(0);
      this._read();
    },
    /** Performs a read operation. */
    _read: function() {
      var reader = new FileReader();
      reader.addEventListener('load', this._loadObserver);
      reader.addEventListener('error', this._errorObserver);
      reader.addEventListener('progress', this._progressObserver);
      reader.addEventListener('abort', this._abortObserver);
      switch (this.readAs) {
        case 'arrayBuffer':
          reader.readAsArrayBuffer(this.blob);
          break;
        case 'binaryString':
          reader.readAsBinaryString(this.blob);
          break;
        case 'dataURL':
          reader.readAsDataURL(this.blob);
          break;
        case 'text':
          reader.readAsText(this.blob, this.encoding);
          break;
        default:
          throw new Error('The readAs attribute must be set.');
      }
      this._reader = reader;
    },
    /** Error event handler */
    _readError: function(e) {
      this._setError(true);
      this._setLoading(false);
      this._setLoaded(true);
      this.fire('file-error', {
        error: e
      });
    },
    /** Load event handler */
    _readResult: function(e) {
      this._setLoaded(true);
      this._setLoading(false);
      this.fire('file-read', {
        result: e.target.result
      });
    },
    /** Abort event handler */
    _readAbort: function() {
      this._setLoading(false);
      this._setLoaded(false);
      this.fire('file-abort');
    },
    /** Progress event handler. */
    _readProgress: function(e) {
      if (e.lengthComputable) {
        let percentComplete = e.loaded / e.total;
        this._setProgress(percentComplete);
      }
    },
    /**
     * Aborts current operation.
     * If the reader is not working this method do nothing.
     * Note that the `file-abort` event is fired when this method is called.
     */
    abort: function() {
      if (this._reader) {
        this._reader.abort();
        this._reader.removeEventListener('load', this._loadObserver);
        this._reader.removeEventListener('error', this._errorObserver);
        this._reader.removeEventListener('progress', this._progressObserver);
        this._reader.removeEventListener('abort', this._abortObserver);
        this._reader = null;
      }
    }
  });
})();
