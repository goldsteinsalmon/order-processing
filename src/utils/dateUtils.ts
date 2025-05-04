import { format, isWeekend, addDays, isToday, isBefore, parseISO, startOfDay, isSaturday, isSunday } from "date-fns";

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

// Get working day before a specific date
export const getWorkingDayBefore = (date: Date): Date => {
  let previousDay = addDays(date, -1);
  
  // If it's a weekend, move to Friday
  while (isWeekend(previousDay)) {
    previousDay = addDays(previousDay, -1);
  }
  
  return previousDay;
};

// Check if a date is a weekend (Saturday or Sunday)
export const isWeekendDay = (date: Date): boolean => {
  return isSaturday(date) || isSunday(date);
};

// Check if a standing order needs to be processed immediately
export const shouldProcessImmediately = (deliveryDate: Date | string): boolean => {
  const parsedDate = typeof deliveryDate === "string" ? parseISO(deliveryDate) : deliveryDate;
  
  // Format date to yyyy-MM-dd for comparison
  const dateFormatted = format(parsedDate, "yyyy-MM-dd");
  const todayFormatted = format(new Date(), "yyyy-MM-dd");
  const nextWorkingDayFormatted = format(getNextWorkingDay(), "yyyy-MM-dd");
  
  // Process immediately if it's same day or next working day
  return dateFormatted === todayFormatted || dateFormatted === nextWorkingDayFormatted;
};

// Check if an order should be scheduled for processing
export const shouldScheduleProcessing = (deliveryDate: Date | string): boolean => {
  const parsedDate = typeof deliveryDate === "string" ? parseISO(deliveryDate) : deliveryDate;
  const today = startOfDay(new Date());
  
  // If deliveryDate is in the future (more than next working day)
  return isBefore(today, parsedDate) && !shouldProcessImmediately(parsedDate);
};

// Get the date when an order should be processed (midnight of working day before delivery)
export const getOrderProcessingDate = (deliveryDate: Date | string): Date => {
  const parsedDate = typeof deliveryDate === "string" ? parseISO(deliveryDate) : deliveryDate;
  
  if (shouldProcessImmediately(parsedDate)) {
    // If it should be processed immediately, return current date
    return new Date();
  } else {
    // Otherwise, return the working day before the delivery at midnight
    const processingDay = getWorkingDayBefore(parsedDate);
    processingDay.setHours(0, 0, 0, 0); // Set to midnight
    return processingDay;
  }
};
