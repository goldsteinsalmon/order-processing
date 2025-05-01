
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { OrderChange, Product } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrderDate } from "@/utils/propertyHelpers";

const EditCompletedOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, completedOrders, updateOrder, products } = useData();
  const { toast } = useToast();
  
  // Look for the order in both regular orders and completed orders
  const originalOrder = orders.find(order => order.id === id) || 
                       completedOrders.find(order => order.id === id);
                       
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [orderDate, setOrderDate] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  useEffect(() => {
    if (originalOrder) {
      // Clone the items to avoid modifying the original order directly
      setOrderItems(originalOrder.items.map(item => ({
        ...item,
        originalQuantity: item.quantity,
        hasChanged: false
      })));
      
      // Set the order date
      setOrderDate(getOrderDate(originalOrder));
    }
  }, [originalOrder]);

  if (!originalOrder) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
      </div>
    );
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    const updatedItems = orderItems.map(item => {
      if (item.id === id) {
        const hasChanged = item.originalQuantity !== newQuantity;
        return { 
          ...item, 
          quantity: newQuantity,
          hasChanged
        };
      }
      return item;
    });
    
    setOrderItems(updatedItems);
    checkForChanges(updatedItems, orderDate);
  };

  const checkForChanges = (items: any[], date: string) => {
    const itemsChanged = items.some(item => item.hasChanged);
    const dateChanged = date !== getOrderDate(originalOrder);
    setHasChanges(itemsChanged || dateChanged);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setOrderDate(newDate);
    checkForChanges(orderItems, newDate);
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    
    const productToAdd = products.find(p => p.id === selectedProductId);
    if (!productToAdd) return;
    
    // Check if this product is already in the order
    const existingItem = orderItems.find(item => item.productId === selectedProductId);
    
    if (existingItem) {
      toast({
        title: "Product already in order",
        description: "This product is already in the order. Adjust its quantity instead.",
        variant: "destructive"
      });
      return;
    }
    
    // Generate a unique ID for the new item
    const newItemId = `new-${Date.now()}`;
    
    const newItem = {
      id: newItemId,
      productId: productToAdd.id,
      product: productToAdd,
      quantity: 1,
      originalQuantity: 0,
      hasChanged: true,
      isNew: true
    };
    
    const updatedItems = [...orderItems, newItem];
    setOrderItems(updatedItems);
    setSelectedProductId("");
    checkForChanges(updatedItems, orderDate);
  };

  const saveChanges = () => {
    // Track which items were originally in the order vs newly added
    const originalItemIds = originalOrder.items.map(item => item.productId);
    
    const changes: OrderChange[] = orderItems
      .filter(item => item.hasChanged)
      .map(item => ({
        productId: item.productId,
        productName: item.product.name,
        originalQuantity: item.isNew ? 0 : item.originalQuantity,
        newQuantity: item.quantity,
        date: new Date().toISOString()
      }));
    
    // Create list of all items for updated order, removing "originalQuantity" and "hasChanged" properties
    const cleanedItems = orderItems.map(({ hasChanged, originalQuantity, isNew, ...item }) => item);
      
    // Create the updated order with changes, preserving picker, batch numbers and blown pouches
    const updatedOrder = {
      ...originalOrder,
      orderDate: orderDate,
      items: cleanedItems,
      changes: [...(originalOrder.changes || []), ...changes],
      hasChanges: true,
      updated: new Date().toISOString(),
      status: "Modified" as "Modified",
    };

    // Save the updated order back into the system as a regular order (not completed)
    updateOrder(updatedOrder);
    
    toast({
      title: "Order updated",
      description: `Order ${originalOrder.id.substring(0, 8)} has been updated and moved to the Orders list.`,
    });
    
    // Navigate back to the orders page
    navigate("/");
  };

  const availableProducts = products.filter(
    product => !orderItems.some(item => item.productId === product.id)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(originalOrder.status === "Completed" ? "/completed-orders" : "/")} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Edit Order</h2>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!hasChanges}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Order Changes</AlertDialogTitle>
              <AlertDialogDescription>
                This will update the order and move it back to the pending orders list with the changes highlighted. 
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={saveChanges}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order ID:</dt>
                <dd className="col-span-2">{originalOrder.id}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order Date:</dt>
                <dd className="col-span-2">
                  <Input 
                    type="date" 
                    value={orderDate}
                    onChange={handleDateChange}
                    className="mt-[-4px]"
                  />
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Customer:</dt>
                <dd className="col-span-2">{originalOrder.customer.name}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Status:</dt>
                <dd className="col-span-2">
                  {originalOrder.status} (Will be changed to "Modified")
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Picker:</dt>
                <dd className="col-span-2">{originalOrder.picker || "N/A"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Edit Order Items</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              You can edit quantities, set to zero, or add new products.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex space-x-2 mb-6">
            <div className="flex-1">
              <Select 
                value={selectedProductId} 
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-2">Product</th>
                  <th className="text-left font-medium py-2">SKU</th>
                  <th className="text-right font-medium py-2">Original Quantity</th>
                  <th className="text-right font-medium py-2">New Quantity</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`border-b ${item.hasChanged ? "bg-red-50" : ""}`}
                  >
                    <td className="py-3">{item.product.name}</td>
                    <td className="py-3">{item.product.sku}</td>
                    <td className="py-3 text-right">{item.isNew ? "New" : item.originalQuantity}</td>
                    <td className="py-3 text-right">
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-20 text-right inline-block ml-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <p className="text-sm text-gray-500 mr-auto">
            {hasChanges ? "Changes detected. Save to update the order." : "No changes made yet."}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditCompletedOrder;
