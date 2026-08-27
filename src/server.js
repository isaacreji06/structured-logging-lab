const express = require('express');
const { connectDb } = require('./db');
const ordersRouter = require('./routes/orders');
const { processPayment } = require('./payment');
const { logger, requestLoggerMiddleware } = require('./logger');

const app = express();
const port = 3000;

logger.info('server.starting');

app.use(express.json());
app.use(requestLoggerMiddleware);

connectDb();

app.get('/', (req, res) => {
  logger.info('health_check.success');
  res.send('Orders API is running');
});

app.use('/orders', ordersRouter);

app.post('/payments', (req, res) => {
  logger.info('payment.process.start');
  processPayment();
  res.send('Payment processed');
});

app.get('/simulate-error', (req, res) => {
  logger.error('error.simulated', { err: new Error('Simulated failure endpoint called') });
  res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
  logger.info('server.listening', { port });
});
