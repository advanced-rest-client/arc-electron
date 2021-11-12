import Server from '@api-components/amf-web-api';
import getPort from 'get-port';

/**
 * A wrapper for the `@api-components/amf-web-api` module that is running 
 * in a background process.
 */
export class AmfParserService {
  constructor() {
    this.isRunning = false;
    this.port = 0; 
  }

  /**
   * @param {any} message
   */
  async messageHandler(message) {
    const { id, type } = message;
    let promise;
    switch (type) {
      case 'start': promise = this.start(message.port); break;
      case 'stop': promise = this.stop(); break;
      case 'getPort': promise = this.getServerPort(); break;
      default: 
        this.reportError(new Error(`Unknown command: ${message.type}`), id); 
        return;
    }
    try {
      const result = await promise;
      process.send({
        type: 'result',
        id,
        result,
      });
    } catch (e) {
      this.reportError(e, id); 
    }
  }

  /**
   * If the server is not running it starts the server.
   * @returns {Promise<number>} The port number the server is running on.
   */
  async getServerPort() {
    if (!this.isRunning) {
      await this.start();
    }
    return this.port;
  }

  /**
   * Starts the www server with the AMF parser.
   * @param {number=} port Optional port number to run the server on.
   * @returns {Promise<number>} The port number the server is running on.
   */
  async start(port) {
    let parsedPort = Number(port);
    if (Number.isNaN(parsedPort)) {
      parsedPort = await getPort();
    }
    this.port = parsedPort;
    this.srv = new Server({ cors: { enabled: true } });
    this.srv.setupRoutes();
    await this.srv.startHttp(parsedPort);
    this.isRunning = true;
    return parsedPort;
  }

  /**
   * Stops the running server.
   * It does nothing when the server is not running.
   * @returns {Promise<void>}
   */
  async stop() {
    this.isRunning = false;
    this.port = 0;
    if (!this.srv) {
      return;
    }
    await this.srv.stopHttp();
  }

  /**
   * @param {Error} error
   * @param {string=} id The request id, if any.
   */
  reportError(error, id) {
    process.send({
      type: 'error',
      message: error.message,
      stack: error.stack,
      id,
    });
  }
}

const service = new AmfParserService();
process.on('message', service.messageHandler.bind(service));;
process.send({
  type: 'initialized',
});
