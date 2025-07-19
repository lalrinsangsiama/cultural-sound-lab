'use client'

import { useState } from 'react'
import { Play, ArrowRight, Star, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const featuredDemos = [
  {
    id: 'restaurant_ambient_logo_1',
    name: 'Serene Strings',
    category: 'Restaurant',
    subcategory: 'Ambient',
    duration: '8s',
    description: 'Perfect for upscale dining',
    mood: 'calming',
    plays: '2.3k'
  },
  {
    id: 'wellness_spa_logo_1',
    name: 'Tranquil Waters',
    category: 'Wellness',
    subcategory: 'Spa',
    duration: '8s',
    description: 'Deep relaxation therapy',
    mood: 'tranquil',
    plays: '1.8k'
  },
  {
    id: 'retail_boutique_logo_1',
    name: 'Elegant Selection',
    category: 'Retail',
    subcategory: 'Boutique',
    duration: '8s',
    description: 'Sophisticated shopping',
    mood: 'sophisticated',
    plays: '1.5k'
  }
]

const businessImpact = [
  {
    icon: TrendingUp,
    title: '40% Average Revenue Increase',
    description: 'Businesses see significant revenue growth with our cultural music'
  },
  {
    icon: Users,
    title: '95% Customer Satisfaction',
    description: 'Customers report deeper connection and authentic experiences'
  },
  {
    icon: Star,
    title: '4.9/5 Business Rating',
    description: 'Consistently high ratings from business owners across industries'
  }
]

export default function DemoLibraryPromo() {
  const [playingDemo, setPlayingDemo] = useState<string | null>(null)

  const handlePlay = (demoId: string) => {
    setPlayingDemo(playingDemo === demoId ? null : demoId)
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Explore Our Demo Library
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover how AI-generated traditional music transforms businesses across industries. 
            Listen to real examples and see the impact on customer experience and revenue.
          </p>
        </div>

        {/* Featured Demos */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-center">Featured Demos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDemos.map((demo) => (
              <Card key={demo.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{demo.name}</CardTitle>
                      <CardDescription>{demo.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{demo.mood}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{demo.category}</span>
                    <span>•</span>
                    <span>{demo.subcategory}</span>
                    <span>•</span>
                    <span>{demo.duration}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant={playingDemo === demo.id ? "secondary" : "default"}
                      onClick={() => handlePlay(demo.id)}
                      className="flex-1 mr-2"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {playingDemo === demo.id ? 'Playing...' : 'Preview'}
                    </Button>
                    <span className="text-xs text-muted-foreground">{demo.plays} plays</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Impact Stats */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-center">Proven Business Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businessImpact.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <item.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6 bg-white rounded-lg p-8 shadow-sm">
          <h3 className="text-2xl font-bold">
            Ready to Explore the Full Library?
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access hundreds of pre-generated demos across 5 business categories, 
            detailed case studies, and ROI analysis to help you make informed decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/dashboard/demos">
                Browse Demo Library
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/dashboard/case-studies">
                View Success Stories
              </Link>
            </Button>
          </div>
        </div>

        {/* Categories Preview */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-center">Demo Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Restaurant', count: '60+ demos', color: 'bg-red-100 text-red-800' },
              { name: 'Retail', count: '45+ demos', color: 'bg-blue-100 text-blue-800' },
              { name: 'Wellness', count: '40+ demos', color: 'bg-green-100 text-green-800' },
              { name: 'Corporate', count: '35+ demos', color: 'bg-purple-100 text-purple-800' },
              { name: 'Events', count: '50+ demos', color: 'bg-orange-100 text-orange-800' }
            ].map((category) => (
              <div key={category.name} className="text-center space-y-2">
                <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center mx-auto`}>
                  <span className="text-lg font-semibold">{category.name[0]}</span>
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}