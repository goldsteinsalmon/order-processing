
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO, isAfter } from "date-fns";
import { useData } from "@/context/DataContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderItem } from "@/types";
import { ArrowLeft, Plus, Minus, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isBusinessDay } from "@/utils/dateUtils";

const EditStandingOrderDeliveryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const deliveryDateParam = searchParams.get("date");
  
  const navigate = useNavigate();
  const { standingOrders, addOrder, updateStandingOrder, products } = useData();
  const { toast } = useToast();
  
  // State for order form
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState<Date | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"Delivery" | "Collection">("Delivery");
  const [customerOrderNumber, setCustomerOrderNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<{ 
    id: string; 
    productId: string; 
    quantity: number;
  }[]>([]);
  
  // Product addition state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  
  const standingOrder = standingOrders.find(order => order.id === id);
  
  useEffect(() => {
    if (standingOrder && deliveryDateParam) {
      const parsedDate = new Date(deliveryDateParam);
      
      // Set up form with standing order data
      setCustomerId(standingOrder.customerId);
      setCustomerName(standingOrder.customer.name);
      setOrderDate(parsedDate);
      setDeliveryMethod(standingOrder.schedule.deliveryMethod);
      setCustomerOrderNumber(standingOrder.customerOrderNumber || "");
      setNotes(standingOrder.notes || "");
      
      // Convert order items for the form
      setOrderItems(
        standingOrder.items.map(item => ({
          id: uuidv4(),
          productId: item.productId,
          quantity: item.quantity
        }))
      );
    }
  }, [standingOrder, deliveryDateParam]);
  
  if (!standingOrder || !deliveryDateParam || !orderDate) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Standing order or delivery date not found</h2>
          <Button variant="outline" onClick={() => navigate("/standing-orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Standing Orders
          </Button>
        </div>
      </Layout>
    );
  }
  
  const handleAddItem = () => {
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
      quantity: selectedQuantity
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      toast({
        title: "No products added",
        description: "Please add at least one product to the order.",
        variant: "destructive",
      });
      return;
    }

    // Create full order items with product data
    const fullOrderItems: OrderItem[] = orderItems
      .filter(item => item.productId && item.quantity > 0)
      .map(item => {
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
    
    if (fullOrderItems.length === 0) {
      toast({
        title: "Invalid items",
        description: "Please ensure all items have a product and quantity.",
        variant: "destructive",
      });
      return;
    }
    
    // Create the new order using the scheduled delivery date
    const newOrder = {
      id: uuidv4(),
      customerId: standingOrder.customerId,
      customer: standingOrder.customer,
      customerOrderNumber: customerOrderNumber,
      orderDate: orderDate.toISOString(), // Use the scheduled date from the standing order
      requiredDate: orderDate.toISOString(),
      deliveryMethod: deliveryMethod,
      items: fullOrderItems,
      notes: notes ? 
        `${notes} (Processed from Standing Order #${standingOrder.id.substring(0, 8)})` : 
        `Processed from Standing Order #${standingOrder.id.substring(0, 8)}`,
      status: "Pending" as const,
      created: new Date().toISOString(),
      fromStandingOrder: standingOrder.id,
    };
    
    // Mark the date as processed in the standing order
    const updatedStandingOrder = { ...standingOrder };
    
    // Initialize processedDates if it doesn't exist
    if (!updatedStandingOrder.schedule.processedDates) {
      updatedStandingOrder.schedule.processedDates = [];
    }
    
    // Add this date to processedDates if not already there
    const deliveryDateStr = format(orderDate, "yyyy-MM-dd");
    const alreadyProcessed = updatedStandingOrder.schedule.processedDates.some(
      d => format(new Date(d), "yyyy-MM-dd") === deliveryDateStr
    );
    
    if (!alreadyProcessed) {
      updatedStandingOrder.schedule.processedDates.push(orderDate.toISOString());
    }
    
    // Update the standing order with the processed date
    updateStandingOrder(updatedStandingOrder);
    
    // Add the new order
    addOrder(newOrder);
    
    // Show success message
    toast({
      title: "Order created",
      description: "The order has been created from the standing order."
    });
    
    // Navigate back
    navigate(`/standing-order-schedule/${standingOrder.id}`);
  };
  
  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/standing-order-schedule/${standingOrder.id}`)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Edit Standing Order Delivery</h2>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Delivery Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex space-x-2">
              <dt className="font-medium">Customer:</dt>
              <dd>{customerName}</dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Delivery Date:</dt>
              <dd>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {orderDate ? format(orderDate, "EEEE, MMMM d, yyyy") : "Select date..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={orderDate}
                      onSelect={(date) => date && setOrderDate(date)}
                      disabled={(date) => !isBusinessDay(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Delivery Method:</dt>
              <dd>
                <Select value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as "Delivery" | "Collection")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                    <SelectItem value="Collection">Collection</SelectItem>
                  </SelectContent>
                </Select>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="customerOrderNumber" className="block text-sm font-medium mb-1">
                Customer Order Number (Optional)
              </label>
              <Input
                id="customerOrderNumber"
                value={customerOrderNumber}
                onChange={(e) => setCustomerOrderNumber(e.target.value)}
                placeholder="Enter customer's order number"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions or notes"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Items</span>
              <Button type="button" onClick={handleAddItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Product</label>
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
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium py-2">Product</th>
                    <th className="text-left font-medium py-2">SKU</th>
                    <th className="text-center font-medium py-2">Quantity</th>
                    <th className="text-right font-medium py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        No items added to this order
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="py-3">
                            <Select 
                              value={item.productId} 
                              onValueChange={(value) => handleItemChange(item.id, "productId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue>
                                  {product ? product.name : "Select product"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {products.map(p => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3">{product ? product.sku : ""}</td>
                          <td className="py-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 0)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Minus className="h-4 w-4 text-red-500" />
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
        
        <div className="flex justify-end mt-6 space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/standing-order-schedule/${standingOrder.id}`)}
          >
            Cancel
          </Button>
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
      </form>
    </Layout>
  );
};

export default EditStandingOrderDeliveryPage;
