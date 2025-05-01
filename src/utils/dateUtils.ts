
import { format, isWeekend, addDays, isToday, isBefore, parseISO, startOfDay, isSaturday, isSunday } from "date-fns";

// Helper to safely parse dates
const safeParseDate = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  
  try {
    // If it's a string, try to parse it
    if (typeof date === "string") {
      // Check if it's a valid ISO string
      const parsed = parseISO(date);
      // Check if the resulting date is valid
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // If it's already a Date object, check if it's valid
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error("Invalid date value:", date, e);
    return null;
  }
};

// Get the next working day
export const getNextWorkingDay = (date: Date = new Date()): Date => {
  let nextDay = new Date(date);
  
  // If it's after 12 PM, add an extra day
  if (date.getHours() >= 12) {
    nextDay = addDays(nextDay, 1);
  } else {
    nextDay = addDays(nextDay, 1);
  }
  
  // If it's a weekend, move to Monday
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  
  return nextDay;
};

// Check if a date is a business day (not a weekend)
export const isBusinessDay = (date: Date): boolean => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return false;
  
  return !isWeekend(safeDate);
};

// Format a date for display
export const formatDisplayDate = (date: Date | string | null | undefined): string => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return "Invalid Date";
  
  return format(safeDate, "MMMM do, yyyy");
};

// Check if an order is same day
export const isSameDayOrder = (orderDate: Date | string | null | undefined): boolean => {
  const safeDate = safeParseDate(orderDate);
  if (!safeDate) return false;
  
  return isToday(safeDate);
};

// Check if an order is next working day
export const isNextWorkingDayOrder = (orderDate: Date | string | null | undefined): boolean => {
  const safeDate = safeParseDate(orderDate);
  if (!safeDate) return false;
  
  const tomorrow = addDays(new Date(), 1);
  
  // Check if dates are the same (ignoring time)
  try {
    return format(safeDate, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd") && isBusinessDay(safeDate);
  } catch (e) {
    console.error("Error comparing dates in isNextWorkingDayOrder:", e);
    return false;
  }
};

// Order date validator (for disabling weekends in date picker)
export const orderDateValidator = (date: Date): boolean => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return false;
  
  return !isWeekend(safeDate);
};

// Get working day before a specific date
export const getWorkingDayBefore = (date: Date): Date => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return new Date(); // Return today as fallback
  
  let previousDay = addDays(safeDate, -1);
  
  // If it's a weekend, move to Friday
  while (isWeekend(previousDay)) {
    previousDay = addDays(previousDay, -1);
  }
  
  return previousDay;
};

// Check if a date is a weekend (Saturday or Sunday)
export const isWeekendDay = (date: Date): boolean => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return false;
  
  return isSaturday(safeDate) || isSunday(safeDate);
};

// Check if a standing order needs to be processed immediately
export const shouldProcessImmediately = (deliveryDate: Date | string | null | undefined): boolean => {
  const safeDate = safeParseDate(deliveryDate);
  if (!safeDate) return false;
  
  try {
    // Format date to yyyy-MM-dd for comparison
    const dateFormatted = format(safeDate, "yyyy-MM-dd");
    const todayFormatted = format(new Date(), "yyyy-MM-dd");
    const nextWorkingDayFormatted = format(getNextWorkingDay(), "yyyy-MM-dd");
    
    // Process immediately if it's same day or next working day
    return dateFormatted === todayFormatted || dateFormatted === nextWorkingDayFormatted;
  } catch (e) {
    console.error("Error in shouldProcessImmediately:", e);
    return false;
  }
};

// Check if an order should be scheduled for processing
export const shouldScheduleProcessing = (deliveryDate: Date | string | null | undefined): boolean => {
  const safeDate = safeParseDate(deliveryDate);
  if (!safeDate) return false;
  
  const today = startOfDay(new Date());
  
  // If deliveryDate is in the future (more than next working day)
  return isBefore(today, safeDate) && !shouldProcessImmediately(safeDate);
};

// Get the date when an order should be processed (midnight of working day before delivery)
export const getOrderProcessingDate = (deliveryDate: Date | string | null | undefined): Date => {
  const safeDate = safeParseDate(deliveryDate);
  if (!safeDate) return new Date(); // Return today as fallback
  
  if (shouldProcessImmediately(safeDate)) {
    // If it should be processed immediately, return current date
    return new Date();
  } else {
    // Otherwise, return the working day before the delivery at midnight
    const processingDay = getWorkingDayBefore(safeDate);
    processingDay.setHours(0, 0, 0, 0); // Set to midnight
    return processingDay;
  }
};
