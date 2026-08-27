const { Pool } = require('pg');
const { logger } = require('./logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'ordersdb',
  port: process.env.DB_PORT || 5432,
});

const connectDb = async () => {
  logger.info('db.connecting', { host: process.env.DB_HOST || 'localhost' });
  try {
    await pool.query('SELECT NOW()');
    logger.info('db.connected');
  } catch (err) {
    logger.error('db.connection_failed', { err });
    logger.warn('db.retry_connection');
  }
};

const queryDb = async (text, params) => {
  const start = Date.now();
  logger.debug('db.query.start', { query: text });
  try {
    const res = await pool.query(text, params);
    const durationMs = Date.now() - start;
    logger.info('db.query.completed', { query: text, rowCount: res.rowCount, durationMs });
    return res;
  } catch (err) {
    logger.error('db.query.error', { query: text, err });
    throw err;
  }
};

module.exports = { connectDb, queryDb, pool };
