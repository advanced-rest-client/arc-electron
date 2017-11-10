const net = require('net');
const client = net.createConnection(80, 'httpbin.org', {}, () => {
  client.on('data', (data) => {
    console.log('Received');
    console.log(data.toString('utf8'));
  });
  client.on('end', () => {
    console.log('Socket end');
  });
  client.on('error', (err) => {
    console.log('Socket error', err);
  });
  var message = 'PUT /anything HTTP/1.1\r\n';
  message += 'HOST: httpbin.org\r\n';
  message += 'content-type: application/json\r\n';
  message += 'content-length: 16\r\n';
  message += '\r\n';
  message += '{\r\n';
  message += '  "a": "b"\r\n';
  message += '}\r\n\r\n';
  const buffer = Buffer.from(message, 'utf8');
  client.write(buffer, () => {
    client.end();
    console.log('Socket written');
  });
});
client.once('error', function(err) {
  console.error('client error', err);
});
