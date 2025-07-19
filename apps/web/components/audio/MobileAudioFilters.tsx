"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SwipeableFilters } from "./SwipeableFilters";
import { FilterState } from "./AudioLibraryFilters";
import { 
  Search, 
  Filter,
  X,
  Music,
  Volume2,
  Clock,
  MapPin,
  SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileAudioFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
  className?: string;
}

const instrumentTypes = [
  { id: "percussion", label: "Percussion", count: 8 },
  { id: "wind", label: "Wind", count: 5 },
  { id: "string", label: "String", count: 12 },
  { id: "vocal", label: "Vocal", count: 6 },
  { id: "ensemble", label: "Ensemble", count: 3 },
];

const moodTags = [
  { id: "energetic", label: "Energetic", count: 15 },
  { id: "peaceful", label: "Peaceful", count: 12 },
  { id: "ceremonial", label: "Ceremonial", count: 8 },
  { id: "melodic", label: "Melodic", count: 18 },
  { id: "uplifting", label: "Uplifting", count: 10 },
  { id: "meditative", label: "Meditative", count: 7 },
  { id: "joyful", label: "Joyful", count: 14 },
  { id: "traditional", label: "Traditional", count: 20 },
];

const culturalOrigins = [
  { id: "mizo", label: "Mizo", count: 8 },
  { id: "naga", label: "Naga", count: 0 },
  { id: "khasi", label: "Khasi", count: 0 },
  { id: "manipuri", label: "Manipuri", count: 0 },
  { id: "assamese", label: "Assamese", count: 0 },
];

export function MobileAudioFilters({
  filters,
  onFiltersChange,
  totalResults,
  className
}: MobileAudioFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

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

  const activeFilterCount = 
    filters.instrumentTypes.length + 
    filters.moods.length + 
    filters.culturalOrigins.length +
    (filters.search ? 1 : 0) +
    (filters.durationRange[0] > 0 || filters.durationRange[1] < 300 ? 1 : 0) +
    (filters.bpmRange[0] > 60 || filters.bpmRange[1] < 180 ? 1 : 0);

  return (
    <div className={cn("md:hidden", className)}>
      {/* Mobile Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search samples..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-9 pr-16 h-12 text-base"
        />
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <div className="flex flex-col h-full">
              <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter Samples
                  </SheetTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground text-left">
                  {totalResults} results found
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Instrument Types */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <h3 className="font-medium">Instruments</h3>
                  </div>
                  <SwipeableFilters
                    filters={instrumentTypes}
                    selectedFilters={filters.instrumentTypes}
                    onFilterChange={toggleInstrumentType}
                    onClearAll={() => updateFilters({ instrumentTypes: [] })}
                  />
                </div>

                {/* Moods */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <h3 className="font-medium">Moods</h3>
                  </div>
                  <SwipeableFilters
                    filters={moodTags}
                    selectedFilters={filters.moods}
                    onFilterChange={toggleMood}
                    onClearAll={() => updateFilters({ moods: [] })}
                  />
                </div>

                {/* Cultural Origins */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <h3 className="font-medium">Cultural Origin</h3>
                  </div>
                  <SwipeableFilters
                    filters={culturalOrigins}
                    selectedFilters={filters.culturalOrigins}
                    onFilterChange={toggleCulturalOrigin}
                    onClearAll={() => updateFilters({ culturalOrigins: [] })}
                  />
                </div>
              </div>

              {/* Apply Button */}
              <div className="border-t p-4 flex-shrink-0">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full h-12 text-base"
                >
                  Apply Filters ({totalResults} results)
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs text-red-600"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Search className="h-3 w-3" />
                "{filters.search}"
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters({ search: "" })}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            {filters.instrumentTypes.map(type => (
              <div key={type} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {instrumentTypes.find(i => i.id === type)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleInstrumentType(type)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {filters.moods.map(mood => (
              <div key={mood} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {moodTags.find(m => m.id === mood)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMood(mood)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {filters.culturalOrigins.map(origin => (
              <div key={origin} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {culturalOrigins.find(o => o.id === origin)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCulturalOrigin(origin)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}