const net = require('net');
const log = require('../../../main/logger');
const { RemoteApi } = require('./remote-api');
const argv = require('yargs');
/**
 * A class that allow to connect to the application via HTTP server and
 * send instructions to the app so it can be controlled externally.
 */
class CommunicationProtocol {
  /**
   * @param {Number} port A port number to create a communication server.
   */
  constructor(port) {
    this.port = port;
    this.api = new RemoteApi();
    this._clients = [];
    this._connectedHandler = this._connectedHandler.bind(this);
    this.nl = '\n';
  }

  start() {
    log.debug('Initializing remote protocol on port ' + this.port);
    const server = net.createServer(this._connectedHandler);
    server.on('error', (err) => {
      log.error(err);
    });
    server.listen(this.port, () => {
      console.log('server bound');
    });
  }

  _connectedHandler(client) {
    log.debug('[ARC-REMOTE] Accepting client.');
    this._clients.push(client);

    client.on('end', () => this._removeClient(client));
    client.on('error', () => this._removeClient(client, true));
    client.on('data', (message) => this._processMessage(client, message));

    client.write('arc-client-ready' + this.nl);
  }

  _removeClient(client, disconnect) {
    log.debug('[ARC-REMOTE] Removing client.');
    for (let i = 0, len = this._clients.length; i < len; i++) {
      if (this._clients[i] === client) {
        if (disconnect && !client.destroyed) {
          client.destroy();
        }
        this._clients.splice(i, 1);
        return;
      }
    }
  }

  _processMessage(client, message) {
    if (typeof message !== 'string') {
      message = message.toString();
    }
    const params = argv(message).argv;
    const command = params._[0];
    Object.keys(params).forEach((key) => {
      if (key === '_' || key === '$0' || typeof params[key] !== 'string') {
        return;
      }
      let value = params[key];
      if (value[0] === '"' && value[value.length - 1] === '"') {
        value = value.substr(1, value.length - 1);
        params[key] = value;
      }
    });
    switch (command) {
      case 'get-application-settings-file-location':
        // either default or user set file.
        client.write(global.arc.prefs.settingsFile + this.nl);
        break;
      case 'create-new-tab':
        return this.api.newTab(params);
      default:
        log.warn('[ARC-REMOTE] Skiping unknown message: ' + message);
        client.write('unknown-command' + this.nl);
    }
  }
}
exports.CommunicationProtocol = CommunicationProtocol;
