import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isToday, isBefore, startOfDay, addBusinessDays } from "date-fns";
import { Plus, Search, X } from "lucide-react";
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
import { OrderItem, Customer } from "@/types";

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
  
  // Sort products by SKU
  const sortedProducts = [...products].sort((a, b) => 
    a.sku.localeCompare(b.sku)
  );
  
  // Filtered products based on search
  const filteredProducts = productSearch.trim() !== "" 
    ? sortedProducts.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearch.toLowerCase())
      )
    : sortedProducts;
  
  // Filtered customers based on search - Fixed to properly search by name
  const filteredCustomers = customerSearch.trim() !== ""
    ? customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (customer.accountNumber && customer.accountNumber.toLowerCase().includes(customerSearch.toLowerCase()))
      )
    : customers;
    
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
    setOrderItems([...orderItems, { productId: "", quantity: 1, id: crypto.randomUUID() }]);
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
  
  const handleSelectProduct = (id: string, productId: string) => {
    handleItemChange(id, "productId", productId);
    setShowProductSearch(false);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>
                  <CommandDialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
                    <CommandInput 
                      placeholder="Search customers..."
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                      autoFocus={true}
                    />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup heading="Customers">
                        {filteredCustomers.map(customer => (
                          <CommandItem 
                            key={customer.id} 
                            value={customer.id}
                            onSelect={() => handleSelectCustomer(customer.id)}
                            className={customer.onHold ? "text-red-500 font-medium" : ""}
                          >
                            {customer.name}
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items *</h3>
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
                        onClick={() => setShowProductSearch(true)}
                      >
                        <span className="truncate">
                          {getSelectedProductName(item.productId)}
                        </span>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                      {showProductSearch && (
                        <CommandDialog open={showProductSearch} onOpenChange={setShowProductSearch}>
                          <CommandInput 
                            placeholder="Search products by name or SKU..."
                            value={productSearch}
                            onValueChange={setProductSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No products found.</CommandEmpty>
                            <CommandGroup>
                              {filteredProducts.map(product => (
                                <CommandItem 
                                  key={product.id} 
                                  value={product.id}
                                  onSelect={() => handleSelectProduct(item.id, product.id)}
                                >
                                  <span>{product.name}</span>
                                  <span className="ml-2 text-muted-foreground">({product.sku})</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </CommandDialog>
                      )}
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
                        className="text-center"
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
    </>
  );
};

export default CreateOrderForm;
