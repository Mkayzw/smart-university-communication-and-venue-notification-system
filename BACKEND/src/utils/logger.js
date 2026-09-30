const shouldLogHttp =
  process.env.HTTP_LOGGING === 'true' ||
  process.env.NODE_ENV === 'development';

const logger = (req, res, next) => {
  if (!shouldLogHttp) {
    return next();
  }

  const startedAt = process.hrtime.bigint();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(
      `[${timestamp}] ${method} ${url} - Status: ${res.statusCode} - ${durationMs.toFixed(1)}ms - IP: ${ip}`
    );
  });

  return next();
};

module.exports = logger;
