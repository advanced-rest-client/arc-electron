const assert = require('chai').assert;
const {BrowserWindow} = require('electron');
const {ContentSearchService} = require('../main');
// const {ArcPreferences} = require('@advanced-rest-client/arc-electron-preferences');

describe('ContentSearchService basic tests- main process', function() {
  describe('get / set / remove service', function() {
    let win;
    before(() => {
      win = new BrowserWindow({
        show: false
      });
    });

    it('getService returns undefined for no services', function() {
      const result = ContentSearchService.getService(win);
      assert.isUndefined(result);
    });

    it('getService returns service for existing one', function() {
      const service = new ContentSearchService(win);
      ContentSearchService.addService(service);
      const result = ContentSearchService.getService(win);
      assert.isTrue(result === service);
    });

    it('Removes the service', function() {
      const service = new ContentSearchService(win);
      ContentSearchService.addService(service);
      ContentSearchService.removeService(service);
      const result = ContentSearchService.getService(win);
      assert.isUndefined(result);
    });
  });
});
