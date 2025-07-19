"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AudioGrid from "@/components/audio/AudioGrid";
import AudioLibraryFilters, { FilterState } from "@/components/audio/AudioLibraryFilters";
import { MobileAudioFilters } from "@/components/audio/MobileAudioFilters";
import MobileAudioPlayer from "@/components/audio/MobileAudioPlayer";
import { MobileEnhancements } from "@/components/ui/mobile-enhancements";
import { Play, Pause, Download, Info, Music2, DollarSign, RefreshCw } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { AudioSample } from "@/lib/types/audio";
import mizoSamplesData from "@/../../assets/sample-audio/mizo-samples.json";

// Transform the Mizo samples data to match our component structure
interface MizoSample {
  id: string;
  name: string;
  description: string;
  culture: string;
  instrument: string;
  duration: number;
  tags: string[];
  culturalContext: any;
  preview: string;
  waveform: string;
  price: {
    personal: number;
    commercial: number;
    enterprise: number;
  };
  bpm?: number;
  key?: string | null;
}

const audioSamples: AudioSample[] = mizoSamplesData.samples.map((sample: MizoSample) => ({
  id: sample.id,
  title: sample.name,
  description: sample.description,
  culturalOrigin: sample.culture,
  instrumentType: sample.instrument,
  duration: sample.duration,
  tags: sample.tags,
  culturalContext: sample.culturalContext,
  previewUrl: sample.preview,
  waveformUrl: sample.waveform,
  price: sample.price?.personal || 5, // Use personal price as default
  bpm: sample.bpm,
  key: sample.key || undefined,
  artist: "Traditional Mizo Artist", // Fixed artist since performer is not in the data
  audioUrl: sample.preview || "", // Using preview as audio URL for now
  fileSize: 2048000, // Mock file size
  sampleRate: 44100, // Mock sample rate
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export default function LibraryPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    instrumentTypes: [],
    moods: [],
    durationRange: [0, 300],
    culturalOrigins: [],
    bpmRange: [60, 180],
  });
  
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [playingSample, setPlayingSample] = useState<AudioSample | null>(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredSamples = audioSamples.filter(sample => {
    // Search filter
    const matchesSearch = !filters.search || 
      sample.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      sample.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      sample.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
    
    // Instrument type filter
    const matchesInstrument = filters.instrumentTypes.length === 0 || 
      filters.instrumentTypes.includes(sample.instrumentType.toLowerCase());
    
    // Mood filter
    const matchesMood = filters.moods.length === 0 || 
      filters.moods.some(mood => sample.tags.some(tag => tag.toLowerCase().includes(mood.toLowerCase())));
    
    // Cultural origin filter
    const matchesCulture = filters.culturalOrigins.length === 0 || 
      filters.culturalOrigins.includes(sample.culturalOrigin.toLowerCase());
    
    // Duration filter
    const matchesDuration = sample.duration >= filters.durationRange[0] && 
      sample.duration <= filters.durationRange[1];
    
    // BPM filter (if sample has BPM)
    const matchesBpm = !sample.bpm || 
      (sample.bpm >= filters.bpmRange[0] && sample.bpm <= filters.bpmRange[1]);
    
    return matchesSearch && matchesInstrument && matchesMood && matchesCulture && matchesDuration && matchesBpm;
  });

  const handleSampleSelect = (sample: AudioSample) => {
    setSelectedSamples(prev => 
      prev.includes(sample.id) 
        ? prev.filter(id => id !== sample.id)
        : [...prev, sample.id]
    );
  };

  const handleSamplePlay = (sample: AudioSample) => {
    if (playingSample?.id === sample.id) {
      setPlayingSample(null);
    } else {
      setPlayingSample(sample);
      setIsPlayerMinimized(false);
    }
  };

  const handleUseInGeneration = (sample: AudioSample) => {
    // Add sample to generation workflow
    setSelectedSamples(prev => 
      prev.includes(sample.id) ? prev : [...prev, sample.id]
    );
    console.log(`Added ${sample.title} to generation queue`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Reset filters on refresh
    setFilters({
      search: "",
      instrumentTypes: [],
      moods: [],
      durationRange: [0, 300],
      culturalOrigins: [],
      bpmRange: [60, 180],
    });
    setIsRefreshing(false);
  };

  return (
    <MobileEnhancements
      enablePullToRefresh={true}
      enableHapticFeedback={true}
      enableOrientationHandling={true}
      onRefresh={handleRefresh}
      className="space-y-4 md:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Audio Library</h2>
          <p className="text-gray-600 text-sm md:text-base">Browse and preview cultural sound samples</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {filteredSamples.length} samples
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden sm:flex"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden md:block">
          <AudioLibraryFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalResults={filteredSamples.length}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Mobile Filters */}
          <MobileAudioFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalResults={filteredSamples.length}
          />

          {/* Audio Grid */}
          <AudioGrid
            samples={filteredSamples}
            columns={3}
            onSampleSelect={handleSampleSelect}
            onSamplePlay={handleSamplePlay}
            onUseInGeneration={handleUseInGeneration}
            selectedSamples={selectedSamples}
            loading={isRefreshing}
          />

          {filteredSamples.length === 0 && !isRefreshing && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Music2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No samples found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    search: "",
                    instrumentTypes: [],
                    moods: [],
                    durationRange: [0, 300],
                    culturalOrigins: [],
                    bpmRange: [60, 180],
                  })}
                >
                  Clear all filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Audio Player */}
      {playingSample && (
        <MobileAudioPlayer
          src={playingSample.audioUrl}
          title={playingSample.title}
          artist={playingSample.artist}
          duration={playingSample.duration}
          isMinimized={isPlayerMinimized}
          onToggleMinimize={() => setIsPlayerMinimized(!isPlayerMinimized)}
          onPlay={() => console.log(`Playing ${playingSample.title}`)}
          onPause={() => console.log(`Paused ${playingSample.title}`)}
          onEnded={() => setPlayingSample(null)}
        />
      )}
    </MobileEnhancements>
  );
}