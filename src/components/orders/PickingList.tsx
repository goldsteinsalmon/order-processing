
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Check, X } from "lucide-react";
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
  const { orders, updateOrder, addMissingItem, pickers } = useData();
  const { toast } = useToast();

  const order = orders.find(order => order.id === id);

  const [selectedPicker, setSelectedPicker] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [pickedItems, setPickedItems] = useState<{ [key: string]: boolean }>({});
  const [unavailableItems, setUnavailableItems] = useState<{ [key: string]: boolean }>({});
  const [unavailableQuantities, setUnavailableQuantities] = useState<{ [key: string]: number }>({});
  const [blownPouches, setBlownPouches] = useState<{ [key: string]: number }>({});

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

    // If item is marked as unavailable, update the unavailable quantity if needed
    if (checked) {
      const item = order.items.find(item => item.id === itemId);
      if (item && !unavailableQuantities[itemId]) {
        setUnavailableQuantities({
          ...unavailableQuantities,
          [itemId]: item.quantity,
        });
      }

      // Also, it can't be picked
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

  const handleUnavailableQuantityChange = (itemId: string, quantity: number) => {
    const item = order.items.find(item => item.id === itemId);
    if (item) {
      const maxQuantity = item.quantity;
      const validQuantity = Math.min(Math.max(1, quantity), maxQuantity);
      
      setUnavailableQuantities({
        ...unavailableQuantities,
        [itemId]: validQuantity,
      });
    }
  };

  const handleBlownPouchesChange = (itemId: string, value: number) => {
    const validValue = Math.max(0, value);
    setBlownPouches({
      ...blownPouches,
      [itemId]: validValue,
    });
  };

  const handleSave = () => {
    if (!selectedPicker) {
      toast({
        title: "Error",
        description: "Please select a picker.",
        variant: "destructive",
      });
      return;
    }

    if (!batchNumber) {
      toast({
        title: "Error",
        description: "Please enter a batch number.",
        variant: "destructive",
      });
      return;
    }

    // Calculate total blown pouches
    const totalBlownPouches = Object.values(blownPouches).reduce((sum, value) => sum + value, 0);

    // Create updated order items
    const updatedItems = order.items.map(item => ({
      ...item,
      isUnavailable: unavailableItems[item.id] || false,
      unavailableQuantity: unavailableItems[item.id] ? unavailableQuantities[item.id] || 0 : 0,
      blownPouches: blownPouches[item.id] || 0,
    }));

    // Create updated order
    const updatedOrder = {
      ...order,
      items: updatedItems,
      picker: selectedPicker,
      batchNumber: batchNumber,
      isPicked: true,
      status: "Picking",
      totalBlownPouches: totalBlownPouches,
      updated: new Date().toISOString(),
    };

    // Add missing items if needed
    updatedItems.forEach(item => {
      if (item.isUnavailable && item.unavailableQuantity) {
        const missingItem = {
          id: crypto.randomUUID(),
          orderId: order.id,
          order: order,
          productId: item.productId,
          product: item.product,
          quantity: item.unavailableQuantity!,
          date: new Date().toISOString(),
        };
        
        addMissingItem(missingItem);
      }
    });

    updateOrder(updatedOrder);

    toast({
      title: "Picking complete",
      description: "The order has been successfully processed.",
    });

    navigate("/");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(`/order-details/${id}`)} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Picking List</h2>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" /> Complete Picking
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Picking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
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
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Batch Number</label>
                  <Input
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Enter batch number"
                  />
                </div>
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
                <dt className="font-medium">Total Items:</dt>
                <dd className="col-span-2">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Delivery Method:</dt>
                <dd className="col-span-2">{order.deliveryMethod}</dd>
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
                  <th className="text-center font-medium py-2">Picked</th>
                  <th className="text-center font-medium py-2">Unavailable</th>
                  <th className="text-center font-medium py-2">Unavailable Qty</th>
                  <th className="text-center font-medium py-2">Blown Pouches</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.product.name}</td>
                    <td className="py-3">{item.product.sku}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
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
                          value={unavailableQuantities[item.id] || item.quantity}
                          onChange={(e) => handleUnavailableQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 mx-auto"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={blownPouches[item.id] || 0}
                        onChange={(e) => handleBlownPouchesChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-20 mx-auto"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td colSpan={6} className="py-3 text-right">Total Blown Pouches:</td>
                  <td className="py-3 text-center">
                    {Object.values(blownPouches).reduce((sum, value) => sum + value, 0)}
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
