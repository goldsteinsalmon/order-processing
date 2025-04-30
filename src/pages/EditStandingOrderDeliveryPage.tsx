
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getNextWorkingDay, isBusinessDay } from "@/utils/dateUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OrderItem, StandingOrder } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Schema for the order form
const orderSchema = z.object({
  customerOrderNumber: z.string().optional(),
  deliveryDate: z.date({ required_error: "Delivery date is required" }),
  deliveryMethod: z.enum(["Delivery", "Collection"], {
    required_error: "Delivery method is required"
  }),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

const EditStandingOrderDeliveryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { standingOrders, products, addOrder, updateStandingOrder } = useData();
  const { toast } = useToast();
  
  // Extract the date from the query parameter
  const queryParams = new URLSearchParams(location.search);
  const dateParam = queryParams.get('date');
  const parsedDate = dateParam ? new Date(dateParam) : null;
  
  const [order, setOrder] = useState<StandingOrder | null>(null);
  const [orderItems, setOrderItems] = useState<{ 
    productId: string; 
    quantity: number; 
    id: string;
  }[]>([]);
  const [showSameDayWarning, setShowSameDayWarning] = useState(false);
  const [showCutOffWarning, setShowCutOffWarning] = useState(false);
  const [manualDateChange, setManualDateChange] = useState(false);
  
  // Find the standing order
  useEffect(() => {
    const foundOrder = standingOrders.find(o => o.id === id);
    
    if (foundOrder) {
      setOrder(foundOrder);
      
      // Check if this date has a modified delivery
      if (parsedDate && foundOrder.schedule.modifiedDeliveries) {
        const modifiedDelivery = foundOrder.schedule.modifiedDeliveries.find(delivery => 
          new Date(delivery.date).toDateString() === parsedDate.toDateString()
        );
        
        if (modifiedDelivery && modifiedDelivery.modifications.items) {
          // Use the modified items
          const items = modifiedDelivery.modifications.items.map(item => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity
          }));
          setOrderItems(items);
          
          // Set form values
          form.setValue("customerOrderNumber", foundOrder.customerOrderNumber || "");
          form.setValue("deliveryDate", parsedDate);
          form.setValue("deliveryMethod", foundOrder.schedule.deliveryMethod);
          form.setValue("notes", modifiedDelivery.modifications.notes || "");
        } else {
          // Use the default items
          const items = foundOrder.items.map(item => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity
          }));
          setOrderItems(items);
          
          // Set form values
          form.setValue("customerOrderNumber", foundOrder.customerOrderNumber || "");
          form.setValue("deliveryDate", parsedDate);
          form.setValue("deliveryMethod", foundOrder.schedule.deliveryMethod);
          form.setValue("notes", foundOrder.notes || "");
        }
      } else if (foundOrder) {
        // Use the default items
        const items = foundOrder.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity
        }));
        setOrderItems(items);
        
        // Set form values
        form.setValue("customerOrderNumber", foundOrder.customerOrderNumber || "");
        form.setValue("deliveryDate", parsedDate || getNextWorkingDay());
        form.setValue("deliveryMethod", foundOrder.schedule.deliveryMethod);
        form.setValue("notes", foundOrder.notes || "");
      }
    }
  }, [id, standingOrders, dateParam]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerOrderNumber: "",
      deliveryDate: parsedDate || getNextWorkingDay(),
      deliveryMethod: "Delivery",
      notes: "",
    },
  });

  const deliveryDate = form.watch("deliveryDate");
  
  useEffect(() => {
    if (!manualDateChange || !deliveryDate) {
      return;
    }

    // Check for same day warning - only show when selecting today's date
    setShowSameDayWarning(isToday(deliveryDate));
    
    // Check for cut-off warning - only show when selecting next working day after 12 PM
    const currentHour = new Date().getHours();
    const nextWorkingDay = getNextWorkingDay(new Date());
    
    // Format both dates to compare just the date part (ignoring time)
    const isNextDay = format(deliveryDate, "yyyy-MM-dd") === format(nextWorkingDay, "yyyy-MM-dd");
    
    setShowCutOffWarning(currentHour >= 12 && isNextDay && manualDateChange);
  }, [deliveryDate, manualDateChange]);

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
    if (!order) return;

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

    // Create the full order items with product data
    const fullOrderItems: OrderItem[] = orderItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product with ID ${item.productId} not found`);
      
      return {
        id: item.id,
        productId: item.productId,
        product,
        quantity: item.quantity
      };
    });
    
    // Create new order from the standing order
    const newOrder = {
      id: uuidv4(),
      customerId: order.customerId,
      customer: order.customer,
      customerOrderNumber: data.customerOrderNumber,
      orderDate: new Date().toISOString(),
      requiredDate: data.deliveryDate.toISOString(), // Keep the selected delivery date
      deliveryMethod: data.deliveryMethod as "Delivery" | "Collection",
      items: fullOrderItems,
      notes: data.notes ? 
        `${data.notes} (Created from Standing Order #${order.id.substring(0, 8)})` : 
        `Created from Standing Order #${order.id.substring(0, 8)}`,
      status: "Pending" as const,
      created: new Date().toISOString(),
      fromStandingOrder: order.id
    };
    
    // Add the new order
    addOrder(newOrder);
    
    // Mark this delivery as skipped in the standing order
    const updatedOrder = { ...order };
    
    // Initialize skippedDates if it doesn't exist
    if (!updatedOrder.schedule.skippedDates) {
      updatedOrder.schedule.skippedDates = [];
    }
    
    // Add this date to skipped dates
    if (parsedDate) {
      updatedOrder.schedule.skippedDates.push(parsedDate.toISOString());
    }
    
    // Update the standing order
    updateStandingOrder(updatedOrder);

    toast({
      title: "Order created",
      description: `Order for ${format(data.deliveryDate, "MMMM do, yyyy")} has been created successfully.`,
    });
    
    // Navigate back to the standing order schedule
    navigate(`/standing-order-schedule/${order.id}`);
  };

  if (!order) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Standing order not found</h2>
          <Button variant="outline" onClick={() => navigate("/standing-orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Standing Orders
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/standing-order-schedule/${order.id}`)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Create Order from Standing Order</h2>
      </div>
      
      <p className="text-gray-500 mb-6">Customize this delivery for {order.customer.name}</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-md border">
              <p className="font-medium">Customer</p>
              <p>{order.customer.name}</p>
              <p className="text-sm text-gray-500">{order.customer.email}</p>
            </div>
            
            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Delivery Date *</FormLabel>
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

              {orderItems.map((item) => (
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
            <Button type="button" variant="outline" onClick={() => navigate(`/standing-order-schedule/${order.id}`)}>
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
    </Layout>
  );
};

export default EditStandingOrderDeliveryPage;
