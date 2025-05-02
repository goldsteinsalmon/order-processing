import { format, isWeekend, addDays, isToday, isBefore, parseISO, startOfDay, isSaturday, isSunday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Cache non-working days to reduce database calls
let nonWorkingDaysCache: Date[] = [];
let cacheFetchTime: number | null = null;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

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

// Fetch non-working days from the database
export const fetchNonWorkingDays = async (): Promise<Date[]> => {
  // Return cached data if it's still valid
  const now = Date.now();
  if (cacheFetchTime && now - cacheFetchTime < CACHE_TTL && nonWorkingDaysCache.length > 0) {
    return nonWorkingDaysCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('non_working_days')
      .select('date')
      .order('date', { ascending: true });
    
    if (error) {
      console.error("Error fetching non-working days:", error);
      return [];
    }
    
    const dates = data.map(item => parseISO(item.date));
    
    // Update cache
    nonWorkingDaysCache = dates;
    cacheFetchTime = now;
    
    return dates;
  } catch (e) {
    console.error("Error in fetchNonWorkingDays:", e);
    return [];
  }
};

// Check if date is a manually marked non-working day
export const isNonWorkingDay = async (date: Date): Promise<boolean> => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return false;
  
  const nonWorkingDays = await fetchNonWorkingDays();
  
  // Format date to compare only year, month, and day
  const dateStr = format(safeDate, "yyyy-MM-dd");
  
  return nonWorkingDays.some(nonWorkingDay => {
    return format(nonWorkingDay, "yyyy-MM-dd") === dateStr;
  });
};

// Get the next working day
export const getNextWorkingDay = async (date: Date = new Date()): Promise<Date> => {
  let nextDay = new Date(date);
  
  // If it's after 12 PM, add an extra day
  if (date.getHours() >= 12) {
    nextDay = addDays(nextDay, 1);
  } else {
    nextDay = addDays(nextDay, 1);
  }
  
  // If it's a weekend or a non-working day, move to the next working day
  // Use a do-while loop to ensure we check each day until we find a working day
  let isNonWorking = false;
  
  do {
    isNonWorking = isWeekend(nextDay) || await isNonWorkingDay(nextDay);
    if (isNonWorking) {
      nextDay = addDays(nextDay, 1);
    }
  } while (isNonWorking);
  
  return nextDay;
};

// Check if a date is a business day (not a weekend or non-working day)
export const isBusinessDay = async (date: Date): Promise<boolean> => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return false;
  
  // Check if it's a weekend
  if (isWeekend(safeDate)) return false;
  
  // Check if it's a manually marked non-working day
  return !(await isNonWorkingDay(safeDate));
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
export const isNextWorkingDayOrder = async (orderDate: Date | string | null | undefined): Promise<boolean> => {
  const safeDate = safeParseDate(orderDate);
  if (!safeDate) return false;
  
  const tomorrow = await getNextWorkingDay(new Date());
  
  // Check if dates are the same (ignoring time)
  try {
    return format(safeDate, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd") && await isBusinessDay(safeDate);
  } catch (e) {
    console.error("Error comparing dates in isNextWorkingDayOrder:", e);
    return false;
  }
};

// Order date validator (for disabling weekends and non-working days in date picker)
export const orderDateValidator = async (date: Date): Promise<boolean> => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return false;
  
  return await isBusinessDay(safeDate);
};

// Get working day before a specific date
export const getWorkingDayBefore = async (date: Date): Promise<Date> => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return new Date(); // Return today as fallback
  
  let previousDay = addDays(safeDate, -1);
  
  // If it's a weekend or non-working day, move to the previous working day
  let isNonWorking = false;
  
  do {
    isNonWorking = isWeekend(previousDay) || await isNonWorkingDay(previousDay);
    if (isNonWorking) {
      previousDay = addDays(previousDay, -1);
    }
  } while (isNonWorking);
  
  return previousDay;
};

// Check if a date is a weekend (Saturday or Sunday)
export const isWeekendDay = (date: Date): boolean => {
  const safeDate = safeParseDate(date);
  if (!safeDate) return false;
  
  return isSaturday(safeDate) || isSunday(safeDate);
};

// Check if a standing order needs to be processed immediately
export const shouldProcessImmediately = async (deliveryDate: Date | string | null | undefined): Promise<boolean> => {
  const safeDate = safeParseDate(deliveryDate);
  if (!safeDate) return false;
  
  try {
    // Format date to yyyy-MM-dd for comparison
    const dateFormatted = format(safeDate, "yyyy-MM-dd");
    const todayFormatted = format(new Date(), "yyyy-MM-dd");
    const nextWorkingDay = await getNextWorkingDay();
    const nextWorkingDayFormatted = format(nextWorkingDay, "yyyy-MM-dd");
    
    // Process immediately if it's same day or next working day
    return dateFormatted === todayFormatted || dateFormatted === nextWorkingDayFormatted;
  } catch (e) {
    console.error("Error in shouldProcessImmediately:", e);
    return false;
  }
};

// Check if an order should be scheduled for processing
export const shouldScheduleProcessing = async (deliveryDate: Date | string | null | undefined): Promise<boolean> => {
  const safeDate = safeParseDate(deliveryDate);
  if (!safeDate) return false;
  
  const today = startOfDay(new Date());
  
  // If deliveryDate is in the future (more than next working day)
  return isBefore(today, safeDate) && !(await shouldProcessImmediately(safeDate));
};

// Get the date when an order should be processed (midnight of working day before delivery)
export const getOrderProcessingDate = async (deliveryDate: Date | string | null | undefined): Promise<Date> => {
  const safeDate = safeParseDate(deliveryDate);
  if (!safeDate) return new Date(); // Return today as fallback
  
  if (await shouldProcessImmediately(safeDate)) {
    // If it should be processed immediately, return current date
    return new Date();
  } else {
    // Otherwise, return the working day before the delivery at midnight
    const processingDay = await getWorkingDayBefore(safeDate);
    processingDay.setHours(0, 0, 0, 0); // Set to midnight
    return processingDay;
  }
};
