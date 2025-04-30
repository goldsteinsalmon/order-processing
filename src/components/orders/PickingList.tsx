import React, { useState, useEffect, useRef } from "react";
import { useData } from "@/context/DataContext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Check, Save, ArrowLeft, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams } from "react-router-dom";
import { OrderItem, Order } from "@/types";
import OrderSelection from "./picking/OrderSelection";
import OrderDetailsCard from "./picking/OrderDetailsCard";
import ItemsTable from "./picking/ItemsTable";
import CompletionDialog from "./picking/CompletionDialog";
import PrintablePickingList from "./picking/PrintablePickingList";

// Extended OrderItem type to include UI state properties
interface ExtendedOrderItem extends OrderItem {
  checked: boolean;
  batchNumber: string;
  originalQuantity?: number; // Added for tracking changes
}

interface PickingListProps {
  orderId?: string;
}

const PickingList: React.FC<PickingListProps> = ({ orderId }) => {
  const { orders, completeOrder, pickers, recordBatchUsage, updateOrder, addMissingItem, removeMissingItem } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Use either passed orderId prop or the URL param
  const effectiveOrderId = orderId || id || null;
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPickerId, setSelectedPickerId] = useState<string>("");
  const [allItems, setAllItems] = useState<ExtendedOrderItem[]>([]);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [missingItems, setMissingItems] = useState<{id: string, quantity: number}[]>([]);
  const [resolvedMissingItems, setResolvedMissingItems] = useState<{id: string, quantity: number}[]>([]);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  // Filter orders that are in "Pending" status
  const pendingOrders = orders.filter(order => order.status === "Pending" || order.status === "Partially Picked" || order.status === "Modified");
  
  // Get the selected order
  const selectedOrder = selectedOrderId 
    ? orders.find(order => order.id === selectedOrderId) 
    : null;

  // If id param exists, set it as selected order when component mounts
  useEffect(() => {
    if (effectiveOrderId) {
      const orderExists = orders.find(order => order.id === effectiveOrderId);
      if (orderExists && (orderExists.status === "Pending" || orderExists.status === "Partially Picked" || orderExists.status === "Modified")) {
        setSelectedOrderId(effectiveOrderId);
      }
    }
  }, [effectiveOrderId, orders]);
  
  // Update allItems when selectedOrderId changes
  useEffect(() => {
    if (selectedOrder) {
      // Create a flat list of all items from the order
      const items = selectedOrder.items.map(item => {
        // Check if this item has changes by looking at the order's changes array
        let originalQty = item.originalQuantity;
        
        // If no originalQuantity exists but the order has changes, try to find it in the changes array
        if (originalQty === undefined && selectedOrder.changes && selectedOrder.changes.length > 0) {
          const itemChange = selectedOrder.changes.find(change => change.productId === item.productId);
          if (itemChange) {
            originalQty = itemChange.originalQuantity;
          }
        }
        
        // Determine if the item has quantity changes
        const hasQuantityChanged = originalQty !== undefined && originalQty !== item.quantity;
        
        return {
          ...item,
          // If quantity has changed, ensure item is not checked
          checked: hasQuantityChanged ? false : (item.checked || false),
          batchNumber: item.batchNumber || "",
          pickedWeight: item.pickedWeight || 0,
          originalQuantity: originalQty,
        };
      });
      
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
      } else {
        setSelectedPickerId("");
      }
      
      // Reset resolved missing items
      setResolvedMissingItems([]);
    } else {
      setAllItems([]);
      setMissingItems([]);
      setResolvedMissingItems([]);
    }
  }, [selectedOrderId, selectedOrder]);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Picking List - ${selectedOrder?.customer.name || "Unknown"} - ${format(new Date(), "yyyy-MM-dd")}`,
    contentRef: printRef,
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
  
  const handleWeightChange = (itemId: string, weight: number) => {
    setAllItems(
      allItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, pickedWeight: weight };
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
  
  // New function to handle resolving missing items
  const handleResolveMissingItem = (itemId: string) => {
    // Find the missing item
    const missingItem = missingItems.find(mi => mi.id === itemId);
    if (!missingItem || !selectedOrderId) return;
    
    // Add to resolved list
    setResolvedMissingItems(prev => [...prev, missingItem]);
    
    // Remove from current missing items list
    setMissingItems(prev => prev.filter(mi => mi.id !== itemId));
    
    // Find the item details
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Remove from the global missing items list
    const missingItemId = `${selectedOrderId}-${itemId}`;
    removeMissingItem(missingItemId);
  };
  
  // Save current progress
  const handleSaveProgress = () => {
    if (!selectedOrder) return;
    
    // Create a copy of the order with updated items (including batch numbers and checks)
    const updatedOrder: Order = {
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
          missingQuantity: missingQuantity,
          pickedWeight: updatedItem.pickedWeight || item.pickedWeight
        };
      }),
      pickingInProgress: true,
      status: missingItems.length > 0 ? "Partially Picked" : "Pending",
      pickedBy: selectedPickerId || undefined,
      picker: selectedPickerId ? pickers.find(p => p.id === selectedPickerId)?.name : undefined, // Save the picker name
      missingItems: missingItems
    };
    
    // Update the order with progress
    updateOrder(updatedOrder);
    
    // Record missing items for the Missing Items page
    missingItems.forEach(missingItem => {
      if (missingItem.quantity > 0) {
        const item = allItems.find(i => i.id === missingItem.id);
        if (item && selectedOrderId) {
          // Find the product for the missing item
          const product = item.product;
          
          // Add to missing items collection for tracking
          const missingItemEntry = {
            id: `${selectedOrderId}-${item.id}`,
            orderId: selectedOrderId,
            productId: item.productId,
            product: product,
            quantity: missingItem.quantity,
            date: new Date().toISOString(),
            order: {
              id: selectedOrderId,
              customer: selectedOrder.customer,
            }
          };
          
          // Check if this is a new missing item before adding
          if (!resolvedMissingItems.some(rmi => rmi.id === missingItem.id)) {
            addMissingItem(missingItemEntry);
          }
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
    
    // Check if all items that require weight input have a weight entered
    const weightInputMissing = allItems
      .filter(item => item.product.requiresWeightInput)
      .some(item => !item.pickedWeight || item.pickedWeight <= 0);
    
    if (weightInputMissing) {
      toast({
        title: "Missing weight information",
        description: "Please enter weights for all products that require it.",
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
    
    // Find the picker name
    const pickerName = pickers.find(p => p.id === selectedPickerId)?.name;
    
    // Create a copy of the order with updated items (including batch numbers)
    const updatedOrder: Order = {
      ...selectedOrder,
      items: allItems.map(item => {
        // Check if this item has a missing quantity
        const missingItem = missingItems.find(mi => mi.id === item.id);
        const missingQuantity = missingItem ? missingItem.quantity : 0;
        
        return {
          ...item,
          batchNumber: item.batchNumber,
          missingQuantity: missingQuantity,
          pickedQuantity: item.quantity - missingQuantity,
          pickedWeight: item.pickedWeight
        };
      }),
      pickedBy: selectedPickerId,
      picker: pickerName, // Save the picker name
      pickedAt: new Date().toISOString(),
      batchNumbers: allItems.map(item => item.batchNumber), // Ensure we capture all batch numbers
      status: "Completed" as const
    };
    
    // Complete the order
    completeOrder(updatedOrder);
    
    // Now record batch usage for each item
    allItems.forEach(item => {
      if (item.batchNumber && selectedOrderId) {
        if (item.product.requiresWeightInput && item.pickedWeight) {
          // For weight-based products, use the entered weight
          recordBatchUsage(item.batchNumber, item.productId, 0, selectedOrderId, item.pickedWeight);
        } else {
          // For quantity-based products, use the quantity
          recordBatchUsage(item.batchNumber, item.productId, item.quantity - (item.missingQuantity || 0), selectedOrderId);
        }
      }
    });
    
    // Remove any resolved missing items
    resolvedMissingItems.forEach(resolvedItem => {
      if (selectedOrderId) {
        const missingItemId = `${selectedOrderId}-${resolvedItem.id}`;
        removeMissingItem(missingItemId);
      }
    });
    
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
        <Button variant="outline" onClick={handleBackToOrders}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </div>
      
      {!selectedOrder && (
        <OrderSelection 
          pendingOrders={pendingOrders}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
        />
      )}
      
      {selectedOrder && (
        <>
          {/* Order Details Card */}
          <OrderDetailsCard 
            selectedOrder={selectedOrder}
            selectedPickerId={selectedPickerId}
            onPickerChange={setSelectedPickerId}
            pickers={pickers}
          />
          
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              Order for {selectedOrder.customer.name}
              {selectedOrder.hasChanges && (
                <span className="text-sm text-red-600 ml-2 font-medium">
                  (Modified Order)
                </span>
              )}
            </h3>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handlePrint}>
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
          
          {/* Items Table with changes tracking */}
          <ItemsTable 
            items={allItems}
            missingItems={missingItems}
            onCheckItem={handleCheckItem}
            onBatchNumberChange={handleBatchNumber}
            onMissingItemChange={handleMissingItem}
            onResolveMissingItem={handleResolveMissingItem}
            onWeightChange={handleWeightChange}
          />
          
          {/* Printable version */}
          <div className="hidden">
            <PrintablePickingList 
              ref={printRef}
              selectedOrder={selectedOrder}
              items={allItems}
            />
          </div>
        </>
      )}
      
      {/* Completion Dialog */}
      <CompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        missingItems={missingItems}
        resolvedMissingItems={resolvedMissingItems}
        allItems={allItems}
        onConfirm={confirmCompleteOrder}
      />
    </div>
  );
};

export default PickingList;
