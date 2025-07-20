"use client";

import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { 
  Music, 
  Sparkles, 
  Library, 
  TrendingUp, 
  Users, 
  Play, 
  Mic, 
  Waveform, 
  Clock,
  ArrowRight,
  Volume2,
  Zap,
  Globe,
  Award,
  ChevronRight,
  BarChart3,
  Headphones,
  Radio
} from "lucide-react";
import Link from "next/link";

const recentActivity = [
  {
    id: "1",
    type: "generation",
    title: "Mizo Drum Sound Logo",
    subtitle: "3.2s • Sound Logo",
    time: "2 hours ago",
    status: "completed",
    waveform: "████▆▅▇█▅▆▄▃▅▇█▆▅▄"
  },
  {
    id: "2",
    type: "license",
    title: "Documentary Score",
    subtitle: "4:32 • Licensed to National Geographic",
    time: "4 hours ago",
    status: "completed",
    waveform: "▃▅▇█▆▅▄▃▅▇█▆▅▄▃▅▇█"
  },
  {
    id: "3",
    type: "generation",
    title: "Instagram Reel Background",
    subtitle: "30s • Social Media",
    time: "1 day ago",
    status: "processing",
    waveform: "▄▅▆▇█▆▅▄▃▄▅▆▇█▆▅▄"
  }
];

const quickStats = {
  totalGenerations: 12,
  totalEarnings: 103950.00,
  activeLicenses: 28,
  librarySize: 6
};

const culturalSamples = [
  { name: "Mizo Traditional Drums", location: "Northeast India", plays: 1247 },
  { name: "Tibetan Singing Bowls", location: "Tibet", plays: 892 },
  { name: "Irish Folk Fiddle", location: "Ireland", plays: 1456 }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-obsidian">
      {/* Studio Console Header */}
      <div className="border-b border-charcoal bg-gradient-to-r from-graphite to-charcoal">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 knob-control flex items-center justify-center shadow-gold">
                <Headphones className="h-8 w-8 text-gold" />
                <div className="led-indicator absolute -top-1 -right-1"></div>
              </div>
              <div>
                <h1 className="text-display font-display font-bold text-white mb-2">
                  Cultural Studio
                </h1>
                <p className="text-body text-ash">
                  Your professional workspace for cultural music creation
                </p>
              </div>
            </div>
            
            {/* Quick Access Controls */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 mr-4">
                <div className="led-indicator"></div>
                <span className="text-small text-emerald font-mono">LIVE</span>
              </div>
              <Button variant="secondary" size="sm" className="border-gold/20 hover:border-gold border-glow">
                <Radio className="w-4 h-4 mr-2" />
                Live Session
              </Button>
              <Button variant="gold" size="sm" className="animate-gold-pulse">
                <Zap className="w-4 h-4 mr-2" />
                New Creation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Primary Workflow Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Audio Card */}
          <Card variant="refined" className="group cursor-pointer hover:shadow-gold/10 transition-all duration-300 hover-lift brushed-metal">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 knob-control flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-gold" />
                  <div className="led-indicator absolute -top-1 -right-1"></div>
                </div>
                <ChevronRight className="h-5 w-5 text-ash group-hover:text-gold transition-colors" />
              </div>
              
              <h3 className="text-h2 font-display font-bold text-white mb-3 group-hover:text-gold transition-colors">
                Create Music
              </h3>
              <p className="text-body text-ash mb-6 leading-relaxed">
                Transform authentic cultural recordings into contemporary compositions
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-small text-silver">
                  <Volume2 className="w-4 h-4 mr-2 text-gold" />
                  Sound Logos • Ambient Music • Story Clips
                </div>
                <div className="flex items-center text-small text-silver">
                  <Clock className="w-4 h-4 mr-2 text-gold" />
                  5-30 seconds processing time
                </div>
              </div>
              
              <Link href="/dashboard/generate">
                <Button variant="gold" className="w-full">
                  Start Creating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Browse Library Card */}
          <Card variant="refined" className="group cursor-pointer hover:shadow-gold/10 transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-medium flex items-center justify-center">
                  <Library className="h-7 w-7 text-gold" />
                </div>
                <ChevronRight className="h-5 w-5 text-ash group-hover:text-gold transition-colors" />
              </div>
              
              <h3 className="text-h2 font-display font-bold text-white mb-3 group-hover:text-gold transition-colors">
                Heritage Collection
              </h3>
              <p className="text-body text-ash mb-6 leading-relaxed">
                Discover centuries-old cultural instruments and sacred recordings
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-small text-silver">
                  <Globe className="w-4 h-4 mr-2 text-gold" />
                  {quickStats.librarySize} Cultural Collections
                </div>
                <div className="flex items-center text-small text-silver">
                  <Award className="w-4 h-4 mr-2 text-gold" />
                  Authenticated Heritage
                </div>
              </div>
              
              <Link href="/dashboard/library">
                <Button variant="secondary" className="w-full border-gold/20 hover:border-gold">
                  Explore Heritage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* My Projects Card */}
          <Card variant="refined" className="group cursor-pointer hover:shadow-gold/10 transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-medium flex items-center justify-center">
                  <Music className="h-7 w-7 text-gold" />
                </div>
                <ChevronRight className="h-5 w-5 text-ash group-hover:text-gold transition-colors" />
              </div>
              
              <h3 className="text-h2 font-display font-bold text-white mb-3 group-hover:text-gold transition-colors">
                My Projects
              </h3>
              <p className="text-body text-ash mb-6 leading-relaxed">
                Manage your cultural creations and downloads
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-small text-silver">
                  <BarChart3 className="w-4 h-4 mr-2 text-gold" />
                  {quickStats.totalGenerations} Generations
                </div>
                <div className="flex items-center text-small text-silver">
                  <Users className="w-4 h-4 mr-2 text-gold" />
                  {quickStats.activeLicenses} Active Licenses
                </div>
              </div>
              
              <Link href="/dashboard/projects">
                <Button variant="secondary" className="w-full border-gold/20 hover:border-gold">
                  View Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Enhanced Studio Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="studio-panel brushed-metal group cursor-pointer hover-console-lift animate-console-glow">
            <div className="p-6 text-center">
              <div className="w-12 h-12 knob-control flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-gold" />
                <div className="led-indicator absolute -top-1 -right-1"></div>
              </div>
              <div className="text-h1 font-display font-bold text-white font-mono mb-2 group-hover:text-gold transition-colors animate-typing-dots">
                {quickStats.totalGenerations}
              </div>
              <div className="text-small text-ash group-hover:text-silver transition-colors">
                Total Generations
              </div>
              <div className="text-caption text-emerald font-mono mt-1 flex items-center justify-center space-x-1">
                <div className="waveform-visualizer w-8 h-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="waveform-bar" />
                  ))}
                </div>
                <span>+3 this week</span>
              </div>
            </div>
          </div>

          <div className="studio-panel brushed-metal group cursor-pointer hover-console-lift animate-audio-pulse">
            <div className="p-6 text-center">
              <div className="w-12 h-12 knob-control flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-gold" />
                <div className="led-indicator emerald absolute -top-1 -right-1"></div>
              </div>
              <div className="text-h1 font-display font-bold text-white font-mono mb-2 group-hover:text-gold transition-colors">
                ₹{quickStats.totalEarnings.toLocaleString('en-IN')}
              </div>
              <div className="text-small text-ash group-hover:text-silver transition-colors">
                Total Earnings
              </div>
              <div className="text-caption text-emerald font-mono mt-1 flex items-center justify-center space-x-2">
                <div className="frequency-analyzer w-6 h-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="frequency-bar spectrum-bar" />
                  ))}
                </div>
                <span>+12% this month</span>
              </div>
            </div>
          </div>

          <div className="studio-panel brushed-metal group cursor-pointer hover-console-lift">
            <div className="p-6 text-center">
              <div className="w-12 h-12 knob-control flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-gold" />
                <div className="led-indicator amber absolute -top-1 -right-1"></div>
              </div>
              <div className="text-h1 font-display font-bold text-white font-mono mb-2 group-hover:text-gold transition-colors animate-studio-breathe">
                {quickStats.activeLicenses}
              </div>
              <div className="text-small text-ash group-hover:text-silver transition-colors">
                Active Licenses
              </div>
              <div className="text-caption text-emerald font-mono mt-1 flex items-center justify-center space-x-1">
                <div className="data-visualization w-8 h-1"></div>
                <span>+8 this month</span>
              </div>
            </div>
          </div>

          <div className="studio-panel brushed-metal group cursor-pointer hover-console-lift animate-spectrum-wave">
            <div className="p-6 text-center">
              <div className="w-12 h-12 knob-control flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-gold" />
                <div className="led-indicator absolute -top-1 -right-1"></div>
              </div>
              <div className="text-h1 font-display font-bold text-white font-mono mb-2 group-hover:text-gold transition-colors">
                {quickStats.librarySize}
              </div>
              <div className="text-small text-ash group-hover:text-silver transition-colors">
                Cultural Collections
              </div>
              <div className="text-caption text-ash font-mono mt-1 flex items-center justify-center space-x-1">
                <div className="vu-meter w-8 h-2 rounded-small"></div>
                <span>Available now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Cultural Samples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card variant="refined">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-h3 font-display font-bold text-white">Recent Activity</h3>
                  <p className="text-small text-ash mt-1">Your latest cultural creations</p>
                </div>
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-medium flex items-center justify-center">
                  <Waveform className="h-5 w-5 text-gold" />
                </div>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="studio-panel group cursor-pointer">
                    <div className="p-4 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-medium flex items-center justify-center flex-shrink-0">
                        {activity.type === "generation" ? (
                          <Sparkles className="h-5 w-5 text-gold" />
                        ) : (
                          <Play className="h-5 w-5 text-gold" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-body font-medium text-white group-hover:text-gold transition-colors truncate">
                            {activity.title}
                          </p>
                          <div className={`px-2 py-1 rounded-small text-caption font-mono border flex-shrink-0 ${
                            activity.status === "completed" 
                              ? "bg-emerald/10 text-emerald border-emerald/20" 
                              : "bg-amber/10 text-amber border-amber/20"
                          }`}>
                            {activity.status}
                          </div>
                        </div>
                        <p className="text-small text-ash mb-2">{activity.subtitle}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-caption text-silver font-mono">{activity.time}</span>
                          <div className="waveform-visualizer w-16 h-3">
                            {activity.waveform.split('').map((_, i) => (
                              <div key={i} className="waveform-bar animate-meter-level" style={{ animationDelay: `${i * 0.02}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-charcoal">
                <Link href="/dashboard/projects">
                  <Button variant="ghost" className="w-full justify-between text-ash hover:text-gold">
                    View All Projects
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Featured Cultural Samples */}
          <Card variant="refined">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-h3 font-display font-bold text-white">Featured Heritage</h3>
                  <p className="text-small text-ash mt-1">Discover authentic cultural instruments</p>
                </div>
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-medium flex items-center justify-center">
                  <Mic className="h-5 w-5 text-gold" />
                </div>
              </div>
              
              <div className="space-y-4">
                {culturalSamples.map((sample, index) => (
                  <div key={index} className="studio-panel group cursor-pointer">
                    <div className="p-4 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-medium flex items-center justify-center flex-shrink-0">
                        <Volume2 className="h-5 w-5 text-gold" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium text-white group-hover:text-gold transition-colors truncate mb-1">
                          {sample.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-small text-ash">{sample.location}</span>
                          <div className="flex items-center text-caption text-silver font-mono">
                            <Play className="w-3 h-3 mr-1 text-gold" />
                            {sample.plays.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-charcoal">
                <Link href="/dashboard/library">
                  <Button variant="ghost" className="w-full justify-between text-ash hover:text-gold">
                    Explore Full Library
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Cultural Impact Footer */}
        <Card variant="refined" className="bg-gradient-to-r from-charcoal to-slate">
          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-h2 font-display font-bold text-white mb-3">
                Cultural Impact
              </h3>
              <p className="text-body text-ash max-w-2xl mx-auto">
                Every creation helps preserve and share traditional music with the world
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-obsidian/50 border border-gold/10 rounded-medium">
                <div className="text-display font-display font-bold text-sapphire font-mono mb-2">
                  15
                </div>
                <div className="text-small text-ash">Cultural Stories Shared</div>
              </div>
              <div className="text-center p-6 bg-obsidian/50 border border-gold/10 rounded-medium">
                <div className="text-display font-display font-bold text-emerald font-mono mb-2">
                  8
                </div>
                <div className="text-small text-ash">Educational Uses</div>
              </div>
              <div className="text-center p-6 bg-obsidian/50 border border-gold/10 rounded-medium">
                <div className="text-display font-display font-bold text-gold font-mono mb-2">
                  1,247
                </div>
                <div className="text-small text-ash">People Reached</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}