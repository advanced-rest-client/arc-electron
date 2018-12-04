const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const {ArcSessionControl} = require('../main');

describe('ArcSessionControl class - main process', function() {
  describe('Initialization', function() {
    it('Sets "id" property', function() {
      const instance = new ArcSessionControl(1);
      assert.equal(instance.id, 1);
    });

    it('Sets "settingsFile" path with "sessions" directory', () => {
      const instance = new ArcSessionControl(0);
      const compare = path.join('sessions', '0.json');
      assert.notEqual(instance.settingsFile.indexOf(compare), -1);
    });

    it('"settingsFile" is in app directory', () => {
      const instance = new ArcSessionControl(0);
      const app = require('electron').app;
      const ud = app.getPath('userData');
      const compare = path.join(ud, 'sessions', '0.json');
      assert.equal(instance.settingsFile, compare);
    });
  });

  describe('_numberValue()', function() {
    let instance;
    before(() => {
      instance = new ArcSessionControl(0);
    });

    it('Accepts numeric value', function() {
      const result = instance._numberValue(5, 1);
      assert.equal(result, 5);
    });

    it('Accepts string numeric value', function() {
      const result = instance._numberValue('5', 1);
      assert.equal(result, 5);
    });

    it('Accepts default value for undefined', function() {
      const result = instance._numberValue(undefined, 1);
      assert.equal(result, 1);
    });

    it('Accepts default value for NaN', function() {
      const result = instance._numberValue('undefined', 1);
      assert.equal(result, 1);
    });
  });

  describe('_readAppScreenSize()', function() {
    let instance;
    before(() => {
      instance = new ArcSessionControl(2);
    });

    it('Returns defaults when no argument', function() {
      const result = instance._readAppScreenSize();
      assert.typeOf(result, 'object');
      assert.equal(result.width, instance._defaultWidth);
      assert.equal(result.height, instance._defaultHeight);
    });

    it('Returns defaults when argument is missing size', function() {
      const result = instance._readAppScreenSize({});
      assert.typeOf(result, 'object');
      assert.equal(result.width, instance._defaultWidth);
      assert.equal(result.height, instance._defaultHeight);
    });

    it('Returns defaults when size is incorrect', function() {
      const result = instance._readAppScreenSize({
        size: {
          width: 'width',
          height: 'height'
        }
      });
      assert.typeOf(result, 'object');
      assert.equal(result.width, instance._defaultWidth);
      assert.equal(result.height, instance._defaultHeight);
    });

    it('Returns 0s for negative values', function() {
      const result = instance._readAppScreenSize({
        size: {
          width: -5,
          height: -10
        }
      });
      assert.typeOf(result, 'object');
      assert.equal(result.width, 0);
      assert.equal(result.height, 0);
    });

    it('Returns stored values as numbers', function() {
      const result = instance._readAppScreenSize({
        size: {
          width: '5',
          height: '10'
        }
      });
      assert.typeOf(result, 'object');
      assert.equal(result.width, 5);
      assert.equal(result.height, 10);
    });
  });

  describe('_readAppScreenPosition()', function() {
    let instance;
    before(() => {
      instance = new ArcSessionControl(2);
    });

    it('Returns defaults when no argument', function() {
      const result = instance._readAppScreenPosition();
      assert.typeOf(result, 'object');
      assert.isUndefined(result.x);
      assert.isUndefined(result.y);
    });

    it('Returns defaults when argument is missing position', function() {
      const result = instance._readAppScreenPosition({});
      assert.typeOf(result, 'object');
      assert.isUndefined(result.x);
      assert.isUndefined(result.y);
    });

    it('Returns defaults when position is incorrect', function() {
      const result = instance._readAppScreenPosition({
        position: {
          x: 'x',
          y: 'y'
        }
      });
      assert.typeOf(result, 'object');
      assert.isUndefined(result.x);
      assert.isUndefined(result.y);
    });

    it('Returns defaults for negative values', function() {
      const result = instance._readAppScreenPosition({
        position: {
          x: -5,
          y: -10
        }
      });
      assert.typeOf(result, 'object');
      assert.equal(result.x, 0);
      assert.equal(result.y, 0);
    });

    it('Returns stored values as numbers', function() {
      const result = instance._readAppScreenPosition({
        position: {
          x: '5',
          y: '10'
        }
      });
      assert.typeOf(result, 'object');
      assert.equal(result.x, 5);
      assert.equal(result.y, 10);
    });
  });

  describe('Reading data', function() {
    let instance;
    beforeEach(() => {
      instance = new ArcSessionControl(2);
    });

    afterEach(() => {
      return fs.remove(instance.settingsFile);
    });

    it('Returns default data', (done) => {
      instance.load()
      .then((data) => {
        setTimeout(() => {
          const size = data.size;
          const position = data.position;
          assert.typeOf(size, 'object');
          assert.equal(size.width, instance._defaultWidth);
          assert.equal(size.height, instance._defaultHeight);
          assert.typeOf(position, 'object');
          assert.isUndefined(position.x);
          assert.isUndefined(position.y);
          done();
        }, 1);
      });
    });
  });

  describe('updateSize()', function() {
    let instance;
    beforeEach(() => {
      instance = new ArcSessionControl(2);
      instance.storeDebounce = 1;
    });

    afterEach(() => {
      return fs.remove(instance.settingsFile);
    });

    it('Updates __settings object', (done) => {
      instance.updateSize(1, 2);
      assert.equal(instance.__settings.size.width, 1);
      assert.equal(instance.__settings.size.height, 2);
      setTimeout(() => done(), 2);
    });

    it('Saves values to the file', (done) => {
      instance.updateSize(1, 2);
      setTimeout(() => {
        fs.readJson(instance.settingsFile)
        .then((data) => {
          assert.equal(data.size.width, 1);
          assert.equal(data.size.height, 2);
          done();
        });
      }, 5);
    });
  });

  describe('updatePosition()', function() {
    let instance;
    beforeEach(() => {
      instance = new ArcSessionControl(2);
      instance.storeDebounce = 1;
    });

    afterEach(() => {
      return fs.remove(instance.settingsFile);
    });

    it('Updates __settings object', (done) => {
      instance.updatePosition(1, 2);
      assert.equal(instance.__settings.position.x, 1);
      assert.equal(instance.__settings.position.y, 2);
      setTimeout(() => done(), 2);
    });

    it('Saves values to the file', (done) => {
      instance.updatePosition(1, 2);
      setTimeout(() => {
        fs.readJson(instance.settingsFile)
        .then((data) => {
          assert.equal(data.position.x, 1);
          assert.equal(data.position.y, 2);
          done();
        });
      }, 5);
    });
  });
});
