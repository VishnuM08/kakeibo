import { Trash2, Edit3, LucideIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

/**
 * Swipeable Expense Item Component
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 * ═══════════════════════════════════════════════════════════════════════════
 * Provides iOS-style swipe gestures for quick actions on expense items:
 * - Swipe left to reveal Edit and Delete buttons
 * - Smooth animations and haptic-like feedback
 * - Auto-close on outside tap
 * 
 * USAGE:
 * Wrap expense item content with this component to add swipe functionality
 */

interface SwipeableExpenseItemProps {
  onEdit: () => void;
  onDelete: () => void;
  isDarkMode?: boolean;
  children: React.ReactNode;
}

export function SwipeableExpenseItem({
  onEdit,
  onDelete,
  isDarkMode = false,
  children,
}: SwipeableExpenseItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const MAX_SWIPE = 160; // Width for both buttons

  // Reset swipe on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSwipeOffset(0);
      }
    };

    if (swipeOffset !== 0) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [swipeOffset]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX.current - currentX;
    
    // Only allow left swipe, clamp to MAX_SWIPE
    const newOffset = Math.max(0, Math.min(MAX_SWIPE, diff));
    setSwipeOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to open or closed based on threshold
    if (swipeOffset > MAX_SWIPE / 2) {
      setSwipeOffset(MAX_SWIPE);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = startX.current - currentX;
    
    const newOffset = Math.max(0, Math.min(MAX_SWIPE, diff));
    setSwipeOffset(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (swipeOffset > MAX_SWIPE / 2) {
      setSwipeOffset(MAX_SWIPE);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleEditClick = () => {
    setSwipeOffset(0);
    onEdit();
  };

  const handleDeleteClick = () => {
    setSwipeOffset(0);
    onDelete();
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
    >
      {/* Action Buttons (Hidden behind) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center">
        <button
          onClick={handleEditClick}
          className="h-full w-20 bg-[#0a84ff] flex items-center justify-center transition-opacity"
          style={{ opacity: swipeOffset > 0 ? 1 : 0 }}
        >
          <Edit3 className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
        <button
          onClick={handleDeleteClick}
          className="h-full w-20 bg-[#ff3b30] flex items-center justify-center transition-opacity"
          style={{ opacity: swipeOffset > 0 ? 1 : 0 }}
        >
          <Trash2 className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Swipeable Content */}
      <div
        className={`relative transition-transform ${
          isDragging ? '' : 'duration-300 ease-out'
        }`}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>
    </div>
  );
}
