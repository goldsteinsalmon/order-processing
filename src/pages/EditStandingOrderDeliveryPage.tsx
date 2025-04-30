import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { StandingOrder, OrderItem, Product } from "@/types";
import { v4 as uuidv4 } from "uuid";

const EditStandingOrderDeliveryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { standingOrders, updateStandingOrder, products, addOrder } = useData();
  const { toast } = useToast();
  
  // Extract the date from the query parameter
  const queryParams = new URLSearchParams(location.search);
  const dateParam = queryParams.get('date');
  const deliveryDate = dateParam ? new Date(dateParam) : null;
  
  const [order, setOrder] = useState<StandingOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [processImmediately, setProcessImmediately] = useState<boolean>(false);
  
  // Available products (excluding those already in the order)
  const availableProducts = products.filter(
    product => !items.some(item => item.productId === product.id)
  );
  
  console.log("Initial render with date:", deliveryDate?.toISOString());
  
  // Find the standing order
  useEffect(() => {
    const foundOrder = standingOrders.find(order => order.id === id);
    console.log("Found standing order:", foundOrder?.id);
    
    if (foundOrder) {
      setOrder(foundOrder);
      
      // Check if this date has a modified delivery
      if (deliveryDate && foundOrder.schedule.modifiedDeliveries) {
        const modifiedDelivery = foundOrder.schedule.modifiedDeliveries.find(delivery => 
          new Date(delivery.date).toDateString() === deliveryDate.toDateString()
        );
        
        console.log("Found modified delivery:", modifiedDelivery);
        
        if (modifiedDelivery) {
          // Use the modified items if they exist
          if (modifiedDelivery.modifications.items) {
            console.log("Setting modified items:", modifiedDelivery.modifications.items);
            // Make deep copy to avoid reference issues
            const itemsCopy = JSON.parse(JSON.stringify(modifiedDelivery.modifications.items));
            setItems(itemsCopy);
          } else {
            // Otherwise use the default items
            console.log("Setting default items (from modified)");
            const itemsCopy = JSON.parse(JSON.stringify(foundOrder.items));
            setItems(itemsCopy);
          }
          
          // Set the notes if they exist
          setNotes(modifiedDelivery.modifications.notes || "");
        } else {
          // Use the default items and notes
          console.log("Setting default items (no modification found)");
          const itemsCopy = JSON.parse(JSON.stringify(foundOrder.items));
          setItems(itemsCopy);
          setNotes(foundOrder.notes || "");
        }
      } else {
        // Use the default items and notes
        console.log("Setting default items (no delivery date)");
        const itemsCopy = JSON.parse(JSON.stringify(foundOrder.items));
        setItems(itemsCopy);
        setNotes(foundOrder.notes || "");
      }
    }
  }, [id, standingOrders, deliveryDate]);
  
  // Handle quantity change
  const handleQuantityChange = (index: number, value: string) => {
    console.log(`Changing quantity for index ${index} to ${value}`);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      quantity: parseInt(value) || 0
    };
    console.log("New items after quantity change:", newItems);
    setItems(newItems);
    setHasChanges(true);
  };
  
  // Handle notes change
  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };
  
  // Handle add product
  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    console.log(`Adding product ${product.name} with quantity ${productQuantity}`);
    
    const newItem: OrderItem = {
      id: uuidv4(),
      productId: product.id,
      product: product,
      quantity: productQuantity
    };
    
    console.log("New item to add:", newItem);
    setItems([...items, newItem]);
    setSelectedProduct("");
    setProductQuantity(1);
    setShowAddProduct(false);
    setHasChanges(true);
  };
  
  // Handle remove product
  const handleRemoveProduct = (index: number) => {
    console.log(`Removing product at index ${index}`);
    const newItems = [...items];
    newItems.splice(index, 1);
    console.log("Items after removal:", newItems);
    setItems(newItems);
    setHasChanges(true);
  };
  
  // Handle process immediately change
  const handleProcessImmediatelyChange = (value: boolean) => {
    setProcessImmediately(value);
    setHasChanges(true);
  };
  
  // Handle save changes
  const handleSave = () => {
    if (!order || !deliveryDate) return;
    
    console.log("Saving changes with items:", items);
    console.log("Process immediately:", processImmediately);
    
    if (processImmediately) {
      // Create a new order with this delivery's changes
      const newOrder = {
        id: uuidv4(),
        customerId: order.customer.id,
        customer: order.customer,
        customerOrderNumber: order.customerOrderNumber,
        orderDate: deliveryDate.toISOString(),
        requiredDate: deliveryDate.toISOString(),
        deliveryMethod: order.schedule.deliveryMethod,
        items: [...items], // Make sure we pass a copy of the items array
        notes: notes ? `${notes} (Modified from Standing Order #${order.id.substring(0, 8)})` : 
          `Modified from Standing Order #${order.id.substring(0, 8)}`,
        status: "Pending" as const,
        created: new Date().toISOString(),
        fromStandingOrder: order.id
      };
      
      // Add the new order
      addOrder(newOrder);
      
      // Mark this delivery as processed in the standing order
      const updatedOrder: StandingOrder = { ...order };
      
      // Initialize skippedDates if it doesn't exist
      if (!updatedOrder.schedule.skippedDates) {
        updatedOrder.schedule.skippedDates = [];
      }
      
      // Add this date to skipped dates
      updatedOrder.schedule.skippedDates.push(deliveryDate.toISOString());
      
      // Update the standing order
      updateStandingOrder(updatedOrder);
      
      // Show success toast
      toast({
        title: "Order Created",
        description: `A modified order for ${format(deliveryDate, "EEEE, MMMM d, yyyy")} has been created and this date will be skipped in the standing order.`
      });
    } else {
      // Create a copy of the order
      const updatedOrder: StandingOrder = { ...order };
      
      // Initialize modifiedDeliveries if it doesn't exist
      if (!updatedOrder.schedule.modifiedDeliveries) {
        updatedOrder.schedule.modifiedDeliveries = [];
      }
      
      // Find the index of the existing modified delivery if it exists
      const existingIndex = updatedOrder.schedule.modifiedDeliveries.findIndex(
        delivery => new Date(delivery.date).toDateString() === deliveryDate.toDateString()
      );
      
      console.log("Existing modified delivery index:", existingIndex);
      
      // Create the modified delivery object
      const modifiedDelivery = {
        date: deliveryDate.toISOString(),
        modifications: {
          items: items.map(item => ({
            id: item.id,
            productId: item.productId,
            product: item.product,
            quantity: item.quantity
          })),
          notes: notes || undefined
        }
      };
      
      console.log("Modified delivery to save:", modifiedDelivery);
      
      // Update or add the modified delivery
      if (existingIndex >= 0) {
        updatedOrder.schedule.modifiedDeliveries[existingIndex] = modifiedDelivery;
      } else {
        updatedOrder.schedule.modifiedDeliveries.push(modifiedDelivery);
      }
      
      console.log("Updated standing order:", updatedOrder);
      
      // Update the standing order
      updateStandingOrder(updatedOrder);
      
      // Show success toast
      toast({
        title: "Changes Saved",
        description: `Delivery for ${format(deliveryDate, "EEEE, MMMM d, yyyy")} has been updated.`
      });
    }
    
    // Navigate back to the schedule page
    navigate(`/standing-order-schedule/${order.id}`);
  };
  
  // Handle remove modifications
  const handleResetToDefault = () => {
    if (!order || !deliveryDate) return;
    
    // Create a copy of the order
    const updatedOrder: StandingOrder = { ...order };
    
    // Remove this delivery from modifiedDeliveries if it exists
    if (updatedOrder.schedule.modifiedDeliveries) {
      updatedOrder.schedule.modifiedDeliveries = updatedOrder.schedule.modifiedDeliveries.filter(
        delivery => new Date(delivery.date).toDateString() !== deliveryDate.toDateString()
      );
    }
    
    // Update the standing order
    updateStandingOrder(updatedOrder);
    
    // Show success toast
    toast({
      title: "Reset to Default",
      description: `Delivery for ${format(deliveryDate, "EEEE, MMMM d, yyyy")} has been reset to the default order.`
    });
    
    // Navigate back to the schedule page
    navigate(`/standing-order-schedule/${order.id}`);
  };
  
  if (!order || !deliveryDate) {
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

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/standing-order-schedule/${order.id}`)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Edit Delivery</h2>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Delivery Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex space-x-2">
              <dt className="font-medium">Customer:</dt>
              <dd>{order.customer.name}</dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Delivery Date:</dt>
              <dd>{format(deliveryDate, "EEEE, MMMM d, yyyy")}</dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Delivery Method:</dt>
              <dd>{order.schedule.deliveryMethod}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
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
                      No products added to this delivery
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
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add any special instructions or notes for this delivery"
            rows={3}
          />
          
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="processImmediately"
              checked={processImmediately}
              onChange={(e) => handleProcessImmediatelyChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="processImmediately" className="text-sm font-medium">
              Process as a separate order immediately (this will skip this date in the standing order schedule)
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handleResetToDefault}
              className="mr-2"
            >
              Reset to Default Order
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/standing-order-schedule/${order.id}`)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Layout>
  );
};

export default EditStandingOrderDeliveryPage;
