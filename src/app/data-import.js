import { ArcBindings } from './bindings/ArcBindings.js';
import { DataImportScreenElectron } from './pages/DataImportScreenElectron.js';
import './pouchdb.js';

(async () => {
  const bindings = new ArcBindings();
  await bindings.initialize();

  const page = new DataImportScreenElectron();
  await page.initialize();
})();
