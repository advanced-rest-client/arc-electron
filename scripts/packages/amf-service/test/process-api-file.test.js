const {ElectronAmfService} = require('../');
const {assert} = require('chai');
const path = require('path');
const fs = require('fs-extra');

describe('File data processing', function() {
  this.timeout(10000);

  describe('Blob data - parses to AMF', function() {
    [
      ['Single RAML file', 'single-file-api.raml'],
      ['OAS 2.0', 'oas-2.0-json.zip'],
      ['Single RAML file in zip', 'single-file-api.zip'],
      ['Multiple RAML files in zip', 'multiple-raml-files.zip'],
      ['Folder in the zip', 'inception.zip']
    ].forEach((item) => {
      it(item[0], function() {
        const file = path.join('test', item[1]);
        let service;
        return fs.readFile(file)
        .then((data) => {
          const buff = new Blob([new Uint8Array(data)]);
          service = new ElectronAmfService();
          return service.processApiFile(buff);
        })
        .then((amf) => {
          assert.typeOf(amf, 'array');
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
        const file = path.join('test', item[1]);
        return fs.readFile(file)
        .then((data) => {
          const service = new ElectronAmfService();
          return service.processApiFile(data);
        })
        .then((amf) => {
          assert.typeOf(amf, 'array');
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

      const file = path.join('test', 'multiple-entry-points.zip');
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
});
