import { css } from '../../web_modules/lit-element/lit-element.js';

export default css`
:host {
  display: block;
};

paper-spinner {
  margin-left: 8px;
}

.error-toast {
  background-color: var(--warning-primary-color, #FF7043);
  color: var(--warning-contrast-color, #fff);
}

[hidden] {
  display: none !important;
}

.loader {
  height: 100%;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  vertical-align: column;
  align-items: center;
  justify-content: center;
  min-height: inherit;
}

.drop-target {
  display: none;
}

:host([dragging]) .drop-target {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  vertical-align: column;
  align-items: center;
  background-color: #fff;
  border: 4px var(--drop-file-importer-header-background-color, var(--primary-color)) solid;
}
`;
