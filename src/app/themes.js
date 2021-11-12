import { ThemesScreen } from '../../web_modules/index.js';
import { ArcBindings } from './bindings/ArcBindings.js';

(async () => {
  const bindings = new ArcBindings();
  await bindings.initialize();
  
  const page = new ThemesScreen();
  await page.initialize();
})();
