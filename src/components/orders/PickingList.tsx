import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, Printer, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";
import ItemsTable, { ExtendedOrderItem } from "./picking/ItemsTable";
import PrintablePickingList from "./picking/PrintablePickingList";
import { Order, OrderItem, MissingItem } from "@/types";
import { getOrderDate, getDeliveryMethod, getPickingInProgress, getBoxDistributions, getCustomerOrderNumber, getCustomerId } from "@/utils/propertyHelpers";
import { DebugLoader } from "@/components/ui/debug-loader";
import OrderDetailsCard from "./picking/OrderDetailsCard";

interface PickingListProps {
  orderId: string;
  nextBoxToFocus?: number;
}

const PickingList: React.FC<PickingListProps> = ({ orderId, nextBoxToFocus }) => {
  const { orders, isLoading, updateOrder, addMissingItem, removeMissingItem, missingItems, completeOrder, recordBatchUsage, recordAllBatchUsagesForOrder, pickers } = useData();
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
  const [selectedPickerId, setSelectedPickerId] = useState<string>("");
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [pickingStartAttempted, setPickingStartAttempted] = useState<boolean>(false);
  const [lastSavedItems, setLastSavedItems] = useState<ExtendedOrderItem[]>([]);
  
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
      console.log("PickingList: Order items:", order.items);
      
      // Set the order
      setSelectedOrder(order);
      
      // Set picker if exists
      if (order.picked_by) {
        console.log("PickingList: Setting picker to:", order.picked_by);
        setSelectedPickerId(order.picked_by);
      }
      
      // Check if order has box distributions and use that to determine grouping
      const hasBoxDistributions = getBoxDistributions(order) && getBoxDistributions(order).length > 0;
      setGroupByBox(hasBoxDistributions);
      
      // Initialize ordered items with checked status
      const items = order.items || [];
      
      if (!items || items.length === 0) {
        setOrderError("This order has no items");
        return;
      }
      
      console.log("PickingList: Raw order items from DB:", items.map(item => ({
        id: item.id,
        name: item.product?.name,
        checked: item.checked,
        boxNumber: item.boxNumber || item.box_number
      })));
      
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
          batchNumber: item.batchNumber || item.batch_number || "",
          // Only set originalQuantity if there's an actual recorded change
          originalQuantity: hasRecordedChange ? item.originalQuantity : undefined
        };
      });
      
      console.log("PickingList: Initialized items with checked status:", 
        initialItems.map(item => ({
          name: item.product?.name,
          quantity: item.quantity,
          checked: item.checked,
          batchNumber: item.batchNumber,
          originalQuantity: item.originalQuantity,
          hasOriginalQuantity: item.originalQuantity !== undefined
        }))
      );
      
      setOrderItems(initialItems);
      setLastSavedItems(initialItems);
      
      // Load existing completed boxes if any
      if (order.completedBoxes && order.completedBoxes.length > 0) {
        console.log("PickingList: Loading completed boxes:", order.completedBoxes);
        setCompletedBoxes(order.completedBoxes);
      }
      
      // Load existing saved boxes if any
      if (order.savedBoxes && order.savedBoxes.length > 0) {
        console.log("PickingList: Loading saved boxes:", order.savedBoxes);
        setSavedBoxes(order.savedBoxes);
      }
      
      // Load missing items specific to this order
      const orderSpecificMissingItems = missingItems.filter(mi => mi.orderId === order.id);
      setOrderMissingItems(orderSpecificMissingItems);
      
      // Mark initial load as complete
      setInitialLoadComplete(true);
      
    } catch (error) {
      console.error("Error processing order data:", error);
      setOrderError("There was an error processing this order data. Please try again later.");
    }
  }, [orderId, orders, isLoading, missingItems, updateOrder, pickers]);
  
  // Effect to start picking progress AFTER initial load is complete
  // Now with proper error handling and prevent multiple attempts
  useEffect(() => {
    // Only proceed if initial load is complete, we have an order, picking is not in progress,
    // and we haven't attempted to start picking yet
    if (!initialLoadComplete || !selectedOrder || getPickingInProgress(selectedOrder) || pickingStartAttempted) {
      return;
    }
    
    console.log("Starting picking progress for order:", selectedOrder.id);
    
    // Mark that we've attempted to start picking to prevent retries
    setPickingStartAttempted(true);
    
    // Update order to indicate picking has started
    const updatedOrder = {
      ...selectedOrder,
      pickingInProgress: true,
      status: "Picking" as const
    };
    
    // Try to update the order but don't throw errors if it fails
    // This operation isn't critical for user experience
    updateOrder(updatedOrder).catch(error => {
      // Log the error but don't show it to the user
      console.error("Non-critical error starting picking progress:", error);
      // We don't show the toast here since it's not critical to user experience
    });
      
  }, [initialLoadComplete, selectedOrder, updateOrder, pickingStartAttempted]);
  
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
    console.log(`CheckItem: Setting item ${itemId} checked to ${checked}`);
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, checked } : item
      )
    );
  };
  
  const handleBatchNumberChange = (itemId: string, batchNumber: string, boxNumber: number = 0) => {
    console.log(`BatchNumber: Setting item ${itemId} batch to ${batchNumber}`);
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, batchNumber, boxNumber } : item
      )
    );
  };
  
  const handleWeightChange = (itemId: string, weight: number) => {
    console.log(`Weight: Setting item ${itemId} weight to ${weight}`);
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, pickedWeight: weight } : item
      )
    );
  };
  
  const handlePickerChange = (pickerId: string) => {
    console.log(`Picker: Setting picker to ${pickerId}`);
    setSelectedPickerId(pickerId);
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
      console.log("Saving with picker:", selectedPickerId);
      console.log("Current checked items:", orderItems.filter(item => item.checked).map(i => ({
        id: i.id,
        name: i.product?.name,
        checked: i.checked,
        batchNumber: i.batchNumber
      })));
      
      // Map the order items to the format expected by the database
      const updatedOrderItems = orderItems.map(item => {
        return {
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          // Batch number can be empty, no need to verify it before saving
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
        newStatus = "Picking";
      }

      // Record batch usage for each item that has a batch number and is checked
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
        items: updatedOrderItems as OrderItem[],
        status: newStatus,
        isPicked: allChecked,
        is_picked: allChecked, // Add this for database compatibility
        totalBlownPouches: 0,
        total_blown_pouches: 0, // Add this for database compatibility
        pickingInProgress: !allChecked,
        picking_in_progress: !allChecked, // Add this for database compatibility
        pickedBy: selectedPickerId,
        picked_by: selectedPickerId, // Add this to ensure the correct field is set in the database
        pickedAt: allChecked ? new Date().toISOString() : undefined,
        picked_at: allChecked ? new Date().toISOString() : undefined, // Add this for database compatibility
        missingItems: orderMissingItems,
        missing_items: orderMissingItems, // Add this for database compatibility
        completedBoxes,
        completed_boxes: completedBoxes, // Add this for database compatibility
        savedBoxes
      };
      
      console.log("Saving order with status:", newStatus);
      console.log("Saving picked_by:", selectedPickerId);
      console.log("Saving checked items:", updatedOrderItems.filter(item => item.checked).map(i => i.id));
      
      // If order is completed, also record all batch usages and move it to completed orders
      if (newStatus === "Completed") {
        console.log("Order is completed, recording all batch usages and moving to completed orders");
        recordAllBatchUsagesForOrder(updatedOrder);
        const success = await completeOrder(updatedOrder);
        
        if (success) {
          toast({
            title: "Order completed",
            description: "Order has been marked as completed and moved to completed orders"
          });
          
          // Navigate back to orders list
          navigate("/orders");
          return;
        } else {
          console.error("Failed to complete order!");
        }
      } else {
        const success = await updateOrder(updatedOrder);
        
        // If update was successful, update our local state reference
        if (success) {
          console.log("Order update successful, updating last saved items");
          setLastSavedItems([...orderItems]);
          
          toast({
            title: "Order saved",
            description: "Order progress has been saved",
          });
        } else {
          console.error("Order update failed!");
          
          toast({
            title: "Error",
            description: "Failed to save order progress. Please try again.",
            variant: "destructive",
          });
        }
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
    
    // Also save the overall progress
    handleSave();
    
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
      
      // Save progress before redirecting
      handleSave();
      
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
  
  // Compare current items to last saved items to detect unsaved changes
  const hasUnsavedChanges = orderItems.some(item => {
    const savedItem = lastSavedItems.find(si => si.id === item.id);
    return !savedItem || 
      savedItem.checked !== item.checked || 
      savedItem.batchNumber !== item.batchNumber ||
      savedItem.pickedWeight !== item.pickedWeight;
  });
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Picking List</h1>
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </div>
      
      {/* Order details card with picker selection */}
      <OrderDetailsCard 
        selectedOrder={selectedOrder}
        selectedPickerId={selectedPickerId}
        onPickerChange={handlePickerChange}
        pickers={pickers}
      />
      
      {/* Order title and action buttons */}
      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-xl font-bold">Order for {selectedOrder.customer.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintClick} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button 
            variant={hasUnsavedChanges ? "default" : "outline"} 
            onClick={handleSave} 
            className="flex items-center gap-2"
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            Save Progress
            {hasUnsavedChanges && " *"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Order
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Picking interface */}
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
      
      {/* Notes if any */}
      {selectedOrder.notes && (
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
          <h3 className="font-semibold mb-2">Order Notes</h3>
          <p>{selectedOrder.notes}</p>
        </div>
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
