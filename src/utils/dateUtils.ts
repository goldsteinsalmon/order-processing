import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";

export const formatOrderDate = (dateString: string): string => {
  if (!dateString) return "";
  
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else if (isThisWeek(date)) {
    return format(date, "EEEE"); // Day name
  } else if (isThisMonth(date)) {
    return format(date, "d MMM"); // Day + Month abbreviated
  } else {
    return format(date, "d MMM yyyy"); // Full date for older dates
  }
};

// Function to fetch non-working days from the database
export const fetchNonWorkingDays = async (): Promise<Date[]> => {
  try {
    const { data, error } = await supabase
      .from('non_working_days')
      .select('date')
      .order('date');
    
    if (error) {
      console.error('Error fetching non-working days:', error);
      return [];
    }
    
    // Convert the string dates to Date objects
    return data ? data.map(item => new Date(item.date)) : [];
  } catch (error) {
    console.error('Error in fetchNonWorkingDays:', error);
    return [];
  }
};

// Function to check if a date is disabled (weekend or non-working day)
export const isDateDisabled = (date: Date, nonWorkingDays: Date[] = []): boolean => {
  // Check if it's a weekend (0 = Sunday, 6 = Saturday)
  if (date.getDay() === 0 || date.getDay() === 6) {
    return true;
  }
  
  // Check if it's in the non-working days list
  return nonWorkingDays.some(nonWorkingDay => {
    return nonWorkingDay.getDate() === date.getDate() &&
           nonWorkingDay.getMonth() === date.getMonth() &&
           nonWorkingDay.getFullYear() === date.getFullYear();
  });
};

// Function to get the next working day
export const getNextWorkingDay = async (date: Date = new Date()): Promise<Date> => {
  const nonWorkingDays = await fetchNonWorkingDays();
  
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Keep incrementing until we find a working day
  while (isDateDisabled(nextDay, nonWorkingDays)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
};

// Function to get the order processing date
export const getOrderProcessingDate = async (deliveryDate: Date): Promise<Date> => {
  const nonWorkingDays = await fetchNonWorkingDays();
  
  // Start with the day before delivery
  let processingDate = new Date(deliveryDate);
  processingDate.setDate(processingDate.getDate() - 1);
  
  // Keep going back until we find a working day
  while (isDateDisabled(processingDate, nonWorkingDays)) {
    processingDate.setDate(processingDate.getDate() - 1);
  }
  
  return processingDate;
};

// Function to convert database frequency to display frequency
export const dbToDisplayFrequency = (frequency: string): "Every Week" | "Every 2 Weeks" | "Every 4 Weeks" => {
  switch (frequency) {
    case "Weekly":
      return "Every Week";
    case "Bi-Weekly":
      return "Every 2 Weeks";
    case "Monthly":
      return "Every 4 Weeks";
    default:
      return "Every Week"; // Default to weekly
  }
};

// Function to convert display frequency to database frequency
export const displayToDbFrequency = (frequency: string): "Weekly" | "Bi-Weekly" | "Monthly" => {
  switch (frequency) {
    case "Every Week":
      return "Weekly";
    case "Every 2 Weeks":
      return "Bi-Weekly";
    case "Every 4 Weeks":
      return "Monthly";
    default:
      return "Weekly"; // Default to weekly
  }
};
