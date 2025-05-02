
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchNonWorkingDays, isDateDisabled } from "@/utils/dateUtils";

interface OrderDetailsStepProps {
  form: any;
  onDateChange: (date?: Date) => void;
  onNext: () => void;
  onBack: () => void;
  hideNavigationButtons?: boolean;
}

const OrderDetailsStep: React.FC<OrderDetailsStepProps> = ({
  form,
  onDateChange,
  onNext,
  onBack,
  hideNavigationButtons = false,
}) => {
  // Instead of using an async function directly, we'll use state to manage disabled dates
  // This allows the calendar to work with synchronous date checking
  const [nonWorkingDays, setNonWorkingDays] = useState<Date[]>([]);
  
  // Update the disabled dates by loading non-working days
  useEffect(() => {
    const loadNonWorkingDays = async () => {
      try {
        const days = await fetchNonWorkingDays();
        setNonWorkingDays(days);
      } catch (error) {
        console.error("Error loading non-working days:", error);
      }
    };
    
    loadNonWorkingDays();
  }, []);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="deliveryMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Delivery Method</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Delivery">Delivery</SelectItem>
                <SelectItem value="Collection">Collection</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="customerOrderNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Customer Order Number (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="Customer Order Number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="orderDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Order Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "EEEE, d MMMM yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    onDateChange(date);
                  }}
                  disabled={(date) => isDateDisabled(date, nonWorkingDays)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormDescription>
              Select a business day. Weekends and non-working days are disabled.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add any special instructions or notes here"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!hideNavigationButtons && (
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="button" onClick={onNext}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsStep;
