// Simple in-memory caching middleware (no external dependencies)
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Set cache with TTL (time to live in milliseconds)
  set(key, value, ttl = 300000) { // Default 5 minutes
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set up automatic expiration
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  // Get cached value
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  // Delete cache entry
  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const cache = new SimpleCache();

// Cache middleware for Express routes
const cacheMiddleware = (duration = 300000) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key based on URL and query parameters
    const cacheKey = `cache:${req.originalUrl || req.url}`;
    
    // Try to get cached data
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    // If no cache, store the original send method
    const originalSend = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      // Cache the response data
      cache.set(cacheKey, data, duration);
      
      // Call the original send method
      return originalSend.call(this, data);
    };

    next();
  };
};

// Cache invalidation middleware
const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    // Store original send method
    const originalSend = res.json;
    
    // Override res.json to invalidate cache after successful response
    res.json = function(data) {
      try {
        // Invalidate cache patterns
        patterns.forEach(pattern => {
          const keys = Array.from(cache.cache.keys());
          keys.forEach(key => {
            if (key.includes(pattern)) {
              cache.delete(key);
            }
          });
        });
      } catch (error) {
        console.error('Cache invalidation error:', error);
      }
      
      // Call the original send method
      return originalSend.call(this, data);
    };

    next();
  };
};

// Pre-configured cache durations
const cacheAvailableCars = cacheMiddleware(300000); // 5 minutes
const cacheCarDetails = cacheMiddleware(600000); // 10 minutes
const cacheUserData = cacheMiddleware(1800000); // 30 minutes
const cacheStats = cacheMiddleware(3600000); // 1 hour
const cacheYearRange = cacheMiddleware(86400000); // 24 hours
const cachePriceRange = cacheMiddleware(3600000); // 1 hour

// Cache management routes (for debugging)
const cacheRoutes = (router) => {
  // Get cache stats
  router.get('/cache/stats', (req, res) => {
    res.json(cache.getStats());
  });

  // Clear all cache
  router.delete('/cache/clear', (req, res) => {
    cache.clear();
    res.json({ message: 'Cache cleared successfully' });
  });

  // Clear specific cache pattern
  router.delete('/cache/clear/:pattern', (req, res) => {
    const pattern = req.params.pattern;
    const keys = Array.from(cache.cache.keys());
    let clearedCount = 0;

    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
        clearedCount++;
      }
    });

    res.json({ 
      message: `Cleared ${clearedCount} cache entries for pattern: ${pattern}` 
    });
  });
};

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache,
  cacheAvailableCars,
  cacheCarDetails,
  cacheUserData,
  cacheStats,
  cacheYearRange,
  cachePriceRange,
  cacheRoutes
};
