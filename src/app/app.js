import { MonacoLoader } from '../../web_modules/index.js';
import { ArcBindings } from './bindings/ArcBindings.js';
import { ArcScreenElectron } from './pages/ArcScreenElectron.js';
import './pouchdb.js';

(async () => {
  const bindings = new ArcBindings();
  await bindings.initialize();

  const base = new URL('/node_modules/monaco-editor/', window.location.href).toString();
  MonacoLoader.createEnvironment(base);
  await MonacoLoader.loadMonaco(base);
  await MonacoLoader.monacoReady();

  const page = new ArcScreenElectron();
  page.systemVariables = process.env;
  await page.initialize();
})();
