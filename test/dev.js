// const path = require('path');
// const Application = require('spectron').Application;

// let electronPath = path.join(__dirname, '..', 'node_modules',
//   '.bin', 'electron');
// if (process.platform === 'win32') {
//   electronPath += '.cmd';
// }
// const workspaceFilePath = 'test/test-workspace.json';
// let appPath = path.join(__dirname, '..', 'main.js');
// let app = new Application({
//   path: electronPath,
//   args: [
//     appPath,
//     '--workspace-file',
//     workspaceFilePath
//   ]
// });
// app.start();
const {SocketRequest} = require('../scripts/renderer/socket-request.js');
const parts = [
  // After processing status line
  Buffer.from([67, 111, 110, 116, 101, 110, 116, 45, 84, 121, 112, 101,
    58, 32, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110,
    47, 106, 115, 111, 110, 13, 10, 67, 111, 110, 116, 101, 110,
    116, 45, 76, 101, 110, 103, 116, 104, 58, 32, 49, 49, 52,
    13, 10]),
    Buffer.from([83,101,114,118,101,114,58,32,87,101,114,107,122,101,117,103,47,48,46,49,52,46,49,32,80,121,116,104,111,110,47,50,46,55,46,49,52,13,10,68,97,116,101,58,32,84,104,117,44,32,50,49,32,74,117,110,32,50,48,49,56,32,49,56,58,51,48,58,53,49,32,71,77,84,13,10,13,10,123,34,105,110,115,116,114,117,109,101,110,116,95,105,100,34,58,32,50,52,49,56,54,44,32,34,117,115,101,114,95,105,100,34,58,32,53,57,44,32,34,112,114,111,100,117,99,116,95,105,100,34,58,32,51,50,54,57,44,32,34,112,114,105,99,101,34,58,32,50,46,48,44,32,34,115,105,100,101,34,58,32,34,83,101,108,108,34,44,32,34,105,100,34,58,32,50,44,32,34,113,117,97,110,116,105,116,121,34,58,32,48,125,10])
];
const requests = [{
  url: `http://localhost:8080/api/endpoint?query=param`,
  method: 'GET',
  headers: 'Host: test.com\nContent-Length: 0',
  payload: 'abc'
}];

const opts = [{
  timeout: 50000,
  followRedirects: false,
  hosts: [{
    from: 'domain.com',
    to: 'test.com'
  }]
}];
const request = new SocketRequest(requests[0], opts[0]);
request._processHeaders(parts[0]);
debugger;
request._processHeaders(parts[1]);
