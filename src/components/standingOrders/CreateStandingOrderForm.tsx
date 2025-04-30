
import React, { useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { shouldProcessImmediately, getOrderProcessingDate } from "@/utils/dateUtils";
import { Order } from "@/types";

const CreateStandingOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customers, products, addStandingOrder, addOrder } = useData();
  
  // Form state
  const [customerId, setCustomerId] = useState("");
  const [customerOrderNumber, setCustomerOrderNumber] = useState("");
  const [frequency, setFrequency] = useState<"Weekly" | "Bi-Weekly" | "Monthly">("Weekly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"Delivery" | "Collection">("Delivery");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<{id: string; productId: string; quantity: number}[]>([]);
  
  // Product selection
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductQuantity, setSelectedProductQuantity] = useState(1);

  // Get first delivery date based on frequency settings
  const getFirstDeliveryDate = () => {
    const today = new Date();
    const nextDeliveryDate = new Date();
    
    if (frequency === "Weekly" || frequency === "Bi-Weekly") {
      // Set to the next occurrence of the selected day of week
      const currentDayOfWeek = today.getDay();
      let daysToAdd = dayOfWeek - currentDayOfWeek;
      
      if (daysToAdd <= 0) {
        // If the day has already occurred this week, go to next week
        daysToAdd += 7;
      }
      
      nextDeliveryDate.setDate(today.getDate() + daysToAdd);
    } else if (frequency === "Monthly") {
      // Set to the selected day of the current month
      nextDeliveryDate.setDate(dayOfMonth);
      
      // If the day has already occurred this month, go to next month
      if (nextDeliveryDate < today) {
        nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
      }
    }
    
    return nextDeliveryDate;
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

    const newItem = {
      id: uuidv4(),
      productId: selectedProductId,
      quantity: selectedProductQuantity,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProductId("");
    setSelectedProductQuantity(1);
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
        productId: item.productId,
        product: product,
        quantity: item.quantity,
      };
    });

    // Generate first delivery date
    const firstDeliveryDate = getFirstDeliveryDate();
    const firstDeliveryDateString = firstDeliveryDate.toISOString();

    // Create the standing order object
    const standingOrder = {
      id: uuidv4(),
      customerId,
      customer,
      customerOrderNumber: customerOrderNumber || undefined,
      schedule: {
        frequency,
        ...(frequency === "Weekly" || frequency === "Bi-Weekly" ? { dayOfWeek } : {}),
        ...(frequency === "Monthly" ? { dayOfMonth } : {}),
        deliveryMethod,
        nextDeliveryDate: firstDeliveryDateString,
      },
      items: fullOrderItems,
      notes: notes || undefined,
      active: true,
      created: new Date().toISOString(),
      nextProcessingDate: getOrderProcessingDate(firstDeliveryDate).toISOString(),
    };

    // Add to standing orders
    addStandingOrder(standingOrder);

    // Create an immediate order if this first delivery qualifies for immediate processing
    if (shouldProcessImmediately(firstDeliveryDate)) {
      // Create a normal order from the standing order for immediate processing
      const immediateOrder: Order = {
        id: uuidv4(),
        customerId,
        customer,
        customerOrderNumber: customerOrderNumber || undefined,
        orderDate: firstDeliveryDateString,
        deliveryMethod,
        items: fullOrderItems,
        notes: notes ? `${notes} (Generated from Standing Order #${standingOrder.id.substring(0, 8)})` : `Generated from Standing Order #${standingOrder.id.substring(0, 8)}`,
        status: "Pending",
        created: new Date().toISOString(),
        fromStandingOrder: standingOrder.id,
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

  // Get day of week name
  const getDayOfWeekName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Customer Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            
            {(frequency === "Weekly" || frequency === "Bi-Weekly") && (
              <div>
                <Label>Day of Week *</Label>
                <Select 
                  value={dayOfWeek.toString()} 
                  onValueChange={(value) => setDayOfWeek(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of week" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {getDayOfWeekName(day)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
              <Label>First Delivery</Label>
              <div className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 border border-gray-200 rounded">
                {getFirstDeliveryDate() ? format(getFirstDeliveryDate(), "EEEE, MMMM d, yyyy") : "Please select frequency options"}
                {shouldProcessImmediately(getFirstDeliveryDate()) && (
                  <Badge variant="secondary" className="ml-2">Will be processed immediately</Badge>
                )}
              </div>
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
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-24">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={selectedProductQuantity}
                onChange={e => setSelectedProductQuantity(parseInt(e.target.value) || 1)}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
    </form>
  );
};

export default CreateStandingOrderForm;
