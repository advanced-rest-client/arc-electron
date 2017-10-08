(function() {
'use strict';
/*******************************************************************************
 * Copyright 2012 Pawel Psztyc
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
/**
 * A HTTP parser contains a helper method to check validity of HTTP data.
 */
class HttpParser {
  /**
   * See RFC 7230, Section 3.2.6.
   *
   * @param {String} characters A string to test
   */
  static isValidHTTPToken(characters) {
    if (!characters || characters.length === 0) {
      return false;
    }
    for (let i = 0, len = characters.length; i < len; ++i) {
      let c = characters[i];
      if (c <= 0x20 || c >= 0x7F ||
        c === '(' || c === ')' || c === '<' || c === '>' || c === '@' ||
        c === ',' || c === ';' || c === ':' || c === '\\' || c === '"' ||
        c === '/' || c === '[' || c === ']' || c === '?' || c === '=' ||
        c === '{' || c === '}') {
        return false;
      }
    }
    return true;
  }
  /**
   * "A forbidden method is a method that is a byte case-insensitive match"
   * for one of `CONNECT`, `TRACE`, and `TRACK`."
   *
   * @param {String} method Method value to test
   * @return {Boolean} True if the method name is formbidden.
   */
  static isForbiddenMethod(method) {
    return HttpParser.equalIgnoringCase(method, 'TRACE') ||
      HttpParser.equalIgnoringCase(method, 'TRACK') ||
      HttpParser.equalIgnoringCase(method, 'CONNECT');
  }
  static equalIgnoringCase(strA, strB) {
    if (!strA) {
      return !strB;
    }
    if (!strB) {
      return !strA;
    }
    return strA.toLowerCase() === strB.toLowerCase();
  }
}
window.HttpParser = HttpParser;
})();
