// Redis cache implementation
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

async function cacheMiddleware(req, res, next) {
  const key = `cache:${req.originalUrl}`;
  
  try {
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, 3600, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  } catch (error) {
    next();
  }
}

module.exports = { client, cacheMiddleware };
