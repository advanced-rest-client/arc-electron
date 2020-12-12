/* eslint-disable import/no-commonjs */
const { app } = require('electron');
const { SessionManager } = require('../../src/io/SessionManager.js');

app.on('ready', () => {
  const instance = new SessionManager();
  instance.listen();
});
