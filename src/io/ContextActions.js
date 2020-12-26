import { Menu } from 'electron';
import { logger } from './Logger.js';

const selectionMenu = Menu.buildFromTemplate([
  {role: 'copy', accelerator: 'ctrl+c'},
  {type: 'separator'},
  {role: 'selectAll', accelerator: 'ctrl+a'},
]);

const inputMenu = Menu.buildFromTemplate([
  {role: 'undo', accelerator: 'ctrl+z'},
  {role: 'redo', accelerator: 'ctrl+shift+z'},
  {type: 'separator'},
  {role: 'cut', accelerator: 'ctrl+x'},
  {role: 'copy', accelerator: 'ctrl+c'},
  {role: 'paste', accelerator: 'ctrl+v'},
  {type: 'separator'},
  {role: 'selectAll', accelerator: 'ctrl+a'},
]);

/**
 * A class responsible for gathering information about registered context menu
 * actions and creating a configuration for opened windows.
 */
export class ContextActions {
  /**
   * Registers application default actions on the window object.
   *
   * @param {Electron.WebContents} webContents A web contents object of the renderer process
   */
  registerDefaultActions(webContents) {
    logger.debug('Registering window default context menu actions');
    webContents.on('context-menu', (e, props) => {
      const { selectionText, isEditable, editFlags } = props;
      if (isEditable) {
        inputMenu.items[0].enabled = editFlags.canUndo;
        inputMenu.items[1].enabled = editFlags.canRedo;
        inputMenu.items[3].enabled = editFlags.canCut;
        inputMenu.items[4].enabled = editFlags.canCopy;
        inputMenu.items[5].enabled = editFlags.canPaste;
        inputMenu.items[7].enabled = editFlags.canSelectAll;
        inputMenu.popup();
      } else if (selectionText && selectionText.trim() !== '') {
        inputMenu.items[0].enabled = editFlags.canCopy;
        inputMenu.items[2].enabled = editFlags.canSelectAll;
        selectionMenu.popup();
      }
    })
  }
}
