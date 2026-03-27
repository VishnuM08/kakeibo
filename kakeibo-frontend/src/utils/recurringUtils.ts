/**
 * Utilities for recurring expenses
 */

/**
 * Calculates the next occurrence date for a recurring expense based on its frequency
 * and when it was last processed.
 */
export const calculateNextOccurrence = (
  startDate: string,
  frequency: string,
  lastProcessed?: string,
): string => {
  const start = new Date(startDate);
  const last = lastProcessed ? new Date(lastProcessed) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = last ? new Date(last) : new Date(start);
  
  // If it has been processed or the next occurrence is in the past, move to future
  if (last || next < today) {
    switch (frequency) {
      case "daily":
        while (next <= today) next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        while (next <= today) next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        while (next <= today) next.setMonth(next.getMonth() + 1);
        break;
      case "yearly":
        while (next <= today) next.setFullYear(next.getFullYear() + 1);
        break;
    }
  }
  return next.toISOString();
};

/**
 * Checks if a recurring expense is due today or in the past
 */
export const isDue = (nextOccurrence: string): boolean => {
  if (!nextOccurrence) return false;
  const due = new Date(nextOccurrence);
  if (isNaN(due.getTime())) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due <= today;
};

/**
 * Returns number of days until the next occurrence
 */
export const getDaysUntil = (nextOccurrence: string): number => {
  if (!nextOccurrence) return 0;
  const due = new Date(nextOccurrence);
  if (isNaN(due.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diff = due.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};
