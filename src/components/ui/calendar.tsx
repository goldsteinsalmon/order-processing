
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { fetchNonWorkingDays } from "@/utils/dateUtils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [nonWorkingDays, setNonWorkingDays] = React.useState<Date[]>([]);
  
  React.useEffect(() => {
    const loadNonWorkingDays = async () => {
      const days = await fetchNonWorkingDays();
      setNonWorkingDays(days);
    };
    
    loadNonWorkingDays();
  }, []);
  
  // Create a custom disabled function that includes both weekends and non-working days
  const isDateDisabled = (date: Date): boolean => {
    // First check if it's a weekend (built-in check)
    if (date.getDay() === 0 || date.getDay() === 6) {
      return true;
    }
    
    // Then check if it's in our non-working days list
    return nonWorkingDays.some(nonWorkingDay => {
      return nonWorkingDay.getDate() === date.getDate() &&
             nonWorkingDay.getMonth() === date.getMonth() &&
             nonWorkingDay.getFullYear() === date.getFullYear();
    });
  };
  
  // Merge the custom disabled function with any existing one
  const mergedDisabled = props.disabled 
    ? (date: Date) => isDateDisabled(date) || (props.disabled && props.disabled(date))
    : isDateDisabled;
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      disabled={mergedDisabled}
      weekStartsOn={1} // Start week on Monday (1) instead of Sunday (0)
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
