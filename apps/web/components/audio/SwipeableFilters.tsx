"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface SwipeableFiltersProps {
  filters: FilterOption[];
  selectedFilters: string[];
  onFilterChange: (filterId: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function SwipeableFilters({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
  className
}: SwipeableFiltersProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollPosition = () => {
    const element = scrollRef.current;
    if (!element) return;

    setCanScrollLeft(element.scrollLeft > 0);
    setCanScrollRight(
      element.scrollLeft < element.scrollWidth - element.clientWidth - 1
    );
  };

  useEffect(() => {
    checkScrollPosition();
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', checkScrollPosition);
      return () => element.removeEventListener('scroll', checkScrollPosition);
    }
  }, [filters]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Filter header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {selectedFilters.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedFilters.length}
            </Badge>
          )}
        </div>
        {selectedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Scrollable filters container */}
      <div className="relative">
        {/* Left gradient overlay */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        )}

        {/* Right gradient overlay */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        )}

        {/* Filter pills */}
        <div
          ref={scrollRef}
          className={cn(
            "flex space-x-2 overflow-x-auto scrollbar-hide pb-2",
            "scroll-smooth snap-x snap-mandatory",
            // Hide scrollbar on all browsers
            "[-ms-overflow-style:none] [scrollbar-width:none]",
            "[&::-webkit-scrollbar]:hidden"
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filters.map((filter) => {
            const isSelected = selectedFilters.includes(filter.id);
            return (
              <Badge
                key={filter.id}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap select-none snap-start",
                  "px-3 py-2 h-8 text-sm transition-all duration-200",
                  "touch-manipulation", // Improves touch responsiveness
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-gray-100 active:bg-gray-200"
                )}
                onClick={() => onFilterChange(filter.id)}
              >
                <span>{filter.label}</span>
                {filter.count !== undefined && (
                  <span 
                    className={cn(
                      "ml-1 text-xs",
                      isSelected ? "text-primary-foreground/80" : "text-gray-500"
                    )}
                  >
                    {filter.count}
                  </span>
                )}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Scroll hint on mobile */}
      {canScrollRight && (
        <div className="md:hidden text-xs text-gray-400 text-center mt-1">
          Swipe to see more filters →
        </div>
      )}
    </div>
  );
}