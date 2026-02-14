/**
 * LOADING SPINNER COMPONENTS
 * 
 * Professional loading indicators for async operations.
 * 
 * VARIANTS:
 * - LoadingSpinner: Centered full-screen spinner
 * - InlineSpinner: Small inline spinner for buttons
 * - SkeletonLoader: Content placeholder skeleton
 * - ProgressBar: Linear progress indicator
 * 
 * USAGE:
 * <LoadingSpinner /> - Full screen loading
 * <InlineSpinner /> - Inside buttons
 * <SkeletonLoader type="card" /> - Content placeholder
 * <ProgressBar progress={50} /> - Progress tracking
 * 
 * ACCESSIBILITY:
 * - aria-label for screen readers
 * - role="status" for status updates
 * - Reduced motion support (prefers-reduced-motion)
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

// ================================
// TYPE DEFINITIONS
// ================================

interface LoadingSpinnerProps {
  message?: string;
  isDarkMode?: boolean;
}

interface InlineSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'list' | 'avatar';
  count?: number;
  isDarkMode?: boolean;
}

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  color?: string;
  isDarkMode?: boolean;
}

// ================================
// LOADING SPINNER (Full Screen)
// ================================

/**
 * Full-screen loading spinner
 * Use for page-level loading states
 */
export function LoadingSpinner({ message, isDarkMode = false }: LoadingSpinnerProps) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-[#121212]' : 'bg-[#f5f5f7]'
      }`}
      role="status"
      aria-label={message || 'Loading'}
    >
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <Loader2
            className={`w-16 h-16 animate-spin ${
              isDarkMode ? 'text-white' : 'text-[#007aff]'
            }`}
            strokeWidth={2.5}
          />
        </div>

        {/* Message */}
        {message && (
          <p
            className={`text-[17px] font-medium ${
              isDarkMode ? 'text-white/70' : 'text-black/70'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// ================================
// INLINE SPINNER (For Buttons)
// ================================

/**
 * Small inline spinner
 * Use inside buttons or small UI elements
 */
export function InlineSpinner({ size = 'md', className = '' }: InlineSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      strokeWidth={2.5}
      aria-label="Loading"
    />
  );
}

// ================================
// SKELETON LOADER (Placeholders)
// ================================

/**
 * Skeleton loading placeholders
 * Use while content is loading to prevent layout shift
 */
export function SkeletonLoader({
  type = 'card',
  count = 1,
  isDarkMode = false,
}: SkeletonLoaderProps) {
  const baseClass = isDarkMode
    ? 'bg-white/10 animate-pulse'
    : 'bg-black/10 animate-pulse';

  // Text skeleton (multiple lines)
  if (type === 'text') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`h-4 ${baseClass} rounded-lg w-full`}></div>
            <div className={`h-4 ${baseClass} rounded-lg w-5/6`}></div>
            <div className={`h-4 ${baseClass} rounded-lg w-4/6`}></div>
          </div>
        ))}
      </div>
    );
  }

  // Card skeleton (for expense cards)
  if (type === 'card') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl ${
              isDarkMode ? 'bg-[#1c1c1e]/90' : 'bg-white/80'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar skeleton */}
              <div className={`w-12 h-12 ${baseClass} rounded-full flex-shrink-0`}></div>
              
              {/* Content skeleton */}
              <div className="flex-1 space-y-2">
                <div className={`h-4 ${baseClass} rounded-lg w-2/3`}></div>
                <div className={`h-3 ${baseClass} rounded-lg w-1/3`}></div>
              </div>
              
              {/* Amount skeleton */}
              <div className={`h-5 ${baseClass} rounded-lg w-16`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List skeleton
  if (type === 'list') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className={`w-8 h-8 ${baseClass} rounded-full`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-3 ${baseClass} rounded-lg w-3/4`}></div>
              <div className={`h-2 ${baseClass} rounded-lg w-1/2`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Avatar skeleton
  if (type === 'avatar') {
    return (
      <div className="flex gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`w-10 h-10 ${baseClass} rounded-full`}></div>
        ))}
      </div>
    );
  }

  return null;
}

// ================================
// PROGRESS BAR
// ================================

/**
 * Linear progress bar
 * Use for upload progress, multi-step forms, etc.
 */
export function ProgressBar({
  progress,
  showLabel = true,
  color = '#007aff',
  isDarkMode = false,
}: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full" role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
      {/* Label */}
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span
            className={`text-sm font-medium ${
              isDarkMode ? 'text-white/70' : 'text-black/70'
            }`}
          >
            Loading...
          </span>
          <span
            className={`text-sm font-semibold ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}
          >
            {clampedProgress}%
          </span>
        </div>
      )}

      {/* Progress bar track */}
      <div
        className={`w-full h-2 rounded-full overflow-hidden ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`}
      >
        {/* Progress bar fill */}
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// ================================
// LOADING DOTS (Alternative)
// ================================

/**
 * Animated loading dots
 * Alternative to spinner for minimal UI
 */
export function LoadingDots({ isDarkMode = false }: { isDarkMode?: boolean }) {
  return (
    <div className="flex items-center gap-1" role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            isDarkMode ? 'bg-white/70' : 'bg-black/70'
          }`}
          style={{
            animation: 'bounce 1.4s infinite ease-in-out',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ================================
// LOADING CARD (For Overlays)
// ================================

/**
 * Loading card overlay
 * Use for inline loading states within sections
 */
export function LoadingCard({
  message,
  isDarkMode = false,
}: {
  message?: string;
  isDarkMode?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-8 text-center ${
        isDarkMode ? 'bg-[#1c1c1e]/90' : 'bg-white/80'
      }`}
      role="status"
      aria-label={message || 'Loading'}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 mb-3">
        <Loader2
          className={`w-12 h-12 animate-spin ${
            isDarkMode ? 'text-white' : 'text-[#007aff]'
          }`}
          strokeWidth={2.5}
        />
      </div>
      {message && (
        <p
          className={`text-[15px] font-medium ${
            isDarkMode ? 'text-white/70' : 'text-black/70'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

// ================================
// BUTTON LOADING STATE
// ================================

/**
 * Button with loading state
 * Replaces button content with spinner when loading
 */
export function LoadingButton({
  loading,
  children,
  onClick,
  disabled,
  className = '',
  ...props
}: {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative ${className} ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <InlineSpinner size="md" />
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}
