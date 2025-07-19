"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AudioGrid from "@/components/audio/AudioGrid";
import AudioPlayer from "@/components/audio/AudioPlayer";
import WaveformDisplay from "@/components/audio/WaveformDisplay";
import AudioUploader from "@/components/audio/AudioUploader";
import AudioLibraryFilters, { FilterState } from "@/components/audio/AudioLibraryFilters";
import EnhancedAudioCard from "@/components/audio/EnhancedAudioCard";
import BatchOperations from "@/components/audio/BatchOperations";
import EmptyStates from "@/components/audio/EmptyStates";
import LoadingSkeleton from "@/components/audio/LoadingSkeleton";
import { AudioSample } from "@/lib/types/audio";
import { Upload, Music, Grid3x3, List, Search, Filter, Shuffle, SortAsc, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for audio samples with proper typing
const audioSamples: AudioSample[] = [
  {
    id: "1",
    title: "Mizo Traditional Drum",
    description: "Traditional Mizo drum pattern used in ceremonial dances",
    culturalOrigin: "Mizo",
    instrumentType: "Percussion",
    fileUrl: "/api/audio/samples/1",
    audioUrl: "/api/audio/samples/1",
    artist: "Traditional Mizo Artist",
    duration: 45,
    fileSize: 2200000, // 2.2 MB in bytes
    sampleRate: 44100,
    tags: ["traditional", "ceremonial", "drums"],
    metadata: {
      tempo: 120,
      mood: "energetic",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-15T10:30:00Z"
    },
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    title: "Mizo Flute Melody",
    description: "Soothing flute melody from Mizo folk tradition",
    culturalOrigin: "Mizo",
    instrumentType: "Wind",
    fileUrl: "/api/audio/samples/2",
    audioUrl: "/api/audio/samples/2",
    artist: "Traditional Mizo Artist",
    duration: 38,
    fileSize: 1900000, // 1.9 MB in bytes
    sampleRate: 44100,
    tags: ["traditional", "peaceful", "flute"],
    metadata: {
      tempo: 80,
      mood: "peaceful",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-14T15:45:00Z"
    },
    createdAt: "2024-01-14T15:45:00Z",
    updatedAt: "2024-01-14T15:45:00Z"
  },
  {
    id: "3",
    title: "Mizo String Instrument",
    description: "Traditional Mizo string instrument with authentic tuning",
    culturalOrigin: "Mizo",
    instrumentType: "String",
    fileUrl: "/api/audio/samples/3",
    audioUrl: "/api/audio/samples/3",
    artist: "Traditional Mizo Artist",
    duration: 52,
    fileSize: 2500000, // 2.5 MB in bytes
    sampleRate: 44100,
    tags: ["traditional", "strings", "melodic"],
    metadata: {
      tempo: 100,
      mood: "melodic",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-13T09:15:00Z"
    },
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z"
  },
  {
    id: "4",
    title: "Mizo Vocal Chant",
    description: "Traditional Mizo vocal chant with cultural significance",
    culturalOrigin: "Mizo",
    instrumentType: "Vocal",
    fileUrl: "/api/audio/samples/4",
    audioUrl: "/api/audio/samples/4",
    artist: "Traditional Mizo Artist",
    duration: 67,
    fileSize: 3200000, // 3.2 MB in bytes
    sampleRate: 44100,
    tags: ["traditional", "vocal", "chant"],
    metadata: {
      tempo: 60,
      mood: "ceremonial",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-12T14:20:00Z"
    },
    createdAt: "2024-01-12T14:20:00Z",
    updatedAt: "2024-01-12T14:20:00Z"
  },
  {
    id: "5",
    title: "Mizo Bamboo Flute",
    description: "Handcrafted bamboo flute with natural resonance",
    culturalOrigin: "Mizo",
    instrumentType: "Wind",
    fileUrl: "/api/audio/samples/5",
    audioUrl: "/api/audio/samples/5",
    artist: "Traditional Mizo Artist",
    duration: 41,
    fileSize: 2000000, // 2.0 MB in bytes
    sampleRate: 44100,
    tags: ["traditional", "bamboo", "flute"],
    metadata: {
      tempo: 90,
      mood: "peaceful",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-11T11:30:00Z"
    },
    createdAt: "2024-01-11T11:30:00Z",
    updatedAt: "2024-01-11T11:30:00Z"
  },
  {
    id: "6",
    title: "Mizo Ensemble",
    description: "Traditional ensemble piece with multiple instruments",
    culturalOrigin: "Mizo",
    instrumentType: "Ensemble",
    fileUrl: "/api/audio/samples/6",
    audioUrl: "/api/audio/samples/6",
    artist: "Traditional Mizo Artist",
    duration: 89,
    fileSize: 4300000, // 4.3 MB in bytes
    sampleRate: 44100,
    tags: ["traditional", "ensemble", "complex"],
    metadata: {
      tempo: 110,
      mood: "uplifting",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-10T16:45:00Z"
    },
    createdAt: "2024-01-10T16:45:00Z",
    updatedAt: "2024-01-10T16:45:00Z"
  }
];

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
  const [currentlyPlaying, setCurrentlyPlaying] = useState<AudioSample | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "duration">("newest");
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");

  const filteredSamples = audioSamples.filter(sample => {
    // Search filter
    const matchesSearch = !filters.search || 
      sample.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      sample.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      sample.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
    
    // Instrument type filter
    const matchesInstrument = filters.instrumentTypes.length === 0 || 
      filters.instrumentTypes.some(type => sample.instrumentType.toLowerCase() === type.toLowerCase());
    
    // Mood filter (using tags as proxy for moods)
    const matchesMood = filters.moods.length === 0 || 
      filters.moods.some(mood => sample.tags.some(tag => tag.toLowerCase().includes(mood.toLowerCase())));
    
    // Duration filter
    const matchesDuration = sample.duration >= filters.durationRange[0] && sample.duration <= filters.durationRange[1];
    
    // Cultural origin filter
    const matchesCultural = filters.culturalOrigins.length === 0 || 
      filters.culturalOrigins.some(origin => sample.culturalOrigin.toLowerCase() === origin.toLowerCase());
    
    // BPM filter (using metadata.tempo as proxy)
    const sampleBpm = sample.metadata?.tempo || 120;
    const matchesBpm = sampleBpm >= filters.bpmRange[0] && sampleBpm <= filters.bpmRange[1];
    
    return matchesSearch && matchesInstrument && matchesMood && matchesDuration && matchesCultural && matchesBpm;
  });

  // Sort samples
  const sortedSamples = [...filteredSamples].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.metadata?.uploadedAt || 0).getTime() - new Date(a.metadata?.uploadedAt || 0).getTime();
      case "oldest":
        return new Date(a.metadata?.uploadedAt || 0).getTime() - new Date(b.metadata?.uploadedAt || 0).getTime();
      case "name":
        return a.title.localeCompare(b.title);
      case "duration":
        return b.duration - a.duration;
      default:
        return 0;
    }
  });

  const handleSampleSelect = useCallback((sample: AudioSample) => {
    console.log("Selected sample:", sample);
  }, []);

  const handleSamplePlay = useCallback((sample: AudioSample) => {
    setCurrentlyPlaying(sample);
    console.log("Playing sample:", sample.title);
  }, []);

  const handleUseInGeneration = useCallback((sample: AudioSample) => {
    setSelectedSamples(prev => {
      if (prev.includes(sample.id)) {
        return prev.filter(id => id !== sample.id);
      }
      return [...prev, sample.id];
    });
  }, []);

  const handleFileUpload = useCallback((files: File[]) => {
    console.log("Files uploaded:", files);
    // In a real app, this would upload the files to the server
  }, []);

  const handleFavorite = useCallback((sample: AudioSample) => {
    setFavorites(prev => {
      if (prev.includes(sample.id)) {
        return prev.filter(id => id !== sample.id);
      }
      return [...prev, sample.id];
    });
  }, []);

  const handleBulkDownload = useCallback(async (sampleIds: string[]) => {
    console.log("Bulk downloading:", sampleIds);
    // Simulate download process
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, []);

  const handleCreateCollection = useCallback(async (sampleIds: string[], collectionName: string) => {
    console.log("Creating collection:", collectionName, sampleIds);
    // Simulate collection creation
    await new Promise(resolve => setTimeout(resolve, 1500));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: "",
      instrumentTypes: [],
      moods: [],
      durationRange: [0, 300],
      culturalOrigins: [],
      bpmRange: [60, 180],
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSamples([]);
  }, []);

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        {isLoading ? (
          <LoadingSkeleton variant="header" className="mb-6" />
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Audio Library</h1>
              <p className="text-gray-600 text-lg">Discover and explore cultural sound samples from around the world</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {sortedSamples.length} sample{sortedSamples.length !== 1 ? 's' : ''}
                </Badge>
                {selectedSamples.length > 0 && (
                  <Badge variant="default" className="text-sm px-3 py-1">
                    {selectedSamples.length} selected
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="player" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Player
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {isLoading ? (
              <div className="flex gap-6">
                <LoadingSkeleton variant="filter" className="flex-shrink-0" />
                <div className="flex-1">
                  <LoadingSkeleton variant="card" count={6} />
                </div>
              </div>
            ) : (
              <div className="flex gap-6">
                {/* Filters Sidebar */}
                {showFilters && (
                  <div className="flex-shrink-0 transition-all duration-300">
                    <AudioLibraryFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      totalResults={sortedSamples.length}
                    />
                  </div>
                )}
                
                {/* Main Content */}
                <div className="flex-1 space-y-6">
                  {/* Batch Operations */}
                  <BatchOperations
                    selectedSamples={selectedSamples}
                    allSamples={sortedSamples}
                    onSelectionChange={setSelectedSamples}
                    onBulkDownload={handleBulkDownload}
                    onCreateCollection={handleCreateCollection}
                  />
                  
                  {/* Controls */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                        className="flex items-center gap-2"
                      >
                        {viewMode === "grid" ? (
                          <>
                            <List className="h-4 w-4" />
                            List View
                          </>
                        ) : (
                          <>
                            <Grid3x3 className="h-4 w-4" />
                            Grid View
                          </>
                        )}
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sort by:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name" | "duration")}
                          className="text-sm border rounded px-2 py-1 bg-white"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="name">Name A-Z</option>
                          <option value="duration">Duration</option>
                        </select>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const shuffled = [...sortedSamples].sort(() => Math.random() - 0.5);
                        // In a real app, you'd update the sort order
                        console.log('Shuffling samples:', shuffled);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Shuffle className="h-4 w-4" />
                      Shuffle
                    </Button>
                  </div>

                  {/* Audio Grid/List */}
                  {sortedSamples.length === 0 ? (
                    <EmptyStates
                      type={filters.search || filters.instrumentTypes.length || filters.moods.length ? "filtered-empty" : "no-samples"}
                      searchTerm={filters.search}
                      onClearFilters={clearAllFilters}
                      onUpload={() => setActiveTab('upload')}
                      onExploreLibrary={() => clearAllFilters()}
                    />
                  ) : viewMode === "grid" ? (
                    <div className={cn(
                      "grid gap-6 transition-all duration-300",
                      showFilters ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    )}>
                      {sortedSamples.map((sample) => (
                        <EnhancedAudioCard
                          key={sample.id}
                          sample={sample}
                          isSelected={selectedSamples.includes(sample.id)}
                          isPlaying={currentlyPlaying?.id === sample.id}
                          isFavorited={favorites.includes(sample.id)}
                          onSelect={handleSampleSelect}
                          onPlay={handleSamplePlay}
                          onFavorite={handleFavorite}
                          onAddToProject={handleUseInGeneration}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedSamples.map((sample) => (
                        <EnhancedAudioCard
                          key={sample.id}
                          sample={sample}
                          isSelected={selectedSamples.includes(sample.id)}
                          isPlaying={currentlyPlaying?.id === sample.id}
                          isFavorited={favorites.includes(sample.id)}
                          isListView={true}
                          onSelect={handleSampleSelect}
                          onPlay={handleSamplePlay}
                          onFavorite={handleFavorite}
                          onAddToProject={handleUseInGeneration}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            {audioSamples.length === 0 ? (
              <EmptyStates type="upload-prompt" onUpload={() => {}} />
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">Upload Your Audio Samples</h3>
                  <p className="text-gray-600">
                    Share your cultural music with the community and help preserve cultural heritage
                  </p>
                </div>
                
                <AudioUploader
                  onUpload={handleFileUpload}
                  maxFiles={10}
                  maxFileSize={100 * 1024 * 1024} // 100MB
                  allowedExtensions={['mp3', 'wav', 'ogg', 'm4a', 'flac']}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="player" className="space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center">
                <Music className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Enhanced Audio Player</h3>
                <p className="text-gray-600">
                  Professional audio playback with waveform visualization and cultural context
                </p>
              </div>

              {currentlyPlaying ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <Music className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold">{currentlyPlaying.title}</h4>
                        <p className="text-muted-foreground">{currentlyPlaying.culturalOrigin} • {currentlyPlaying.instrumentType}</p>
                        <div className="flex gap-2 mt-2">
                          {currentlyPlaying.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <AudioPlayer
                      src={currentlyPlaying.fileUrl || currentlyPlaying.audioUrl}
                      title={currentlyPlaying.title}
                      artist={currentlyPlaying.artist || currentlyPlaying.culturalOrigin || 'Unknown Artist'}
                      duration={currentlyPlaying.duration}
                    />
                  </div>
                  
                  <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <h5 className="font-medium mb-4">Waveform Visualization</h5>
                    <WaveformDisplay
                      audioUrl={currentlyPlaying.fileUrl || currentlyPlaying.audioUrl}
                      height={150}
                      waveColor="#e5e7eb"
                      progressColor="#3b82f6"
                      cursorColor="#ef4444"
                    />
                  </div>
                  
                  <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <h5 className="font-medium mb-4">Cultural Context</h5>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentlyPlaying.description}
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyStates 
                  type="no-samples" 
                  onExploreLibrary={() => {
                    // Switch to browse tab
                    const browseTab = document.querySelector('[value="browse"]') as HTMLElement;
                    browseTab?.click();
                  }}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}