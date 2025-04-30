
import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isToday, isBefore, startOfDay, addBusinessDays } from "date-fns";
import { Plus, Search, X, Package } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getNextWorkingDay, isBusinessDay, isSameDayOrder } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils"; // Import the cn utility function
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
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { BoxItem, Customer, Box, OrderItem } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  
  // Add the missing state variables
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showOnHoldWarning, setShowOnHoldWarning] = useState(false);
  
  const [orderItems, setOrderItems] = useState<{ 
    productId: string; 
    quantity: number; 
    id: string;
  }[]>([{ productId: "", quantity: 0, id: crypto.randomUUID() }]);
  
  const [showSameDayWarning, setShowSameDayWarning] = useState(false);
  const [showCutOffWarning, setShowCutOffWarning] = useState(false);
  const [manualDateChange, setManualDateChange] = useState(false);
  
  // Search state
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [activeProductItemId, setActiveProductItemId] = useState<string | null>(null);
  
  // Box Distribution state
  const [showBoxDistribution, setShowBoxDistribution] = useState(false);
  const [boxDistributions, setBoxDistributions] = useState<Box[]>([{ 
    boxNumber: 1, 
    items: [], 
    completed: false,
    printed: false
  }]);
  const [currentStep, setCurrentStep] = useState<"items" | "boxes">("items");
  const [unassignedItems, setUnassignedItems] = useState<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
  }[]>([]);
  
  // Sort products by SKU
  const sortedProducts = [...products].sort((a, b) => 
    a.sku.localeCompare(b.sku)
  );
  
  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (productSearch.trim() === "") return sortedProducts;
    
    const searchLower = productSearch.toLowerCase();
    return sortedProducts.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower)
    );
  }, [productSearch, sortedProducts]);
  
  // Filter customers using the same logic as in the Customers page
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];
    
    if (customerSearch.trim()) {
      const lowerSearch = customerSearch.toLowerCase();
      filtered = customers.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(lowerSearch);
        const emailMatch = customer.email ? customer.email.toLowerCase().includes(lowerSearch) : false;
        const phoneMatch = customer.phone ? customer.phone.includes(customerSearch) : false;
        const accountMatch = customer.accountNumber ? customer.accountNumber.toLowerCase().includes(lowerSearch) : false;
        
        return nameMatch || emailMatch || phoneMatch || accountMatch;
      });
    }
    
    // Sort by account number alphabetically
    return filtered.sort((a, b) => {
      const accountA = a.accountNumber || '';
      const accountB = b.accountNumber || '';
      return accountA.localeCompare(accountB);
    });
  }, [customers, customerSearch]);
    
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
  const customerId = form.watch("customerId");
  
  // Effect to check if customer needs detailed box labels
  useEffect(() => {
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [customerId, customers]);
  
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

  // Update unassigned items when order items change
  useEffect(() => {
    if (currentStep === "boxes" && selectedCustomer?.needsDetailedBoxLabels) {
      const newUnassignedItems = orderItems
        .filter(item => item.productId && item.quantity > 0)
        .map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            id: item.id,
            productId: item.productId,
            productName: product ? product.name : "Unknown Product",
            quantity: item.quantity
          };
        });
      
      setUnassignedItems(newUnassignedItems);
      
      // Initialize box distributions with empty boxes
      if (boxDistributions.length === 0) {
        setBoxDistributions([{ 
          boxNumber: 1, 
          items: [], 
          completed: false,
          printed: false
        }]);
      }
    }
  }, [currentStep, orderItems, products, selectedCustomer, boxDistributions]);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 0, id: crypto.randomUUID() }]);
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
  
  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    
    // If customer is on hold, show warning dialog
    if (customer && customer.onHold) {
      setSelectedCustomer(customer);
      setShowOnHoldWarning(true);
    } else {
      // If not on hold, proceed normally
      form.setValue("customerId", customerId);
      setShowCustomerSearch(false);
    }
  };
  
  const confirmOnHoldCustomer = () => {
    if (selectedCustomer) {
      form.setValue("customerId", selectedCustomer.id);
      setShowOnHoldWarning(false);
      setShowCustomerSearch(false);
    }
  };
  
  const cancelOnHoldCustomer = () => {
    setSelectedCustomer(null);
    setShowOnHoldWarning(false);
  };
  
  const handleSelectProduct = (itemId: string, productId: string) => {
    handleItemChange(itemId, "productId", productId);
    setShowProductSearch(false);
    setActiveProductItemId(null);
  };
  
  // Box distribution handlers
  const handleAddBox = () => {
    const newBoxNumber = boxDistributions.length > 0 
      ? Math.max(...boxDistributions.map(box => box.boxNumber)) + 1 
      : 1;
      
    setBoxDistributions([
      ...boxDistributions, 
      { 
        boxNumber: newBoxNumber, 
        items: [], 
        completed: false,
        printed: false
      }
    ]);
  };
  
  const handleRemoveBox = (boxNumber: number) => {
    // Get items from the box being removed
    const boxToRemove = boxDistributions.find(box => box.boxNumber === boxNumber);
    if (boxToRemove) {
      // Return items to unassigned
      const itemsToReturn = boxToRemove.items;
      const updatedUnassignedItems = [...unassignedItems];
      
      itemsToReturn.forEach(item => {
        const existingItem = updatedUnassignedItems.find(uItem => uItem.productId === item.productId);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          const product = products.find(p => p.id === item.productId);
          updatedUnassignedItems.push({
            id: crypto.randomUUID(),
            productId: item.productId,
            productName: product ? product.name : "Unknown Product",
            quantity: item.quantity
          });
        }
      });
      
      setUnassignedItems(updatedUnassignedItems);
      setBoxDistributions(boxDistributions.filter(box => box.boxNumber !== boxNumber));
    }
  };
  
  const handleAddItemToBox = (boxNumber: number, item: typeof unassignedItems[0], quantity: number) => {
    if (quantity <= 0 || quantity > item.quantity) return;
    
    // Add item to box
    setBoxDistributions(boxDistributions.map(box => {
      if (box.boxNumber === boxNumber) {
        const existingItem = box.items.find(i => i.productId === item.productId);
        if (existingItem) {
          // Increment existing item quantity
          return {
            ...box,
            items: box.items.map(i => 
              i.productId === item.productId 
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          };
        } else {
          // Add new item to box
          const product = products.find(p => p.id === item.productId);
          return {
            ...box,
            items: [
              ...box.items, 
              { 
                productId: item.productId, 
                productName: product ? product.name : "Unknown Product",
                quantity,
                weight: 0
              }
            ]
          };
        }
      }
      return box;
    }));
    
    // Remove from unassigned items
    setUnassignedItems(unassignedItems.map(i => {
      if (i.id === item.id) {
        return { ...i, quantity: i.quantity - quantity };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };
  
  const handleRemoveItemFromBox = (boxNumber: number, productId: string, quantity?: number) => {
    // Find the box and item
    const box = boxDistributions.find(b => b.boxNumber === boxNumber);
    if (!box) return;
    
    const itemInBox = box.items.find(i => i.productId === productId);
    if (!itemInBox) return;
    
    const amountToRemove = quantity || itemInBox.quantity;
    
    // Update box by removing or decreasing the item
    setBoxDistributions(boxDistributions.map(b => {
      if (b.boxNumber === boxNumber) {
        return {
          ...b,
          items: b.items
            .map(i => {
              if (i.productId === productId) {
                return { ...i, quantity: i.quantity - amountToRemove };
              }
              return i;
            })
            .filter(i => i.quantity > 0) // Remove items with 0 quantity
        };
      }
      return b;
    }));
    
    // Return to unassigned items
    const existingUnassigned = unassignedItems.find(i => i.productId === productId);
    if (existingUnassigned) {
      setUnassignedItems(unassignedItems.map(i => {
        if (i.productId === productId) {
          return { ...i, quantity: i.quantity + amountToRemove };
        }
        return i;
      }));
    } else {
      // Add as new unassigned item
      const product = products.find(p => p.id === productId);
      setUnassignedItems([
        ...unassignedItems,
        {
          id: crypto.randomUUID(),
          productId,
          productName: product ? product.name : "Unknown Product",
          quantity: amountToRemove
        }
      ]);
    }
  };

  // Check if all items have been assigned to boxes
  const areAllItemsAssigned = useMemo(() => {
    return unassignedItems.length === 0;
  }, [unassignedItems]);
  
  const handleContinueToBoxes = () => {
    // Validate items before proceeding
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

    if (selectedCustomer?.needsDetailedBoxLabels) {
      setCurrentStep("boxes");
      
      // Initialize box distributions if needed
      if (boxDistributions.length === 0) {
        setBoxDistributions([{ 
          boxNumber: 1, 
          items: [], 
          completed: false,
          printed: false
        }]);
      }
    } else {
      // If customer doesn't need box labels, submit the form directly
      form.handleSubmit(onSubmit)();
    }
  };

  const handleGoBackToItems = () => {
    setCurrentStep("items");
  };

  const onSubmit = (data: OrderFormValues) => {
    // Validate items if not using box distribution
    if (!selectedCustomer?.needsDetailedBoxLabels) {
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
    } else {
      // For customers with box labels, check if all items are assigned
      if (!areAllItemsAssigned) {
        toast({
          title: "Unassigned items",
          description: "Please assign all items to boxes before submitting.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if there are empty boxes
      const hasEmptyBoxes = boxDistributions.some(box => box.items.length === 0);
      if (hasEmptyBoxes) {
        toast({
          title: "Empty boxes",
          description: "Please remove any empty boxes before submitting.",
          variant: "destructive",
        });
        return;
      }
    }

    // Create new order with or without box distribution
    const orderItems: OrderItem[] = selectedCustomer?.needsDetailedBoxLabels 
      ? boxDistributions.flatMap(box => 
          box.items.map(item => ({
            id: crypto.randomUUID(),
            productId: item.productId,
            product: products.find(p => p.id === item.productId)!,
            quantity: item.quantity,
            boxNumber: box.boxNumber
          }))
        )
      : orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          product: products.find(p => p.id === item.productId)!,
          quantity: item.quantity
        }));

    const newOrder = {
      id: crypto.randomUUID(),
      customerId: data.customerId,
      customer: customers.find(c => c.id === data.customerId)!,
      customerOrderNumber: data.customerOrderNumber,
      orderDate: format(data.orderDate, "yyyy-MM-dd"),
      deliveryMethod: data.deliveryMethod as "Delivery" | "Collection",
      items: orderItems,
      notes: data.notes,
      status: "Pending" as const,
      created: new Date().toISOString(),
      // Include box distributions if customer needs detailed box labels
      boxDistributions: selectedCustomer?.needsDetailedBoxLabels ? boxDistributions : undefined
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
    setBoxDistributions([{ boxNumber: 1, items: [], completed: false, printed: false }]);
    setUnassignedItems([]);
    setCurrentStep("items");
    setManualDateChange(false);
    
    // Navigate back to orders page
    navigate("/orders");
  };

  const handleCancel = () => {
    navigate("/orders");
  };

  const getSelectedCustomerName = () => {
    const customerId = form.watch("customerId");
    if (!customerId) return "Select a customer...";
    
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Select a customer...";
  };
  
  const isCustomerOnHold = (customerId: string) => {
    if (!customerId) return false;
    const customer = customers.find(c => c.id === customerId);
    return customer?.onHold || false;
  };
  
  const getSelectedProductName = (productId: string) => {
    if (!productId) return "Select a product...";
    
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.sku})` : "Select a product...";
  };

  return (
    <>
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Selection with Search */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <div className="relative">
                    <Button 
                      type="button"
                      variant="outline" 
                      className={cn(
                        "w-full justify-between",
                        isCustomerOnHold(field.value) && "text-red-500 font-medium"
                      )}
                      onClick={() => setShowCustomerSearch(true)}
                    >
                      {getSelectedCustomerName()}
                      {selectedCustomer?.needsDetailedBoxLabels && (
                        <Package className="mx-2 h-4 w-4 text-blue-500" />
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>
                  <CommandDialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <CommandInput 
                        placeholder="Search customers by name, email, phone or account..."
                        value={customerSearch}
                        onValueChange={setCustomerSearch}
                        autoFocus={true}
                        className="pl-8"
                      />
                    </div>
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup heading="Customers">
                        {filteredCustomers.map(customer => (
                          <CommandItem 
                            key={customer.id} 
                            value={customer.name} // Use name as the value for matching
                            onSelect={() => {
                              handleSelectCustomer(customer.id);
                            }}
                            className={customer.onHold ? "text-red-500 font-medium" : ""}
                          >
                            <div className="flex items-center">
                              {customer.name}
                              {customer.needsDetailedBoxLabels && (
                                <Package className="ml-2 h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            {customer.accountNumber && <span className="ml-2 text-muted-foreground">({customer.accountNumber})</span>}
                            {customer.onHold && " (On Hold)"}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </CommandDialog>
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

          {/* Items Step */}
          {currentStep === "items" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Items *</h3>
                {selectedCustomer?.needsDetailedBoxLabels && (
                  <div className="flex items-center text-sm text-blue-600">
                    <Package className="h-4 w-4 mr-1" />
                    This customer requires detailed box labels
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 font-medium">
                  <div className="col-span-6 md:col-span-5">Product</div>
                  <div className="col-span-3 md:col-span-3">SKU</div>
                  <div className="col-span-2 md:col-span-3 text-center">Quantity</div>
                  <div className="col-span-1"></div>
                </div>
  
                {/* Product Items */}
                {orderItems.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b">
                      <div className="col-span-6 md:col-span-5">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full justify-start text-left"
                          onClick={() => {
                            setActiveProductItemId(item.id);
                            setProductSearch(""); // Reset search when opening
                            setShowProductSearch(true);
                          }}
                        >
                          <span className="truncate">
                            {getSelectedProductName(item.productId)}
                          </span>
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </div>
                      <div className="col-span-3">
                        {product ? product.sku : ""}
                      </div>
                      <div className="col-span-2 md:col-span-3">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity || ""}
                          onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 0)}
                          className="text-center text-gray-500"
                          placeholder="Qty"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={orderItems.length <= 1}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full mt-2" 
                  onClick={handleAddItem}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Another Product
                </Button>
              </div>
            </div>
          )}

          {/* Box Distribution Step */}
          {currentStep === "boxes" && selectedCustomer?.needsDetailedBoxLabels && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Box Distribution</h3>
                <div className="flex items-center text-sm text-blue-600">
                  <Package className="h-4 w-4 mr-1" />
                  Assigning products to boxes
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unassigned Items */}
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">Unassigned Items</h4>
                  {unassignedItems.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      All items have been assigned to boxes
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {unassignedItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">Add to Box</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {boxDistributions.map(box => (
                                <DropdownMenuItem 
                                  key={box.boxNumber}
                                  onClick={() => handleAddItemToBox(box.boxNumber, item, item.quantity)}
                                >
                                  Add to Box {box.boxNumber}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Box Management */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Boxes</h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddBox}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add Box
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {boxDistributions.map(box => (
                      <div key={box.boxNumber} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">Box {box.boxNumber}</h5>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBox(box.boxNumber)}
                            disabled={boxDistributions.length <= 1}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        
                        {box.items.length === 0 ? (
                          <div className="text-center py-2 text-gray-500">
                            No items in this box
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {box.items.map(item => (
                              <div key={item.productId} className="flex justify-between items-center text-sm border-b pb-1">
                                <div className="flex-1">
                                  <div>{item.productName}</div>
                                  <div className="text-gray-500">Qty: {item.quantity}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItemFromBox(box.boxNumber, item.productId)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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
            {currentStep === "boxes" ? (
              <>
                <Button type="button" variant="outline" onClick={handleGoBackToItems}>
                  Back to Items
                </Button>
                <Button 
                  type="button" 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={!areAllItemsAssigned}
                >
                  Create Order
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleContinueToBoxes}>
                  {selectedCustomer?.needsDetailedBoxLabels ? "Continue to Box Distribution" : "Create Order"}
                </Button>
              </>
            )}
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

      {/* On Hold Customer Warning Dialog */}
      <AlertDialog open={showOnHoldWarning} onOpenChange={setShowOnHoldWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Customer On Hold Warning</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCustomer && (
                <>
                  <p className="font-medium text-red-500 mb-2">
                    {selectedCustomer.name} is currently on hold.
                  </p>
                  <p className="mb-4">
                    Reason: {selectedCustomer.holdReason || "No reason provided"}
                  </p>
                  <p>Are you sure you want to proceed with this customer?</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelOnHoldCustomer}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmOnHoldCustomer}>
              Yes, Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Search Dialog - Improved */}
      <CommandDialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <CommandInput 
            placeholder="Search products by name or SKU..."
            value={productSearch}
            onValueChange={setProductSearch}
            autoFocus={true}
            className="pl-8"
          />
        </div>
        <CommandList>
          <CommandEmpty>No products found.</CommandEmpty>
          <CommandGroup heading="Products">
            {filteredProducts.map(product => (
              <CommandItem 
                key={product.id} 
                value={`${product.name} ${product.sku}`} // Combined value for better matching
                onSelect={() => {
                  console.log(`Product selected: ${product.name} (${product.id})`);
                  if (activeProductItemId) {
                    handleSelectProduct(activeProductItemId, product.id);
                  }
                }}
              >
                <span>{product.name}</span>
                <span className="ml-2 text-muted-foreground">({product.sku})</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CreateOrderForm;
