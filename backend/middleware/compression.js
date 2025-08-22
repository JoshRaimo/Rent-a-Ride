// Built-in compression middleware using Node.js zlib (no external dependencies)
const zlib = require('zlib');

// Compression middleware
const compression = (req, res, next) => {
  // Skip compression for small responses
  const shouldCompress = (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress if response is already compressed
    if (res.getHeader('content-encoding')) {
      return false;
    }
    
    // Don't compress if response is too small
    const contentLength = res.getHeader('content-length');
    if (contentLength && parseInt(contentLength) < 1024) {
      return false;
    }
    
    return true;
  };

  // Check if compression should be applied
  if (!shouldCompress(req, res)) {
    return next();
  }

  // Check what compression the client supports
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Determine best compression method
  let compressionMethod = null;
  if (acceptEncoding.includes('br')) {
    compressionMethod = 'br';
  } else if (acceptEncoding.includes('gzip')) {
    compressionMethod = 'gzip';
  } else if (acceptEncoding.includes('deflate')) {
    compressionMethod = 'deflate';
  }

  if (!compressionMethod) {
    return next();
  }

  // Store original methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  // Override res.send
  res.send = function(data) {
    if (typeof data === 'string' || Buffer.isBuffer(data)) {
      compressAndSend(data, 'text/plain');
    } else {
      originalSend.call(this, data);
    }
  };

  // Override res.json
  res.json = function(data) {
    const jsonString = JSON.stringify(data);
    compressAndSend(jsonString, 'application/json');
  };

  // Override res.end
  res.end = function(data) {
    if (data) {
      compressAndSend(data, 'text/plain');
    } else {
      originalEnd.call(this);
    }
  };

  // Compression function
  const compressAndSend = (data, contentType) => {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    // Set content type
    res.setHeader('Content-Type', contentType);
    
    // Compress based on method
    let compressedData;
    let encoding;
    
    try {
      switch (compressionMethod) {
        case 'br':
          compressedData = zlib.brotliCompressSync(input, { level: 6 });
          encoding = 'br';
          break;
        case 'gzip':
          compressedData = zlib.gzipSync(input, { level: 6 });
          encoding = 'gzip';
          break;
        case 'deflate':
          compressedData = zlib.deflateSync(input, { level: 6 });
          encoding = 'deflate';
          break;
        default:
          compressedData = input;
          encoding = null;
      }
      
      // Set compression headers
      if (encoding) {
        res.setHeader('Content-Encoding', encoding);
        res.setHeader('Content-Length', compressedData.length);
        res.setHeader('Vary', 'Accept-Encoding');
      }
      
      // Send compressed response
      originalEnd.call(res, compressedData);
      
    } catch (error) {
      console.error('Compression error:', error);
      // Fallback to uncompressed
      res.setHeader('Content-Length', input.length);
      originalEnd.call(res, input);
    }
  };

  next();
};

module.exports = compression;
