/**
 * A helper class that processes payload before saving it to a
 * datastore or file.
 * It processes `FormData` and `Blob` payloads into string and restores
 * them to original state.
 */
class PayloadProcessor {
  /**
   * @constructor
   *
   * @param {Object} arcRequest The ARC request object to operate on.
   */
  constructor(arcRequest) {
    this.request = arcRequest;
  }
  /**
   * Transforms request pyload to string if needed.
   * Note, this returns copy of the object if any transformation is applied.
   *
   * @return {Promise} Promise resolved when payload has been processed.
   */
  payloadToString() {
    if (!this.request.payload) {
      return Promise.resolve(this.request);
    }
    if (this.request.payload instanceof FormData) {
      let data = Object.assign({}, this.request);
      if (!data.payload.entries) {
        data.payload = undefined;
        return Promise.resolve(data);
      }
      return this._createMultipartEntry(data.payload)
      .then((entry) => {
        data.payload = undefined;
        data.multipart = entry;
        return data;
      });
    } else if (this.request.payload instanceof Blob) {
      let data = Object.assign({}, this.request);
      return this._blobToString(data.payload)
      .then((str) => {
        data.payload = undefined;
        data.blob = str;
        return data;
      });
    }
    return Promise.resolve(this.request);
  }

  /**
   * Computes `multipart` list value to replace FormData with array that can
   * be stored in the datastore.
   *
   * @param {FormData} payload FormData object
   * @return {Promise} Promise resolved to a form part representation.
   */
  _createMultipartEntry(payload) {
    let iterator = payload.entries();
    let textParts;
    if (payload._arcMeta && payload._arcMeta.textParts) {
      textParts = payload._arcMeta.textParts;
    }
    return this._computeFormDataEntry(iterator, textParts);
  }
  /**
   * Recuresively iterates over form data and appends result of creating the
   * part object to the `result` array.
   *
   * Each part entry contains `name` as a form part name, value as a string
   * representation of the value and `isFile` to determine is the value is
   * acttually a string or a file data.
   *
   * @param {Iterator} iterator FormData iterator
   * @param {?Array<String>} textParts From `_arcMeta` property. List of blobs
   * that should be treated as text parts.
   * @param {?Array<Object>} result An array where the results are appended to.
   * It creates new result object when it's not passed.
   * @return {Promise} A promise resolved to the `result` array.
   */
  _computeFormDataEntry(iterator, textParts, result) {
    result = result || [];
    let item = iterator.next();
    if (item.done) {
      return Promise.resolve(result);
    }
    let entry = item.value;
    let name = entry[0];
    let value = entry[1];
    let promise;
    let isBlob = false;
    let isTextBlob = false;
    if (value instanceof Blob) {
      promise = this._blobToString(value);
      if (textParts && textParts.indexOf(name) !== -1) {
        isBlob = false;
        isTextBlob = true;
      } else {
        isBlob = true;
      }
    } else {
      promise = Promise.resolve(value);
    }
    return promise
    .then((str) => {
      let _part = {
        name: name,
        value: str,
        isFile: isBlob
      };
      if (isTextBlob) {
        _part.isTextBlob = isTextBlob;
      }
      return _part;
    })
    .then((part) => {
      result.push(part);
      return this._computeFormDataEntry(iterator, textParts, result);
    });
  }
  /**
   * Converts blob data to base64 string.
   *
   * @param {Blob} blob File or blob object to be translated to string
   * @return {Promise} Promise resolved to a base64 string data from the file.
   */
  _blobToString(blob) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onloadend = function(e) {
        resolve(e.target.result);
      };
      reader.onerror = function() {
        reject(new Error('Unable to convert blob to string.'));
      };
      reader.readAsDataURL(blob);
    });
  }
  /**
   * Restores FormData from ARC data model.
   *
   * @param {Array<Object>} model ARC model for multipart.
   * @return {FormData} Restored form data
   */
  restoreMultipart(model) {
    let fd = new FormData();
    if (!model || !model.length) {
      return fd;
    }
    fd._arcMeta = {
      textParts: []
    };
    model.forEach((part) => {
      let name = part.name;
      let value;
      if (part.isFile) {
        try {
          value = this._dataURLtoBlob(part.value);
        } catch (e) {
          value = '';
        }
      } else {
        value = part.value;
        if (part.isTextBlob) {
          fd._arcMeta.textParts.push(name);
          try {
            value = this._dataURLtoBlob(part.value);
          } catch (e) {
            value = '';
          }
        }
      }
      fd.append(name, value);
    });
    return fd;
  }

  /**
   * Converts dataurl string to blob
   *
   * @param {String} dataurl Data url from blob value.
   * @return {Blob} Restored blob value
   */
  _dataURLtoBlob(dataurl) {
    let arr = dataurl.split(',');
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
  }
}

exports.PayloadProcessor = PayloadProcessor;
