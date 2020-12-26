import { ArcModelEvents } from '../../../../web_modules/@advanced-rest-client/arc-models/index.js';

/** @typedef {import('../context-menu/interfaces').ContextMenuCommand} ContextMenuCommand */

/**
 * A default set of context menu commands
 */
const commands = /** @type ContextMenuCommand[] */ ([
  {
    selector: "workspace-tab > span.tab-name",
    group: "main",
    label: "Close",
    title: 'Closes this tab',
    icon: 'close',
    command: 'close-tab',
  },
  {
    selector: "workspace-tab > span.tab-name",
    group: "main",
    label: "Close others",
    title: 'Closes all other tabs',
    // icon: 'close',
    command: 'close-other-tabs',
  },
  {
    selector: "workspace-tab > span.tab-name",
    group: "main",
    label: "Close all",
    title: 'Closes all opened tabs',
    // icon: 'close',
    command: 'close-all-tabs',
  },
  {
    selector: "workspace-tab > span.tab-name",
    group: "edit",
    label: "Duplicate",
    title: 'Duplicate this tab',
    icon: 'duplicate',
    command: 'duplicate-tab',
  },

  // history / saved menu
  {
    selector: '.request-list-item[data-id] *',
    group: "main",
    label: "Delete",
    title: 'Delete this request',
    icon: 'deleteOutline',
    execute: (args) => {
      const { root, target } = args;
      let parent = target.closest('history-menu,saved-menu,projects-menu,saved-panel,history-panel');
      if (!parent) {
        parent = /** @type ShadowRoot */ (target.getRootNode()).host;
      }
      if (!parent) {
        return;
      }
      // @ts-ignore
      const { type } = parent;
      const itemTarget = /** @type HTMLElement */ (target.closest('.request-list-item'));
      ArcModelEvents.Request.delete(root, type, itemTarget.dataset.id);
    },
  }
]);

export default commands;
