const express = require('express');
const router = express.Router();
const { queryDb } = require('../db');
const { logger } = require('../logger');

router.get('/', async (req, res) => {
  logger.info('orders.fetch.start');
  try {
    const result = await queryDb('SELECT * FROM orders', []);
    logger.info('orders.fetch.success', { count: result.rows.length });
    res.json(result.rows);
  } catch (err) {
    logger.error('orders.fetch.failed', { err });
    res.status(500).send('Error fetching orders');
  }
});

router.post('/', async (req, res) => {
  logger.info('orders.create.start');
  const { product_id, quantity, customer_id } = req.body;
  
  if (!product_id || !quantity || !customer_id) {
    logger.warn('orders.create.validation_failed', {
      reason: 'Missing required fields',
      providedFields: {
        product_id: Boolean(product_id),
        quantity: Boolean(quantity),
        customer_id: Boolean(customer_id)
      }
    });
    return res.status(400).send('Missing fields');
  }

  try {
    const result = await queryDb(
      'INSERT INTO orders (product_id, quantity, customer_id) VALUES ($1, $2, $3) RETURNING *',
      [product_id, quantity, customer_id]
    );
    const newOrder = result.rows[0];
    logger.info('orders.create.success', {
      orderId: newOrder.id,
      product_id: newOrder.product_id,
      customer_id: newOrder.customer_id
    });
    res.status(201).json(newOrder);
  } catch (err) {
    logger.error('orders.create.failed', { product_id, customer_id, err });
    res.status(500).send('Error creating order');
  }
});

module.exports = router;
