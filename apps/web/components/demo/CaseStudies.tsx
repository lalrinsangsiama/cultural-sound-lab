'use client'

import { useState } from 'react'
import { Star, TrendingUp, Users, DollarSign, Clock, Award, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { OptimizedImage } from '@/components/ui/optimized-image'

const caseStudiesData = [
  {
    id: "mountain_view_restaurant",
    title: "Mountain View Traditional Restaurant",
    business_type: "Fine Dining Restaurant",
    location: "Aizawl, Mizoram",
    industry: "Restaurant",
    size: "Medium (50-100 seats)",
    challenge: "Needed to create an authentic cultural dining experience without hiring live musicians, while maintaining the intimate atmosphere that fine dining customers expect.",
    solution: {
      sound_logo: "Serene Strings - 8s ambient logo for table service",
      background_playlist: "Cultural Dining Journey - 30min traditional playlist", 
      social_media: ["Peaceful Dining Moment - 15s Instagram reel", "Culinary Heritage - 60s storytelling video"],
      special_events: "Evening Dining Symphony - 10min extended composition"
    },
    implementation_timeline: "2 weeks",
    results: {
      customer_satisfaction: { value: 95, label: "95% improvement in atmosphere rating" },
      cultural_authenticity: { value: 85, label: "Guests frequently ask about music source" },
      business_impact: { value: 30, label: "30% increase in reservation requests" },
      revenue_increase: { value: 25, label: "25% higher average ticket price" },
      review_mentions: { value: 85, label: "Music mentioned in 85% of positive reviews" }
    },
    testimonial: {
      quote: "The Cultural Sound Lab music transformed our restaurant into an authentic cultural experience. Customers now specifically book with us for the atmosphere, and our revenue has increased significantly. The music tells the story of our food and culture without us having to explain it.",
      author: "Lalhmangaihsanga Sailo",
      title: "Owner & Head Chef",
      business: "Mountain View Traditional Restaurant",
      rating: 5,
      photo: "/testimonials/lalhmangaihsanga.jpg"
    },
    before_after: {
      before: {
        title: "Before Cultural Sound Lab",
        description: "Generic background music, customers complained about lack of cultural authenticity",
        metrics: ["Silent periods during service", "Generic playlist on repeat", "No cultural connection", "Lower perceived value"]
      },
      after: {
        title: "After Cultural Sound Lab",
        description: "Immersive Mizo traditional atmosphere, customers frequently compliment the authentic ambiance",
        metrics: ["Seamless cultural soundtrack", "Dynamic mood-based music", "Strong cultural identity", "Premium positioning achieved"]
      }
    },
    usage_stats: {
      daily_plays: 45,
      customer_feedback_score: 4.8,
      repeat_customer_rate: 78,
      cultural_engagement: "High - customers often ask about the culture",
      average_visit_duration: "25% longer than before"
    },
    roi_breakdown: {
      monthly_cost: "$199",
      revenue_increase: "$2,400",
      roi_percentage: "1,100%",
      payback_period: "3 days"
    }
  },
  {
    id: "heritage_craft_boutique",
    title: "Heritage Craft Boutique",
    business_type: "Artisan Retail Store",
    location: "Kolasib, Mizoram",
    industry: "Retail",
    size: "Small (Independent)",
    challenge: "Creating an authentic shopping experience that reflects traditional craftsmanship and helps customers understand the cultural value of handmade items.",
    solution: {
      sound_logo: "Artisan Craft - 10s handcrafted traditional sound",
      background_playlist: "Heritage Shopping Experience - 30min artisan-focused music",
      social_media: ["Traditional Craft Story - 30s product showcase", "Artisan Process - 45s behind-the-scenes"],
      product_showcases: "Cultural Craftsmanship - 10min immersive experience"
    },
    implementation_timeline: "1 week",
    results: {
      sales_increase: { value: 40, label: "40% increase in premium product sales" },
      customer_time: { value: 65, label: "65% longer average visit duration" },
      cultural_connection: { value: 78, label: "Customers report deeper connection to products" },
      brand_recognition: { value: 90, label: "90% improvement in brand memorability" },
      social_media_engagement: { value: 300, label: "300% increase in Instagram shares" }
    },
    testimonial: {
      quote: "The traditional music helps customers understand the cultural value of our handcrafted items. It's like having a cultural storyteller in the background of our store. Sales of our premium pieces have increased dramatically because customers now 'feel' the story.",
      author: "C. Lalthangliana",
      title: "Founder & Master Craftsman",
      business: "Heritage Craft Boutique", 
      rating: 5,
      photo: "/testimonials/lalthangliana.jpg"
    },
    before_after: {
      before: {
        title: "Before Cultural Sound Lab",
        description: "Silent store with beautiful crafts but no cultural context",
        metrics: ["No atmosphere", "Customers rushed through", "Price resistance", "Low cultural understanding"]
      },
      after: {
        title: "After Cultural Sound Lab",
        description: "Immersive cultural shopping experience where music tells the story of each craft",
        metrics: ["Rich cultural atmosphere", "Extended browsing time", "Premium pricing accepted", "High cultural engagement"]
      }
    },
    usage_stats: {
      daily_plays: 32,
      conversion_rate_increase: 45,
      average_purchase_value: 85,
      customer_education: 78,
      return_visitor_rate: 62
    },
    roi_breakdown: {
      monthly_cost: "$49",
      revenue_increase: "$1,200",
      roi_percentage: "2,350%",
      payback_period: "1.2 days"
    }
  },
  {
    id: "wellness_retreat_center",
    title: "Mizoram Wellness Retreat",
    business_type: "Wellness & Spa Center",
    location: "Champhai, Mizoram",
    industry: "Wellness",
    size: "Medium (15 treatment rooms)",
    challenge: "Providing unique wellness experience different from generic spa music while honoring traditional healing practices of the region.",
    solution: {
      sound_logo: "Mountain Serenity - 12s nature-inspired traditional sound",
      treatment_music: "Healing Waters - 30min therapeutic traditional playlist",
      yoga_sessions: "Mindful Mountain Practice - 45min yoga-specific compositions",
      meditation: "Sacred Silence - 60min extended meditation soundscape"
    },
    implementation_timeline: "3 weeks",
    results: {
      client_satisfaction: { value: 98, label: "98% report deeper relaxation than other spas" },
      booking_increase: { value: 55, label: "55% increase in repeat bookings" },
      unique_positioning: { value: 100, label: "Only spa in region offering cultural wellness" },
      premium_pricing: { value: 35, label: "35% higher rates than competitors" },
      word_of_mouth: { value: 70, label: "70% of new clients from referrals" }
    },
    testimonial: {
      quote: "The traditional Mizo music creates a unique healing environment. Our clients feel connected to the land and culture while finding deep relaxation. It's a competitive advantage we couldn't have imagined. We now have a 6-month waiting list.",
      author: "Dr. Lalnunmawii Chhangte",
      title: "Director & Wellness Practitioner",
      business: "Mizoram Wellness Retreat",
      rating: 5,
      photo: "/testimonials/lalnunmawii.jpg"
    },
    before_after: {
      before: {
        title: "Before Cultural Sound Lab",
        description: "Standard spa with typical new-age music, struggled to differentiate from competitors",
        metrics: ["Generic spa music", "Standard pricing", "No cultural identity", "Moderate demand"]
      },
      after: {
        title: "After Cultural Sound Lab",
        description: "Unique cultural wellness experience with 6-month waiting list for treatments",
        metrics: ["Authentic cultural healing", "Premium pricing", "Strong local identity", "High demand"]
      }
    },
    usage_stats: {
      daily_sessions: 28,
      client_retention: 89,
      treatment_effectiveness: "40% better relaxation reported",
      cultural_learning: 65,
      therapist_satisfaction: "95% prefer cultural music"
    },
    roi_breakdown: {
      monthly_cost: "$199",
      revenue_increase: "$8,500",
      roi_percentage: "4,170%",
      payback_period: "0.7 days"
    }
  }
]

export default function CaseStudies() {
  const [selectedCase, setSelectedCase] = useState(caseStudiesData[0]!)
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Success Stories</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          See how businesses across different industries have transformed their customer experience 
          and increased revenue using Cultural Sound Lab's AI-generated traditional music.
        </p>
      </div>

      {/* Case Study Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {caseStudiesData.map((study) => (
          <Card 
            key={study.id} 
            className={`cursor-pointer transition-all ${selectedCase.id === study.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
            onClick={() => setSelectedCase(study)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{study.title}</CardTitle>
                  <CardDescription>{study.business_type}</CardDescription>
                </div>
                <Badge variant="outline">{study.industry}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{study.size}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Case Study Details */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{selectedCase.title}</CardTitle>
              <CardDescription className="text-lg mt-1">
                {selectedCase.business_type} • {selectedCase.location}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{selectedCase.industry}</Badge>
              <Badge variant="outline">{selectedCase.size}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="testimonial">Testimonial</TabsTrigger>
              <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Challenge</h3>
                    <p className="text-muted-foreground">{selectedCase.challenge}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Solution Implemented</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedCase.solution).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-3">
                          <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                          <div>
                            <p className="font-medium capitalize">{key.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Before vs After</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                        <h4 className="font-medium text-red-800 mb-2">{selectedCase.before_after.before.title}</h4>
                        <p className="text-sm text-red-700 mb-3">{selectedCase.before_after.before.description}</p>
                        <ul className="space-y-1">
                          {selectedCase.before_after.before.metrics.map((metric, idx) => (
                            <li key={idx} className="text-xs text-red-600 flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                              {metric}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">{selectedCase.before_after.after.title}</h4>
                        <p className="text-sm text-green-700 mb-3">{selectedCase.before_after.after.description}</p>
                        <ul className="space-y-1">
                          {selectedCase.before_after.after.metrics.map((metric, idx) => (
                            <li key={idx} className="text-xs text-green-600 flex items-center gap-2">
                              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                              {metric}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Implementation</h3>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Timeline: {selectedCase.implementation_timeline}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(selectedCase.results).map(([key, result]) => (
                  <Card key={key}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span className="text-2xl font-bold">{result.value}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.label}</p>
                        <Progress value={Math.min(result.value, 100)} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedCase.usage_stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Achievements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(selectedCase.results).slice(0, 3).map(([key, result]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm">{result.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="testimonial" className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(selectedCase.testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg italic mb-6 leading-relaxed">
                    "{selectedCase.testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                    {selectedCase.testimonial.photo ? (
                      <OptimizedImage
                        src={selectedCase.testimonial.photo}
                        alt={`Photo of ${selectedCase.testimonial.author}`}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        fallbackSrc="/images/placeholder.svg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {selectedCase.testimonial.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{selectedCase.testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{selectedCase.testimonial.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedCase.testimonial.business}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roi" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{selectedCase.roi_breakdown.monthly_cost}</div>
                    <p className="text-sm text-muted-foreground">Monthly Cost</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{selectedCase.roi_breakdown.revenue_increase}</div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue Increase</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{selectedCase.roi_breakdown.roi_percentage}</div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{selectedCase.roi_breakdown.payback_period}</div>
                    <p className="text-sm text-muted-foreground">Payback Period</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>ROI Breakdown</CardTitle>
                  <CardDescription>
                    Financial impact analysis for {selectedCase.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Monthly Subscription Cost</span>
                      <span className="font-medium">-{selectedCase.roi_breakdown.monthly_cost}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Monthly Revenue Increase</span>
                      <span className="font-medium text-green-600">+{selectedCase.roi_breakdown.revenue_increase}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b font-semibold">
                      <span>Net Monthly Benefit</span>
                      <span className="text-green-600">
                        +${parseInt(selectedCase.roi_breakdown.revenue_increase.replace('$', '').replace(',', '')) - parseInt(selectedCase.roi_breakdown.monthly_cost.replace('$', ''))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-lg font-bold">
                      <span>Return on Investment</span>
                      <span className="text-green-600">{selectedCase.roi_breakdown.roi_percentage}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="pt-6 text-center space-y-4">
          <h3 className="text-2xl font-bold">Ready to Transform Your Business?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join these successful businesses and start creating authentic cultural experiences 
            that increase customer satisfaction and drive revenue growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="px-8">
              Start Your Free Trial
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Schedule Consultation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}