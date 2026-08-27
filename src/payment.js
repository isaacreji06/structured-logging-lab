const { logger } = require('./logger');

const processPayment = () => {
  logger.info('payment.processing.started');
  // Simulate some payment processing
  setTimeout(() => {
    logger.info('payment.processing.completed');
  }, 500);
};

module.exports = { processPayment };
