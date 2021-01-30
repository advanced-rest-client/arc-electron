import './pouchdb.js';
import { AdvancedRestClientApplication } from './arc/AdvancedRestClientApplication.js';
import marked from '../../../web_modules/marked/lib/marked.js';

// @ts-ignore
window.marked = marked;

const page = new AdvancedRestClientApplication();
page.initialize();
