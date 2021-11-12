/* eslint-disable import/no-commonjs */

const Chance = require('chance');
// @ts-ignore
const _require = require('esm')(module);

const { Cookie } = _require('@advanced-rest-client/base/src/lib/Cookie.js');

const chance = new Chance();

class DataGenerator {
  // Generates random Cookie data
  generateCookieObject() {
    const cookie = new Cookie(chance.word(), chance.word(), {
      'domain': chance.domain(),
      'expires': chance.hammertime(),
      'hostOnly': chance.bool(),
      'httpOnly': chance.bool(),
      'path': chance.bool() ? '/' : `/${chance.word()}`,
      'secure': chance.bool(),
      'max-age': chance.integer({ min: 100, max: 1000 }),
    });
    return cookie;
  }

  /**
   * Generates cookies list
   *
   * @param {object=} opts Configuration options:
   * -   `size` (Number) Number of items to generate. Default to 25.
   * @return {object[]} List of datastore entries.
   */
  generateCookiesData(opts = {}) {
    const size = opts.size || 25;
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(this.generateCookieObject());
    }
    return result;
  }
}

module.exports.DataGenerator = DataGenerator;
