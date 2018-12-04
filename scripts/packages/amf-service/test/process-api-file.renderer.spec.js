const {ElectronAmfService} = require('../');
const {assert} = require('chai');
const path = require('path');
const fs = require('fs-extra');

describe('File data processing', function() {
  function entryPointCallback(e) {
    e.preventDefault();
    e.detail.result = new Promise((resolve) => {
      setTimeout(() => {
        resolve(e.detail.candidates[0]);
      });
    });
  }

  before(() => {
    window.addEventListener('api-select-entrypoint', entryPointCallback);
  });

  after(() => {
    window.removeEventListener('api-select-entrypoint', entryPointCallback);
  });

  describe('Blob data - parses to AMF', function() {
    [
      ['Single RAML file', 'single-file-api.raml'],
      ['OAS 2.0', 'oas-2.0-json.zip'],
      ['Single RAML file in zip', 'single-file-api.zip'],
      ['Multiple RAML files in zip', 'multiple-raml-files.zip'],
      ['Folder in the zip', 'inception.zip']
    ].forEach((item) => {
      it(item[0], function() {
        const file = path.join(__dirname, item[1]);
        let service;
        return fs.readFile(file)
        .then((data) => {
          const buff = new Blob([new Uint8Array(data)]);
          service = new ElectronAmfService();
          return service.processApiFile(buff);
        })
        .then((result) => {
          assert.typeOf(result, 'object', 'Returns an object');
          assert.typeOf(result.model, 'string', 'Returns the model');
          assert.typeOf(result.type, 'object', 'Returns type info');
          assert.typeOf(result.type.type, 'string', 'API type is set');
          assert.typeOf(result.type.contentType, 'string', 'API content-type is set');
          return service.unlisten();
        });
      });
    });
  });

  describe('Buffer data - parses to AMF', function() {
    [
      ['Single RAML file', 'single-file-api.raml'],
      ['OAS 2.0', 'oas-2.0-json.zip'],
      ['Single RAML file in zip', 'single-file-api.zip'],
      ['Multiple RAML files in zip', 'multiple-raml-files.zip'],
      ['Folder in the zip', 'inception.zip']
    ].forEach((item) => {
      it(item[0], function() {
        const file = path.join(__dirname, item[1]);
        return fs.readFile(file)
        .then((data) => {
          const service = new ElectronAmfService();
          return service.processApiFile(data);
        })
        .then((result) => {
          assert.typeOf(result, 'object', 'Returns an object');
          assert.typeOf(result.model, 'string', 'Returns the model');
          assert.typeOf(result.type, 'object', 'Returns type info');
          assert.typeOf(result.type.type, 'string', 'API type is set');
          assert.typeOf(result.type.contentType, 'string', 'API content-type is set');
        });
      });
    });
  });

  describe('api-select-entrypoint event', function() {
    it('Dispatches event for multiple entry points', function() {
      let called = false;
      window.addEventListener('api-select-entrypoint', function f(e) {
        window.removeEventListener('api-select-entrypoint', f);
        called = true;
        e.preventDefault();
        e.detail.result = Promise.resolve();
      });

      const file = path.join(__dirname, 'multiple-entry-points.zip');
      return fs.readFile(file)
      .then((data) => {
        const service = new ElectronAmfService();
        return service.processApiFile(data);
      })
      .then(() => {
        assert.isTrue(called);
      });
    });
  });
}).timeout(10000);
