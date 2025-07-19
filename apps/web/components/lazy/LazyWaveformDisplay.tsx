"use client";

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const WaveformDisplay = lazy(() => import('@/components/audio/WaveformDisplay'));

const WaveformSkeleton = () => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-16 w-full rounded-md" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);

interface LazyWaveformDisplayProps {
  [key: string]: any;
}

export default function LazyWaveformDisplay(props: LazyWaveformDisplayProps) {
  return (
    <Suspense fallback={<WaveformSkeleton />}>
      <WaveformDisplay {...props} />
    </Suspense>
  );
}