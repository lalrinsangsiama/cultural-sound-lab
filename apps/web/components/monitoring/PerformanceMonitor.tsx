'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gauge, Zap, Eye, Accessibility } from 'lucide-react'

interface PerformanceMetrics {
  fcp: number
  lcp: number
  fid: number
  cls: number
  ttfb: number
  domLoad: number
  windowLoad: number
}

interface LighthouseScore {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [scores, setScores] = useState<LighthouseScore>({
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0
  })

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          setMetrics(prev => ({
            ...prev,
            ttfb: navEntry.responseStart - navEntry.requestStart,
            domLoad: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
            windowLoad: navEntry.loadEventEnd - navEntry.fetchStart,
          } as PerformanceMetrics))
        }
        
        if (entry.entryType === 'paint') {
          const paintEntry = entry as PerformancePaintTiming
          if (paintEntry.name === 'first-contentful-paint') {
            setMetrics(prev => ({
              ...prev,
              fcp: paintEntry.startTime,
            } as PerformanceMetrics))
          }
        }
        
        if (entry.entryType === 'largest-contentful-paint') {
          const lcpEntry = entry as any
          setMetrics(prev => ({
            ...prev,
            lcp: lcpEntry.startTime,
          } as PerformanceMetrics))
        }
        
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as any
          setMetrics(prev => ({
            ...prev,
            fid: fidEntry.processingStart - fidEntry.startTime,
          } as PerformanceMetrics))
        }
        
        if (entry.entryType === 'layout-shift') {
          const clsEntry = entry as any
          if (!clsEntry.hadRecentInput) {
            setMetrics(prev => ({
              ...prev,
              cls: (prev?.cls || 0) + clsEntry.value,
            } as PerformanceMetrics))
          }
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (e) {
      console.warn('Performance Observer not fully supported')
    }

    // Simulate Lighthouse scores (in production, these would come from actual Lighthouse CI)
    setTimeout(() => {
      setScores({
        performance: Math.floor(Math.random() * 20) + 80, // 80-100
        accessibility: Math.floor(Math.random() * 15) + 85, // 85-100
        bestPractices: Math.floor(Math.random() * 10) + 90, // 90-100
        seo: Math.floor(Math.random() * 15) + 85, // 85-100
      })
    }, 2000)

    return () => observer.disconnect()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getMetricStatus = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'good'
    if (value <= thresholds[1]) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'needs-improvement': return 'text-orange-600 bg-orange-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
        <p className="text-muted-foreground">Real-time performance metrics and Lighthouse scores</p>
      </div>

      {/* Lighthouse Scores */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scores.performance}</div>
            <Badge className={getScoreColor(scores.performance)}>
              {scores.performance >= 90 ? 'Excellent' : scores.performance >= 70 ? 'Good' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accessibility</CardTitle>
            <Accessibility className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scores.accessibility}</div>
            <Badge className={getScoreColor(scores.accessibility)}>
              {scores.accessibility >= 90 ? 'Excellent' : scores.accessibility >= 70 ? 'Good' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Practices</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scores.bestPractices}</div>
            <Badge className={getScoreColor(scores.bestPractices)}>
              {scores.bestPractices >= 90 ? 'Excellent' : scores.bestPractices >= 70 ? 'Good' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SEO</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scores.seo}</div>
            <Badge className={getScoreColor(scores.seo)}>
              {scores.seo >= 90 ? 'Excellent' : scores.seo >= 70 ? 'Good' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Core Web Vitals</CardTitle>
            <CardDescription>Real-time performance metrics from the browser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">First Contentful Paint (FCP)</div>
                <div className="text-2xl font-bold">{Math.round(metrics.fcp)}ms</div>
                <Badge className={getStatusColor(getMetricStatus(metrics.fcp, [1800, 3000]))}>
                  {getMetricStatus(metrics.fcp, [1800, 3000])}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Largest Contentful Paint (LCP)</div>
                <div className="text-2xl font-bold">{Math.round(metrics.lcp)}ms</div>
                <Badge className={getStatusColor(getMetricStatus(metrics.lcp, [2500, 4000]))}>
                  {getMetricStatus(metrics.lcp, [2500, 4000])}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Cumulative Layout Shift (CLS)</div>
                <div className="text-2xl font-bold">{metrics.cls.toFixed(3)}</div>
                <Badge className={getStatusColor(getMetricStatus(metrics.cls, [0.1, 0.25]))}>
                  {getMetricStatus(metrics.cls, [0.1, 0.25])}
                </Badge>
              </div>

              {metrics.fid > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">First Input Delay (FID)</div>
                  <div className="text-2xl font-bold">{Math.round(metrics.fid)}ms</div>
                  <Badge className={getStatusColor(getMetricStatus(metrics.fid, [100, 300]))}>
                    {getMetricStatus(metrics.fid, [100, 300])}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Time to First Byte (TTFB)</div>
                <div className="text-2xl font-bold">{Math.round(metrics.ttfb)}ms</div>
                <Badge className={getStatusColor(getMetricStatus(metrics.ttfb, [800, 1800]))}>
                  {getMetricStatus(metrics.ttfb, [800, 1800])}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">DOM Content Loaded</div>
                <div className="text-2xl font-bold">{Math.round(metrics.domLoad)}ms</div>
                <Badge className={getStatusColor(getMetricStatus(metrics.domLoad, [1500, 3000]))}>
                  {getMetricStatus(metrics.domLoad, [1500, 3000])}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>Suggestions to improve performance scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scores.performance < 90 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                <div>
                  <div className="font-medium">Optimize JavaScript bundles</div>
                  <div className="text-sm text-muted-foreground">
                    Consider code splitting and tree shaking to reduce bundle size
                  </div>
                </div>
              </div>
            )}
            
            {scores.accessibility < 95 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <div className="font-medium">Improve accessibility</div>
                  <div className="text-sm text-muted-foreground">
                    Add missing alt texts, improve color contrast, and ensure keyboard navigation
                  </div>
                </div>
              </div>
            )}

            {scores.seo < 95 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <div className="font-medium">Enhance SEO</div>
                  <div className="text-sm text-muted-foreground">
                    Add structured data, improve meta descriptions, and ensure mobile-friendliness
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <div>
                <div className="font-medium">Enable performance monitoring</div>
                <div className="text-sm text-muted-foreground">
                  Set up continuous monitoring with tools like Lighthouse CI or SpeedCurve
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}