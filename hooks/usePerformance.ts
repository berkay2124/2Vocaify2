/**
 * Performance Monitoring Hook
 * Track component render performance and user interactions
 */

"use client";

import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = Date.now();
    renderCount.current += 1;

    logger.debug(`${componentName} mounted`, {
      component: componentName,
      renderCount: renderCount.current,
    });

    return () => {
      const lifetime = Date.now() - mountTime.current;
      logger.debug(`${componentName} unmounted`, {
        component: componentName,
        lifetime,
        renderCount: renderCount.current,
      });
    };
  }, [componentName]);

  const measureAction = useCallback(
    async <T,>(actionName: string, action: () => Promise<T> | T): Promise<T> => {
      const start = Date.now();
      try {
        const result = await action();
        const duration = Date.now() - start;
        logger.performance(`${componentName}.${actionName}`, duration, {
          component: componentName,
          action: actionName,
        });
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(`${componentName}.${actionName} failed`, error as Error, {
          component: componentName,
          action: actionName,
          duration,
        });
        throw error;
      }
    },
    [componentName]
  );

  return { measureAction, renderCount: renderCount.current };
}

export function usePageLoadPerformance(pageName: string) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        const metrics = {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          domInteractive: perfData.domInteractive - perfData.fetchStart,
          ttfb: perfData.responseStart - perfData.requestStart,
        };

        logger.performance(`Page load: ${pageName}`, metrics.loadComplete, {
          page: pageName,
          metrics,
        });
      }
    }
  }, [pageName]);
}
