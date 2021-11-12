import { execFile } from "child_process";
import path from "path";

const ITEM_PATTERN =
  /^(.*)\s(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\s+([^\s].*)$/;

/** @typedef {import('../../types').RegKeyValues} RegKeyValues */
/** @typedef {import('../../types').ExecOutput} ExecOutput */

/**
 * Based on https://github.com/Azure/get-proxy-settings/blob/master/src/winreg.ts
 */
export class WinReg {
  /**
   * @param {string} hive
   * @param {string} key
   * @returns {Promise<RegKeyValues>}
   */
  async readKey(hive, key) {
    const keyPath = `${hive}\\${key}`;
    const { stdout } = await this.execAsync(this.getRegPath(), [
      "query",
      keyPath,
    ]);
    const values = this.parseOutput(stdout);
    return values;
  }

  /**
   * @param {string} stdout
   * @returns {RegKeyValues}
   */
  parseOutput(stdout) {
    const lines = stdout.split("\n");
    const result = /** @type RegKeyValues */ ({});
    for (const line of lines.slice(1)) {
      const match = ITEM_PATTERN.exec(line.trim());
      if (match) {
        const name = match[1].trim();
        const type = match[2].trim();
        const value = match[3].trim();
        result[name] = { type, value };
      }
    }
    return result;
  }

  /** 
   * @param {string} command
   * @param {string[]=} [args=[]]
   * @returns {Promise<ExecOutput>}
   */
  execAsync(command, args=[]) {
    return new Promise((resolve, reject) => {
      execFile(command, args, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  /** 
   * @returns {string}
   */
  getRegPath() {
    if (process.platform === "win32" && process.env.windir) {
      return path.join(process.env.windir, "system32", "reg.exe");
    }
    return "REG";
  }
}
