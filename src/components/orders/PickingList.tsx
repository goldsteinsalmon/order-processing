import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, PenSquare, Trash2, Save, Printer, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";
import ItemsTable, { ExtendedOrderItem } from "./picking/ItemsTable";
import PrintablePickingList from "./picking/PrintablePickingList";
import { Order, OrderItem, MissingItem, Box, BoxItem } from "@/types";
import { getCustomerId, getOrderDate, getDeliveryMethod, getPickingInProgress, getBoxDistributions, getCustomerOrderNumber } from "@/utils/propertyHelpers";
import { DebugLoader } from "@/components/ui/debug-loader";

interface PickingListProps {
  orderId: string;
  nextBoxToFocus?: number;
}

const PickingList: React.FC<PickingListProps> = ({ orderId, nextBoxToFocus }) => {
  // Fix the loading property name to match the DataContext type
  const { orders, isLoading, updateOrder, addMissingItem, removeMissingItem, missingItems, completeOrder, recordBatchUsage, recordAllBatchUsagesForOrder } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  // State for order and UI
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<ExtendedOrderItem[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [orderMissingItems, setOrderMissingItems] = useState<MissingItem[]>([]);
  const [completedBoxes, setCompletedBoxes] = useState<number[]>([]);
  const [savedBoxes, setSavedBoxes] = useState<number[]>([]);
  const [selectedBoxToPrint, setSelectedBoxToPrint] = useState<number | null>(null);
  const [showBoxPrintDialog, setShowBoxPrintDialog] = useState<boolean>(false);
  const [groupByBox, setGroupByBox] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Load order data
  useEffect(() => {
    if (isLoading) {
      console.log("PickingList: Loading data...");
      return;
    }
    
    console.log("PickingList: Looking for order with ID:", orderId);
    console.log("PickingList: Total orders available:", orders.length);
    
    if (orders.length > 0) {
      console.log("PickingList: First few order IDs:", orders.slice(0, 3).map(o => o.id));
    }
    
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      console.error("PickingList: Order not found with ID:", orderId);
      setOrderError("Order not found. It may have been deleted or you don't have permission to view it.");
      return;
    }
    
    try {
      console.log("PickingList: Found order:", order);
      
      // Set the order
      setSelectedOrder(order);
      
      // Check if order has box distributions and use that to determine grouping
      const hasBoxDistributions = getBoxDistributions(order) && getBoxDistributions(order).length > 0;
      setGroupByBox(hasBoxDistributions);
      
      // Initialize ordered items with checked status
      const items = order.items || [];
      
      if (!items || items.length === 0) {
        setOrderError("This order has no items");
        return;
      }
      
      // IMPORTANT: Force originalQuantity to undefined for all items in new orders
      // This ensures no items show as changed when they weren't
      const initialItems: ExtendedOrderItem[] = items.map(item => {
        // Explicitly check if there's been an actual change tracked in the system
        const hasRecordedChange = 
          item.originalQuantity !== undefined && 
          item.originalQuantity !== null && 
          item.originalQuantity !== item.quantity;
        
        return {
          ...item,
          checked: !!item.checked,
          boxNumber: item.boxNumber || item.box_number,
          // Only set originalQuantity if there's an actual recorded change
          originalQuantity: hasRecordedChange ? item.originalQuantity : undefined
        };
      });
      
      console.log("PickingList: Initialized items with originalQuantity check:", 
        initialItems.map(item => ({
          name: item.product?.name,
          quantity: item.quantity,
          originalQuantity: item.originalQuantity,
          hasOriginalQuantity: item.originalQuantity !== undefined
        }))
      );
      
      setOrderItems(initialItems);
      
      // Load existing completed boxes if any
      if (order.completedBoxes && order.completedBoxes.length > 0) {
        setCompletedBoxes(order.completedBoxes);
      }
      
      // Load existing saved boxes if any
      if (order.savedBoxes && order.savedBoxes.length > 0) {
        setSavedBoxes(order.savedBoxes);
      }
      
      // Start picking progress
      if (!getPickingInProgress(order)) {
        // Update order to indicate picking has started
        // IMPORTANT: Changed status from "Processing" to "Picking" to match database constraint
        const updatedOrder = {
          ...order,
          pickingInProgress: true,
          status: "Picking" as const
        };
        updateOrder(updatedOrder);
      }
      
      // Load missing items specific to this order
      const orderSpecificMissingItems = missingItems.filter(mi => mi.orderId === order.id);
      setOrderMissingItems(orderSpecificMissingItems);
    } catch (error) {
      console.error("Error processing order data:", error);
      setOrderError("There was an error processing this order data. Please try again later.");
    }
  }, [orderId, orders, isLoading, missingItems, updateOrder]);
  
  // Effect to scroll to next box if specified
  useEffect(() => {
    if (nextBoxToFocus) {
      const boxElement = document.getElementById(`box-${nextBoxToFocus}`);
      if (boxElement) {
        boxElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [nextBoxToFocus]);
  
  const handleCheckItem = (itemId: string, checked: boolean) => {
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, checked } : item
      )
    );
  };
  
  const handleBatchNumberChange = (itemId: string, batchNumber: string, boxNumber: number = 0) => {
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, batchNumber, boxNumber } : item
      )
    );
  };
  
  const handleWeightChange = (itemId: string, weight: number) => {
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, pickedWeight: weight } : item
      )
    );
  };
  
  const handleMissingItemChange = (itemId: string, quantity: number) => {
    const item = orderItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Check if we already have a missing item entry
    const existingMissingItemIndex = orderMissingItems.findIndex(mi => mi.productId === item.productId);
    
    if (quantity > 0) {
      // Create or update missing item
      if (existingMissingItemIndex >= 0) {
        // Update existing entry
        const updatedMissingItems = [...orderMissingItems];
        updatedMissingItems[existingMissingItemIndex] = {
          ...updatedMissingItems[existingMissingItemIndex],
          quantity
        };
        setOrderMissingItems(updatedMissingItems);
      } else {
        // Create new entry
        if (selectedOrder) {
          const newMissingItem: MissingItem = {
            id: crypto.randomUUID(),
            orderId: selectedOrder.id,
            productId: item.productId,
            quantity,
            date: new Date().toISOString(),
            product: item.product,
            status: 'Pending'
          };
          
          setOrderMissingItems(prev => [...prev, newMissingItem]);
          addMissingItem(newMissingItem);
        }
      }
    } else if (existingMissingItemIndex >= 0) {
      // Remove missing item if quantity is 0
      handleResolveMissingItem(item.id);
    }
  };
  
  const handleResolveMissingItem = (itemId: string) => {
    const item = orderItems.find(i => i.id === itemId);
    if (!item) return;
    
    const missingItemIndex = orderMissingItems.findIndex(mi => mi.productId === item.productId);
    if (missingItemIndex >= 0) {
      const missingItemId = orderMissingItems[missingItemIndex].id;
      removeMissingItem(missingItemId);
      
      // Update local state
      setOrderMissingItems(prev => prev.filter(mi => mi.id !== missingItemId));
    }
  };
  
  const handleSave = async () => {
    if (!selectedOrder) return;
    
    setIsSaving(true);
    
    try {
      // Map the order items to the format expected by the database
      const updatedOrderItems = orderItems.map(item => {
        // Log item state before saving
        console.log(`Saving item ${item.product?.name}:`, {
          quantity: item.quantity,
          originalQuantity: item.originalQuantity,
          hasOriginalQuantity: item.originalQuantity !== undefined
        });
        
        return {
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          batchNumber: item.batchNumber || "",
          checked: item.checked,
          pickedQuantity: item.checked ? item.quantity : 0,
          pickedWeight: item.pickedWeight || 0,
          boxNumber: item.boxNumber || 0,
          // Only include originalQuantity if it was explicitly set and is different
          ...(item.originalQuantity !== undefined && 
             item.originalQuantity !== item.quantity && 
             {originalQuantity: item.originalQuantity})
        };
      });
      
      // Prepare total missing and completed data
      const allChecked = updatedOrderItems.every(item => item.checked);
      const hasMissingItems = orderMissingItems.length > 0;
      
      // Update order status based on checks
      let newStatus = selectedOrder.status;
      if (allChecked && !hasMissingItems) {
        newStatus = "Completed";
      } else if (allChecked && hasMissingItems) {
        newStatus = "Missing Items";
      } else if (updatedOrderItems.some(item => item.checked)) {
        newStatus = "Partially Picked";
      } else {
        // IMPORTANT: Keep "Picking" instead of "Processing" to match database constraint
        newStatus = "Picking";
      }

      // Record batch usage for each item
      updatedOrderItems.forEach(item => {
        if (item.batchNumber && item.checked) {
          recordBatchUsage(
            item.batchNumber, 
            item.productId, 
            item.quantity, 
            selectedOrder.id,
            item.pickedWeight
          );
        }
      });
      
      // Update the order with new items and status
      const updatedOrder: Order = {
        ...selectedOrder,
        items: updatedOrderItems,
        status: newStatus,
        isPicked: allChecked,
        totalBlownPouches: 0, // TODO: implement blown pouches
        pickingInProgress: !allChecked,
        pickedBy: "Current User", // TODO: get from auth context
        pickedAt: allChecked ? new Date().toISOString() : undefined,
        missingItems: orderMissingItems,
        completedBoxes,
        savedBoxes
      };
      
      console.log("Saving order with status:", newStatus);
      
      // If order is completed, also record all batch usages
      if (newStatus === "Completed") {
        recordAllBatchUsagesForOrder(updatedOrder);
        await completeOrder(updatedOrder);
      } else {
        await updateOrder(updatedOrder);
      }
      
      toast({
        title: "Order saved",
        description: allChecked ? "Order has been marked as picked" : "Order progress saved",
      });
      
      // Navigate back to orders list if completely picked
      if (allChecked && !hasMissingItems) {
        navigate("/orders");
      }
    } catch (error) {
      console.error("Error saving order:", error);
      toast({
        title: "Error",
        description: "Failed to save order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/orders");
  };
  
  const handlePrintClick = () => {
    if (!selectedOrder) return;
    
    setSelectedBoxToPrint(null);
    handlePrint();
  };
  
  const handleSaveBoxProgress = (boxNumber: number) => {
    if (savedBoxes.includes(boxNumber)) return;
    
    // Update saved boxes
    setSavedBoxes(prev => [...prev, boxNumber]);
    
    toast({
      title: "Box progress saved",
      description: `Box ${boxNumber} progress has been saved.`
    });
  };
  
  const handlePrintBoxLabel = (boxNumber: number) => {
    setSelectedBoxToPrint(boxNumber);
    setShowBoxPrintDialog(true);
  };
  
  const handleConfirmPrintBox = () => {
    // Close dialog
    setShowBoxPrintDialog(false);
    
    // Execute print
    if (selectedBoxToPrint !== null) {
      // Add to completed boxes if not already there
      if (!completedBoxes.includes(selectedBoxToPrint)) {
        setCompletedBoxes(prev => [...prev, selectedBoxToPrint]);
      }
      
      // Trigger print
      handlePrint();
      
      // Redirect to continue picking
      setTimeout(() => {
        // Get next uncompleted box if there is one
        let nextBox = null;
        
        if (selectedOrder && getBoxDistributions(selectedOrder)) {
          const boxDistributions = getBoxDistributions(selectedOrder);
          if (boxDistributions) {
            // Find boxes that aren't completed yet
            const uncompletedBoxes = boxDistributions
              .filter(b => !completedBoxes.includes(b.boxNumber))
              .sort((a, b) => a.boxNumber - b.boxNumber);
            
            if (uncompletedBoxes.length > 0) {
              nextBox = uncompletedBoxes[0].boxNumber;
            }
          }
        }
        
        // Navigate with next box param to trigger focus
        if (nextBox) {
          navigate(`/orders/${orderId}/picking?nextBox=${nextBox}`);
        } else {
          // No more boxes to pick, just refresh
          navigate(`/orders/${orderId}/picking`);
        }
      }, 500);
    }
  };
  
  // Print handler - fixed to use correct options format
  const handlePrint = useReactToPrint({
    documentTitle: `Picking List - ${selectedOrder?.id.substring(0, 8)}`,
    contentRef: printRef,
  });
  
  // Filter items for a specific box
  const getBoxItems = (boxNumber: number | null): ExtendedOrderItem[] => {
    if (boxNumber === null) {
      return orderItems;
    }
    
    return orderItems.filter(item => item.boxNumber === boxNumber);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <DebugLoader isLoading={true} context="Picking List" />
      </div>
    );
  }
  
  if (orderError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {orderError}
        </AlertDescription>
        <div className="mt-4">
          <Button onClick={() => navigate("/orders")}>
            Back to Orders
          </Button>
        </div>
      </Alert>
    );
  }
  
  if (!selectedOrder) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading order details...</span>
      </div>
    );
  }
  
  // Count missing items for the UI
  const missingItemCount = orderMissingItems.reduce((acc, item) => acc + item.quantity, 0);
  
  return (
    <div className="space-y-6">
      {/* Order header */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl">
              Picking Order #{selectedOrder.id.substring(0, 8)}
            </CardTitle>
            {getCustomerOrderNumber(selectedOrder) && (
              <p className="text-sm text-muted-foreground">
                {getCustomerOrderNumber(selectedOrder)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintClick}
              className="flex gap-1"
            >
              <Printer className="h-4 w-4" /> Print All
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="flex gap-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-1">Customer</h3>
              <p>{selectedOrder.customer.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedOrder.customer.email}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Order Details</h3>
              <p>
                <span className="text-muted-foreground">Date:</span>{" "}
                {format(new Date(getOrderDate(selectedOrder)), "MMMM d, yyyy")}
              </p>
              <p>
                <span className="text-muted-foreground">Delivery:</span>{" "}
                {getDeliveryMethod(selectedOrder)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Status</h3>
              <div className="flex items-center gap-2">
                {selectedOrder.status === "Completed" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : selectedOrder.status === "Missing Items" ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-500" />
                )}
                <span>{selectedOrder.status}</span>
              </div>
              {missingItemCount > 0 && (
                <p className="text-sm text-red-500 mt-1">
                  {missingItemCount} item(s) missing
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Picking interface */}
      <div className="space-y-6">
        <ItemsTable 
          items={orderItems}
          missingItems={orderMissingItems.map(item => ({ id: item.orderId, quantity: item.quantity }))}
          onCheckItem={handleCheckItem}
          onBatchNumberChange={handleBatchNumberChange}
          onMissingItemChange={handleMissingItemChange}
          onResolveMissingItem={handleResolveMissingItem}
          onWeightChange={handleWeightChange}
          onPrintBoxLabel={handlePrintBoxLabel}
          onSaveBoxProgress={handleSaveBoxProgress}
          groupByBox={groupByBox}
          completedBoxes={completedBoxes}
          savedBoxes={savedBoxes}
        />
      </div>

      {/* Notes if any */}
      {selectedOrder.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{selectedOrder.notes}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Hidden print component */}
      <div className="hidden">
        <PrintablePickingList
          ref={printRef}
          selectedOrder={selectedOrder}
          items={selectedBoxToPrint !== null ? getBoxItems(selectedBoxToPrint) : orderItems}
          groupByBox={selectedBoxToPrint !== null}
        />
      </div>
      
      {/* Print Box Dialog */}
      <Dialog open={showBoxPrintDialog} onOpenChange={setShowBoxPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Box {selectedBoxToPrint} Label</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to print the label for Box {selectedBoxToPrint}?
              This will mark the box as completed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBoxPrintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPrintBox}>
              <Printer className="mr-2 h-4 w-4" /> Print and Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PickingList;
