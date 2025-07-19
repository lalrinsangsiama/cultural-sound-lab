'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, Filter, Heart, Star, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

interface DemoItem {
  id: string
  name: string
  duration: string
  file: string
  description: string
  mood: string
  instruments: string[]
  use_cases: string[]
  licensing: string
  attribution: string
}

interface DemoCategory {
  title: string
  description: string
  subcategories: Record<string, {
    title: string
    description: string
    sound_logos: DemoItem[]
    playlists?: DemoItem[]
    social_clips?: DemoItem[]
    long_form?: DemoItem[]
  }>
}

interface CaseStudy {
  id: string
  title: string
  business_type: string
  location: string
  challenge: string
  results: {
    customer_satisfaction?: string
    sales_increase?: string
    business_impact?: string
    revenue_increase?: string
    client_satisfaction?: string
  }
  testimonial: {
    quote: string
    author: string
    title: string
    rating: number
  }
}

const demoData = {
  categories: {
    restaurant: {
      title: "Restaurant & Dining",
      description: "Carefully crafted soundscapes for restaurants, cafes, and dining establishments",
      subcategories: {
        ambient: {
          title: "Ambient Dining",
          description: "Subtle background music for intimate dining experiences",
          sound_logos: [
            {
              id: "restaurant_ambient_logo_1",
              name: "Serene Strings",
              duration: "8s",
              file: "restaurant/sound-logos/ambient-serene-strings.mp3",
              description: "Gentle traditional string melody perfect for upscale restaurants",
              mood: "calming",
              instruments: ["Mizo bamboo strings", "traditional flute"],
              use_cases: ["fine dining", "romantic restaurants", "cultural establishments"],
              licensing: "commercial",
              attribution: "Generated using Mizo traditional instruments from Cultural Sound Lab"
            },
            {
              id: "restaurant_ambient_logo_2", 
              name: "Mountain Echo",
              duration: "10s",
              file: "restaurant/sound-logos/ambient-mountain-echo.mp3",
              description: "Echoing flute with subtle percussion for authentic cultural dining",
              mood: "peaceful",
              instruments: ["traditional flute", "bamboo percussion"],
              use_cases: ["cultural restaurants", "tea houses", "ethnic cuisine"],
              licensing: "commercial",
              attribution: "Generated using Mizo traditional instruments from Cultural Sound Lab"
            },
            {
              id: "restaurant_ambient_logo_3",
              name: "Harvest Harmony",
              duration: "12s", 
              file: "restaurant/sound-logos/ambient-harvest-harmony.mp3",
              description: "Layered traditional instruments creating warm, welcoming atmosphere",
              mood: "welcoming",
              instruments: ["bamboo strings", "traditional flute", "subtle percussion"],
              use_cases: ["farm-to-table", "organic restaurants", "community dining"],
              licensing: "commercial",
              attribution: "Generated using Mizo traditional instruments from Cultural Sound Lab"
            }
          ]
        },
        energetic: {
          title: "Energetic Dining",
          description: "Upbeat and lively music for casual dining and social restaurants",
          sound_logos: [
            {
              id: "restaurant_energetic_logo_1",
              name: "Vibrant Feast",
              duration: "8s",
              file: "restaurant/sound-logos/energetic-vibrant-feast.mp3",
              description: "Upbeat traditional melody perfect for casual dining",
              mood: "energetic",
              instruments: ["rhythmic bamboo", "lively flute", "percussion"],
              use_cases: ["casual dining", "family restaurants", "lunch spots"],
              licensing: "commercial",
              attribution: "Generated using Mizo traditional instruments from Cultural Sound Lab"
            }
          ]
        }
      }
    },
    wellness: {
      title: "Wellness & Health", 
      description: "Therapeutic soundscapes for wellness and health-focused environments",
      subcategories: {
        spa: {
          title: "Spa & Relaxation",
          description: "Deeply relaxing music for spa treatments and wellness centers",
          sound_logos: [
            {
              id: "wellness_spa_logo_1",
              name: "Tranquil Waters",
              duration: "8s",
              file: "wellness/sound-logos/spa-tranquil-waters.mp3",
              description: "Flowing traditional sounds for deep relaxation",
              mood: "tranquil",
              instruments: ["flowing bamboo", "gentle percussion"],
              use_cases: ["spa treatments", "massage therapy", "relaxation centers"],
              licensing: "commercial",
              attribution: "Generated using Mizo traditional instruments from Cultural Sound Lab"
            }
          ]
        }
      }
    }
  },
  case_studies: [
    {
      id: "mountain_view_restaurant",
      title: "Mountain View Traditional Restaurant",
      business_type: "Fine Dining Restaurant",
      location: "Aizawl, Mizoram",
      challenge: "Authentic cultural dining experience without live musicians",
      results: {
        customer_satisfaction: "95% improvement in atmosphere rating",
        business_impact: "30% increase in reservation requests",
        revenue_increase: "25% higher average ticket price"
      },
      testimonial: {
        quote: "The Cultural Sound Lab music transformed our restaurant into an authentic cultural experience. Customers now specifically book with us for the atmosphere, and our revenue has increased significantly.",
        author: "Lalhmangaihsanga Sailo",
        title: "Owner, Mountain View Traditional Restaurant",
        rating: 5
      }
    },
    {
      id: "heritage_craft_boutique",
      title: "Heritage Craft Boutique",
      business_type: "Artisan Retail Store",
      location: "Kolasib, Mizoram",
      challenge: "Creating an authentic shopping experience that reflects traditional craftsmanship",
      results: {
        sales_increase: "40% increase in premium product sales",
        customer_time: "65% longer average visit duration",
        brand_recognition: "90% improvement in brand memorability"
      },
      testimonial: {
        quote: "The traditional music helps customers understand the cultural value of our handcrafted items. It's like having a cultural storyteller in the background of our store.",
        author: "C. Lalthangliana",
        title: "Founder, Heritage Craft Boutique", 
        rating: 5
      }
    },
    {
      id: "wellness_retreat_center",
      title: "Mizoram Wellness Retreat",
      business_type: "Wellness & Spa Center",
      location: "Champhai, Mizoram",
      challenge: "Providing unique wellness experience different from generic spa music",
      results: {
        client_satisfaction: "98% report deeper relaxation than other spas",
        booking_increase: "55% increase in repeat bookings",
        premium_pricing: "35% higher rates than competitors"
      },
      testimonial: {
        quote: "The traditional Mizo music creates a unique healing environment. Our clients feel connected to the land and culture while finding deep relaxation. It's a competitive advantage we couldn't have imagined.",
        author: "Dr. Lalnunmawii Chhangte",
        title: "Director, Mizoram Wellness Retreat",
        rating: 5
      }
    }
  ]
}

export default function DemoShowcase() {
  const [selectedCategory, setSelectedCategory] = useState('restaurant')
  const [selectedSubcategory, setSelectedSubcategory] = useState('ambient')
  const [selectedContentType, setSelectedContentType] = useState('sound_logos')
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlay = async (trackId: string, file: string) => {
    if (playingTrack === trackId) {
      if (audioRef.current) {
        audioRef.current.pause()
        setPlayingTrack(null)
      }
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    try {
      audioRef.current = new Audio(`/demo-audio/${file}`)
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          audioRef.current.play()
          setPlayingTrack(trackId)
        }
      }
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          const percentage = (audioRef.current.currentTime / audioRef.current.duration) * 100
          setProgress(percentage)
        }
      }
      audioRef.current.onended = () => {
        setPlayingTrack(null)
        setProgress(0)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const currentCategory = demoData.categories[selectedCategory as keyof typeof demoData.categories]
  const currentSubcategory = currentCategory?.subcategories[selectedSubcategory]
  const currentContent = currentSubcategory?.[selectedContentType as keyof typeof currentSubcategory] as DemoItem[] | undefined

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Demo Library</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore our comprehensive library of AI-generated cultural music across different business categories. 
          Experience the perfect blend of traditional Mizo instruments and modern audio production.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-center">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="restaurant">Restaurant & Dining</SelectItem>
            <SelectItem value="wellness">Wellness & Health</SelectItem>
          </SelectContent>
        </Select>

        {currentCategory && (
          <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(currentCategory.subcategories).map(([key, sub]) => (
                <SelectItem key={key} value={key}>{sub.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedContentType} onValueChange={setSelectedContentType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sound_logos">Sound Logos</SelectItem>
            <SelectItem value="playlists">Playlists</SelectItem>
            <SelectItem value="social_clips">Social Clips</SelectItem>
            <SelectItem value="long_form">Long-form</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Grid */}
      {currentContent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentContent.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="text-sm">{item.duration}</CardDescription>
                  </div>
                  <Badge variant="secondary">{item.mood}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                
                {/* Instruments */}
                <div className="space-y-2">
                  <p className="text-xs font-medium">Instruments:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.instruments.map((instrument, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {instrument}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Use Cases */}
                <div className="space-y-2">
                  <p className="text-xs font-medium">Perfect for:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.use_cases.map((useCase, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {useCase}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                {playingTrack === item.id && (
                  <Progress value={progress} className="h-1" />
                )}

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={playingTrack === item.id ? "secondary" : "default"}
                    onClick={() => handlePlay(item.id, item.file)}
                    className="flex-1"
                  >
                    {playingTrack === item.id ? (
                      <><Pause className="w-4 h-4 mr-2" /> Pause</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" /> Play</>
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>

                <Button variant="ghost" size="sm" className="w-full">
                  Generate Similar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Case Studies Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Success Stories</h2>
          <p className="text-muted-foreground">See how businesses transformed their customer experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {demoData.case_studies.map((study) => (
            <Card key={study.id} className="space-y-4">
              <CardHeader>
                <CardTitle className="text-xl">{study.title}</CardTitle>
                <CardDescription>
                  {study.business_type} • {study.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Challenge:</p>
                    <p className="text-sm text-muted-foreground">{study.challenge}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Results:</p>
                    {Object.entries(study.results).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(study.testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-sm italic text-muted-foreground mb-2">
                    "{study.testimonial.quote}"
                  </blockquote>
                  <div className="text-xs">
                    <p className="font-medium">{study.testimonial.author}</p>
                    <p className="text-muted-foreground">{study.testimonial.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center space-y-6 bg-muted/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold">Ready to Transform Your Business?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join hundreds of businesses using Cultural Sound Lab to create authentic, engaging experiences for their customers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="px-8">
            Start Generating Music
          </Button>
          <Button size="lg" variant="outline" className="px-8">
            Schedule Demo Call
          </Button>
        </div>
      </section>
    </div>
  )
}