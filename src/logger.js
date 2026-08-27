const crypto = require('crypto');
const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

function formatLog(level, msg, meta = {}) {
  const store = asyncLocalStorage.getStore() || {};
  
  let errorDetails = {};
  if (meta.err instanceof Error) {
    errorDetails = {
      err: {
        message: meta.err.message,
        name: meta.err.name,
      }
    };
    delete meta.err;
  }

  const logObj = {
    ts: new Date().toISOString(),
    level,
    service: 'orders-api',
    msg: typeof msg === 'string' ? msg : JSON.stringify(msg),
  };

  const reqId = meta.reqId || store.reqId;
  if (reqId) {
    logObj.reqId = reqId;
  }

  // Safely assign metadata
  Object.assign(logObj, meta, errorDetails);

  return JSON.stringify(logObj);
}

const logger = {
  info(msg, meta) {
    process.stdout.write(formatLog('info', msg, meta) + '\n');
  },
  warn(msg, meta) {
    process.stdout.write(formatLog('warn', msg, meta) + '\n');
  },
  error(msg, meta) {
    process.stdout.write(formatLog('error', msg, meta) + '\n');
  },
  debug(msg, meta) {
    process.stdout.write(formatLog('debug', msg, meta) + '\n');
  },
  child(extraContext = {}) {
    return {
      info: (msg, meta) => logger.info(msg, { ...extraContext, ...meta }),
      warn: (msg, meta) => logger.warn(msg, { ...extraContext, ...meta }),
      error: (msg, meta) => logger.error(msg, { ...extraContext, ...meta }),
      debug: (msg, meta) => logger.debug(msg, { ...extraContext, ...meta }),
    };
  }
};

const requestLoggerMiddleware = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = reqId;
  req.log = logger.child({ reqId });

  const start = Date.now();

  asyncLocalStorage.run({ reqId }, () => {
    logger.info('http.request.received', {
      method: req.method,
      path: req.originalUrl || req.path,
    });

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      logger[level]('http.request.completed', {
        method: req.method,
        path: req.originalUrl || req.path,
        statusCode: res.statusCode,
        durationMs,
      });
    });

    next();
  });
};

module.exports = {
  logger,
  requestLoggerMiddleware,
  asyncLocalStorage,
};
