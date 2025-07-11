"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, Info, Music2, DollarSign } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import mizoSamplesData from "@/../../assets/sample-audio/mizo-samples.json";

// Transform the Mizo samples data to match our component structure
const audioSamples = mizoSamplesData.samples.map((sample) => ({
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
  price: sample.price,
  bpm: sample.bpm,
  key: sample.key
}));

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filteredSamples = audioSamples.filter(sample => {
    const matchesSearch = sample.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sample.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sample.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === "all" || sample.instrumentType.toLowerCase() === selectedFilter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const handlePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      // In a real app, you'd integrate with an audio player here
      console.log(`Playing audio sample ${id}`);
    }
  };

  // Get unique instrument types from the samples
  const uniqueInstruments = [...new Set(audioSamples.map(s => s.instrumentType))];
  const instrumentTypes = ["all", ...uniqueInstruments];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Audio Library</h2>
          <p className="text-gray-600">Browse and preview cultural sound samples</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary">{filteredSamples.length} samples</Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search samples, instruments, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {instrumentTypes.map((type) => (
            <Button
              key={type}
              variant={selectedFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(type)}
            >
              {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Audio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSamples.map((sample) => (
          <Card key={sample.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{sample.title}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {sample.culturalOrigin} • {sample.instrumentType}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePlay(sample.id)}
                  className="ml-2"
                >
                  {playingId === sample.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{sample.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {sample.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Music2 className="h-3 w-3" />
                  <span>{formatDuration(sample.duration)}</span>
                </div>
                {sample.bpm && (
                  <div className="flex items-center gap-1">
                    <span>{sample.bpm} BPM</span>
                  </div>
                )}
                {sample.key && (
                  <div className="flex items-center gap-1">
                    <span>Key: {sample.key}</span>
                  </div>
                )}
                {sample.culturalContext && (
                  <div className="flex items-center gap-1">
                    <span>{sample.culturalContext.year}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-3 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Personal Use</span>
                  <span className="font-semibold">${sample.price.personal}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Info className="h-3 w-3 mr-1" />
                  Details
                </Button>
                <Button size="sm" className="flex-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  License
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSamples.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No samples found matching your criteria.</p>
          <Button variant="outline" onClick={() => {
            setSearchTerm("");
            setSelectedFilter("all");
          }} className="mt-4">
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}