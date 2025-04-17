const Redis = require('redis');
const { promisify } = require('util');

// Connect to Redis
const redisClient = Redis.createClient(process.env.REDIS_URL);

// Promisify Redis methods
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

// Handle connection errors
redisClient.on('error', (error) => {
  console.error('Redis client error:', error);
});

// Cache middleware
const cacheMiddleware = (ttl = 60) => {
  return async (req, res, next) => {
    try {
      const key = `bazuu:${req.originalUrl}`;
      const cachedData = await getAsync(key);
      
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
      
      // Store the original send function
      const originalSend = res.send;
      
      // Override the send function to cache responses
      res.send = function(data) {
        setAsync(key, JSON.stringify(data), 'EX', ttl);
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching
    }
  };
};

module.exports = {
  redisClient,
  getAsync,
  setAsync,
  cacheMiddleware
};