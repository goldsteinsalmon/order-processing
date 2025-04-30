
import { format, isWeekend, addDays, isToday, isBefore, parseISO } from "date-fns";

// Get the next working day
export const getNextWorkingDay = (date: Date = new Date()): Date => {
  let nextDay = new Date(date);
  
  // If it's after 12 PM, add an extra day
  if (date.getHours() >= 12) {
    nextDay = addDays(nextDay, 2);
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
  return !isWeekend(date);
};

// Format a date for display
export const formatDisplayDate = (date: Date | string): string => {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "MMMM do, yyyy");
};

// Check if an order is same day
export const isSameDayOrder = (orderDate: Date | string): boolean => {
  const parsedDate = typeof orderDate === "string" ? parseISO(orderDate) : orderDate;
  return isToday(parsedDate);
};

// Check if an order is next working day
export const isNextWorkingDayOrder = (orderDate: Date | string): boolean => {
  const parsedDate = typeof orderDate === "string" ? parseISO(orderDate) : orderDate;
  const tomorrow = addDays(new Date(), 1);
  
  // Check if dates are the same (ignoring time)
  return format(parsedDate, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd") && isBusinessDay(parsedDate);
};

// Order date validator (for disabling weekends in date picker)
export const orderDateValidator = (date: Date): boolean => {
  return !isWeekend(date);
};
