
import React from "react";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { isBusinessDay } from "@/utils/dateUtils";
import { OrderFormValues } from "./orderSchema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderDetailsStepProps {
  form: UseFormReturn<OrderFormValues>;
  onDateChange: (date?: Date) => void;
  onNext: () => void;
  onBack: () => void;
}

const OrderDetailsStep: React.FC<OrderDetailsStepProps> = ({
  form,
  onDateChange,
  onNext,
  onBack
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Order Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="orderDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Order Date *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "MMMM do, yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={onDateChange}
                    disabled={(date) => 
                      !isBusinessDay(date) || isBefore(date, startOfDay(new Date()))
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerOrderNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Order Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter customer order number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deliveryMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Method *</FormLabel>
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
      </div>
      
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OrderDetailsStep;
