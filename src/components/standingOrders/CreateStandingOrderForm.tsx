
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addWeeks } from "date-fns";
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
import { Plus, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const standingOrderSchema = z.object({
  customerId: z.string().min(1, { message: "Customer ID is required." }),
  customerOrderNumber: z.string().optional(),
  frequency: z.enum(["Every Week", "Every 2 Weeks", "Every 4 Weeks"], {
    required_error: "Please select an order frequency.",
  }),
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
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState({});
  const [productSearchQuery, setProductSearchQuery] = useState({});

  const form = useForm<StandingOrderFormValues>({
    resolver: zodResolver(standingOrderSchema),
    defaultValues: {
      customerId: "",
      customerOrderNumber: "",
      frequency: "Every Week",
      deliveryMethod: "Delivery",
      nextDeliveryDate: new Date(),
      notes: "",
    },
  });

  const { watch, setValue, getValues, formState } = form;
  const frequency = watch("frequency");
  const nextDeliveryDate = watch("nextDeliveryDate");

  const handleAddItem = () => {
    setStandingOrderItems([...standingOrderItems, { 
      productId: "", 
      quantity: 1, 
      id: crypto.randomUUID() 
    }]);
    setProductSearchOpen(prev => ({...prev, [standingOrderItems.length]: false}));
    setProductSearchQuery(prev => ({...prev, [standingOrderItems.length]: ""}));
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

  // Filter customers based on search
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      if (!customerSearchQuery) return true;
      
      const searchLower = customerSearchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.accountNumber && customer.accountNumber.toLowerCase().includes(searchLower)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower))
      );
    });
  }, [customers, customerSearchQuery]);

  // Filter products based on search
  const getFilteredProducts = (query: string) => {
    return products.filter(product => {
      if (!query) return true;
      
      const searchLower = query.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
      );
    });
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

    // Determine frequency in database format
    let dbFrequency: "Weekly" | "Bi-Weekly" | "Monthly";
    switch (data.frequency) {
      case "Every Week": dbFrequency = "Weekly"; break;
      case "Every 2 Weeks": dbFrequency = "Bi-Weekly"; break;
      case "Every 4 Weeks": dbFrequency = "Monthly"; break; // Using Monthly for 4 weeks
      default: dbFrequency = "Weekly";
    }

    const newStandingOrder = {
      id: crypto.randomUUID(),
      customerId: data.customerId,
      customerOrderNumber: data.customerOrderNumber,
      schedule: {
        frequency: dbFrequency,
        dayOfWeek: undefined,
        dayOfMonth: undefined,
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
      if (frequency === "Every Week") {
        nextDelivery = addWeeks(nextDeliveryDate, 1);
      } else if (frequency === "Every 2 Weeks") {
        nextDelivery = addWeeks(nextDeliveryDate, 2);
      } else if (frequency === "Every 4 Weeks") {
        nextDelivery = addWeeks(nextDeliveryDate, 4);
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

  // Set up dropdown state for each product item
  useEffect(() => {
    const initialProductSearchState = {};
    const initialProductQueryState = {};
    standingOrderItems.forEach((item, idx) => {
      initialProductSearchState[idx] = false;
      initialProductQueryState[idx] = "";
    });
    setProductSearchOpen(initialProductSearchState);
    setProductSearchQuery(initialProductQueryState);
  }, []);

  const toggleProductSearch = (idx: number) => {
    setProductSearchOpen(prev => ({...prev, [idx]: !prev[idx]}));
  };

  const handleProductSearchChange = (idx: number, value: string) => {
    setProductSearchQuery(prev => ({...prev, [idx]: value}));
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
                    <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={customerSearchOpen}
                            className="justify-between w-full"
                          >
                            {field.value
                              ? customers.find((customer) => customer.id === field.value)?.name
                              : "Select customer"}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search customers..." 
                            value={customerSearchQuery}
                            onValueChange={setCustomerSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No customers found.</CommandEmpty>
                            <CommandGroup>
                              {filteredCustomers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  onSelect={() => {
                                    setValue("customerId", customer.id);
                                    setCustomerSearchOpen(false);
                                  }}
                                >
                                  <span>{customer.name}</span>
                                  {customer.accountNumber && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({customer.accountNumber})
                                    </span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
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
                        <SelectItem value="Every Week">Every Week</SelectItem>
                        <SelectItem value="Every 2 Weeks">Every 2 Weeks</SelectItem>
                        <SelectItem value="Every 4 Weeks">Every 4 Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <div className="grid gap-2 flex-1">
                      <Label htmlFor={`productId-${item.id}`}>Product</Label>
                      <Popover 
                        open={productSearchOpen[index]} 
                        onOpenChange={() => toggleProductSearch(index)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={productSearchOpen[index]}
                            className="justify-between w-full text-left"
                          >
                            {item.productId ? (
                              <span>
                                {products.find(p => p.id === item.productId)?.name}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({products.find(p => p.id === item.productId)?.sku})
                                </span>
                              </span>
                            ) : (
                              "Select a product"
                            )}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search products..." 
                              value={productSearchQuery[index] || ""}
                              onValueChange={(value) => handleProductSearchChange(index, value)}
                            />
                            <CommandList>
                              <CommandEmpty>No products found.</CommandEmpty>
                              <CommandGroup>
                                {getFilteredProducts(productSearchQuery[index] || "").map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    onSelect={() => {
                                      handleItemChange(item.id, "productId", product.id);
                                      toggleProductSearch(index);
                                    }}
                                  >
                                    <span>{product.name}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({product.sku})
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2 w-24">
                      <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                      <Input
                        type="number"
                        id={`quantity-${item.id}`}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 0)}
                        min={1}
                        className="w-full"
                      />
                    </div>
                    <div className="pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={standingOrderItems.length <= 1}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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
