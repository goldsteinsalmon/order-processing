
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isToday, isBefore, startOfDay, addBusinessDays } from "date-fns";
import { Plus, Minus } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getNextWorkingDay, isBusinessDay, isSameDayOrder } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import {
  Form,
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
import { OrderItem } from "@/types";

const orderSchema = z.object({
  customerId: z.string({ required_error: "Customer is required" }),
  customerOrderNumber: z.string().optional(),
  orderDate: z.date({ required_error: "Order date is required" }),
  deliveryMethod: z.enum(["Delivery", "Collection"], { 
    required_error: "Delivery method is required" 
  }),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

const CreateOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { customers, products, addOrder } = useData();
  const { toast } = useToast();
  
  const [orderItems, setOrderItems] = useState<{ 
    productId: string; 
    quantity: number; 
    id: string;
  }[]>([{ productId: "", quantity: 1, id: crypto.randomUUID() }]);
  
  const [showSameDayWarning, setShowSameDayWarning] = useState(false);
  const [showCutOffWarning, setShowCutOffWarning] = useState(false);
  const [manualDateChange, setManualDateChange] = useState(false);
  
  // Get the default order date based on current time
  const getDefaultOrderDate = () => {
    const currentHour = new Date().getHours();
    // If it's after 12 PM, set the default to 2 working days from now
    if (currentHour >= 12) {
      return addBusinessDays(new Date(), 2);
    } else {
      return getNextWorkingDay();
    }
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      deliveryMethod: "Delivery",
      orderDate: getDefaultOrderDate(),
    },
  });

  // Re-initialize form with updated default date when component mounts to ensure correct date is used
  useEffect(() => {
    form.setValue("orderDate", getDefaultOrderDate());
  }, []);

  const orderDate = form.watch("orderDate");
  
  useEffect(() => {
    if (!manualDateChange || !orderDate) {
      return;
    }

    // Check for same day warning - only show when selecting today's date
    setShowSameDayWarning(isToday(orderDate));
    
    // Check for cut-off warning - only show when selecting next working day after 12 PM
    const currentHour = new Date().getHours();
    const nextWorkingDay = getNextWorkingDay(new Date());
    
    // Format both dates to compare just the date part (ignoring time)
    const isNextDay = format(orderDate, "yyyy-MM-dd") === format(nextWorkingDay, "yyyy-MM-dd");
    
    setShowCutOffWarning(currentHour >= 12 && isNextDay && manualDateChange);
  }, [orderDate, manualDateChange]);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { 
      productId: "", 
      quantity: 1, 
      id: crypto.randomUUID() 
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: "productId" | "quantity", value: string | number) => {
    setOrderItems(
      orderItems.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const onSubmit = (data: OrderFormValues) => {
    // Validate items
    const hasInvalidItems = orderItems.some(
      item => item.productId === "" || item.quantity <= 0
    );

    if (hasInvalidItems) {
      toast({
        title: "Invalid items",
        description: "Please ensure all items have a product and a positive quantity.",
        variant: "destructive",
      });
      return;
    }

    // Create new order with the correct status type
    const newOrder = {
      id: crypto.randomUUID(),
      customerId: data.customerId,
      customer: customers.find(c => c.id === data.customerId)!,
      customerOrderNumber: data.customerOrderNumber,
      orderDate: format(data.orderDate, "yyyy-MM-dd"),
      deliveryMethod: data.deliveryMethod as "Delivery" | "Collection",
      items: orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        product: products.find(p => p.id === item.productId)!,
        quantity: item.quantity
      })) as OrderItem[],
      notes: data.notes,
      status: "Pending" as const,
      created: new Date().toISOString(),
    };

    addOrder(newOrder);
    
    toast({
      title: "Order created",
      description: "The order has been created successfully.",
    });

    // Reset form
    form.reset({
      customerId: "",
      customerOrderNumber: "",
      orderDate: getDefaultOrderDate(),
      deliveryMethod: "Delivery",
      notes: "",
    });
    setOrderItems([{ productId: "", quantity: 1, id: crypto.randomUUID() }]);
    setManualDateChange(false);
    
    // Navigate back to orders page
    navigate("/orders");
  };

  const handleCancel = () => {
    navigate("/orders");
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        onSelect={(date) => {
                          if (date) {
                            setManualDateChange(true);
                            field.onChange(date);
                          }
                        }}
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items *</h3>
              <Button type="button" onClick={handleAddItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-medium">
                <div className="col-span-6">Product</div>
                <div className="col-span-4">Quantity</div>
                <div className="col-span-2"></div>
              </div>

              {orderItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <Select
                      value={item.productId}
                      onValueChange={(value) => handleItemChange(item.id, "productId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={orderItems.length <= 1}
                    >
                      <Minus className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes for this order"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Create Order</Button>
          </div>
        </form>
      </Form>

      {/* Same Day Warning Dialog */}
      <Dialog open={showSameDayWarning} onOpenChange={setShowSameDayWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Same Day Order Warning</DialogTitle>
            <DialogDescription>
              You are picking today's date. Are you sure you want to place a same-day order?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSameDayWarning(false)}>Yes, I'm Sure</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cut-off Time Warning Dialog */}
      <Dialog open={showCutOffWarning} onOpenChange={setShowCutOffWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Cut-off Time Warning</DialogTitle>
            <DialogDescription>
              It's past the 12 PM cut-off time. Are you sure you want to place an order for the next working day?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowCutOffWarning(false)}>Yes, I'm Sure</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateOrderForm;
