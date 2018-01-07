const http = require('http');

const Chance = require('chance');
const chance = new Chance();

var srv;

function writeChunk(res) {
  res.write(chance.paragraph() + '\n');
}

function writeChunkedResponse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Transfer-Encoding': 'chunked'
  });
  writeChunk(res);
  var time = 0;
  for (var i = 0; i < 4; i++) {
    let timeout = chance.integer({min: 1, max: 10});
    time += timeout;
    setTimeout(writeChunk.bind(this, res), timeout);
  }
  time += 5;
  setTimeout(function() {
    res.end('END');
  }, time);
}

function connectedCallback(req, res) {
  writeChunkedResponse(res);
  console.log('Responding to a request.');
}

srv = http.createServer(connectedCallback);
srv.listen(8123);
