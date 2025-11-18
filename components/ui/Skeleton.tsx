/**
 * Skeleton Component - Enterprise Design System
 * Loading placeholders with shimmer animation
 */

import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const shimmerAnimation = `
    relative overflow-hidden
    before:absolute before:inset-0
    before:-translate-x-full
    before:animate-[shimmer_2s_infinite]
    before:bg-gradient-to-r
    before:from-transparent before:via-white/60 before:to-transparent
  `;

  const widthStyle = width
    ? typeof width === 'number'
      ? { width: `${width}px` }
      : { width }
    : {};

  const heightStyle = height
    ? typeof height === 'number'
      ? { height: `${height}px` }
      : { height }
    : {};

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`
              bg-gray-200
              ${variantStyles[variant]}
              ${shimmerAnimation}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            style={{ ...widthStyle, ...heightStyle }}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        bg-gray-200
        ${variantStyles[variant]}
        ${shimmerAnimation}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={{ ...widthStyle, ...heightStyle }}
      {...props}
    />
  );
}

// Compound components for common patterns
export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton count={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 grid grid-cols-4 gap-4">
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-start gap-4">
          <Skeleton variant="rectangular" width={80} height={80} />
          <div className="flex-1 space-y-3">
            <Skeleton width="80%" />
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Add shimmer keyframe to global CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(style);
}
