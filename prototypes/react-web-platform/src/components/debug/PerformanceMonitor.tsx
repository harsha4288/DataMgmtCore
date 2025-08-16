import React, { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  themeSwitchTime: number;
  lastThemeSwitch: number;
  averageThemeSwitch: number;
  totalSwitches: number;
  bundleSize: number;
  tokenCount: number;
  currentTheme: string;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function PerformanceMonitor({ 
  enabled = true, 
  showDetails = false,
  className = ''
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    themeSwitchTime: 0,
    lastThemeSwitch: 0,
    averageThemeSwitch: 0,
    totalSwitches: 0,
    bundleSize: 0,
    tokenCount: 0,
    currentTheme: 'light'
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Track theme switching performance
  const measureThemeSwitch = useCallback(() => {
    if (!enabled) return;

    const startTime = performance.now();
    
    // Mark the start of theme switch
    performance.mark('theme-switch-start');
    
    // Wait for next frame to measure DOM changes
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      // Mark the end and measure
      performance.mark('theme-switch-end');
      performance.measure('theme-switch-duration', 'theme-switch-start', 'theme-switch-end');
      
      // Get the actual measurement
      const measurements = performance.getEntriesByName('theme-switch-duration');
      const actualSwitchTime = measurements.length > 0 ? measurements[measurements.length - 1].duration : switchTime;
      
      setMetrics(prev => {
        const newTotal = prev.totalSwitches + 1;
        const newAverage = ((prev.averageThemeSwitch * prev.totalSwitches) + actualSwitchTime) / newTotal;
        
        return {
          ...prev,
          lastThemeSwitch: actualSwitchTime,
          averageThemeSwitch: newAverage,
          totalSwitches: newTotal,
          themeSwitchTime: actualSwitchTime
        };
      });

      // Clean up performance entries
      performance.clearMarks('theme-switch-start');
      performance.clearMarks('theme-switch-end');
      performance.clearMeasures('theme-switch-duration');
    });
  }, [enabled]);

  // Monitor theme changes
  useEffect(() => {
    if (!enabled) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = (mutation.target as HTMLElement).getAttribute('data-theme') || 'light';
          setMetrics(prev => ({ ...prev, currentTheme: newTheme }));
          measureThemeSwitch();
        }
      });
    });

    // Observe theme changes on document element
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Initial theme detection
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setMetrics(prev => ({ ...prev, currentTheme: initialTheme }));

    return () => observer.disconnect();
  }, [enabled, measureThemeSwitch]);

  // Get bundle size and token metrics
  useEffect(() => {
    if (!enabled) return;

    const updateBundleMetrics = async () => {
      try {
        // Estimate CSS bundle size from stylesheets
        let totalSize = 0;
        let tokenCount = 0;
        
        Array.from(document.styleSheets).forEach(sheet => {
          try {
            Array.from(sheet.cssRules || []).forEach(rule => {
              if (rule.cssText) {
                totalSize += rule.cssText.length;
                // Count CSS custom properties (tokens)
                const tokenMatches = rule.cssText.match(/var\(--[^)]+\)/g);
                if (tokenMatches) {
                  tokenCount += tokenMatches.length;
                }
              }
            });
          } catch (e) {
            // Cross-origin stylesheets may throw errors, ignore them
          }
        });

        setMetrics(prev => ({
          ...prev,
          bundleSize: Math.round(totalSize / 1024), // Convert to KB
          tokenCount
        }));
      } catch (error) {
        console.warn('Could not measure bundle metrics:', error);
      }
    };

    updateBundleMetrics();
    
    // Update metrics every 30 seconds
    const interval = setInterval(updateBundleMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [enabled]);

  // Toggle monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  // Reset metrics
  const resetMetrics = () => {
    setMetrics(prev => ({
      ...prev,
      lastThemeSwitch: 0,
      averageThemeSwitch: 0,
      totalSwitches: 0,
      themeSwitchTime: 0
    }));
  };

  // Get performance status
  const getPerformanceStatus = () => {
    if (metrics.lastThemeSwitch === 0) return { status: 'none', color: 'text-gray-500' };
    if (metrics.lastThemeSwitch < 50) return { status: 'excellent', color: 'text-green-600' };
    if (metrics.lastThemeSwitch < 75) return { status: 'good', color: 'text-yellow-600' };
    return { status: 'needs improvement', color: 'text-red-600' };
  };

  if (!enabled) return null;

  const perfStatus = getPerformanceStatus();

  return (
    <div className={`performance-monitor ${className}`}>
      {showDetails ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              🎯 Performance Monitor
            </h3>
            <div className="flex gap-2">
              <button
                onClick={toggleMonitoring}
                className={`px-2 py-1 text-xs rounded ${
                  isMonitoring 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isMonitoring ? 'Stop' : 'Start'}
              </button>
              <button
                onClick={resetMetrics}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
              >
                Reset
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Current Theme</div>
              <div className="font-mono font-medium">{metrics.currentTheme}</div>
            </div>
            
            <div>
              <div className="text-gray-600 dark:text-gray-400">Last Switch</div>
              <div className={`font-mono font-medium ${perfStatus.color}`}>
                {metrics.lastThemeSwitch > 0 ? `${metrics.lastThemeSwitch.toFixed(1)}ms` : '--'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-600 dark:text-gray-400">Average Switch</div>
              <div className="font-mono font-medium">
                {metrics.averageThemeSwitch > 0 ? `${metrics.averageThemeSwitch.toFixed(1)}ms` : '--'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-600 dark:text-gray-400">Total Switches</div>
              <div className="font-mono font-medium">{metrics.totalSwitches}</div>
            </div>
            
            <div>
              <div className="text-gray-600 dark:text-gray-400">Bundle Size</div>
              <div className="font-mono font-medium">{metrics.bundleSize}KB</div>
            </div>
            
            <div>
              <div className="text-gray-600 dark:text-gray-400">Token Usage</div>
              <div className="font-mono font-medium">{metrics.tokenCount}</div>
            </div>
          </div>
          
          {metrics.lastThemeSwitch > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Performance Status</div>
              <div className={`text-xs font-medium ${perfStatus.color}`}>
                {perfStatus.status} {metrics.lastThemeSwitch < 50 ? '✅' : metrics.lastThemeSwitch < 75 ? '⚠️' : '❌'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: &lt;50ms • Current: {metrics.lastThemeSwitch.toFixed(1)}ms
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <span>Theme Switch:</span>
          <span className={`font-mono ${perfStatus.color}`}>
            {metrics.lastThemeSwitch > 0 ? `${metrics.lastThemeSwitch.toFixed(1)}ms` : '--'}
          </span>
          {metrics.lastThemeSwitch > 0 && (
            <span>{metrics.lastThemeSwitch < 50 ? '✅' : metrics.lastThemeSwitch < 75 ? '⚠️' : '❌'}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default PerformanceMonitor;