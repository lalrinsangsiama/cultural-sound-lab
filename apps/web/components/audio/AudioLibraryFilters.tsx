"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  X, 
  Music, 
  Mic, 
  Music2, 
  Volume2,
  Clock,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  search: string;
  instrumentTypes: string[];
  moods: string[];
  durationRange: [number, number];
  culturalOrigins: string[];
  bpmRange: [number, number];
}

interface AudioLibraryFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
  className?: string;
}

const instrumentTypes = [
  { id: "percussion", label: "Percussion", icon: "🥁", color: "bg-red-100 text-red-800" },
  { id: "wind", label: "Wind", icon: "🎺", color: "bg-blue-100 text-blue-800" },
  { id: "string", label: "String", icon: "🎸", color: "bg-green-100 text-green-800" },
  { id: "vocal", label: "Vocal", icon: "🎤", color: "bg-purple-100 text-purple-800" },
  { id: "ensemble", label: "Ensemble", icon: "🎼", color: "bg-orange-100 text-orange-800" },
];

const moodTags = [
  { id: "energetic", label: "Energetic", color: "bg-red-500" },
  { id: "peaceful", label: "Peaceful", color: "bg-blue-500" },
  { id: "ceremonial", label: "Ceremonial", color: "bg-purple-500" },
  { id: "melodic", label: "Melodic", color: "bg-green-500" },
  { id: "uplifting", label: "Uplifting", color: "bg-yellow-500" },
  { id: "meditative", label: "Meditative", color: "bg-indigo-500" },
  { id: "joyful", label: "Joyful", color: "bg-pink-500" },
  { id: "traditional", label: "Traditional", color: "bg-amber-500" },
];

const culturalOrigins = [
  { id: "mizo", label: "Mizo", flag: "🏔️", region: "Northeast India" },
  { id: "naga", label: "Naga", flag: "🏔️", region: "Northeast India" },
  { id: "khasi", label: "Khasi", flag: "🏔️", region: "Northeast India" },
  { id: "manipuri", label: "Manipuri", flag: "🏔️", region: "Northeast India" },
  { id: "assamese", label: "Assamese", flag: "🏔️", region: "Northeast India" },
];

export default function AudioLibraryFilters({ 
  filters, 
  onFiltersChange, 
  totalResults,
  className 
}: AudioLibraryFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    instruments: true,
    moods: true,
    duration: true,
    cultural: true,
    tempo: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  const toggleInstrumentType = (type: string) => {
    const current = filters.instrumentTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateFilters({ instrumentTypes: updated });
  };

  const toggleMood = (mood: string) => {
    const current = filters.moods;
    const updated = current.includes(mood)
      ? current.filter(m => m !== mood)
      : [...current, mood];
    updateFilters({ moods: updated });
  };

  const toggleCulturalOrigin = (origin: string) => {
    const current = filters.culturalOrigins;
    const updated = current.includes(origin)
      ? current.filter(o => o !== origin)
      : [...current, origin];
    updateFilters({ culturalOrigins: updated });
  };

  const clearAllFilters = () => {
    updateFilters({
      search: "",
      instrumentTypes: [],
      moods: [],
      durationRange: [0, 300],
      culturalOrigins: [],
      bpmRange: [60, 180],
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.instrumentTypes.length > 0 || 
    filters.moods.length > 0 || 
    filters.culturalOrigins.length > 0 ||
    filters.durationRange[0] > 0 || 
    filters.durationRange[1] < 300 ||
    filters.bpmRange[0] > 60 || 
    filters.bpmRange[1] < 180;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("w-80 h-fit", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {totalResults} results found
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search samples..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        {/* Instrument Types */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('instruments')}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Instruments
            </div>
            {expandedSections.instruments ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
          
          {expandedSections.instruments && (
            <div className="grid grid-cols-1 gap-2">
              {instrumentTypes.map((instrument) => (
                <Button
                  key={instrument.id}
                  variant="ghost"
                  onClick={() => toggleInstrumentType(instrument.id)}
                  className={cn(
                    "justify-start h-auto p-3",
                    filters.instrumentTypes.includes(instrument.id) && 
                    "bg-primary/10 border border-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-lg">{instrument.icon}</span>
                    <span className="flex-1 text-left">{instrument.label}</span>
                    {filters.instrumentTypes.includes(instrument.id) && (
                      <Badge className={instrument.color} variant="secondary">
                        ✓
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Mood Tags */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('moods')}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Moods
            </div>
            {expandedSections.moods ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
          
          {expandedSections.moods && (
            <div className="flex flex-wrap gap-2">
              {moodTags.map((mood) => (
                <Button
                  key={mood.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMood(mood.id)}
                  className={cn(
                    "h-8 transition-all duration-200",
                    filters.moods.includes(mood.id) 
                      ? `text-white border-transparent shadow-md transform scale-105 ${mood.color}` 
                      : "hover:scale-105"
                  )}
                >
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      filters.moods.includes(mood.id) ? "bg-white" : mood.color
                    )}
                  />
                  {mood.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Duration Range */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('duration')}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration
            </div>
            {expandedSections.duration ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
          
          {expandedSections.duration && (
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={filters.durationRange}
                  onValueChange={(value) => updateFilters({ durationRange: value as [number, number] })}
                  max={300}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatDuration(filters.durationRange[0])}</span>
                <span>{formatDuration(filters.durationRange[1])}</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Cultural Origins */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('cultural')}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cultural Origin
            </div>
            {expandedSections.cultural ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
          
          {expandedSections.cultural && (
            <div className="space-y-2">
              {culturalOrigins.map((origin) => (
                <Button
                  key={origin.id}
                  variant="ghost"
                  onClick={() => toggleCulturalOrigin(origin.id)}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    filters.culturalOrigins.includes(origin.id) && 
                    "bg-primary/10 border border-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-lg">{origin.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{origin.label}</div>
                      <div className="text-xs text-muted-foreground">{origin.region}</div>
                    </div>
                    {filters.culturalOrigins.includes(origin.id) && (
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        ✓
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Tempo/BPM Range */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('tempo')}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              Tempo (BPM)
            </div>
            {expandedSections.tempo ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
          
          {expandedSections.tempo && (
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={filters.bpmRange}
                  onValueChange={(value) => updateFilters({ bpmRange: value as [number, number] })}
                  max={180}
                  min={60}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.bpmRange[0]} BPM</span>
                <span>{filters.bpmRange[1]} BPM</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}