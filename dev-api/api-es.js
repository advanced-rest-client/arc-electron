import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import apiRouter from './routes.js';
/* eslint-disable no-console */

const app = express();
export default app;

app.disable('etag');
app.disable('x-powered-by');
app.set('trust proxy', true);

const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: 'dev-secret',
  signed: true
};

app.use(session(sessionConfig));
app.use('/v1', apiRouter);

const findOpt = (name) => process.argv.slice(2).find((arg) => arg.indexOf(`--${name}`) === 0);
const findPortValue = (name, defaultValue) => {
  const str = findOpt(name);
  if (isNaN(str)) {
    return defaultValue;
  }
  return Number(str);
};

const port = findPortValue('PORT', 3080);
const portSsl = findPortValue('SSLPORT', 3443);


// Basic 404 handler
app.use((req, res) => {
  res.status(404).send({
    error: true,
    message: `Route ${req.url} not found`
  });
});

// Basic error handler
app.use((err, req, res) => {
  console.error(err.response);
  res.status(500).send({
    error: true,
    message: err.response || 'Something is wrong...'
  });
});

const options = {
  key: fs.readFileSync(path.join(__dirname, 'cc', 'server_key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cc', 'server_cert.pem')),
  requestCert: true,
  rejectUnauthorized: false,
  ca: [fs.readFileSync(path.join(__dirname, 'cc', 'server_cert.pem'))],
};

http.createServer(app).listen(port, () => {
  console.info(`HTTP listening on port ${port}`);
});
https.createServer(options, app).listen(portSsl, () => {
  console.info(`HTTPS listening on port ${portSsl}`);
});
