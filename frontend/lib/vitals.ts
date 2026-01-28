import { Metric } from 'web-vitals'

/**
 * Web Vitals tracking and reporting
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB, INP
 */

export interface VitalsData {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
}

// Thresholds for rating (based on web.dev recommendations)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Report Web Vitals to analytics service
 */
export function reportWebVitals(metric: Metric) {
  const vitalsData: VitalsData = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    navigationType: metric.navigationType,
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: Math.round(metric.value),
      rating: vitalsData.rating,
      navigationType: metric.navigationType,
    })
  }

  // Send to analytics service (Google Analytics, Vercel Analytics, etc.)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: vitalsData.rating,
    })
  }

  // Send to custom analytics endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    sendToAnalytics(vitalsData)
  }
}

/**
 * Send vitals data to custom analytics endpoint
 */
async function sendToAnalytics(data: VitalsData) {
  try {
    await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }),
    })
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.error('Failed to send vitals:', error)
  }
}

/**
 * Performance marks for custom measurements
 */
export const performanceMark = {
  start: (name: string) => {
    if (typeof window !== 'undefined' && typeof window.performance?.mark === 'function') {
      performance.mark(`${name}-start`)
    }
  },
  
  end: (name: string) => {
    if (typeof window !== 'undefined' && typeof window.performance?.mark === 'function') {
      performance.mark(`${name}-end`)
      
      try {
        performance.measure(name, `${name}-start`, `${name}-end`)
        const measure = performance.getEntriesByName(name)[0]
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${name}:`, Math.round(measure.duration), 'ms')
        }
        
        // Clean up marks
        performance.clearMarks(`${name}-start`)
        performance.clearMarks(`${name}-end`)
        performance.clearMeasures(name)
      } catch (error) {
        console.error('Performance measure error:', error)
      }
    }
  },
}

/**
 * Track custom events
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, any>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventData)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Event] ${eventName}:`, eventData)
  }
}

/**
 * Track page views
 */
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: url,
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Page View] ${url}`)
  }
}

// Type augmentation for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}
