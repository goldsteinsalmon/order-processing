
import React, { useState, useEffect, useRef } from "react";
import { useData } from "@/context/DataContext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Printer, Check, Save, ArrowLeft } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderItem, MissingItem as MissingItemType } from "@/types";

// Extended OrderItem type to include UI state properties
interface ExtendedOrderItem extends OrderItem {
  checked: boolean;
  batchNumber: string;
}

const PickingList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { orders, completeOrder, pickers, recordBatchUsage, updateOrder, addMissingItem } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPickerId, setSelectedPickerId] = useState<string>("");
  const [allItems, setAllItems] = useState<ExtendedOrderItem[]>([]);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [missingItems, setMissingItems] = useState<{id: string, quantity: number}[]>([]);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  // Filter orders that are in "Pending" status
  const pendingOrders = orders.filter(order => order.status === "Pending");
  
  // Get the selected order
  const selectedOrder = selectedOrderId 
    ? orders.find(order => order.id === selectedOrderId) 
    : null;

  // If id param exists, set it as selected order when component mounts
  useEffect(() => {
    if (id) {
      const orderExists = orders.find(order => order.id === id);
      if (orderExists && orderExists.status === "Pending") {
        setSelectedOrderId(id);
      }
    }
  }, [id, orders]);
  
  // Update allItems when selectedOrderId changes
  useEffect(() => {
    if (selectedOrder) {
      // Create a flat list of all items from the order
      const items = selectedOrder.items.map(item => ({
        ...item,
        checked: false, // Initialize checked status
        batchNumber: item.batchNumber || "", // Initialize batch number
      }));
      setAllItems(items);
      
      // If the order has previously recorded missing items, set them
      if (selectedOrder.missingItems) {
        setMissingItems(selectedOrder.missingItems);
      } else {
        setMissingItems([]);
      }

      // If the order has a picker assigned, set it
      if (selectedOrder.pickedBy) {
        setSelectedPickerId(selectedOrder.pickedBy);
      }
    } else {
      setAllItems([]);
      setMissingItems([]);
    }
  }, [selectedOrderId, selectedOrder]);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Picking List - ${selectedOrder?.customer.name || "Unknown"} - ${format(new Date(), "yyyy-MM-dd")}`,
    onAfterPrint: () => {
      toast({
        title: "Picking list printed",
        description: "The picking list has been sent to the printer."
      });
    }
  });
  
  const handleCheckItem = (itemId: string, checked: boolean) => {
    setAllItems(
      allItems.map(item => {
        if (item.id === itemId) {
          return { ...item, checked };
        }
        return item;
      })
    );
  };
  
  const handleBatchNumber = (itemId: string, batchNumber: string) => {
    // Fix by adding the orderId parameter
    if (selectedOrderId && batchNumber) {
      const item = allItems.find((i) => i.id === itemId);
      if (item) {
        recordBatchUsage(batchNumber, item.productId, item.quantity, selectedOrderId);
      }
    }
    
    // Update the item in state
    setAllItems(
      allItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, batchNumber };
        }
        return item;
      })
    );
  };
  
  const handleMissingItem = (itemId: string, quantity: number) => {
    // Find if this item is already in the missing items list
    const existingIndex = missingItems.findIndex(mi => mi.id === itemId);
    
    if (existingIndex >= 0) {
      // Update existing entry
      const updatedMissingItems = [...missingItems];
      updatedMissingItems[existingIndex].quantity = quantity;
      setMissingItems(updatedMissingItems);
    } else {
      // Add new entry
      setMissingItems([...missingItems, { id: itemId, quantity }]);
    }
  };
  
  // Save current progress
  const handleSaveProgress = () => {
    if (!selectedOrder) return;
    
    // Create a copy of the order with updated items (including batch numbers and checks)
    const updatedOrder = {
      ...selectedOrder,
      items: selectedOrder.items.map(item => {
        const updatedItem = allItems.find(i => i.id === item.id);
        if (!updatedItem) return item;
        
        // Find if this item has a missing quantity
        const missingItem = missingItems.find(mi => mi.id === item.id);
        const missingQuantity = missingItem ? missingItem.quantity : 0;
        
        return {
          ...item,
          batchNumber: updatedItem.batchNumber || item.batchNumber,
          checked: updatedItem.checked,
          missingQuantity: missingQuantity
        };
      }),
      pickingInProgress: true,
      status: missingItems.length > 0 ? "Partially Picked" : "Pending",
      pickedBy: selectedPickerId || undefined,
      missingItems: missingItems
    };
    
    // Update the order with progress
    updateOrder(updatedOrder);
    
    // Record missing items for the Missing Items page
    missingItems.forEach(missingItem => {
      if (missingItem.quantity > 0) {
        const item = allItems.find(i => i.id === missingItem.id);
        if (item && selectedOrderId) {
          // Add to missing items collection for tracking
          addMissingItem({
            id: `${selectedOrderId}-${item.id}`,
            orderId: selectedOrderId,
            productId: item.productId,
            quantity: missingItem.quantity,
            date: new Date().toISOString(),
            status: "Pending",
            order: {
              id: selectedOrderId,
              customer: selectedOrder.customer,
            }
          });
        }
      }
    });
    
    // Show success message
    toast({
      title: "Progress saved",
      description: "Your picking progress has been saved."
    });
  };
  
  const handleCompleteOrder = () => {
    if (!selectedOrder) return;
    
    // Check if all items have been checked
    const allChecked = allItems.every(item => item.checked);
    
    if (!allChecked) {
      toast({
        title: "Incomplete picking",
        description: "Please check all items before completing the order.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if all items have batch numbers
    const allHaveBatchNumbers = allItems.every(item => item.batchNumber);
    
    if (!allHaveBatchNumbers) {
      toast({
        title: "Missing batch numbers",
        description: "Please enter batch numbers for all items.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if a picker has been selected
    if (!selectedPickerId) {
      toast({
        title: "No picker selected",
        description: "Please select who picked this order.",
        variant: "destructive",
      });
      return;
    }
    
    // Show completion dialog
    setShowCompletionDialog(true);
  };
  
  const confirmCompleteOrder = () => {
    if (!selectedOrder || !selectedPickerId) return;
    
    // Create a copy of the order with updated items (including batch numbers)
    const updatedOrder = {
      ...selectedOrder,
      items: allItems.map(item => {
        // Check if this item has a missing quantity
        const missingItem = missingItems.find(mi => mi.id === item.id);
        const missingQuantity = missingItem ? missingItem.quantity : 0;
        
        return {
          ...item,
          batchNumber: item.batchNumber,
          missingQuantity: missingQuantity,
          pickedQuantity: item.quantity - missingQuantity
        };
      }),
      pickedBy: selectedPickerId,
      pickedAt: new Date().toISOString(),
      batchNumbers: allItems.map(item => item.batchNumber)
    };
    
    // Complete the order
    completeOrder(updatedOrder);
    
    // Show success message
    toast({
      title: "Order completed",
      description: "The order has been marked as completed."
    });
    
    // Close dialog and reset state
    setShowCompletionDialog(false);
    
    // Navigate back to orders page
    navigate("/orders");
  };

  // Go back to orders page
  const handleBackToOrders = () => {
    navigate("/orders");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Picking List</h2>
        {selectedOrder && (
          <Button variant="outline" onClick={handleBackToOrders}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Button>
        )}
      </div>
      
      {!selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Select Order to Pick</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No pending orders to pick
                </div>
              ) : (
                pendingOrders.map(order => (
                  <Card 
                    key={order.id} 
                    className={`cursor-pointer transition-all ${
                      selectedOrderId === order.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(order.orderDate), "MMMM d, yyyy")}
                      </div>
                      <div className="text-sm mt-2">
                        {order.items.length} items
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedOrder && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              Order for {selectedOrder.customer.name}
            </h3>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handlePrint()}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button variant="secondary" onClick={handleSaveProgress}>
                <Save className="h-4 w-4 mr-2" /> Save Progress
              </Button>
              <Button onClick={handleCompleteOrder}>
                <Check className="h-4 w-4 mr-2" /> Complete Order
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Order Details Card in a more compact layout */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Customer</Label>
                        <div className="font-medium">{selectedOrder.customer.name}</div>
                      </div>
                      
                      <div>
                        <Label>Order Date</Label>
                        <div>{format(new Date(selectedOrder.orderDate), "MMM d, yyyy")}</div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Delivery Method</Label>
                      <div>{selectedOrder.deliveryMethod}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedOrder.notes && (
                      <div>
                        <Label>Notes</Label>
                        <div className="text-sm bg-gray-50 p-2 rounded border">
                          {selectedOrder.notes}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="picker" className="font-bold text-lg text-primary">Picked By</Label>
                      <Select 
                        value={selectedPickerId} 
                        onValueChange={setSelectedPickerId}
                      >
                        <SelectTrigger id="picker" className="mt-1 border-2">
                          <SelectValue placeholder="Select picker" />
                        </SelectTrigger>
                        <SelectContent>
                          {pickers.map(picker => (
                            <SelectItem key={picker.id} value={picker.id}>
                              {picker.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Items to Pick Card */}
            <Card>
              <CardHeader>
                <CardTitle>Items to Pick</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Picked</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Missing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allItems.map(item => {
                        const missingItem = missingItems.find(mi => mi.id === item.id);
                        const missingQuantity = missingItem ? missingItem.quantity : 0;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox 
                                checked={item.checked} 
                                onCheckedChange={(checked) => 
                                  handleCheckItem(item.id, checked === true)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-gray-500">{item.product.sku}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell>
                              <Input 
                                placeholder="Enter batch #"
                                value={item.batchNumber}
                                onChange={(e) => handleBatchNumber(item.id, e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                min="0"
                                max={item.quantity}
                                placeholder="0"
                                value={missingQuantity || ""}
                                onChange={(e) => handleMissingItem(
                                  item.id, 
                                  Math.min(parseInt(e.target.value) || 0, item.quantity)
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Printable version */}
          <div className="hidden">
            <div ref={printRef} className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Picking List</h2>
                <p>{format(new Date(), "MMMM d, yyyy")}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold">Customer: {selectedOrder.customer.name}</h3>
                <p>Order Date: {format(new Date(selectedOrder.orderDate), "MMMM d, yyyy")}</p>
                <p>Delivery Method: {selectedOrder.deliveryMethod}</p>
                {selectedOrder.notes && (
                  <div className="mt-2">
                    <p className="font-bold">Notes:</p>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
              
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">SKU</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-left py-2">Batch #</th>
                    <th className="text-center py-2">Picked</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.product.name}</td>
                      <td className="py-2">{item.product.sku}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2">_________________</td>
                      <td className="py-2 text-center">□</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-8">
                <p>Picked by: ________________________</p>
                <p className="mt-4">Signature: ________________________</p>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this order as complete?
              {missingItems.length > 0 && (
                <div className="mt-2 text-red-500">
                  Warning: This order has missing items.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {missingItems.length > 0 && (
            <div className="my-4">
              <h4 className="font-medium mb-2">Missing Items:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {missingItems.map(mi => {
                  const item = allItems.find(i => i.id === mi.id);
                  return item ? (
                    <li key={mi.id}>
                      {item.product.name}: {mi.quantity} of {item.quantity}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCompleteOrder}>
              Complete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PickingList;
