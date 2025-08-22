// Simple frontend performance utilities (no external dependencies)

// Performance monitoring class
class SimplePerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.startTime = performance.now();
  }

  // Start timing an operation
  startTimer(name) {
    this.metrics[name] = {
      startTime: performance.now(),
      endTime: null,
      duration: null
    };
  }

  // End timing an operation
  endTimer(name) {
    if (this.metrics[name]) {
      this.metrics[name].endTime = performance.now();
      this.metrics[name].duration = this.metrics[name].endTime - this.metrics[name].startTime;
      
      // Only log very slow operations (over 2 seconds)
      if (this.metrics[name].duration > 2000) {
        console.warn(`🐌 Very slow operation: ${name} took ${this.metrics[name].duration.toFixed(2)}ms`);
      }
      
      return this.metrics[name].duration;
    }
    return null;
  }

  // Monitor API call performance
  monitorApiCall(url, method = 'GET') {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        
        // Only log very slow API calls (over 3 seconds)
        if (duration > 3000) {
          console.warn(`🐌 Very slow API call: ${method} ${url} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    };
  }

  // Monitor component render performance
  monitorComponentRender(componentName) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        
        // Only log very slow renders (over 500ms)
        if (duration > 500) {
          console.warn(`🐌 Very slow component render: ${componentName} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    };
  }

  // Monitor page load performance
  monitorPageLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const loadTime = performance.now() - this.startTime;
          
          // Only log very slow page loads (over 5 seconds)
          if (loadTime > 5000) {
            console.warn(`🐌 Very slow page load: ${loadTime.toFixed(2)}ms`);
          }
        }, 0);
      });
    }
  }

  // Get performance metrics
  getMetrics() {
    return this.metrics;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {};
  }

  // Get overall performance score
  getPerformanceScore() {
    const entries = Object.values(this.metrics);
    if (entries.length === 0) return 100;

    const totalDuration = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const averageDuration = totalDuration / entries.length;
    
    // Score based on average duration (lower is better)
    if (averageDuration < 100) return 100;
    if (averageDuration < 500) return 90;
    if (averageDuration < 1000) return 75;
    if (averageDuration < 2000) return 50;
    return 25;
  }
}

// Global performance monitor instance
export const performanceMonitor = new SimplePerformanceMonitor();

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  // Monitor page load
  performanceMonitor.monitorPageLoad();
  
  // Monitor memory usage (if available)
  if (typeof window !== 'undefined' && 'memory' in performance) {
    setInterval(() => {
      const memory = performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
      
      // Only warn for very high memory usage (over 200MB)
      if (parseFloat(usedMB) > 200) {
        console.warn(`💾 Very high memory usage: ${usedMB}MB / ${totalMB}MB`);
      }
    }, 30000); // Every 30 seconds
  }
}

// React performance monitoring HOC
export function withPerformanceMonitoring(WrappedComponent, componentName) {
  return function PerformanceMonitoredComponent(props) {
    const timer = performanceMonitor.monitorComponentRender(componentName);
    
    React.useEffect(() => {
      timer.end();
    });
    
    return <WrappedComponent {...props} />;
  };
}

// API performance monitoring wrapper
export function monitorApiCall(apiFunction, url, method = 'GET') {
  return async (...args) => {
    const monitor = performanceMonitor.monitorApiCall(url, method);
    try {
      const result = await apiFunction(...args);
      monitor.end();
      return result;
    } catch (error) {
      monitor.end();
      throw error;
    }
  };
}

// Debounce utility for performance
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for performance
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
