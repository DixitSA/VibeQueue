import React from 'react';

export default function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-1 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-full h-[80px] bg-cream/5 rounded-sm mb-3 flex items-center px-4 gap-4 border border-cream/5">
          {/* Album Art Skeleton */}
          <div className="w-12 h-12 bg-cream/10 rounded-xs flex-shrink-0" />
          
          {/* Metadata Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-cream/10 rounded w-3/4" />
            <div className="h-2 bg-cream/5 rounded w-1/2" />
          </div>
          
          {/* Upvotes Skeleton */}
          <div className="w-10 h-10 bg-cream/5 rounded-sm border-l border-cream/10 ml-4" />
        </div>
      ))}
    </div>
  );
}
