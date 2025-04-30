
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useData } from "@/context/DataContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderItem } from "@/types";
import { ArrowLeft, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ItemWithQuantity extends OrderItem {
  originalQuantity: number;
  newQuantity: number;
}

const EditStandingOrderDeliveryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const deliveryDateParam = searchParams.get("date");
  const deliveryDate = deliveryDateParam ? new Date(deliveryDateParam) : null;
  
  const navigate = useNavigate();
  const { standingOrders, addOrder, updateStandingOrder } = useData();
  const { toast } = useToast();
  
  const [items, setItems] = useState<ItemWithQuantity[]>([]);
  const [notes, setNotes] = useState("");
  const [customerOrderNumber, setCustomerOrderNumber] = useState("");
  
  const standingOrder = standingOrders.find(order => order.id === id);
  
  useEffect(() => {
    if (standingOrder) {
      // Convert order items to have quantity input fields
      setItems(
        standingOrder.items.map(item => ({
          ...item,
          originalQuantity: item.quantity,
          newQuantity: item.quantity
        }))
      );
      
      setNotes(standingOrder.notes || "");
      setCustomerOrderNumber(standingOrder.customerOrderNumber || "");
    }
  }, [standingOrder]);
  
  if (!standingOrder || !deliveryDate) {
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
  
  const handleQuantityChange = (id: string, value: string) => {
    const quantity = parseInt(value);
    
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === id ? { ...item, newQuantity: isNaN(quantity) ? 0 : quantity } : item
      )
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a new order from the standing order with modified quantities
    const orderItems = items
      .filter(item => item.newQuantity > 0)
      .map(item => ({
        id: uuidv4(),
        productId: item.productId,
        product: item.product,
        quantity: item.newQuantity
      }));
    
    // Check if there are any quantity changes to track
    const changes = items
      .filter(item => item.originalQuantity !== item.newQuantity)
      .map(item => ({
        productId: item.productId,
        productName: item.product.name,
        originalQuantity: item.originalQuantity,
        newQuantity: item.newQuantity,
        date: new Date().toISOString()
      }));
    
    // Create the new order
    const newOrder = {
      id: uuidv4(),
      customerId: standingOrder.customerId,
      customer: standingOrder.customer,
      customerOrderNumber: customerOrderNumber || standingOrder.customerOrderNumber,
      orderDate: new Date().toISOString(),  // Today's date as order creation date
      requiredDate: deliveryDateParam,      // Use the original delivery date from the schedule
      deliveryMethod: standingOrder.schedule.deliveryMethod,
      items: orderItems,
      notes: notes ? 
        `${notes} (Processed from Standing Order #${standingOrder.id.substring(0, 8)})` : 
        `Processed from Standing Order #${standingOrder.id.substring(0, 8)}`,
      status: "Pending" as const,
      created: new Date().toISOString(),
      fromStandingOrder: standingOrder.id,
      hasChanges: changes.length > 0,
      changes: changes.length > 0 ? changes : undefined
    };
    
    // Mark the date as processed in the standing order
    const updatedStandingOrder = { ...standingOrder };
    
    // Initialize processedDates if it doesn't exist
    if (!updatedStandingOrder.schedule.processedDates) {
      updatedStandingOrder.schedule.processedDates = [];
    }
    
    // Add this date to processedDates if not already there
    if (!updatedStandingOrder.schedule.processedDates.some(d => 
      format(new Date(d), "yyyy-MM-dd") === format(deliveryDate, "yyyy-MM-dd"))) {
      updatedStandingOrder.schedule.processedDates.push(deliveryDate.toISOString());
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
        <h2 className="text-2xl font-bold">Process Standing Order Delivery</h2>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Delivery Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex space-x-2">
              <dt className="font-medium">Customer:</dt>
              <dd>{standingOrder.customer.name}</dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Delivery Date:</dt>
              <dd>{format(deliveryDate, "EEEE, MMMM d, yyyy")}</dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Delivery Method:</dt>
              <dd>{standingOrder.schedule.deliveryMethod}</dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Frequency:</dt>
              <dd>{standingOrder.schedule.frequency}</dd>
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
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium py-2">Product</th>
                    <th className="text-left font-medium py-2">SKU</th>
                    <th className="text-center font-medium py-2">Original Qty</th>
                    <th className="text-center font-medium py-2">New Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">{item.product.name}</td>
                      <td className="py-3">{item.product.sku}</td>
                      <td className="py-3 text-center">{item.originalQuantity}</td>
                      <td className="py-3 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={item.newQuantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-20 mx-auto text-center"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Set quantities to 0 for items you want to exclude from this delivery.
            </p>
          </CardFooter>
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
