'use client'

import { useState } from 'react'
import { Play, ArrowRight, TrendingUp, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const trendingDemos = [
  {
    id: 'restaurant_ambient_logo_1',
    name: 'Serene Strings',
    category: 'Restaurant',
    plays: '2.3k',
    trend: '+12%'
  },
  {
    id: 'wellness_spa_logo_1', 
    name: 'Tranquil Waters',
    category: 'Wellness',
    plays: '1.8k',
    trend: '+8%'
  },
  {
    id: 'events_wedding_logo_1',
    name: 'Eternal Bond',
    category: 'Wedding',
    plays: '1.5k',
    trend: '+15%'
  }
]

const quickStats = [
  { label: 'Total Demos', value: '230+', icon: PlayCircle },
  { label: 'Categories', value: '5', icon: TrendingUp },
  { label: 'Success Stories', value: '12', icon: TrendingUp }
]

export default function DemoLibraryWidget() {
  const [playingDemo, setPlayingDemo] = useState<string | null>(null)

  const handlePlay = (demoId: string) => {
    setPlayingDemo(playingDemo === demoId ? null : demoId)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            Demo Library Overview
          </CardTitle>
          <CardDescription>
            Explore pre-generated music across business categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <Button asChild className="w-full">
              <Link href="/dashboard/demos">
                Browse All Demos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trending Demos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Trending This Week
          </CardTitle>
          <CardDescription>
            Most popular demos across all categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingDemos.map((demo, index) => (
            <div key={demo.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePlay(demo.id)}
                  className="w-8 h-8 p-0"
                >
                  <Play className="w-3 h-3" />
                </Button>
                <div>
                  <p className="font-medium text-sm">{demo.name}</p>
                  <p className="text-xs text-muted-foreground">{demo.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{demo.plays}</p>
                <Badge variant="secondary" className="text-xs">
                  {demo.trend}
                </Badge>
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/case-studies">
                View Success Stories
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}