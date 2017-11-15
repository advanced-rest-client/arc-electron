const tls = require('tls');
const options = {
  rejectUnauthorized: false,
  requestCert: false,
  requestOCSP: false,
  minDHSize: 128,
  servername: 'splatoon2.ink',
  checkServerIdentity:  function() {
    console.log('checkServerIdentity');
  },
  // ciphers: 'ALL',
  // secureProtocol: 'TLSv1_2_client_method',
  // ecdhCurve: false
};
const client = tls.connect(443, 'splatoon2.ink', options, () => {
  console.log('CONNECTED');
});
client.once('error', function(e) {
  console.log('Cert', client.getPeerCertificate(true));
  console.log('authorizationError', client.authorizationError);
  console.log('ERROR', e);
});
client.once('secureConnect', () => {
  console.log('SECURE CONNECT');
});
