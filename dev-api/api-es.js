import express from 'express';
import session from 'express-session';
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

const portStr = process.argv.slice(2).find((arg) => arg.indexOf('--PORT') === 0);
let port;
if (!isNaN(portStr)) {
  port = Number(portStr);
} else {
  port = 8080;
}

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use((err, req, res) => {
  console.error(err.response);
  res.status(500).send({
    error: true,
    message: err.response || 'Something is wrong...'
  });
});

const server = app.listen(port, () => {
  const port = server.address().port;
  console.info(`App listening on port ${port}`);
});
