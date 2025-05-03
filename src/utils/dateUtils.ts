
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

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
