import { css } from '../../../../web_modules/lit-element/lit-element.js';

export const ContextMenuStyles = css`
.context-menu {
  position: fixed;
  font-size: 1rem;
  color: var(--context-menu-color, #000);
  user-select: none;
  z-index: 100;
  --anypoint-item-icon-width: 32px;
  --anypoint-item-min-height: 32px;
}

.context-menu .listbox {
  padding: 2px 0;
  min-width: 160px;
  border-radius: 4px;
  box-shadow: var(--context-menu-shadow, var(--anypoint-dropdown-shadow));
  background-color: var(--context-menu-background-color, var(--primary-background-color));
}

.context-menu .item {
  margin: 8px 0;
}

.context-menu .item.disabled {
  color: var(--context-menu-disabled-color, #9E9E9E);
  pointer-events: none;
}

.menu-divider {
  height: 1px;
  background-color: var(--context-menu-divider-color, rgba(0, 0, 0, 0.12));
  margin: 8px 0 8px 40px;
}

.menu-icon {
  width: 20px;
  height: 20px;
}
`;
