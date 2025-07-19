'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart3, Eye, MousePointer2, TrendingUp, Settings, CheckCircle2, AlertCircle } from 'lucide-react'

interface AnalyticsProvider {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  configured: boolean
  required: boolean
  configKey?: string
}

interface AnalyticsEvent {
  name: string
  description: string
  implemented: boolean
  critical: boolean
}

export function AnalyticsSetup() {
  const [providers, setProviders] = useState<AnalyticsProvider[]>([
    {
      id: 'ga4',
      name: 'Google Analytics 4',
      icon: BarChart3,
      description: 'User behavior and traffic tracking',
      configured: false,
      required: true,
      configKey: 'GA_MEASUREMENT_ID'
    },
    {
      id: 'hotjar',
      name: 'Hotjar',
      icon: MousePointer2,
      description: 'User interaction heatmaps and recordings',
      configured: false,
      required: false,
      configKey: 'HOTJAR_ID'
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      icon: TrendingUp,
      description: 'Advanced event tracking and funnel analysis',
      configured: false,
      required: false,
      configKey: 'MIXPANEL_TOKEN'
    },
    {
      id: 'sentry',
      name: 'Sentry',
      icon: AlertCircle,
      description: 'Error tracking and performance monitoring',
      configured: false,
      required: true,
      configKey: 'SENTRY_DSN'
    }
  ])

  const [events, setEvents] = useState<AnalyticsEvent[]>([
    {
      name: 'page_view',
      description: 'Track page views across the application',
      implemented: true,
      critical: true
    },
    {
      name: 'user_signup',
      description: 'Track new user registrations',
      implemented: false,
      critical: true
    },
    {
      name: 'user_login',
      description: 'Track user authentication events',
      implemented: false,
      critical: true
    },
    {
      name: 'audio_play',
      description: 'Track when users play audio samples',
      implemented: false,
      critical: true
    },
    {
      name: 'audio_download',
      description: 'Track audio file downloads',
      implemented: false,
      critical: true
    },
    {
      name: 'generation_start',
      description: 'Track when AI generation is initiated',
      implemented: false,
      critical: true
    },
    {
      name: 'generation_complete',
      description: 'Track successful AI generations',
      implemented: false,
      critical: true
    },
    {
      name: 'license_purchase',
      description: 'Track license purchases and revenue',
      implemented: false,
      critical: true
    },
    {
      name: 'search_query',
      description: 'Track search queries in audio library',
      implemented: false,
      critical: false
    },
    {
      name: 'filter_applied',
      description: 'Track filter usage in audio library',
      implemented: false,
      critical: false
    },
    {
      name: 'share_content',
      description: 'Track content sharing events',
      implemented: false,
      critical: false
    },
    {
      name: 'error_occurred',
      description: 'Track application errors and exceptions',
      implemented: false,
      critical: true
    }
  ])

  const [configs, setConfigs] = useState<Record<string, string>>({})

  const toggleProvider = (providerId: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { ...provider, configured: !provider.configured }
        : provider
    ))
  }

  const toggleEvent = (eventName: string) => {
    setEvents(prev => prev.map(event => 
      event.name === eventName 
        ? { ...event, implemented: !event.implemented }
        : event
    ))
  }

  const updateConfig = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }))
  }

  const getImplementationStats = () => {
    const requiredProviders = providers.filter(p => p.required)
    const configuredRequired = requiredProviders.filter(p => p.configured).length
    const criticalEvents = events.filter(e => e.critical)
    const implementedCritical = criticalEvents.filter(e => e.implemented).length
    
    return {
      providersConfigured: configuredRequired,
      totalRequiredProviders: requiredProviders.length,
      eventsImplemented: implementedCritical,
      totalCriticalEvents: criticalEvents.length,
      overallScore: Math.round(
        ((configuredRequired / requiredProviders.length) * 0.4 + 
         (implementedCritical / criticalEvents.length) * 0.6) * 100
      )
    }
  }

  const stats = getImplementationStats()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Setup</h2>
        <p className="text-muted-foreground">Configure tracking and monitoring for your application</p>
      </div>

      {/* Analytics Score */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setup Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallScore}%</div>
            <Badge className={stats.overallScore >= 80 ? 'bg-green-100 text-green-800' : stats.overallScore >= 60 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>
              {stats.overallScore >= 80 ? 'Ready' : stats.overallScore >= 60 ? 'Partial' : 'Incomplete'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.providersConfigured}/{stats.totalRequiredProviders}
            </div>
            <p className="text-xs text-muted-foreground">Required configured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.eventsImplemented}/{stats.totalCriticalEvents}
            </div>
            <p className="text-xs text-muted-foreground">Critical events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Tracking</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.name.includes('purchase') || e.name.includes('signup')).filter(e => e.implemented).length}
            </div>
            <p className="text-xs text-muted-foreground">Funnel events active</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Providers</CardTitle>
          <CardDescription>Configure third-party analytics and monitoring services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {providers.map((provider) => {
              const Icon = provider.icon
              return (
                <div key={provider.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{provider.name}</h4>
                        {provider.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                      
                      {provider.configKey && (
                        <div className="space-y-1">
                          <Label htmlFor={provider.configKey} className="text-xs">{provider.configKey}</Label>
                          <Input
                            id={provider.configKey}
                            placeholder={`Enter your ${provider.name} ${provider.configKey}`}
                            value={configs[provider.configKey] || ''}
                            onChange={(e) => updateConfig(provider.configKey!, e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={provider.configured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {provider.configured ? 'Configured' : 'Not configured'}
                    </Badge>
                    <Button
                      size="sm"
                      variant={provider.configured ? "destructive" : "default"}
                      onClick={() => toggleProvider(provider.id)}
                    >
                      {provider.configured ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Event Tracking</CardTitle>
          <CardDescription>Custom events to track user behavior and conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {events.map((event) => (
              <div key={event.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {event.implemented ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {event.name}
                      </code>
                      {event.critical && (
                        <Badge variant="destructive" className="text-xs">Critical</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={event.implemented ? "destructive" : "default"}
                  onClick={() => toggleEvent(event.name)}
                >
                  {event.implemented ? 'Disable' : 'Implement'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
          <CardDescription>Steps to set up analytics tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <div className="font-medium">Configure Environment Variables</div>
                <div className="text-sm text-muted-foreground">
                  Add the configuration keys for each analytics provider to your environment variables
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <div className="font-medium">Install Analytics Scripts</div>
                <div className="text-sm text-muted-foreground">
                  Add the tracking scripts to your application's layout or head component
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <div className="font-medium">Implement Event Tracking</div>
                <div className="text-sm text-muted-foreground">
                  Add event tracking calls throughout your application for critical user actions
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <div className="font-medium">Test and Validate</div>
                <div className="text-sm text-muted-foreground">
                  Verify that events are being sent correctly using browser dev tools or analytics dashboards
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}