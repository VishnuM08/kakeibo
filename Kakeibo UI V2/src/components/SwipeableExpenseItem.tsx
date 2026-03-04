import { Trash2, Edit3 } from "lucide-react";
import { useState, useRef, useEffect, forwardRef } from "react";

/**
 * Swipeable Expense Item Component
 *
 * Includes "Direct Swipe to Delete" (Feature 3):
 * If swiped past 220px, the item highlights red and deletes on release.
 */

interface SwipeableExpenseItemProps {
  onEdit: () => void;
  onDelete: () => void;
  isDarkMode?: boolean;
  children: React.ReactNode;
}

export const SwipeableExpenseItem = forwardRef<
  HTMLDivElement,
  SwipeableExpenseItemProps
>(({ onEdit, onDelete, isDarkMode = false, children }, ref) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const hasMoved = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_SWIPE = 160;
  const DELETE_THRESHOLD = MAX_SWIPE + 60; // 220px

  // Reset swipe on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSwipeOffset(0);
      }
    };

    if (swipeOffset !== 0) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside as any);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside as any);
    };
  }, [swipeOffset]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX + swipeOffset;
    startY.current = e.touches[0].clientY;
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    // Check if it's a real swipe vs a slight tap jitter
    if (
      Math.abs(currentX - (startX.current - swipeOffset)) > 5 ||
      Math.abs(currentY - startY.current) > 5
    ) {
      hasMoved.current = true;
    }

    const diff = startX.current - currentX;
    setSwipeOffset(Math.max(0, diff));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (!hasMoved.current && swipeOffset === 0) {
      onEdit(); // Explicitly trigger edit on clean tap
      return;
    }
    if (swipeOffset >= DELETE_THRESHOLD) {
      onDelete();
      setSwipeOffset(0);
    } else if (swipeOffset > MAX_SWIPE / 2) {
      setSwipeOffset(MAX_SWIPE);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX + swipeOffset;
    startY.current = e.clientY;
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    if (
      Math.abs(currentX - (startX.current - swipeOffset)) > 5 ||
      Math.abs(currentY - startY.current) > 5
    ) {
      hasMoved.current = true;
    }

    const diff = startX.current - currentX;
    setSwipeOffset(Math.max(0, diff));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (!hasMoved.current && swipeOffset === 0) {
      onEdit(); // Explicitly trigger edit on clean tap
      return;
    }
    if (swipeOffset >= DELETE_THRESHOLD) {
      onDelete();
      setSwipeOffset(0);
    } else if (swipeOffset > MAX_SWIPE / 2) {
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

  const isForceDeleting = swipeOffset >= DELETE_THRESHOLD;

  return (
    <div
      ref={(node) => {
        // Internal ref
        (containerRef as any).current = node;
        // Forwarded ref for Framer Motion AnimatePresence
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as any).current = node;
      }}
      className="relative overflow-hidden group"
    >
      {/* Action Buttons (Hidden behind) */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center transition-all duration-200"
        style={{ width: isForceDeleting ? "100%" : `${MAX_SWIPE}px` }}
      >
        <button
          onClick={handleEditClick}
          className="h-full bg-[#0a84ff] flex items-center justify-center transition-all"
          style={{
            width: isForceDeleting ? "0%" : "50%",
            opacity: swipeOffset > 0 && !isForceDeleting ? 1 : 0,
            pointerEvents: isForceDeleting ? "none" : "auto",
          }}
        >
          <Edit3 className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
        <button
          onClick={handleDeleteClick}
          className="h-full bg-[#ff3b30] flex items-center justify-center transition-all relative overflow-hidden"
          style={{
            width: isForceDeleting ? "100%" : "50%",
            opacity: swipeOffset > 0 ? 1 : 0,
          }}
        >
          <Trash2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          {isForceDeleting && (
            <span className="absolute left-10 text-white font-bold text-[14px] uppercase tracking-wider animate-pulse">
              Release to Delete
            </span>
          )}
        </button>
      </div>

      {/* Swipeable Content */}
      <div
        className={`relative transition-transform ${
          isDragging ? "" : "duration-300 ease-out"
        }`}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          cursor: isDragging ? "grabbing" : "pointer",
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
});
