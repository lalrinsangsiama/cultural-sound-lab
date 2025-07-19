"use client";

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MultiStepGenerationForm = lazy(() => import('@/components/generation/MultiStepGenerationForm'));

const GenerationFormSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

interface LazyGenerationFormProps {
  [key: string]: any;
}

export default function LazyGenerationForm(props: LazyGenerationFormProps) {
  return (
    <Suspense fallback={<GenerationFormSkeleton />}>
      <MultiStepGenerationForm {...props} />
    </Suspense>
  );
}