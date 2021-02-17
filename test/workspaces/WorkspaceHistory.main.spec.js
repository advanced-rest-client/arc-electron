const { assert } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const _require = require('esm')(module);
const testPaths = require('../setup-paths');

/** @typedef {import('../../src/io/models/WorkspaceHistory').WorkspaceHistory} WorkspaceHistory */

const { WorkspaceHistory } = _require('../../src/io/models/WorkspaceHistory');

describe('WorkspaceHistory model class', () => {
  const historyPath = path.join('workspace', 'workspace-history.json');

  before(() => {
    testPaths.getBasePath();
  });

  describe('Constructor', () => {
    it('Sets default entries limit', () => {
      const instance = new WorkspaceHistory();
      assert.equal(instance.limit, 15);
    });

    it('Sets limit from the argument', () => {
      const instance = new WorkspaceHistory(10);
      assert.equal(instance.limit, 10);
    });

    it('Sets file path', () => {
      const instance = new WorkspaceHistory();
      const result = path.join(process.env.ARC_HOME, historyPath);
      assert.equal(instance.settingsFile, result);
    });
  });

  describe('defaultSettings()', () => {
    let instance = /** @type WorkspaceHistory */ (null);
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    it('returns an object', async () => {
      const result = await instance.defaultSettings();
      assert.typeOf(result, 'object');
    });

    it('has the "kind" property', async () => {
      const result = await instance.defaultSettings()
      assert.equal(result.kind, 'ARC#WorkspaceHistory');
    });

    it('has the "entries" property', async () => {
      const result = await instance.defaultSettings()
      assert.typeOf(result.entries, 'array');
    });

    it('has empty "entries" property', async () => {
      const result = await instance.defaultSettings()
      assert.lengthOf(result.entries, 0);
    });
  });

  describe('sortEntries()', () => {
    let instance = /** @type WorkspaceHistory */ (null);
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    it('returns 1 when a is older', () => {
      const a = { used: 1, file: 'a' };
      const b = { used: 2, file: 'a' };
      const result = instance.sortEntries(a, b);
      assert.equal(result, 1);
    });

    it('returns -1 when a is younger', () => {
      const a = { used: 2, file: 'a' };
      const b = { used: 1, file: 'a' };
      const result = instance.sortEntries(a, b);
      assert.equal(result, -1);
    });

    it('returns 0 when equal', () => {
      const a = { used: 1, file: 'a' };
      const b = { used: 1, file: 'a' };
      const result = instance.sortEntries(a, b);
      assert.equal(result, 0);
    });
  });

  describe('sortEntries()', () => {
    let instance = /** @type WorkspaceHistory */ (null);
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('returns undefined when no array items', async () => {
      const result = await instance.loadEntries()
      assert.isUndefined(result);
    });

    it('returns undefined when load function do not return data', async () => {
      instance.load = async () => undefined;
      const result = await instance.loadEntries()
      assert.isUndefined(result);
    });

    it('returns undefined when no entires array', async () => {
      instance.load = async () => ({ kind: 'ARC#WorkspaceHistory', entries: undefined });
      const result = await instance.loadEntries()
      assert.isUndefined(result);
    });

    it('returns undefined when entires is not an array', async () => {
      // @ts-ignore
      instance.load = async () => ({ kind: 'ARC#WorkspaceHistory', entries: {} });
      const result = await instance.loadEntries()
      assert.isUndefined(result);
    });

    it('returns list of entires', async () => {
      const entries = [{ used: 1, file: 'test' }];
      instance.load = async () => ({ kind: 'ARC#WorkspaceHistory', entries });
      const result = await instance.loadEntries()
      assert.deepEqual(result, entries);
    });
  });

  describe('addEntry()', () => {
    let instance = /** @type WorkspaceHistory */ (null);
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('rejects when no argument', async () => {
      let called = false;
      try {
        await instance.addEntry(undefined);
      } catch (e) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('adds a new entry', async () => {
      await instance.addEntry('/test');
      const file = path.join(process.env.ARC_HOME, historyPath);
      const data = await fs.readJson(file);
      assert.lengthOf(data.entries, 1, 'Has an entry');
      assert.equal(data.entries[0].file, '/test', 'Entry has file');
      assert.typeOf(data.entries[0].used, 'number', 'Entry has used');
    });

    it('updates existing entry', async () => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      await fs.outputJson(file, {
        entries: [{
          file: '/test',
          used: 1
        }]
      });
      await instance.addEntry('/test');
      const data = await fs.readJson(file);
      assert.typeOf(data.entries[0].used, 'number', 'Entry has used');
      assert.notEqual(data.entries[0].used, 1, 'Entry used time is updated');
    });

    it('limits number of entries', async () => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      instance.limit = 2;
      await fs.outputJson(file, {
        entries: [{
          file: '/1',
          used: 1
        }, {
          file: '/2',
          used: 2
        }]
      });
      await instance.addEntry('/3');
      const data = await fs.readJson(file);
      assert.equal(data.entries[0].file, '/3', 'New Entry added');
      assert.equal(data.entries[1].file, '/2', 'Youngest entry stays');
      assert.lengthOf(data.entries, 2, 'Oldest entry is removed');
    });
  });

  describe('clearHistory()', () => {
    let instance = /** @type WorkspaceHistory */ (null);
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('clears entries', async () => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      await fs.outputJson(file, {
        entries: [{
          file: '/1',
          used: 1
        }, {
          file: '/2',
          used: 2
        }]
      })
      await instance.clearHistory();
      const data = await fs.readJson(file);
      assert.lengthOf(data.entries, 0);
    });
  });
});
