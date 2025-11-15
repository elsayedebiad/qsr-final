'use client'

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="space-y-4">
        {/* Search Bar Skeleton */}
        <div className="h-14 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
        
        {/* Filters Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
          ))}
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
              <div className="h-10 w-10 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer" />
            </div>
            <div className="h-8 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
            <div className="h-3 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="card p-6 space-y-4">
        {/* Table Header */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
            <div className="h-9 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border">
              {/* Checkbox */}
              <div className="h-5 w-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
              
              {/* Avatar */}
              <div className="h-12 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer flex-shrink-0" />
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                <div className="h-3 w-1/2 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                <div className="h-8 w-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                <div className="h-8 w-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
          <div className="h-10 w-10 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
          <div className="h-10 w-10 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmerAnimation {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer {
          animation: shimmerAnimation 2s infinite linear;
          background: linear-gradient(
            90deg,
            var(--muted) 0%,
            rgba(255, 255, 255, 0.1) 20%,
            var(--muted) 40%,
            var(--muted) 100%
          );
          background-size: 1000px 100%;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
