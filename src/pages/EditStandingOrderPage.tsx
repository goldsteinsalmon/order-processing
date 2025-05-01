
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getOrderProcessingDate } from "@/utils/dateUtils";
import { StandingOrderItem, Product } from "@/types";
import { v4 as uuidv4 } from "uuid";

const EditStandingOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { standingOrders, updateStandingOrder, products } = useData();
  const { toast } = useToast();
  
  const order = standingOrders.find(order => order.id === id);
  
  const [frequency, setFrequency] = useState<"Weekly" | "Bi-Weekly" | "Monthly">("Weekly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"Delivery" | "Collection">("Delivery");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<StandingOrderItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [productQuantity, setProductQuantity] = useState<number>(1);
  
  // Available products (excluding those already in the order)
  const availableProducts = products.filter(
    product => !items.some(item => item.product_id === product.id)
  );
  
  // Load initial values
  useEffect(() => {
    if (order) {
      setFrequency(order.schedule.frequency);
      setDayOfWeek(order.schedule.dayOfWeek || 1);
      setDayOfMonth(order.schedule.dayOfMonth || 1);
      setDeliveryMethod(order.schedule.deliveryMethod);
      setActive(order.active);
      setNotes(order.notes || "");
      setItems(order.items || []);
    }
  }, [order]);
  
  // Check for changes
  useEffect(() => {
    if (order) {
      const itemsChanged = JSON.stringify(items) !== JSON.stringify(order.items);
      
      const changes = 
        frequency !== order.schedule.frequency ||
        (frequency === "Weekly" || frequency === "Bi-Weekly") && dayOfWeek !== order.schedule.dayOfWeek ||
        frequency === "Monthly" && dayOfMonth !== order.schedule.dayOfMonth ||
        deliveryMethod !== order.schedule.deliveryMethod ||
        active !== order.active ||
        notes !== (order.notes || "") ||
        itemsChanged;
      
      setHasChanges(changes);
    }
  }, [frequency, dayOfWeek, dayOfMonth, deliveryMethod, active, notes, items, order]);
  
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

  // Get day of week name
  const getDayOfWeekName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };
  
  // Handle quantity change
  const handleQuantityChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      quantity: parseInt(value) || 0
    };
    setItems(newItems);
  };
  
  // Handle add product
  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    const newItem: StandingOrderItem = {
      id: uuidv4(),
      product_id: product.id,
      product,
      quantity: productQuantity
    };
    
    setItems([...items, newItem]);
    setSelectedProduct("");
    setProductQuantity(1);
    setShowAddProduct(false);
  };
  
  // Handle remove product
  const handleRemoveProduct = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  const handleSave = () => {
    // Calculate next delivery date based on frequency settings
    let nextDeliveryDate = new Date();
    
    if (frequency === "Weekly" || frequency === "Bi-Weekly") {
      // Set to the next occurrence of the selected day of week
      const currentDayOfWeek = nextDeliveryDate.getDay();
      let daysToAdd = dayOfWeek - currentDayOfWeek;
      
      if (daysToAdd <= 0) {
        // If the day has already occurred this week, go to next week
        daysToAdd += 7;
      }
      
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + daysToAdd);
      
      // Add another week for Bi-Weekly
      if (frequency === "Bi-Weekly") {
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
      }
    } else if (frequency === "Monthly") {
      // Set to the selected day of the current month
      nextDeliveryDate.setDate(dayOfMonth);
      
      // If the day has already occurred this month, go to next month
      if (nextDeliveryDate < new Date()) {
        nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
      }
    }
    
    const nextProcessingDate = getOrderProcessingDate(nextDeliveryDate);
    
    const updatedStandingOrder = {
      ...order,
      schedule: {
        ...order.schedule,
        frequency,
        ...(frequency === "Weekly" || frequency === "Bi-Weekly" ? { dayOfWeek } : {}),
        ...(frequency === "Monthly" ? { dayOfMonth } : {}),
        deliveryMethod,
        nextDeliveryDate: nextDeliveryDate.toISOString()
      },
      items: items,
      active,
      notes: notes || undefined,
      next_processing_date: nextProcessingDate.toISOString(),
      updated: new Date().toISOString()
    };
    
    updateStandingOrder(updatedStandingOrder);
    
    toast({
      title: "Standing Order Updated",
      description: `Changes to standing order for ${order.customer?.name} have been saved.`
    });
    
    navigate(`/standing-order-details/${order.id}`);
  };

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/standing-order-details/${order.id}`)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Edit Standing Order</h2>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex space-x-2">
                <dt className="font-medium">Customer:</dt>
                <dd>{order.customer?.name}</dd>
              </div>
              <div className="flex space-x-2">
                <dt className="font-medium">Order ID:</dt>
                <dd>{order.id}</dd>
              </div>
              {order.customer_order_number && (
                <div className="flex space-x-2">
                  <dt className="font-medium">Customer Order #:</dt>
                  <dd>{order.customer_order_number}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddProduct(!showAddProduct)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardHeader>
          <CardContent>
            {showAddProduct && (
              <div className="mb-4 p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-3">
                    <Label htmlFor="product">Product</Label>
                    <Select
                      value={selectedProduct}
                      onValueChange={setSelectedProduct}
                    >
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.length > 0 ? (
                          availableProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            All products already added
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <Button 
                      onClick={handleAddProduct}
                      disabled={!selectedProduct || productQuantity <= 0 || availableProducts.length === 0}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium py-2">Product</th>
                    <th className="text-left font-medium py-2">SKU</th>
                    <th className="text-right font-medium py-2 w-32">Quantity</th>
                    <th className="text-right font-medium py-2 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No products added to this standing order
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">{item.product.name}</td>
                        <td className="py-3">{item.product.sku}</td>
                        <td className="py-3">
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className="w-20 text-right ml-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveProduct(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Frequency</Label>
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
                <Label>Day of Week</Label>
                <Select 
                  value={dayOfWeek.toString()} 
                  onValueChange={(value) => setDayOfWeek(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of week" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(day => (
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
                <Label>Day of Month</Label>
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
              <Label>Delivery Method</Label>
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
              <Label>Status</Label>
              <RadioGroup 
                value={active ? "active" : "inactive"} 
                onValueChange={(value) => setActive(value === "active")} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="inactive" />
                  <Label htmlFor="inactive">Inactive</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional notes or instructions"
              rows={3}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">
              {hasChanges ? "You have unsaved changes" : "No changes made"}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate(`/standing-order-details/${order.id}`)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default EditStandingOrderPage;
