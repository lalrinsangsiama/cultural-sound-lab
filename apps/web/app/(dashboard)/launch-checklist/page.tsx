'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Circle, AlertTriangle, Target, Gauge, Shield, BarChart3, FileText, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PerformanceMonitor } from '@/components/monitoring/PerformanceMonitor'
import { SecurityAudit } from '@/components/monitoring/SecurityAudit'
import { AnalyticsSetup } from '@/components/analytics/AnalyticsSetup'
import { LegalCompliance } from '@/components/legal/LegalCompliance'
import { LaunchAssets } from '@/components/assets/LaunchAssets'

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  critical: boolean
  category: string
}

interface ChecklistCategory {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  items: ChecklistItem[]
}

export default function LaunchChecklistPage() {
  const [categories, setCategories] = useState<ChecklistCategory[]>([
    {
      id: 'seo',
      title: 'SEO Optimization',
      icon: Target,
      description: 'Search engine optimization and discoverability',
      items: [
        { id: 'meta-tags', title: 'Meta tags for all pages', description: 'Title, description, keywords for all routes', completed: false, critical: true, category: 'seo' },
        { id: 'og-images', title: 'OpenGraph images', description: 'Social media preview images for all pages', completed: false, critical: true, category: 'seo' },
        { id: 'structured-data', title: 'Structured data markup', description: 'JSON-LD schema for audio content and organization', completed: false, critical: false, category: 'seo' },
        { id: 'sitemap', title: 'Sitemap generation', description: 'XML sitemap for search engine crawling', completed: false, critical: true, category: 'seo' },
        { id: 'robots-txt', title: 'Robots.txt', description: 'Search engine crawling instructions', completed: false, critical: true, category: 'seo' },
      ]
    },
    {
      id: 'performance',
      title: 'Performance Audit',
      icon: Gauge,
      description: 'Speed, optimization, and user experience metrics',
      items: [
        { id: 'lighthouse-scores', title: 'Lighthouse scores > 90', description: 'Performance, accessibility, SEO, best practices', completed: false, critical: true, category: 'performance' },
        { id: 'bundle-size', title: 'Bundle size optimization', description: 'Code splitting and tree shaking implemented', completed: false, critical: true, category: 'performance' },
        { id: 'image-lazy-loading', title: 'Image lazy loading', description: 'Progressive image loading for all assets', completed: false, critical: false, category: 'performance' },
        { id: 'code-splitting', title: 'Route-based code splitting', description: 'Dynamic imports for heavy components', completed: false, critical: true, category: 'performance' },
        { id: 'cdn-config', title: 'CDN configuration', description: 'Asset delivery optimization setup', completed: false, critical: false, category: 'performance' },
      ]
    },
    {
      id: 'security',
      title: 'Security Hardening',
      icon: Shield,
      description: 'Protection against vulnerabilities and attacks',
      items: [
        { id: 'env-vars', title: 'Environment variables secured', description: 'No secrets in client-side code', completed: false, critical: true, category: 'security' },
        { id: 'rate-limiting', title: 'API rate limiting active', description: 'DDoS and abuse protection', completed: false, critical: true, category: 'security' },
        { id: 'cors-config', title: 'CORS properly configured', description: 'Cross-origin request restrictions', completed: false, critical: true, category: 'security' },
        { id: 'sql-injection', title: 'SQL injection prevention', description: 'Parameterized queries and ORM protection', completed: false, critical: true, category: 'security' },
        { id: 'xss-protection', title: 'XSS protection', description: 'Input sanitization and CSP headers', completed: false, critical: true, category: 'security' },
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics Setup',
      icon: BarChart3,
      description: 'Tracking, monitoring, and insights collection',
      items: [
        { id: 'google-analytics', title: 'Google Analytics 4', description: 'User behavior and traffic tracking', completed: false, critical: false, category: 'analytics' },
        { id: 'hotjar', title: 'Hotjar heatmaps', description: 'User interaction visualization', completed: false, critical: false, category: 'analytics' },
        { id: 'custom-events', title: 'Custom event tracking', description: 'Audio plays, generations, purchases', completed: false, critical: true, category: 'analytics' },
        { id: 'conversion-funnel', title: 'Conversion funnel tracking', description: 'Sign-up to purchase flow analytics', completed: false, critical: true, category: 'analytics' },
        { id: 'error-tracking', title: 'Error tracking', description: 'Application error monitoring and alerts', completed: false, critical: true, category: 'analytics' },
      ]
    },
    {
      id: 'legal',
      title: 'Legal Compliance',
      icon: FileText,
      description: 'Terms, privacy, and regulatory compliance',
      items: [
        { id: 'terms-of-service', title: 'Terms of Service', description: 'Legal terms and user agreements', completed: false, critical: true, category: 'legal' },
        { id: 'privacy-policy', title: 'Privacy Policy', description: 'Data collection and usage policies', completed: false, critical: true, category: 'legal' },
        { id: 'cookie-consent', title: 'Cookie consent', description: 'GDPR-compliant cookie management', completed: false, critical: true, category: 'legal' },
        { id: 'gdpr-compliance', title: 'GDPR compliance', description: 'Data protection and user rights', completed: false, critical: true, category: 'legal' },
        { id: 'attribution-requirements', title: 'Attribution requirements', description: 'Cultural content usage guidelines', completed: false, critical: true, category: 'legal' },
      ]
    },
    {
      id: 'assets',
      title: 'Launch Assets',
      icon: Palette,
      description: 'Brand materials and marketing content',
      items: [
        { id: 'logo-variations', title: 'Logo variations', description: 'Light, dark, and monochrome versions', completed: false, critical: false, category: 'assets' },
        { id: 'social-templates', title: 'Social media templates', description: 'Post templates for all platforms', completed: false, critical: false, category: 'assets' },
        { id: 'email-templates', title: 'Email templates', description: 'Welcome, notification, and marketing emails', completed: false, critical: false, category: 'assets' },
        { id: 'press-kit', title: 'Press kit', description: 'Media resources and company information', completed: false, critical: false, category: 'assets' },
        { id: 'demo-video', title: 'Demo video', description: 'Product demonstration and onboarding', completed: false, critical: true, category: 'assets' },
      ]
    }
  ])

  const toggleItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId 
        ? {
            ...category,
            items: category.items.map(item => 
              item.id === itemId 
                ? { ...item, completed: !item.completed }
                : item
            )
          }
        : category
    ))
  }

  const getCompletionStats = () => {
    const allItems = categories.flatMap(cat => cat.items)
    const totalItems = allItems.length
    const completedItems = allItems.filter(item => item.completed).length
    const criticalItems = allItems.filter(item => item.critical).length
    const completedCritical = allItems.filter(item => item.critical && item.completed).length
    
    return {
      overall: Math.round((completedItems / totalItems) * 100),
      critical: Math.round((completedCritical / criticalItems) * 100),
      totalItems,
      completedItems,
      criticalItems,
      completedCritical
    }
  }

  const stats = getCompletionStats()
  const isLaunchReady = stats.critical === 100 && stats.overall >= 80

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Launch Readiness Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Complete all critical items and 80% overall to be launch-ready
        </p>
      </div>

      {/* Overall Progress */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overall}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedItems} of {stats.totalItems} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCritical} of {stats.criticalItems} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Launch Status</CardTitle>
            <CheckCircle2 className={cn("h-4 w-4", isLaunchReady ? "text-green-600" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", isLaunchReady ? "text-green-600" : "text-orange-600")}>
              {isLaunchReady ? "Ready" : "Not Ready"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLaunchReady ? "All requirements met" : "Complete critical items"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Areas to review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Launch Progress</CardTitle>
          <CardDescription>Track your progress towards launch readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{stats.overall}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.overall}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>Critical Items</span>
              <span>{stats.critical}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn("h-2 rounded-full transition-all duration-300", 
                  stats.critical === 100 ? "bg-green-600" : "bg-orange-600"
                )}
                style={{ width: `${stats.critical}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category) => {
          const Icon = category.icon
          const categoryStats = {
            total: category.items.length,
            completed: category.items.filter(item => item.completed).length,
            critical: category.items.filter(item => item.critical).length,
            completedCritical: category.items.filter(item => item.critical && item.completed).length
          }
          const progress = Math.round((categoryStats.completed / categoryStats.total) * 100)

          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {category.title}
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {progress}%
                  </span>
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => toggleItem(category.id, item.id)}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={cn("text-sm font-medium", item.completed && "line-through text-muted-foreground")}>
                            {item.title}
                          </h4>
                          {item.critical && (
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Checklist Categories */}
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => {
              const Icon = category.icon
              const categoryStats = {
                total: category.items.length,
                completed: category.items.filter(item => item.completed).length,
                critical: category.items.filter(item => item.critical).length,
                completedCritical: category.items.filter(item => item.critical && item.completed).length
              }
              const progress = Math.round((categoryStats.completed / categoryStats.total) * 100)

              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {category.title}
                      <span className="ml-auto text-sm font-normal text-muted-foreground">
                        {progress}%
                      </span>
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => toggleItem(category.id, item.id)}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={cn("text-sm font-medium", item.completed && "line-through text-muted-foreground")}>
                                {item.title}
                              </h4>
                              {item.critical && (
                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Launch Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Button 
                  size="lg" 
                  className={cn("w-full max-w-md", isLaunchReady ? "bg-green-600 hover:bg-green-700" : "")}
                  disabled={!isLaunchReady}
                >
                  {isLaunchReady ? "🚀 Ready to Launch!" : "Complete Checklist to Launch"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  {isLaunchReady 
                    ? "All critical requirements have been met. You're ready to go live!"
                    : `Complete ${stats.criticalItems - stats.completedCritical} more critical items to enable launch.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAudit />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsSetup />
        </TabsContent>

        <TabsContent value="legal">
          <LegalCompliance />
        </TabsContent>

        <TabsContent value="assets">
          <LaunchAssets />
        </TabsContent>
      </Tabs>
    </div>
  )
}