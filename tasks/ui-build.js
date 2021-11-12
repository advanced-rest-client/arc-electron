/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs-extra");

async function copyAppStyles() {
  const stylesDirectory = path.join(__dirname, '..', 'node_modules', '@advanced-rest-client', 'app', 'styles');
  const localStyles = path.join(__dirname, '..', 'src', 'app', 'styles');
  const contents = await fs.readdir(stylesDirectory);
  const ps = contents.map(async (file) => {
    if (!file || file.startsWith('.')) {
      return;
    }
    const src = path.join(stylesDirectory, file);
    const dest = path.join(localStyles, file);
    await fs.copy(src, dest, { overwrite: true });
  });

  await Promise.all(ps);
}

(async () => {
  try {
    await esbuild.build({
      entryPoints: ["tasks/index.js", 'tasks/preload.js'],
      outdir: 'web_modules',
      bundle: true,
      sourcemap: true,
      minify: true,
      splitting: false,
      format: "esm",
      target: ["esnext"],
    });
    await copyAppStyles();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
