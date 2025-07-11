"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "list" | "filter" | "header";
  count?: number;
  className?: string;
}

const shimmer = `
  position: relative;
  overflow: hidden;
  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    content: '';
  }
  
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
`;

const SkeletonBox = ({ 
  className, 
  animate = true 
}: { 
  className?: string; 
  animate?: boolean;
}) => (
  <div 
    className={cn(
      "bg-gray-200 rounded",
      animate && "animate-pulse",
      className
    )}
    style={animate ? { position: 'relative', overflow: 'hidden' } : {}}
  >
    {animate && (
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
    )}
  </div>
);

const CardSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-3 flex-1">
        <SkeletonBox className="w-6 h-6 rounded-full" animate={animate} />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-5 w-3/4" animate={animate} />
          <SkeletonBox className="h-4 w-1/2" animate={animate} />
        </div>
      </div>
      <SkeletonBox className="w-8 h-8 rounded-full" animate={animate} />
    </div>

    {/* Description */}
    <div className="space-y-2">
      <SkeletonBox className="h-4 w-full" animate={animate} />
      <SkeletonBox className="h-4 w-2/3" animate={animate} />
    </div>

    {/* Waveform placeholder */}
    <div className="flex justify-center py-2">
      <SkeletonBox className="w-20 h-5 rounded" animate={animate} />
    </div>

    {/* Tags */}
    <div className="flex flex-wrap gap-2">
      <SkeletonBox className="h-6 w-16 rounded-full" animate={animate} />
      <SkeletonBox className="h-6 w-20 rounded-full" animate={animate} />
      <SkeletonBox className="h-6 w-14 rounded-full" animate={animate} />
    </div>

    {/* Metadata */}
    <div className="flex justify-between">
      <div className="flex space-x-4">
        <SkeletonBox className="h-4 w-12" animate={animate} />
        <SkeletonBox className="h-4 w-16" animate={animate} />
      </div>
      <SkeletonBox className="h-4 w-12" animate={animate} />
    </div>

    {/* Actions */}
    <div className="space-y-2">
      <div className="flex gap-2">
        <SkeletonBox className="w-12 h-12 rounded-full" animate={animate} />
        <div className="flex-1 grid grid-cols-3 gap-1">
          <SkeletonBox className="h-8 rounded" animate={animate} />
          <SkeletonBox className="h-8 rounded" animate={animate} />
          <SkeletonBox className="h-8 rounded" animate={animate} />
        </div>
      </div>
      <SkeletonBox className="h-10 w-full rounded" animate={animate} />
    </div>
  </div>
);

const ListSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="bg-white rounded-lg border shadow-sm p-4">
    <div className="flex items-center gap-4">
      {/* Play button */}
      <SkeletonBox className="w-12 h-12 rounded-full flex-shrink-0" animate={animate} />
      
      {/* Content */}
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBox className="w-4 h-4 rounded" animate={animate} />
              <SkeletonBox className="h-5 w-48" animate={animate} />
              <SkeletonBox className="h-5 w-16 rounded-full" animate={animate} />
            </div>
            <SkeletonBox className="h-4 w-96" animate={animate} />
            <div className="flex gap-4">
              <SkeletonBox className="h-3 w-12" animate={animate} />
              <SkeletonBox className="h-3 w-16" animate={animate} />
              <SkeletonBox className="h-3 w-14" animate={animate} />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <SkeletonBox className="w-20 h-5 rounded" animate={animate} />
            <div className="flex gap-1">
              <SkeletonBox className="w-8 h-8 rounded" animate={animate} />
              <SkeletonBox className="w-8 h-8 rounded" animate={animate} />
              <SkeletonBox className="w-8 h-8 rounded" animate={animate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FilterSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="bg-white rounded-lg border shadow-sm p-4 space-y-6 w-80">
    {/* Header */}
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-6 w-20" animate={animate} />
      <SkeletonBox className="h-4 w-12" animate={animate} />
    </div>
    
    <SkeletonBox className="h-4 w-24" animate={animate} />

    {/* Search */}
    <SkeletonBox className="h-10 w-full rounded" animate={animate} />

    {/* Filter sections */}
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <SkeletonBox className="h-5 w-24" animate={animate} />
        <div className="grid gap-2">
          {Array.from({ length: 3 }).map((_, j) => (
            <SkeletonBox key={j} className="h-12 w-full rounded" animate={animate} />
          ))}
        </div>
      </div>
    ))}

    {/* Sliders */}
    <div className="space-y-3">
      <SkeletonBox className="h-5 w-20" animate={animate} />
      <SkeletonBox className="h-6 w-full rounded-full" animate={animate} />
      <div className="flex justify-between">
        <SkeletonBox className="h-4 w-8" animate={animate} />
        <SkeletonBox className="h-4 w-8" animate={animate} />
      </div>
    </div>
  </div>
);

const HeaderSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="space-y-6">
    {/* Page header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-48" animate={animate} />
        <SkeletonBox className="h-5 w-64" animate={animate} />
      </div>
      <div className="flex items-center gap-4">
        <SkeletonBox className="h-6 w-20 rounded-full" animate={animate} />
        <SkeletonBox className="h-6 w-16 rounded-full" animate={animate} />
      </div>
    </div>

    {/* Tab navigation */}
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
      <SkeletonBox className="h-9 w-32 rounded" animate={animate} />
      <SkeletonBox className="h-9 w-28 rounded" animate={animate} />
      <SkeletonBox className="h-9 w-24 rounded" animate={animate} />
    </div>

    {/* Search and filters */}
    <div className="flex gap-4">
      <SkeletonBox className="h-10 flex-1 rounded" animate={animate} />
      <SkeletonBox className="h-10 w-10 rounded" animate={animate} />
      <div className="flex gap-1">
        <SkeletonBox className="h-10 w-16 rounded" animate={animate} />
        <SkeletonBox className="h-10 w-20 rounded" animate={animate} />
        <SkeletonBox className="h-10 w-18 rounded" animate={animate} />
        <SkeletonBox className="h-10 w-22 rounded" animate={animate} />
      </div>
    </div>
  </div>
);

// Staggered animation for multiple items
const StaggeredSkeletons = ({ 
  children, 
  stagger = 100 
}: { 
  children: React.ReactNode[]; 
  stagger?: number;
}) => (
  <>
    {children.map((child, index) => (
      <div
        key={index}
        style={{
          animationDelay: `${index * stagger}ms`,
          animationFillMode: 'both',
        }}
        className="animate-fade-in"
      >
        {child}
      </div>
    ))}
  </>
);

export default function LoadingSkeleton({
  variant = "card",
  count = 6,
  className
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => {
    switch (variant) {
      case "card":
        return <CardSkeleton key={i} />;
      case "list":
        return <ListSkeleton key={i} />;
      case "filter":
        return <FilterSkeleton key={i} />;
      case "header":
        return <HeaderSkeleton key={i} />;
      default:
        return <CardSkeleton key={i} />;
    }
  });

  if (variant === "filter" || variant === "header") {
    return <div className={className}>{skeletons[0]}</div>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {variant === "card" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StaggeredSkeletons>{skeletons}</StaggeredSkeletons>
        </div>
      )}
      
      {variant === "list" && (
        <div className="space-y-3">
          <StaggeredSkeletons stagger={75}>{skeletons}</StaggeredSkeletons>
        </div>
      )}
    </div>
  );
}

// Individual skeleton components for reuse
export { CardSkeleton, ListSkeleton, FilterSkeleton, HeaderSkeleton, SkeletonBox };