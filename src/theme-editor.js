const {ipcRenderer} = require('electron');

const ThemeEditor = {};
ThemeEditor.editor = function() {
  return document.getElementById('editor');
};
ThemeEditor.initStyles = function(styles) {
  ThemeEditor.editor().parsedStyles = styles;
};

ThemeEditor.sendPreview = function(stylesMap) {
  ipcRenderer.send('theme-editor-preview', stylesMap);
};

(function(scope) {
  scope.updatePreview = function() {
    let styles = ThemeEditor.editor().userStyles;
    ThemeEditor.sendPreview(styles);
  };
})(document.getElementById('app'));
