import { format, isWeekend, addDays, isEqual } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Cache of non-working days to avoid repeated database calls
let cachedNonWorkingDays: Date[] | null = null;
let lastCacheTime: number = 0;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches non-working days from the database
 */
export const fetchNonWorkingDays = async (): Promise<Date[]> => {
  const currentTime = Date.now();
  
  // Return cached data if it exists and hasn't expired
  if (cachedNonWorkingDays && (currentTime - lastCacheTime < CACHE_EXPIRY)) {
    return cachedNonWorkingDays;
  }
  
  try {
    const { data, error } = await supabase
      .from('non_working_days')
      .select('date')
      .order('date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Convert date strings to Date objects
    const nonWorkingDays = data.map(item => new Date(item.date));
    
    // Update cache
    cachedNonWorkingDays = nonWorkingDays;
    lastCacheTime = currentTime;
    
    return nonWorkingDays;
  } catch (error) {
    console.error('Error fetching non-working days:', error);
    return [];
  }
};

/**
 * Checks if a given date is a business day (not a weekend or holiday)
 */
export const isBusinessDay = async (date: Date): Promise<boolean> => {
  // First check if it's a weekend
  if (isWeekend(date)) {
    return false;
  }
  
  try {
    // Then check if it's in our non-working days list
    const nonWorkingDays = await fetchNonWorkingDays();
    
    return !nonWorkingDays.some(nonWorkingDay => {
      return nonWorkingDay.getDate() === date.getDate() &&
             nonWorkingDay.getMonth() === date.getMonth() &&
             nonWorkingDay.getFullYear() === date.getFullYear();
    });
  } catch (error) {
    console.error('Error checking if date is a business day:', error);
    // Default to just checking weekends if there's an error
    return !isWeekend(date);
  }
};

/**
 * Gets the next working day from a given date
 */
export const getNextWorkingDay = async (startDate: Date = new Date()): Promise<Date> => {
  let candidateDate = new Date(startDate);
  candidateDate.setHours(0, 0, 0, 0); // Reset hours to start of day
  
  // Add one day to start with the next day
  candidateDate = addDays(candidateDate, 1);
  
  // Keep adding days until we find a business day
  let isWorkingDay = await isBusinessDay(candidateDate);
  
  while (!isWorkingDay) {
    candidateDate = addDays(candidateDate, 1);
    isWorkingDay = await isBusinessDay(candidateDate);
  }
  
  return candidateDate;
};

/**
 * Synchronous function that checks if a date is a business day
 * This is useful for UI components that can't use async functions directly
 */
export const isDateDisabled = (date: Date, nonWorkingDays: Date[]): boolean => {
  // First check if it's a weekend
  if (isWeekend(date)) {
    return true;
  }
  
  // Then check if it's in our non-working days list
  return nonWorkingDays.some(nonWorkingDay => {
    return nonWorkingDay.getDate() === date.getDate() &&
           nonWorkingDay.getMonth() === date.getMonth() &&
           nonWorkingDay.getFullYear() === date.getFullYear();
  });
};
