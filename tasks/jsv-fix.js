const fs = require('fs-extra');
const path = require('path');

/**
 * Fixes https://github.com/garycourt/JSV/issues/94
 */
(async () => {
  const pkgFile = path.join('node_modules', 'JSV', 'package.json');
  const exists = await fs.pathExists(pkgFile);
  if (!exists) {
    return;
  }
  const contents = await fs.readJSON(pkgFile, { throws: false });
  if (Array.isArray(contents.dependencies)) {
    delete contents.dependencies;
    await fs.outputJSON(pkgFile, contents, { spaces: 2 });
  }
})();
