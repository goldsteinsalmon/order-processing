import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, CalendarIcon, Search } from "lucide-react";
import { shouldProcessImmediately, getOrderProcessingDate } from "@/utils/dateUtils";
import { Order, Customer } from "@/types";
import { cn } from "@/lib/utils";

const CreateStandingOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customers, products, addStandingOrder, addOrder } = useData();
  
  // Form state
  const [customerId, setCustomerId] = useState("");
  const [customerOrderNumber, setCustomerOrderNumber] = useState("");
  const [frequency, setFrequency] = useState<"Weekly" | "Bi-Weekly" | "Monthly">("Weekly");
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"Delivery" | "Collection">("Delivery");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<{id: string; productId: string; quantity: number}[]>([]);
  
  // Search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showOnHoldWarning, setShowOnHoldWarning] = useState(false);
  
  // Product selection
  const [productSearch, setProductSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductQuantity, setSelectedProductQuantity] = useState<number | null>(null);
  
  // First delivery date
  const [firstDeliveryDate, setFirstDeliveryDate] = useState<Date>(new Date());

  // Update default delivery date when frequency settings change
  React.useEffect(() => {
    // Ensure the selected date is in the future
    if (firstDeliveryDate < new Date()) {
      setFirstDeliveryDate(new Date());
    }
  }, [frequency]);

  // Sort products by SKU
  const sortedProducts = useMemo(() => 
    [...products].sort((a, b) => a.sku.localeCompare(b.sku)),
    [products]
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
  
  // Filter customers
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

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    
    // If customer is on hold, show warning dialog
    if (customer && customer.onHold) {
      setSelectedCustomer(customer);
      setShowOnHoldWarning(true);
    } else {
      // If not on hold, proceed normally
      setCustomerId(customerId);
      setShowCustomerSearch(false);
    }
  };
  
  const confirmOnHoldCustomer = () => {
    if (selectedCustomer) {
      setCustomerId(selectedCustomer.id);
      setShowOnHoldWarning(false);
      setShowCustomerSearch(false);
    }
  };
  
  const cancelOnHoldCustomer = () => {
    setSelectedCustomer(null);
    setShowOnHoldWarning(false);
  };

  const addProductToOrder = () => {
    if (!selectedProductId) {
      toast({
        title: "No product selected",
        description: "Please select a product to add to the order.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProductQuantity === null || selectedProductQuantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than zero.",
        variant: "destructive",
      });
      return;
    }

    const newItem = {
      id: uuidv4(),
      productId: selectedProductId,
      quantity: selectedProductQuantity,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProductId("");
    setSelectedProductQuantity(null);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setShowProductSearch(false);
    // Focus on quantity input after selecting a product
    setTimeout(() => {
      const quantityInput = document.getElementById("quantity") as HTMLInputElement;
      if (quantityInput) {
        quantityInput.focus();
      }
    }, 100);
  };

  const removeProductFromOrder = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast({
        title: "No customer selected",
        description: "Please select a customer for this standing order.",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "No products added",
        description: "Please add at least one product to the standing order.",
        variant: "destructive",
      });
      return;
    }

    // Find customer
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      toast({
        title: "Invalid customer",
        description: "The selected customer could not be found.",
        variant: "destructive",
      });
      return;
    }

    // Create full order items with product data
    const fullOrderItems = orderItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      return {
        id: item.id,
        product_id: item.productId,
        product: product,
        quantity: item.quantity,
      };
    });

    // Use the selected first delivery date
    const firstDeliveryDateString = firstDeliveryDate.toISOString();
    
    // Calculate day of week from the selected delivery date (0-6, Sunday to Saturday)
    const dayOfWeek = firstDeliveryDate.getDay();

    // Create the standing order object with snake_case property names
    const standingOrder = {
      id: uuidv4(),
      customer_id: customerId,
      customer: customers.find(c => c.id === customerId),
      customer_order_number: customerOrderNumber || undefined,
      frequency,
      day_of_week: frequency === "Weekly" || frequency === "Bi-Weekly" ? dayOfWeek : undefined,
      day_of_month: frequency === "Monthly" ? firstDeliveryDate.getDate() : undefined,
      delivery_method: deliveryMethod,
      next_delivery_date: firstDeliveryDateString,
      items: fullOrderItems,
      notes: notes || undefined,
      active: true,
      created: new Date().toISOString(),
      next_processing_date: getOrderProcessingDate(firstDeliveryDate).toISOString(),
    };

    // Add to standing orders
    addStandingOrder(standingOrder);

    // Create an immediate order if this first delivery qualifies for immediate processing
    if (shouldProcessImmediately(firstDeliveryDate)) {
      // Create a normal order from the standing order for immediate processing
      const immediateOrder: Order = {
        id: uuidv4(),
        customer_id: customerId,
        customer: customers.find(c => c.id === customerId),
        customer_order_number: customerOrderNumber || undefined,
        order_date: firstDeliveryDateString,
        required_date: firstDeliveryDateString,
        delivery_method: deliveryMethod,
        items: fullOrderItems,
        notes: notes ? `${notes} (Generated from Standing Order #${standingOrder.id.substring(0, 8)})` : `Generated from Standing Order #${standingOrder.id.substring(0, 8)}`,
        status: "Pending",
        created: new Date().toISOString(),
        from_standing_order: standingOrder.id,
      };
      
      // Add the immediate order to the orders list
      addOrder(immediateOrder);
      
      toast({
        title: "Standing Order Created",
        description: `Standing order for ${customer.name} has been created with first delivery processed immediately.`,
      });
    } else {
      toast({
        title: "Standing Order Created",
        description: `Standing order for ${customer.name} has been created with first delivery scheduled.`,
      });
    }

    navigate("/standing-orders");
  };
  
  const getSelectedCustomerName = () => {
    if (!customerId) return "Select a customer...";
    
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Select a customer...";
  };
  
  // Correcting the hold reason reference
  const isCustomerOnHold = (customerId: string) => {
    if (!customerId) return false;
    const customer = customers.find(c => c.id === customerId);
    return customer?.on_hold || false;
  };
  
  const getSelectedProductName = (productId: string) => {
    if (!productId) return "Select a product...";
    
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.sku})` : "Select a product...";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Customer Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Button 
                type="button" 
                variant="outline"
                className={cn(
                  "w-full justify-between",
                  isCustomerOnHold(customerId) && "text-red-500 font-medium"
                )}
                onClick={() => setShowCustomerSearch(true)}
              >
                {getSelectedCustomerName()}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </div>
            
            <div>
              <Label htmlFor="customerOrderNumber">Customer Order Number (Optional)</Label>
              <Input
                id="customerOrderNumber"
                value={customerOrderNumber}
                onChange={e => setCustomerOrderNumber(e.target.value)}
                placeholder="Enter customer's order reference"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Schedule Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label>Frequency *</Label>
              <RadioGroup value={frequency} onValueChange={(value: "Weekly" | "Bi-Weekly" | "Monthly") => setFrequency(value)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Bi-Weekly" id="biweekly" />
                  <Label htmlFor="biweekly">Bi-Weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
              </RadioGroup>
            </div>
            
            {frequency === "Monthly" && (
              <div>
                <Label>Day of Month *</Label>
                <Select 
                  value={dayOfMonth.toString()} 
                  onValueChange={(value) => setDayOfMonth(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Delivery Method *</Label>
              <RadioGroup 
                value={deliveryMethod} 
                onValueChange={(value: "Delivery" | "Collection") => setDeliveryMethod(value)} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Collection" id="collection" />
                  <Label htmlFor="collection">Collection</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label>First Delivery Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !firstDeliveryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {firstDeliveryDate ? format(firstDeliveryDate, "EEEE, MMMM d, yyyy") : <span>Pick a date</span>}
                    {shouldProcessImmediately(firstDeliveryDate) && (
                      <Badge variant="secondary" className="ml-2">Will be processed immediately</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={firstDeliveryDate}
                    onSelect={(date) => date && setFirstDeliveryDate(date)}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground mt-1">
                This date will determine the day of week for weekly/bi-weekly orders or the day of month for monthly orders.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Products */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Products</h3>
          
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="product">Select Product</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between text-left"
                onClick={() => {
                  setProductSearch(""); // Reset search when opening
                  setShowProductSearch(true);
                }}
              >
                <span className="truncate">
                  {getSelectedProductName(selectedProductId)}
                </span>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </div>
            
            <div className="w-24">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={selectedProductQuantity === null ? "" : selectedProductQuantity}
                onChange={e => setSelectedProductQuantity(e.target.value ? parseInt(e.target.value) : null)}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-500"
                placeholder="Qty"
              />
            </div>
            
            <div className="flex items-end">
              <Button type="button" onClick={addProductToOrder}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>
          
          {/* Product list */}
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">SKU</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                      No products added yet
                    </td>
                  </tr>
                ) : (
                  orderItems.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-2">{product.name}</td>
                        <td className="px-4 py-2">{product.sku}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeProductFromOrder(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Information */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional notes or instructions"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate("/standing-orders")}
        >
          Cancel
        </Button>
        <Button type="submit">Create Standing Order</Button>
      </div>

      {/* Customer Search Dialog */}
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

      {/* Product Search Dialog */}
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
                onSelect={() => handleSelectProduct(product.id)}
              >
                <span>{product.name}</span>
                <span className="ml-2 text-muted-foreground">({product.sku})</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

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
    </form>
  );
};

export default CreateStandingOrderForm;
