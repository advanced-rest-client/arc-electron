import express from 'express';
import statusCodesRoute from './status-codes.route.js';

/* eslint-disable no-console */

const router = express.Router();
export default router;

// Test scenarios for status codes
router.use('/status', statusCodesRoute);

// Errors
router.use((req, res) => {
  const message = `Route ${req.url} not found`;
  console.warn(message);
  res.status(404).send({
    error: true,
    message
  });
});

router.use((err, req, res) => {
  console.error(err);
  res.send({
    error: true,
    message: 'There was an error. That is all we can share.'
  });
});
