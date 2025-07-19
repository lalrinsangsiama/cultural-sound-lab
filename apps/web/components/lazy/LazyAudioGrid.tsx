"use client";

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AudioGridProps } from '@/lib/types/audio';

const AudioGrid = lazy(() => import('@/components/audio/AudioGrid'));

const AudioGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

interface LazyAudioGridProps extends AudioGridProps {
  [key: string]: any;
}

export default function LazyAudioGrid(props: LazyAudioGridProps) {
  return (
    <Suspense fallback={<AudioGridSkeleton />}>
      <AudioGrid {...props} />
    </Suspense>
  );
}