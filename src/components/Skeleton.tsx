import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  key?: React.Key;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "shimmer rounded-xl",
        className
      )} 
    />
  );
}

export function GroupDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back Button Skeleton */}
      <Skeleton className="h-6 w-48" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <Skeleton className="h-48 rounded-none" />
            <div className="p-6 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
            <Skeleton className="h-6 w-1/2" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-48 rounded-[2.5rem]" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-3xl border border-slate-100" />
            ))}
          </div>
          <Skeleton className="h-20 rounded-[2.5rem] border border-slate-100" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-[2.5rem] border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
