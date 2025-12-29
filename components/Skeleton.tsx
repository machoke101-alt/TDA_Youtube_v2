import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-shimmer rounded ${className}`}></div>
);

export const TableSkeleton: React.FC = () => (
  <div className="space-y-4 w-full">
    <div className="flex gap-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-40" />
    </div>
    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-700/30 last:border-0">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  </div>
);

export const SummarySkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);