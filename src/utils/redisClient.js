const { createClient } = require('redis');
const logger = require('./logger');
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

(async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.error('Error connecting to Redis:', err);
  }
})();

module.exports = redisClient;