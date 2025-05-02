
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderItem, Product } from "@/types";

const EditOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, products, updateOrder } = useData();
  const { toast } = useToast();
  
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [formData, setFormData] = useState({
    customerOrderNumber: "",
    notes: "",
    requiredDate: "",
    deliveryMethod: "Delivery" as "Delivery" | "Collection"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load order data
  useEffect(() => {
    if (id) {
      const foundOrder = orders.find(o => o.id === id);
      if (foundOrder) {
        setCurrentOrder(foundOrder);
        setOrderItems(foundOrder.items || []);
        
        setFormData({
          customerOrderNumber: foundOrder.customerOrderNumber || "",
          notes: foundOrder.notes || "",
          requiredDate: foundOrder.requiredDate ? format(new Date(foundOrder.requiredDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          deliveryMethod: foundOrder.deliveryMethod || "Delivery"
        });
      } else {
        // Order not found
        toast({
          title: "Error",
          description: "Order not found",
          variant: "destructive",
        });
        navigate("/orders");
      }
    }
  }, [id, orders, navigate, toast]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setOrderItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity, originalQuantity: item.originalQuantity || item.quantity } 
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;
    
    setIsSubmitting(true);
    
    try {
      // Check for changes in items
      const hasItemChanges = orderItems.some(item => {
        const originalItem = currentOrder.items?.find(oi => oi.id === item.id);
        return !originalItem || originalItem.quantity !== item.quantity;
      });
      
      // Check if items were removed
      const removedItems = (currentOrder.items || []).filter(
        oi => !orderItems.some(item => item.id === oi.id)
      );
      
      // Track changes to display to user if needed
      const changes = [...orderItems, ...removedItems].filter(item => {
        const originalItem = currentOrder.items?.find(oi => oi.id === item.id);
        return !originalItem || originalItem.quantity !== item.quantity;
      }).map(item => ({
        productId: item.productId,
        productName: (item.product?.name || "Unknown Product"),
        originalQuantity: item.originalQuantity || 0,
        newQuantity: orderItems.find(oi => oi.id === item.id)?.quantity || 0,
        date: new Date().toISOString()
      }));
      
      // Update order with form data and changes
      const updatedOrder: Order = {
        ...currentOrder,
        customerOrderNumber: formData.customerOrderNumber,
        notes: formData.notes,
        requiredDate: formData.requiredDate,
        deliveryMethod: formData.deliveryMethod,
        items: orderItems,
        hasChanges: hasItemChanges || removedItems.length > 0 || currentOrder.hasChanges,
        isModified: true,
        changes: [...(currentOrder.changes || []), ...changes]
      };
      
      await updateOrder(updatedOrder);
      
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      
      navigate(`/orders/${id}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentOrder) {
    return (
      <Layout>
        <div className="text-center py-10">Loading order details...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Order</h2>
        <Button variant="outline" onClick={() => navigate(`/orders/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Order
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerOrderNumber">Customer Order Number</Label>
                <Input
                  id="customerOrderNumber"
                  value={formData.customerOrderNumber}
                  onChange={(e) => handleFormChange("customerOrderNumber", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requiredDate">Required Date</Label>
                <Input
                  id="requiredDate"
                  type="date"
                  value={formData.requiredDate}
                  onChange={(e) => handleFormChange("requiredDate", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">Delivery Method</Label>
                <Select
                  value={formData.deliveryMethod}
                  onValueChange={(value) => handleFormChange("deliveryMethod", value as "Delivery" | "Collection")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                    <SelectItem value="Collection">Collection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">SKU</th>
                    <th className="text-right py-2">Original Qty</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">
                        No items in this order
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          {item.product?.name || "Unknown Product"}
                        </td>
                        <td className="py-3">{item.product?.sku || "N/A"}</td>
                        <td className="py-3 text-right">
                          {item.originalQuantity || item.quantity}
                        </td>
                        <td className="py-3 text-right">
                          <Input
                            type="number"
                            min="1"
                            className="w-20 text-right ml-auto"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
        
        <div className="flex justify-end space-x-2 mt-8">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate(`/orders/${id}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Layout>
  );
};

export default EditOrderPage;
