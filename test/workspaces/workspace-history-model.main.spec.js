const { WorkspaceHistory } = require('../../scripts/main/models/workspace-history');
const { assert } = require('chai');
const path = require('path');
const fs = require('fs-extra');

describe('WorkspaceHistory model class', function() {
  const historyPath = path.join('workspace', 'workspace-history.json');
  describe('Constructor', function() {
    it('Sets default entries limit', function() {
      const instance = new WorkspaceHistory();
      assert.equal(instance.limit, 15);
    });

    it('Sets limit from the argument', function() {
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
    let instance;
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    it('Returns a promise', () => {
      const result = instance.defaultSettings();
      assert.typeOf(result, 'promise');
    });

    it('Promise resolves to an object', () => {
      return instance.defaultSettings()
      .then((result) => {
        assert.typeOf(result, 'object');
      });
    });

    it('Object has kind property', () => {
      return instance.defaultSettings()
      .then((result) => {
        assert.equal(result.kind, 'ARC#WorkspaceHistory');
      });
    });

    it('Object has entries property', () => {
      return instance.defaultSettings()
      .then((result) => {
        assert.typeOf(result.entries, 'array');
      });
    });

    it('Entries property is empty', () => {
      return instance.defaultSettings()
      .then((result) => {
        assert.lengthOf(result.entries, 0);
      });
    });
  });

  describe('sortEntries()', () => {
    let instance;
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    it('Returns 1 when a is older', () => {
      const a = { used: 1 };
      const b = { used: 2 };
      const result = instance.sortEntries(a, b);
      assert.equal(result, 1);
    });

    it('Returns -1 when a is yonger', () => {
      const a = { used: 2 };
      const b = { used: 1 };
      const result = instance.sortEntries(a, b);
      assert.equal(result, -1);
    });

    it('Returns 0 when equal', () => {
      const a = { used: 1 };
      const b = { used: 1 };
      const result = instance.sortEntries(a, b);
      assert.equal(result, 0);
    });
  });

  describe('sortEntries()', () => {
    let instance;
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('Returns a promise', () => {
      const result = instance.loadEntries();
      assert.typeOf(result, 'promise');
      return result;
    });

    it('Returns undefined when no array items', () => {
      return instance.loadEntries()
      .then((result) => {
        assert.isUndefined(result);
      });
    });

    it('Returns undefined when load function do not return data', () => {
      instance.load = () => Promise.resolve();
      return instance.loadEntries()
      .then((result) => {
        assert.isUndefined(result);
      });
    });

    it('Returns undefined when no entires array', () => {
      instance.load = () => Promise.resolve({});
      return instance.loadEntries()
      .then((result) => {
        assert.isUndefined(result);
      });
    });

    it('Returns undefined when entires is not an array', () => {
      instance.load = () => Promise.resolve({ entries: {} });
      return instance.loadEntries()
      .then((result) => {
        assert.isUndefined(result);
      });
    });

    it('Returns list of entires', () => {
      const entries = [{ used: 1, file: 'test' }];
      instance.load = () => Promise.resolve({ entries });
      return instance.loadEntries()
      .then((result) => {
        assert.deepEqual(result, entries);
      });
    });
  });

  describe('addEntry()', () => {
    let instance;
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('Rejects when no argument', (done) => {
      const result = instance.addEntry();
      result.then(() => {
        throw new Error('Should not resolve');
      })
      .catch((cause) => {
        assert.notEqual(cause.message, 'Should not resolve');
        done();
      });
    });

    it('Adds a new entry', () => {
      return instance.addEntry('/test')
      .then(() => {
        const file = path.join(process.env.ARC_HOME, historyPath);
        return fs.readJson(file);
      })
      .then((data) => {
        assert.lengthOf(data.entries, 1, 'Has an entry');
        assert.equal(data.entries[0].file, '/test', 'Entry has file');
        assert.typeOf(data.entries[0].used, 'number', 'Entry has used');
      });
    });

    it('Updates existing entry', () => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.outputJson(file, {
        entries: [{
          file: '/test',
          used: 1
        }]
      })
      .then(() => instance.addEntry('/test'))
      .then(() => fs.readJson(file))
      .then((data) => {
        assert.typeOf(data.entries[0].used, 'number', 'Entry has used');
        assert.notEqual(data.entries[0].used, 1, 'Entry used time is updated');
      });
    });

    it('Limits number of entries', () => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      instance.limit = 2;
      return fs.outputJson(file, {
        entries: [{
          file: '/1',
          used: 1
        }, {
          file: '/2',
          used: 2
        }]
      })
      .then(() => instance.addEntry('/3'))
      .then(() => fs.readJson(file))
      .then((data) => {
        assert.equal(data.entries[0].file, '/3', 'New Entry added');
        assert.equal(data.entries[1].file, '/2', 'Yongest entry stays');
        assert.lengthOf(data.entries, 2, 'Oldest entry is removed');
      });
    });
  });

  describe('clearHistory()', () => {
    let instance;
    beforeEach(() => {
      instance = new WorkspaceHistory();
    });

    afterEach(() => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.remove(file);
    });

    it('Clears entries', () => {
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.outputJson(file, {
        entries: [{
          file: '/1',
          used: 1
        }, {
          file: '/2',
          used: 2
        }]
      })
      .then(() => instance.clearHistory())
      .then(() => fs.readJson(file))
      .then((data) => {
        assert.lengthOf(data.entries, 0);
      });
    });

    it('Creates entries when no data', () => {
      instance.load = () => Promise.resolve();
      const file = path.join(process.env.ARC_HOME, historyPath);
      return fs.outputJson(file, {
        entries: [{
          file: '/1',
          used: 1
        }, {
          file: '/2',
          used: 2
        }]
      })
      .then(() => instance.clearHistory())
      .then(() => fs.readJson(file))
      .then((data) => {
        assert.lengthOf(data.entries, 0);
      });
    });
  });
});
