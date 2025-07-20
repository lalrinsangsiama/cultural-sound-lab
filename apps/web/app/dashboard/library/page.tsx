"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, SearchInput, Card, AudioCard } from "@repo/ui";
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
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        {isLoading ? (
          <LoadingSkeleton variant="header" className="mb-6" />
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-h1 font-display font-bold text-white mb-3">Audio Library</h1>
              <p className="text-body text-ash max-w-2xl">Discover and explore cultural sound samples from around the world</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-charcoal rounded-medium border border-slate">
                  <span className="text-small text-silver font-mono">
                    {sortedSamples.length} sample{sortedSamples.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {selectedSamples.length > 0 && (
                  <div className="px-4 py-2 bg-gold/10 border border-gold/20 rounded-medium">
                    <span className="text-small text-gold font-mono">
                      {selectedSamples.length} selected
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
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
          <div className="flex items-center gap-2 mb-8 bg-charcoal p-2 rounded-medium border border-slate w-fit">
            <TabsTrigger 
              value="browse" 
              className="flex items-center gap-2 px-6 py-3 rounded-small bg-transparent text-ash hover:text-white data-[state=active]:bg-gold data-[state=active]:text-obsidian font-medium transition-all"
            >
              <Music className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="flex items-center gap-2 px-6 py-3 rounded-small bg-transparent text-ash hover:text-white data-[state=active]:bg-gold data-[state=active]:text-obsidian font-medium transition-all"
            >
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger 
              value="player" 
              className="flex items-center gap-2 px-6 py-3 rounded-small bg-transparent text-ash hover:text-white data-[state=active]:bg-gold data-[state=active]:text-obsidian font-medium transition-all"
            >
              <Music className="h-4 w-4" />
              Player
            </TabsTrigger>
          </div>

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
                  <div className="flex justify-between items-center p-6 bg-charcoal rounded-medium border border-slate">
                    <div className="flex items-center gap-6">
                      <Button
                        variant="secondary"
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
                      
                      <div className="flex items-center gap-3">
                        <span className="text-small text-silver">Sort by:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name" | "duration")}
                          className="input-refined text-small py-2 px-3 bg-slate border-iron focus:border-gold"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="name">Name A-Z</option>
                          <option value="duration">Duration</option>
                        </select>
                      </div>
                    </div>
                    
                    <Button
                      variant="secondary"
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
                        <AudioCard
                          key={sample.id}
                          title={sample.title}
                          artist={sample.artist || sample.culturalOrigin}
                          duration={`${Math.floor(sample.duration / 60)}:${(sample.duration % 60).toString().padStart(2, '0')}`}
                          culture={sample.culturalOrigin}
                          isPlaying={currentlyPlaying?.id === sample.id}
                          onPlay={() => handleSamplePlay(sample)}
                          className="hover-lift"
                        >
                          <div className="mt-4 space-y-2">
                            <p className="text-caption text-ash line-clamp-2">{sample.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {sample.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-slate text-ash text-caption rounded-small">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </AudioCard>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedSamples.map((sample) => (
                        <div key={sample.id} className="card-refined p-6">
                          <div className="flex items-center gap-6">
                            <div className="flex-1">
                              <h3 className="text-h4 font-medium text-white">{sample.title}</h3>
                              <p className="text-small text-silver">{sample.artist || sample.culturalOrigin}</p>
                              <p className="text-caption text-ash mt-1">{sample.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-caption text-ash font-mono">
                                {Math.floor(sample.duration / 60)}:{(sample.duration % 60).toString().padStart(2, '0')}
                              </span>
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => handleSamplePlay(sample)}
                                className="w-10 h-10 rounded-full p-0"
                              >
                                {currentlyPlaying?.id === sample.id ? (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-8">
            {audioSamples.length === 0 ? (
              <EmptyStates type="upload-prompt" onUpload={() => {}} />
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gold rounded-medium flex items-center justify-center">
                    <Upload className="h-8 w-8 text-obsidian" />
                  </div>
                  <h3 className="text-h2 font-display font-bold text-white">Upload Your Audio Samples</h3>
                  <p className="text-body text-ash max-w-xl mx-auto">
                    Share your cultural music with the community and help preserve cultural heritage for future generations
                  </p>
                </div>
                
                <div className="studio-panel">
                  <AudioUploader
                    onUpload={handleFileUpload}
                    maxFiles={10}
                    maxFileSize={100 * 1024 * 1024} // 100MB
                    allowedExtensions={['mp3', 'wav', 'ogg', 'm4a', 'flac']}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="player" className="space-y-8">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gold rounded-medium flex items-center justify-center">
                  <Music className="h-8 w-8 text-obsidian" />
                </div>
                <h3 className="text-h2 font-display font-bold text-white">Enhanced Audio Player</h3>
                <p className="text-body text-ash max-w-2xl mx-auto">
                  Professional audio playback with waveform visualization and cultural context
                </p>
              </div>

              {currentlyPlaying ? (
                <div className="space-y-8">
                  <div className="studio-panel">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-champagne/20 rounded-medium flex items-center justify-center border border-gold/20">
                        <Music className="h-10 w-10 text-gold" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-h3 font-bold text-white">{currentlyPlaying.title}</h4>
                        <p className="text-body text-silver">{currentlyPlaying.culturalOrigin} • {currentlyPlaying.instrumentType}</p>
                        <div className="flex gap-2 mt-3">
                          {currentlyPlaying.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-slate text-ash text-small rounded-small">
                              {tag}
                            </span>
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
                  
                  <div className="studio-panel">
                    <h5 className="text-h4 font-bold text-white mb-6">Waveform Visualization</h5>
                    <div className="spectrum-analyzer">
                      <WaveformDisplay
                        audioUrl={currentlyPlaying.fileUrl || currentlyPlaying.audioUrl}
                        height={150}
                        waveColor="#2A2A2A"
                        progressColor="#D4AF37"
                        cursorColor="#DC2626"
                      />
                    </div>
                  </div>
                  
                  <div className="studio-panel">
                    <h5 className="text-h4 font-bold text-white mb-6">Cultural Context</h5>
                    <p className="text-body text-ash leading-relaxed">
                      {currentlyPlaying.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto bg-charcoal rounded-medium flex items-center justify-center mb-6">
                    <Music className="h-12 w-12 text-silver" />
                  </div>
                  <h4 className="text-h3 font-bold text-white mb-3">No Audio Selected</h4>
                  <p className="text-body text-ash mb-6">Select a sample from the Browse tab to start listening</p>
                  <Button
                    variant="gold"
                    onClick={() => {
                      // Switch to browse tab
                      const browseTab = document.querySelector('[value="browse"]') as HTMLElement;
                      browseTab?.click();
                    }}
                  >
                    Explore Library
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}