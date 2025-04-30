import React, { useState, useEffect, useRef } from "react";
import { useData } from "@/context/DataContext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Check, Save, ArrowLeft, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams } from "react-router-dom";
import { OrderItem, Order, Box } from "@/types";
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
  nextBoxToFocus?: number;
}

const PickingList: React.FC<PickingListProps> = ({ orderId, nextBoxToFocus }) => {
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
  const [completedBoxes, setCompletedBoxes] = useState<number[]>([]);
  const [printBoxNumber, setPrintBoxNumber] = useState<number | null>(null);
  const [savedBoxes, setSavedBoxes] = useState<number[]>([]);
  
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
      
      // Reset or load saved and completed boxes from order state
      if (selectedOrder.completedBoxes && selectedOrder.completedBoxes.length > 0) {
        setCompletedBoxes(selectedOrder.completedBoxes);
      } else {
        setCompletedBoxes([]);
      }
      
      // Load saved boxes status if it exists in the order
      if (selectedOrder.savedBoxes && selectedOrder.savedBoxes.length > 0) {
        setSavedBoxes(selectedOrder.savedBoxes);
      } else {
        setSavedBoxes([]);
      }
    } else {
      setAllItems([]);
      setMissingItems([]);
      setResolvedMissingItems([]);
      setCompletedBoxes([]);
      setSavedBoxes([]);
    }
  }, [selectedOrderId, selectedOrder]);
  
  // Add effect to focus on the specified box when nextBoxToFocus is provided
  useEffect(() => {
    if (nextBoxToFocus && selectedOrder && selectedOrder.boxDistributions) {
      // Check if this box exists in the order
      const boxExists = selectedOrder.boxDistributions.some(box => box.boxNumber === nextBoxToFocus);
      
      if (boxExists) {
        // Scroll to the box - this could be improved with a ref, but for now we'll use the box ID
        setTimeout(() => {
          const boxElement = document.getElementById(`box-${nextBoxToFocus}`);
          if (boxElement) {
            boxElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Add a highlight class that we'll animate with CSS
            boxElement.classList.add('highlight-box');
            
            // Remove the highlight class after the animation completes
            setTimeout(() => {
              boxElement.classList.remove('highlight-box');
            }, 2000);
          }
        }, 100);
      }
    }
  }, [nextBoxToFocus, selectedOrder]);
  
  // Check if the customer needs detailed box labels
  const needsDetailedBoxLabels = selectedOrder?.customer.needsDetailedBoxLabels || false;
  
  // Check if the order has box distributions
  const hasBoxDistributions = selectedOrder?.boxDistributions && selectedOrder.boxDistributions.length > 0;
  
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
  
  // Handle printing a specific box label
  const handlePrintBoxLabel = (boxNumber: number) => {
    if (!selectedOrderId) return;
    
    // Save the box data first (combining save and print)
    handleSaveBoxProgress(boxNumber);
    
    // Navigate to print box label page for this specific box
    navigate(`/print-box-label/${selectedOrderId}?box=${boxNumber}`);
  };
  
  // Handle saving a specific box's progress - now automatically called by print function
  const handleSaveBoxProgress = (boxNumber: number) => {
    if (!selectedOrder) return;
    
    // Add to saved boxes if not already there
    const newSavedBoxes = [...savedBoxes];
    if (!newSavedBoxes.includes(boxNumber)) {
      newSavedBoxes.push(boxNumber);
      setSavedBoxes(newSavedBoxes);
    }
    
    // Also add to completed boxes to ensure consistency in UI
    const newCompletedBoxes = [...completedBoxes];
    if (!newCompletedBoxes.includes(boxNumber)) {
      newCompletedBoxes.push(boxNumber);
      setCompletedBoxes(newCompletedBoxes);
    }
    
    // Update the order with the new saved and completed box information
    updateOrder({
      ...selectedOrder,
      savedBoxes: newSavedBoxes,
      completedBoxes: newCompletedBoxes,
      pickedBy: selectedPickerId,
      pickingInProgress: true
    });
    
    // Save overall progress to ensure everything is preserved
    handleSaveProgress();
  };
  
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
  
  // Handler for batch number change with automatic propagation to same product in other boxes
  const handleBatchNumber = (itemId: string, batchNumber: string) => {
    // Find the current item to get its product ID
    const currentItem = allItems.find(item => item.id === itemId);
    if (!currentItem) return;
    
    const productId = currentItem.productId;
    
    // Update all items with the same product ID
    setAllItems(
      allItems.map((item) => {
        if (item.productId === productId) {
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
      missingItems: missingItems,
      completedBoxes: completedBoxes, // Save the printed boxes state
      savedBoxes: savedBoxes // Save the saved boxes state
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
    
    // For orders with box distributions, check if all box labels have been printed
    if (needsDetailedBoxLabels && hasBoxDistributions && selectedOrder.boxDistributions) {
      const boxNumbers = selectedOrder.boxDistributions
        .map(box => box.boxNumber)
        .filter(num => num > 0); // Exclude unassigned box (0)
      
      const allBoxesPrinted = boxNumbers.every(boxNum => completedBoxes.includes(boxNum));
      
      if (!allBoxesPrinted) {
        toast({
          title: "Box labels not printed",
          description: "Please print all box labels before completing the order.",
          variant: "destructive",
        });
        return;
      }
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
      status: "Completed" as const,
      completedBoxes: completedBoxes // Save the list of completed boxes
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
    
    // Navigate to orders page now instead of print box label
    navigate("/orders");
  };

  // Go back to orders page
  const handleBackToOrders = () => {
    navigate("/orders");
  };
  
  // Calculate total weight for all boxes by product
  const calculateTotalWeightByProduct = () => {
    if (!selectedOrder || !selectedOrder.boxDistributions || !allItems.length) {
      return [];
    }
    
    // Create a map to store total weight by product
    const weightByProduct = new Map();
    
    // Get items with their weights
    allItems.forEach(item => {
      const productId = item.productId;
      const productName = item.product.name;
      
      // For weight-based products, use picked weight
      if (item.product.requiresWeightInput && item.pickedWeight) {
        const currentWeight = weightByProduct.get(productId) || { 
          id: productId, 
          name: productName, 
          weight: 0,
          unit: item.product.unit || 'g' // Default to grams if no unit specified
        };
        currentWeight.weight += item.pickedWeight;
        weightByProduct.set(productId, currentWeight);
      } 
      // For non-weight based products with defined weights, calculate
      else if (item.product.weight) {
        const currentWeight = weightByProduct.get(productId) || { 
          id: productId, 
          name: productName, 
          weight: 0,
          unit: item.product.unit || 'g' // Default to grams if no unit specified
        };
        currentWeight.weight += item.product.weight * item.quantity;
        weightByProduct.set(productId, currentWeight);
      }
    });
    
    // Convert map to array
    return Array.from(weightByProduct.values());
  };
  
  const totalWeightByProduct = calculateTotalWeightByProduct();
  
  // Determine if we should display the modified order indicator
  const shouldShowModifiedIndicator = selectedOrder?.hasChanges && selectedOrder?.pickingInProgress;
  
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
              {shouldShowModifiedIndicator && (
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
          
          {/* Items Table with box grouping when needed */}
          <ItemsTable 
            items={allItems}
            missingItems={missingItems}
            onCheckItem={handleCheckItem}
            onBatchNumberChange={handleBatchNumber}
            onMissingItemChange={handleMissingItem}
            onResolveMissingItem={handleResolveMissingItem}
            onWeightChange={handleWeightChange}
            onPrintBoxLabel={handlePrintBoxLabel}
            onSaveBoxProgress={handleSaveBoxProgress}
            groupByBox={needsDetailedBoxLabels && hasBoxDistributions}
            completedBoxes={completedBoxes}
            savedBoxes={savedBoxes}
          />
          
          {/* Total Weight Summary */}
          {totalWeightByProduct.length > 0 && (
            <div className="mt-8 border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Total Product Weights</h3>
              <div className="grid gap-4">
                {totalWeightByProduct.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-semibold">
                      {item.weight.toLocaleString()} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Printable version */}
          <div className="hidden">
            <PrintablePickingList 
              ref={printRef}
              selectedOrder={selectedOrder}
              items={allItems}
              groupByBox={needsDetailedBoxLabels && hasBoxDistributions}
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
