// Simple performance monitoring middleware (no external dependencies)

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Store original send methods to intercept them
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  // Override send methods to add timing header before sending
  res.send = function(data) {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Only log slow requests (over 1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Only log slow requests (over 1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    return originalJson.call(this, data);
  };
  
  res.end = function(data) {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Only log slow requests (over 1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    return originalEnd.call(this, data);
  };
  
  next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  if (req.path === '/health') {
    const memUsage = process.memoryUsage();
    const memInfo = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    };
    
    // Log memory usage much less frequently (1% of 1% = 0.01%)
    if (Math.random() < 0.0001) {
      console.log('💾 Memory usage:', memInfo);
    }
    
    // Add memory info to health check
    req.memoryInfo = memInfo;
  }
  
  next();
};

// Request counting
let requestCount = 0;
let startTime = Date.now();

const requestCounter = (req, res, next) => {
  requestCount++;
  
  // Log stats every 1000 requests (less frequent)
  if (requestCount % 1000 === 0) {
    const uptime = Date.now() - startTime;
    const requestsPerSecond = (requestCount / (uptime / 1000)).toFixed(2);
    console.log(`📊 Stats: ${requestCount} requests, ${requestsPerSecond} req/s, uptime: ${Math.round(uptime / 1000)}s`);
  }
  
  next();
};

// Cache hit rate monitoring
const cacheMonitor = (req, res, next) => {
  // This will be enhanced when we add caching
  next();
};

// Error rate monitoring
let errorCount = 0;
let totalRequests = 0;

const errorMonitor = (req, res, next) => {
  totalRequests++;
  
  // Monitor response status
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      errorCount++;
      const errorRate = ((errorCount / totalRequests) * 100).toFixed(2);
      
      if (res.statusCode >= 500) {
        console.error(`❌ Server error: ${res.statusCode} ${req.method} ${req.originalUrl}`);
      } else {
        console.warn(`⚠️  Client error: ${res.statusCode} ${req.method} ${req.originalUrl}`);
      }
      
      // Log error rate every 50 errors
      if (errorCount % 50 === 0) {
        console.error(`🚨 Error rate: ${errorRate}% (${errorCount}/${totalRequests})`);
      }
    }
  });
  
  next();
};

// Performance stats endpoint
const getPerformanceStats = (req, res) => {
  const uptime = Date.now() - startTime;
  const requestsPerSecond = (requestCount / (uptime / 1000)).toFixed(2);
  const errorRate = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : 0;
  
  const stats = {
    uptime: `${Math.round(uptime / 1000)}s`,
    totalRequests: requestCount,
    requestsPerSecond,
    errorCount,
    errorRate: `${errorRate}%`,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  res.json(stats);
};

module.exports = {
  performanceMonitor,
  memoryMonitor,
  requestCounter,
  cacheMonitor,
  errorMonitor,
  getPerformanceStats
};
