import { MenuScreen } from '../../web_modules/index.js';
import { ArcBindings } from './bindings/ArcBindings.js';
import { PopupMenuBindingsElectron } from './bindings/PopupMenuBindingsElectron.js';
import './pouchdb.js';

(async () => {
  const bindings = new ArcBindings();
  await bindings.initialize();

  const popup = new PopupMenuBindingsElectron();
  await popup.initialize();
  
  const page = new MenuScreen();
  await page.initialize();
})();
