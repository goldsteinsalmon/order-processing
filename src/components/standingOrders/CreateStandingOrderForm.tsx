import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addWeeks, addMonths } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";
import { StandingOrder, Product, OrderItem } from "@/types";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const standingOrderSchema = z.object({
  customerId: z.string().min(1, { message: "Customer ID is required." }),
  customerOrderNumber: z.string().optional(),
  frequency: z.enum(["Weekly", "Bi-Weekly", "Monthly"], {
    required_error: "Please select an order frequency.",
  }),
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.string().optional(),
  deliveryMethod: z.enum(["Delivery", "Collection"], {
    required_error: "Please select a delivery method.",
  }),
  nextDeliveryDate: z.date({
    required_error: "Please select the next delivery date.",
  }),
  notes: z.string().optional(),
});

type StandingOrderFormValues = z.infer<typeof standingOrderSchema>;

const CreateStandingOrderForm = () => {
  const { customers, products, addStandingOrder } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [standingOrderItems, setStandingOrderItems] = useState<{ 
    productId: string; 
    quantity: number;
    id: string;
  }[]>([{ productId: "", quantity: 1, id: crypto.randomUUID() }]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const form = useForm<StandingOrderFormValues>({
    resolver: zodResolver(standingOrderSchema),
    defaultValues: {
      customerId: "",
      customerOrderNumber: "",
      frequency: "Weekly",
      dayOfWeek: "0",
      dayOfMonth: "1",
      deliveryMethod: "Delivery",
      nextDeliveryDate: new Date(),
      notes: "",
    },
  });

  const { watch, setValue, getValues, formState } = form;
  const frequency = watch("frequency");
  const nextDeliveryDate = watch("nextDeliveryDate");

  const getDayOfWeek = (frequency: string, dayOfWeek: string) => {
    return frequency === "Weekly" || frequency === "Bi-Weekly" ? parseInt(dayOfWeek) : undefined;
  };

  const getDayOfMonth = (frequency: string, dayOfMonth: string) => {
    return frequency === "Monthly" ? parseInt(dayOfMonth) : undefined;
  };

  const handleAddItem = () => {
    setStandingOrderItems([...standingOrderItems, { productId: "", quantity: 1, id: crypto.randomUUID() }]);
  };

  const handleRemoveItem = (id: string) => {
    if (standingOrderItems.length > 1) {
      setStandingOrderItems(standingOrderItems.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: "productId" | "quantity", value: string | number) => {
    setStandingOrderItems(
      standingOrderItems.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (data: StandingOrderFormValues) => {
    // Validate items
    const hasInvalidItems = standingOrderItems.some(
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

    const newStandingOrder = {
      id: crypto.randomUUID(),
      customerId: data.customerId,
      customerOrderNumber: data.customerOrderNumber,
      schedule: {
        frequency: data.frequency as "Weekly" | "Bi-Weekly" | "Monthly",
        dayOfWeek: getDayOfWeek(data.frequency, data.dayOfWeek),
        dayOfMonth: getDayOfMonth(data.frequency, data.dayOfMonth),
        deliveryMethod: data.deliveryMethod as "Delivery" | "Collection",
        nextDeliveryDate: format(nextDeliveryDate, "yyyy-MM-dd"),
        processedDates: [],
        skippedDates: [],
        modifiedDeliveries: []
      },
      notes: data.notes,
      items: standingOrderItems.filter(item => item.productId && item.quantity > 0).map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        standingOrderId: crypto.randomUUID() // This will be replaced anyway
      })),
      active: true,
      created: new Date().toISOString(),
      nextProcessingDate: format(nextDeliveryDate, "yyyy-MM-dd")
    };

    const result = await addStandingOrder(newStandingOrder);

    if (result) {
      toast({
        title: "Standing order created",
        description: "The standing order has been created successfully.",
      });
      navigate("/standing-orders");
    } else {
      toast({
        title: "Error",
        description: "Failed to create standing order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    form.trigger().then(isValid => {
      if (!isValid) {
        toast({
          title: "Validation error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const hasInvalidItems = standingOrderItems.some(
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

      // Create order items for preview
      const orderItems = standingOrderItems
        .filter(item => item.productId && item.quantity > 0)
        .map(item => ({
          id: crypto.randomUUID(),
          orderId: "preview",
          productId: item.productId,
          product: products.find(p => p.id === item.productId)!,
          quantity: item.quantity
        }));

      // Calculate next delivery date based on frequency
      let nextDelivery: Date = nextDeliveryDate;
      if (frequency === "Weekly") {
        nextDelivery = addWeeks(nextDeliveryDate, 1);
      } else if (frequency === "Bi-Weekly") {
        nextDelivery = addWeeks(nextDeliveryDate, 2);
      } else if (frequency === "Monthly") {
        nextDelivery = addMonths(nextDeliveryDate, 1);
      }

      // Format the next delivery date
      const formattedNextDeliveryDate = format(nextDelivery, "yyyy-MM-dd");

      // Display preview
      setPreviewError(null);
      setShowPreview(true);
    });
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    navigate("/standing-orders");
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Customer & Schedule</CardTitle>
              <CardDescription>
                Select the customer and schedule for this standing order.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
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
                name="customerOrderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Order Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer order number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {frequency === "Weekly" || frequency === "Bi-Weekly" ? (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of the Week</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(7)].map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {format(new Date(2023, 0, 1 + i), "EEEE")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : frequency === "Monthly" ? (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of the Month</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(31)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="deliveryMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a delivery method" />
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
                name="nextDeliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Next Delivery Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "yyyy-MM-dd")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Choose the date for the first delivery.
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
                      <Input placeholder="Additional notes for this order" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Add the items for this standing order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {standingOrderItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`productId-${item.id}`}>Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleItemChange(item.id, "productId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
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
                    <div className="grid gap-2">
                      <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                      <Input
                        type="number"
                        id={`quantity-${item.id}`}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value))}
                        className="w-24"
                        min={1}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={standingOrderItems.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={handlePreview}>
              Preview
            </Button>
            <Button type="submit">Create Standing Order</Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard all the information you've entered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateStandingOrderForm;
