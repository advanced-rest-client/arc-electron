import { ContextMenuStore } from './ContextMenuStore';

export declare interface ClickVector {
  x: number;
  y: number;
}

export declare interface EnabledOptions {
  /**
   * The object store to be used to store menu item data.
   */
  store: ContextMenuStore;
  /**
   * An instance of the element that triggered the command.
   */
  target: HTMLElement|SVGElement;
  /**
   * The element with which this context menu was initialized with.
   */
  root: HTMLElement;
}

export declare interface ExecuteOptions {
  /**
   * The object store to be used to store menu item data.
   */
  store: ContextMenuStore;
  /**
   * An instance of the element that triggered the command.
   */
  target: HTMLElement|SVGElement;
  /**
   * The element with which this context menu was initialized with.
   */
  root: HTMLElement;
  /**
   * The vector of the original click.
   */
  vector: ClickVector;
  /**
   * The value of the `command` set on the command.
   */
  command?: string;
}

export declare interface ContextMenuCommand {
  /**
   * The name of the CSS selector that identifies the click target.
   */
  selector: string;
  /**
   * The label to render.
   */
  label: string;
  /**
   * Optional title to use
   */
  title?: string;
  /**
   * The icon to render from the modeling-icons library.
   * TODO: Make it also an `SVGTemplateResult`
   */
  icon?: string;
  /**
   * A shortcut that triggers the command.
   */
  shortcut?: string;
  /**
   * This value is not visualized. When set it creates a new group in the
   * context menu in a way that they are separated with each other with
   * a divider.
   *
   * @default main
   */
  group?: string | 'main' | 'edit' | 'view';
  /**
   * When set it is passed to the `execute` function and to the registered callback function.
   */
  command?: string;
  /**
   * Whether the command is enabled or not.
   * When not set it is assumed that the command is enabled.
   * The function returns a value indicating whether the command is enabled.
   */
  enabled?: ((args: EnabledOptions) => boolean);
  /**
   * The action to be executed when this command is activated
   */
  execute?: ((args: ExecuteOptions) => void);
}

export declare interface RegisteredCommand extends ContextMenuCommand {
  /**
   * The id of the registered command.
   */
  id: number;
}
