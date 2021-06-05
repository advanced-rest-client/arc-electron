import { ArcModelEvents, ExportEvents } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';
import { close, deleteOutline, code } from '../../../../web_modules/@advanced-rest-client/arc-icons/ArcIcons.js';
import { HarTransformer } from '../../../../web_modules/@api-client/har/index.js';

/** @typedef {import('@api-client/context-menu').ContextMenuCommand} ContextMenuCommand */
/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */

/**
 * A default set of context menu commands
 */
const commands = /** @type ContextMenuCommand[] */ ([
  {
    target: "workspace-tab > span.tab-name",
    label: "Close",
    title: 'Closes this tab',
    icon: close,
    id: 'close-tab',
  },
  {
    target: "workspace-tab > span.tab-name",
    label: "Close others",
    title: 'Closes all other tabs',
    // icon: close,
    id: 'close-other-tabs',
  },
  {
    target: "workspace-tab > span.tab-name",
    label: "Close all",
    title: 'Closes all opened tabs',
    // icon: 'close,
    id: 'close-all-tabs',
  },
  {
    target: "workspace-tab > span.tab-name",
    group: "edit",
    label: "Duplicate",
    title: 'Duplicate this tab',
    // icon: duplicate,
    id: 'duplicate-tab',
  },

  // history / saved menu
  {
    target: '.request-list-item[data-id] *',
    label: "Save as HAR",
    title: 'Saves this request as HAR object',
    execute: async (args) => {
      const { root, target } = args;
      let parent = target.closest('history-menu,saved-menu,projects-menu,saved-panel,history-panel');
      if (!parent) {
        parent = /** @type ShadowRoot */ (target.getRootNode()).host;
      }
      if (!parent) {
        return;
      }
      // @ts-ignore
      let { type } = parent;
      if (type === 'project') {
        type = 'saved';
      }
      const itemTarget = /** @type HTMLElement */ (target.closest('.request-list-item'));
      const { id } = itemTarget.dataset;
      const request = await ArcModelEvents.Request.read(root, type, id);
      const transformer = new HarTransformer();
      const result = await transformer.transform([request]);
      const data = JSON.stringify(result);
      const name = /** @type ARCSavedRequest */ (request).name || 'arc-request';
      const file = `${name}.har`;
      ExportEvents.fileSave(root, data, {
        contentType: 'application/json',
        file,
      });
    },
  },
  {
    target: '.request-list-item[data-id] *',
    type: 'separator',
  },
  {
    target: '.request-list-item[data-id] *',
    label: "Delete",
    title: 'Delete this request',
    icon: deleteOutline,
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
  },

  // response view manipulation
  {
    target: 'response-highlighter',
    label: "Format",
    title: 'Format the response',
    icon: code,
    execute: (args) => {
      const { target } = args;
      // @ts-ignore
      target.format();
    }
  }
]);

export default commands;
