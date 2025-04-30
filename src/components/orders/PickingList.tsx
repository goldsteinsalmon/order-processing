
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Check, X, FileCheck } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderItem } from "@/types";

const PickingList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateOrder, completeOrder, addMissingItem, pickers, recordBatchUsage } = useData();
  const { toast } = useToast();

  const order = orders.find(order => order.id === id);

  const [selectedPicker, setSelectedPicker] = useState<string>("");
  const [batchNumbers, setBatchNumbers] = useState<{ [key: string]: string }>({});
  const [pickedItems, setPickedItems] = useState<{ [key: string]: boolean }>({});
  const [unavailableItems, setUnavailableItems] = useState<{ [key: string]: boolean }>({});
  const [unavailableQuantities, setUnavailableQuantities] = useState<{ [key: string]: number | null }>({});
  const [blownPouches, setBlownPouches] = useState<{ [key: string]: number | null }>({});

  // Helper function to calculate total weight for an item
  const calculateItemWeight = (item: OrderItem): number => {
    return (item.product.weight || 0) * item.quantity;
  };

  // Helper function to generate change description
  const getChangeDescription = (order) => {
    if (!order.changes || order.changes.length === 0) return null;
    
    // Get the list of changed products
    const changedProducts = order.changes.map(change => {
      if (change.originalQuantity === 0) {
        return `Added ${change.newQuantity} ${change.productName}`;
      } else if (change.newQuantity === 0) {
        return `Removed ${change.productName}`;
      } else {
        return `Changed ${change.productName} from ${change.originalQuantity} to ${change.newQuantity}`;
      }
    });
    
    return changedProducts.join("; ");
  };
  
  // Check if order has saved picking progress or is a modified order with previous picker info
  useEffect(() => {
    if (order?.pickingProgress) {
      setSelectedPicker(order.pickingProgress.picker || "");
      setBatchNumbers(order.pickingProgress.batchNumbers || {});
      setPickedItems(order.pickingProgress.pickedItems || {});
      setUnavailableItems(order.pickingProgress.unavailableItems || {});
      setUnavailableQuantities(order.pickingProgress.unavailableQuantities || {});
      setBlownPouches(order.pickingProgress.blownPouches || {});
    } else if (order?.status === "Modified" && order.picker) {
      // For modified orders, pre-set the picker that was previously assigned
      setSelectedPicker(order.picker);
      
      // If we have batch numbers from the previous picking, populate them
      if (order.items) {
        const initialBatchNumbers = {};
        order.items.forEach(item => {
          if (item.batchNumber) {
            initialBatchNumbers[item.id] = item.batchNumber;
          }
        });
        if (Object.keys(initialBatchNumbers).length > 0) {
          setBatchNumbers(initialBatchNumbers);
        }
        
        // Set the blown pouches if they exist
        const initialBlownPouches = {};
        order.items.forEach(item => {
          if (item.blownPouches) {
            initialBlownPouches[item.id] = item.blownPouches;
          }
        });
        if (Object.keys(initialBlownPouches).length > 0) {
          setBlownPouches(initialBlownPouches);
        }
      }
    }
  }, [order]);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
      </div>
    );
  }

  const handlePickerChange = (value: string) => {
    setSelectedPicker(value);
  };

  const handleBatchNumberChange = (itemId: string, value: string) => {
    setBatchNumbers({
      ...batchNumbers,
      [itemId]: value,
    });
  };

  const handlePickedChange = (itemId: string, checked: boolean) => {
    setPickedItems({
      ...pickedItems,
      [itemId]: checked,
    });

    // If item is marked as picked, it can't be unavailable
    if (checked && unavailableItems[itemId]) {
      handleUnavailableChange(itemId, false);
    }
  };

  const handleUnavailableChange = (itemId: string, checked: boolean) => {
    setUnavailableItems({
      ...unavailableItems,
      [itemId]: checked,
    });

    // If item is marked as unavailable, it can't be picked
    if (checked) {
      setPickedItems({
        ...pickedItems,
        [itemId]: false,
      });
    } else {
      const updatedQuantities = { ...unavailableQuantities };
      delete updatedQuantities[itemId];
      setUnavailableQuantities(updatedQuantities);
    }
  };

  const handleUnavailableQuantityChange = (itemId: string, value: string) => {
    const numValue = value === "" ? null : parseInt(value);
    
    setUnavailableQuantities({
      ...unavailableQuantities,
      [itemId]: numValue,
    });
  };

  const handleBlownPouchesChange = (itemId: string, value: string) => {
    const numValue = value === "" ? null : parseInt(value);
    
    setBlownPouches({
      ...blownPouches,
      [itemId]: numValue,
    });
  };

  const handleSaveProgress = () => {
    // Create picking progress object
    const pickingProgress = {
      picker: selectedPicker,
      batchNumbers,
      pickedItems,
      unavailableItems,
      unavailableQuantities,
      blownPouches,
    };

    // Check if any items are unavailable
    const hasUnavailableItems = Object.values(unavailableItems).some(isUnavailable => isUnavailable);
    
    // Update order with progress and appropriate status
    const updatedOrder = {
      ...order,
      pickingProgress,
      status: hasUnavailableItems ? "Missing Items" as const : "Picking" as const,
      updated: new Date().toISOString(),
    };

    // Process and add missing items if any items are unavailable
    if (hasUnavailableItems) {
      order.items.forEach(item => {
        if (unavailableItems[item.id] && 
            unavailableQuantities[item.id] !== null && 
            unavailableQuantities[item.id] !== undefined && 
            unavailableQuantities[item.id]! > 0) {
          
          // Create a missing item entry
          const missingItem = {
            id: crypto.randomUUID(),
            orderId: order.id,
            order: {
              id: order.id,
              customer: order.customer,
            },
            productId: item.productId,
            product: item.product,
            quantity: unavailableQuantities[item.id]!,
            date: new Date().toISOString(),
          };
          
          // Add missing item to the list
          addMissingItem(missingItem);
        }
      });
    }

    updateOrder(updatedOrder);

    toast({
      title: "Progress saved",
      description: "Your picking progress has been saved.",
    });
    
    // Navigate back to orders list after saving
    navigate("/");
  };

  const handleCompletePicking = () => {
    // Validate requirements
    if (!selectedPicker) {
      toast({
        title: "Error",
        description: "Please select a picker.",
        variant: "destructive",
      });
      return;
    }

    // Check if all items have batch numbers
    const missingBatchNumbers = order.items.some(item => !batchNumbers[item.id]);
    if (missingBatchNumbers) {
      toast({
        title: "Error",
        description: "Please enter batch numbers for all items.",
        variant: "destructive",
      });
      return;
    }

    // Check if all items are either picked or unavailable
    const unprocessedItems = order.items.some(item => !pickedItems[item.id] && !unavailableItems[item.id]);
    if (unprocessedItems) {
      toast({
        title: "Error",
        description: "Please mark all items as either picked or unavailable.",
        variant: "destructive",
      });
      return;
    }

    // Validate that all unavailable items have a quantity specified
    const invalidUnavailableItems = order.items.some(
      item => unavailableItems[item.id] && 
      (unavailableQuantities[item.id] === null || unavailableQuantities[item.id] === undefined || unavailableQuantities[item.id] <= 0)
    );
    
    if (invalidUnavailableItems) {
      toast({
        title: "Error",
        description: "Please specify a valid quantity for all unavailable items.",
        variant: "destructive",
      });
      return;
    }

    // Calculate total blown pouches
    const totalBlownPouches = Object.values(blownPouches).reduce((sum, value) => sum + (value || 0), 0);

    // Create updated order items
    const updatedItems = order.items.map(item => ({
      ...item,
      isUnavailable: unavailableItems[item.id] || false,
      unavailableQuantity: unavailableItems[item.id] ? unavailableQuantities[item.id] || 0 : 0,
      blownPouches: blownPouches[item.id] || 0,
      batchNumber: batchNumbers[item.id] || "",
    }));

    // Check if any items are unavailable to update order status
    const hasUnavailableItems = updatedItems.some(item => item.isUnavailable);
    
    // Create updated order with explicit type for status
    const updatedOrder = {
      ...order,
      items: updatedItems,
      picker: selectedPicker,
      isPicked: true,
      status: "Completed" as const, // Always mark as completed
      totalBlownPouches: totalBlownPouches,
      updated: new Date().toISOString(),
      pickingProgress: null, // Clear progress once completed
      batchNumber: Object.values(batchNumbers)[0] || "", // Use first batch number for order reference
    };

    // Process missing items and record batch usage
    updatedItems.forEach(item => {
      if (item.isUnavailable && item.unavailableQuantity && item.unavailableQuantity > 0) {
        // Create a missing item without circular references
        const missingItem = {
          id: crypto.randomUUID(),
          orderId: order.id,
          // Only include necessary order data to avoid circular references
          order: {
            id: order.id,
            customer: order.customer,
          },
          productId: item.productId,
          product: item.product,
          quantity: item.unavailableQuantity!,
          date: new Date().toISOString(),
        };
        
        // Add missing item to the list
        addMissingItem(missingItem);
      }
      
      // Record batch usage for picked items
      if (!item.isUnavailable && item.batchNumber && pickedItems[item.id]) {
        recordBatchUsage(item.batchNumber, item.productId, item.quantity);
      }
    });

    // Complete the order (move to completedOrders)
    completeOrder(updatedOrder);

    toast({
      title: "Picking complete",
      description: "The order has been successfully processed.",
    });

    // Navigate to print box label page
    navigate(`/print-box-label/${order.id}`);
  };

  const changeDesc = getChangeDescription(order);
  
  // Calculate total weight for the order
  const totalOrderWeight = order.items.reduce((total, item) => {
    return total + calculateItemWeight(item);
  }, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Picking List</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleSaveProgress}>
            <Save className="mr-2 h-4 w-4" /> Save Progress
          </Button>
          <Button onClick={handleCompletePicking}>
            <FileCheck className="mr-2 h-4 w-4" /> Complete Picking
          </Button>
        </div>
      </div>

      {changeDesc && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-medium">
              Attention: This order has been modified. Changes: {changeDesc}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Picking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Picker</label>
                <Select value={selectedPicker} onValueChange={handlePickerChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a picker" />
                  </SelectTrigger>
                  <SelectContent>
                    {pickers
                      .filter(picker => picker.active)
                      .map((picker) => (
                        <SelectItem key={picker.id} value={picker.name}>
                          {picker.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {order.status === "Modified" && order.picker && (
                  <p className="text-xs mt-1 text-gray-600">
                    Previously picked by: {order.picker}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-3">
                <dt className="font-medium">Customer:</dt>
                <dd className="col-span-2">{order.customer.name}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order ID:</dt>
                <dd className="col-span-2">{order.id.substring(0, 8)}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Delivery Method:</dt>
                <dd className="col-span-2">{order.deliveryMethod}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Total Weight:</dt>
                <dd className="col-span-2">{totalOrderWeight} g</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items to Pick</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-2">Product</th>
                  <th className="text-left font-medium py-2">SKU</th>
                  <th className="text-center font-medium py-2">Quantity</th>
                  <th className="text-center font-medium py-2">Weight (g)</th>
                  <th className="text-center font-medium py-2">Total Weight (g)</th>
                  <th className="text-center font-medium py-2">Batch Number</th>
                  <th className="text-center font-medium py-2">Picked</th>
                  <th className="text-center font-medium py-2">Unavailable</th>
                  <th className="text-center font-medium py-2">Unavailable Qty</th>
                  <th className="text-center font-medium py-2">Blown Pouches</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  // Check if this specific item has changes
                  const itemChanges = order.changes?.find(change => 
                    change.productId === item.productId
                  );
                  
                  // Calculate item weight and total weight
                  const itemUnitWeight = item.product.weight || 0;
                  const itemTotalWeight = itemUnitWeight * item.quantity;
                  
                  return (
                    <tr key={item.id} className={`border-b ${itemChanges ? "bg-red-50" : ""}`}>
                      <td className="py-3">
                        {item.product.name}
                        {itemChanges && (
                          <div className="text-red-600 text-xs mt-1">
                            {itemChanges.originalQuantity === 0 
                              ? "New item" 
                              : itemChanges.newQuantity === 0
                                ? "Item removed"
                                : `Changed from ${itemChanges.originalQuantity}`
                            }
                          </div>
                        )}
                      </td>
                      <td className="py-3">{item.product.sku}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-center">{itemUnitWeight}</td>
                      <td className="py-3 text-center">{itemTotalWeight}</td>
                      <td className="py-3 text-center">
                        <Input
                          value={batchNumbers[item.id] || ""}
                          onChange={(e) => handleBatchNumberChange(item.id, e.target.value)}
                          placeholder="Enter batch #"
                          className="w-28 mx-auto"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={pickedItems[item.id] || false}
                            onCheckedChange={(checked) => handlePickedChange(item.id, checked === true)}
                            disabled={unavailableItems[item.id] || false}
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={unavailableItems[item.id] || false}
                            onCheckedChange={(checked) => handleUnavailableChange(item.id, checked === true)}
                            disabled={pickedItems[item.id] || false}
                            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                          />
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        {unavailableItems[item.id] ? (
                          <Input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={unavailableQuantities[item.id] === null ? "" : unavailableQuantities[item.id]}
                            onChange={(e) => handleUnavailableQuantityChange(item.id, e.target.value)}
                            placeholder="Qty"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-20 mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={blownPouches[item.id] === null ? "" : blownPouches[item.id]}
                          onChange={(e) => handleBlownPouchesChange(item.id, e.target.value)}
                          placeholder="0"
                          className="w-20 mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-medium">
                  <td colSpan={4} className="py-3 text-right">Total:</td>
                  <td className="py-3 text-center">{totalOrderWeight} g</td>
                  <td colSpan={4} className="py-3 text-right">Total Blown Pouches:</td>
                  <td className="py-3 text-center">
                    {Object.values(blownPouches).reduce((sum, value) => sum + (value || 0), 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickingList;
