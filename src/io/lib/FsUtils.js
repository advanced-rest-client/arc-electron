import { writeFile, mkdir, rm, readdir } from 'fs/promises';
import fsSync from 'fs';
import { constants } from 'fs';
import { join, dirname } from 'path';

/**
 * @typedef JsonReadOptions
 * @property {boolean=} throws Whether it should throw an error when a reading error occurs.
 */

/**
 * 
 * @param {string} filePath 
 * @returns {Promise<fsSync.Stats>}
 */
function statPromise(filePath) {
  return new Promise((resolve, reject) => {
    fsSync.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

/**
 * Checks whether a file exists in the location.
 * @param {string} filePath 
 * @returns {Promise<boolean>}
 */
export function pathExists(filePath) {
  return new Promise((resolve) => {
    fsSync.stat(filePath, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  // try {
  //   stat(filePath);
  //   return true;
  // } catch (e) {
  //   console.error(e);
  //   return false;
  // }
}

/**
 * Tests a user's permissions for the file or directory specified by filePath.
 * @param {string} filePath The path to test
 * @returns {Promise<boolean>} True when the path can be read by the current user.  
 */
export async function canRead(filePath) {
  const exists = await pathExists(filePath);
  if (!exists) {
    return false;
  }
  
  return new Promise((resolve) => {
    fsSync.access(filePath, constants.R_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  // try {
  //   fsSync.accessSync(filePath, constants.R_OK);
  //   return true;
  // } catch (e) {
  //   console.error(e);
  //   return false;
  // }
}

/**
 * Tests a user's permissions for the file or directory specified by filePath.
 * @param {string} filePath The path to test
 * @returns {Promise<boolean>} True when the path can be written to by the current user.  
 */
export async function canWrite(filePath) {
  const exists = await pathExists(filePath);
  if (!exists) {
    return false;
  }
  return new Promise((resolve) => {
    fsSync.access(filePath, constants.W_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  // try {
  //   await access(filePath, constants.W_OK);
  //   return true;
  // } catch (e) {
  //   console.error(e);
  //   return false;
  // }
}

/**
 * Reads the contents of a JSON file.
 * 
 * @param {string} filePath The path to the JSON file to read.
 * @param {JsonReadOptions=} opts 
 * @returns {Promise<unknown>} The contents of the file. When `throws` options is not set and error occurs then it returns an empty file.
 */
export async function readJson(filePath, opts={}) {
  const readable = await canRead(filePath);
  if (!readable) {
    if (opts.throws) {
      throw new Error(`Unable to read file: ${filePath}. Access is denied.`);
    }
    return {};
  }
  return new Promise((resolve, reject) => {
    fsSync.readFile(filePath, 'utf8', (err, contents) => {
      if (err) {
        reject(err);
      } else {
        let data = {};
        try {
          data = JSON.parse(contents);
        } catch (e) {
          if (opts.throws) {
            const err = new Error(`Invalid JSON contents for file: ${filePath}.`);
            reject(err);
            return;
          }
        }
        resolve(data);
      }
    });
  });
  // const contents = await readFile(filePath, 'utf8');
  // let data = {};
  // try {
  //   data = JSON.parse(contents);
  // } catch (e) {
  //   if (opts.throws) {
  //     throw new Error(`Invalid JSON contents for file: ${filePath}.`);
  //   }
  // }
  // return data;
}

/**
 * Writes the contents to the file.
 * 
 * @param {string} filePath The file to write to. It replaces the contents.
 * @param {string|any} contents The contents to write.
 * @returns {Promise<void>}
 */
export async function writeJson(filePath, contents) {
  const destParent = dirname(filePath);
  const parentWritable = await canWrite(destParent);
  if (!parentWritable) {
    throw new Error(`Unable to write to location: ${parentWritable}. Access is denied.`);
  }
  const data = typeof contents === 'string' ? contents : JSON.stringify(contents);
  await writeFile(filePath, data);
}

/**
 * Ensures the directory exists.
 * 
 * @param {string} dirPath 
 * @returns {Promise<void>}
 */
export async function ensureDir(dirPath) {
  const readable = await canRead(dirPath);
  if (readable) {
    return;
  }
  await mkdir(dirPath, { recursive: true });
}

/**
 * Removes contents of the directory, leaving the directory in the filesystem.
 * 
 * @param {string} dirPath 
 * @returns {Promise<void>}
 */
export async function emptyDir(dirPath) {
  const exists = await pathExists(dirPath);
  if (!exists) {
    return;
  }
  const writeable = await canWrite(dirPath);
  if (!writeable) {
    throw new Error(`Unable to clear directory: ${dirPath}. Access is denied.`);
  }
  const items = await readdir(dirPath, 'utf8');
  for (const item of items) {
    const file = join(dirPath, item);
    await rm(file, { recursive: true });
  }
}

// /**
//  * Copies a file
//  * @param {string} source 
//  * @param {string} dest 
//  * @returns {Promise<void>}
//  */
// async function copyFile(source, dest) {
//   const destParent = dirname(dest);
//   await ensureDir(destParent);
//   await fsCopyFile(source, dest);
// }

/**
 * Copies a file
 * @param {string} source 
 * @param {string} dest 
 * @returns {Promise<void>}
 */
async function copyFile(source, dest) {
  const destParent = dirname(dest);
  await ensureDir(destParent);
  return new Promise((resolve, reject) => {
    fsSync.copyFile(source, dest, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Copies a directory and its contents.
 * @param {string} source 
 * @param {string} dest 
 * @returns {Promise<void>}
 */
async function copyDirectory(source, dest) {
  await ensureDir(dest);
  const entries = fsSync.readdirSync(source, { withFileTypes: true, encoding: 'utf8' });
  // const entries = await readdir(source, { withFileTypes: true, encoding: 'utf8' });
  for (const entry of entries) {
    const srcFile = join(source, entry.name);
    const destFile = join(dest, entry.name);
    const srcStat = await statPromise(srcFile);
    if (srcStat.isDirectory()) {
      await copyDirectory(srcFile, destFile);
    } else {
      await copyFile(srcFile, destFile);
    }
  }
}

/**
 * Copies a file or a directory to the destination location.
 * It creates the destination folder when missing.
 * 
 * @param {string} source The source file or folder.
 * @param {string} dest The destination file or folder.
 * @returns {Promise<void>}
 */
export async function copy(source, dest) {
  const existing = await pathExists(source);
  if (!existing) {
    throw new Error(`Specified path does not exist: ${source}`);
  }
  const srcStat = await statPromise(source);
  if (srcStat.isDirectory()) {
    await copyDirectory(source, dest);
  } else {
    await copyFile(source, dest);
  }
}
