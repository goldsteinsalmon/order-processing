import React, { useState, useEffect } from "react";
import { Plus, X, SplitSquareVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Box, Product } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BoxDistributionStepProps {
  boxDistributions: Box[];
  setBoxDistributions: React.Dispatch<React.SetStateAction<Box[]>>;
  unassignedItems: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
  }[];
  setUnassignedItems: React.Dispatch<React.SetStateAction<
    {id: string; productId: string; productName: string; quantity: number;}[]
  >>;
  products: Product[];
  onBack: () => void;
  onSubmit: () => void;
}

const BoxDistributionStep: React.FC<BoxDistributionStepProps> = ({
  boxDistributions,
  setBoxDistributions,
  unassignedItems,
  setUnassignedItems,
  products,
  onBack,
  onSubmit
}) => {
  // Check if all items have been assigned to boxes
  const areAllItemsAssigned = unassignedItems.length === 0;
  
  // State for the auto split dialog
  const [autoSplitDialogOpen, setAutoSplitDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
  } | null>(null);
  const [boxCount, setBoxCount] = useState(2); // Default to 2 boxes
  
  // State for the manual split dialog
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitTarget, setSplitTarget] = useState<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    targetBox: number;
  } | null>(null);
  const [splitQuantity, setSplitQuantity] = useState(1);

  // Effect to log unassigned items for debugging
  useEffect(() => {
    console.log("Current unassigned items:", unassignedItems);
  }, [unassignedItems]);

  const handleAddBox = () => {
    const newBoxNumber = boxDistributions.length > 0 
      ? Math.max(...boxDistributions.map(box => box.boxNumber)) + 1 
      : 1;
      
    setBoxDistributions([
      ...boxDistributions, 
      { 
        boxNumber: newBoxNumber, 
        items: [], 
        completed: false,
        printed: false
      }
    ]);
  };
  
  const handleRemoveBox = (boxNumber: number) => {
    // Get items from the box being removed
    const boxToRemove = boxDistributions.find(box => box.boxNumber === boxNumber);
    if (!boxToRemove) return;
    
    // Return items to unassigned
    const itemsToReturn = boxToRemove.items;
    const updatedUnassignedItems = [...unassignedItems];
    
    itemsToReturn.forEach(item => {
      const existingItem = updatedUnassignedItems.find(uItem => uItem.productId === item.productId);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        const product = products.find(p => p.id === item.productId);
        updatedUnassignedItems.push({
          id: crypto.randomUUID(),
          productId: item.productId,
          productName: product ? product.name : "Unknown Product",
          quantity: item.quantity
        });
      }
    });
    
    setUnassignedItems(updatedUnassignedItems);
    setBoxDistributions(boxDistributions.filter(box => box.boxNumber !== boxNumber));
  };
  
  const handleAddItemToBox = (boxNumber: number, item: typeof unassignedItems[0], quantity: number) => {
    if (quantity <= 0 || quantity > item.quantity) return;
    
    // Add item to box
    setBoxDistributions(boxDistributions.map(box => {
      if (box.boxNumber === boxNumber) {
        const existingItem = box.items.find(i => i.productId === item.productId);
        if (existingItem) {
          // Increment existing item quantity
          return {
            ...box,
            items: box.items.map(i => 
              i.productId === item.productId 
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          };
        } else {
          // Add new item to box
          const product = products.find(p => p.id === item.productId);
          return {
            ...box,
            items: [
              ...box.items, 
              { 
                productId: item.productId, 
                productName: product ? product.name : "Unknown Product",
                quantity,
                weight: 0
              }
            ]
          };
        }
      }
      return box;
    }));
    
    // Remove from unassigned items
    setUnassignedItems(unassignedItems.map(i => {
      if (i.id === item.id) {
        return { ...i, quantity: i.quantity - quantity };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  // New function to handle auto-splitting items
  const handleOpenAutoSplitDialog = (e: React.MouseEvent, item: typeof unassignedItems[0]) => {
    // Prevent the default form submission
    e.preventDefault();
    e.stopPropagation();
    
    setCurrentItem(item);
    setBoxCount(Math.min(item.quantity, 5)); // Default to min of 5 boxes or item quantity
    setAutoSplitDialogOpen(true);
  };

  // Handle auto-split confirmation
  const handleAutoSplitConfirm = () => {
    if (!currentItem) return;
    
    console.log("Auto split confirm called");
    
    // Make sure we have enough boxes
    const existingBoxCount = boxDistributions.length;
    const newBoxes: Box[] = [];
    
    if (existingBoxCount < boxCount) {
      // Create additional boxes as needed
      let highestBoxNumber = existingBoxCount > 0 
        ? Math.max(...boxDistributions.map(box => box.boxNumber))
        : 0;
        
      for (let i = existingBoxCount; i < boxCount; i++) {
        highestBoxNumber++;
        newBoxes.push({
          boxNumber: highestBoxNumber,
          items: [],
          completed: false,
          printed: false
        });
      }
      
      // Update box distributions with new boxes
      setBoxDistributions(prevBoxes => [...prevBoxes, ...newBoxes]);
    }
    
    // Calculate quantities per box
    const totalQuantity = currentItem.quantity;
    const baseQuantity = Math.floor(totalQuantity / boxCount);
    const remainder = totalQuantity % boxCount;
    
    console.log("Total quantity:", totalQuantity);
    console.log("Base quantity per box:", baseQuantity);
    console.log("Remainder:", remainder);
    
    // Create a new array of all boxes (existing + new)
    const allBoxes = [...boxDistributions, ...newBoxes];
    
    // Sort boxes by box number to ensure consistent order
    allBoxes.sort((a, b) => a.boxNumber - b.boxNumber);
    
    // Get the target boxes we'll distribute to
    const targetBoxes = allBoxes.slice(0, boxCount);
    
    console.log("Target box numbers:", targetBoxes.map(box => box.boxNumber));
    
    // Create a deep copy of the box distributions to modify
    const updatedBoxes = targetBoxes.map((box, index) => {
      // Calculate quantity for this box (add extra for remainder distribution)
      const adjustedQuantity = index < remainder ? baseQuantity + 1 : baseQuantity;
      
      if (adjustedQuantity <= 0) return box;
      
      console.log(`Adding ${adjustedQuantity} items to box ${box.boxNumber}`);
      
      // Check if item already exists in box
      const existingItemIndex = box.items.findIndex(item => item.productId === currentItem.productId);
      
      let updatedItems;
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        updatedItems = box.items.map((item, i) => {
          if (i === existingItemIndex) {
            return { ...item, quantity: item.quantity + adjustedQuantity };
          }
          return item;
        });
      } else {
        // Add as new item
        updatedItems = [
          ...box.items,
          {
            productId: currentItem.productId,
            productName: currentItem.productName,
            quantity: adjustedQuantity,
            weight: 0
          }
        ];
      }
      
      return {
        ...box,
        items: updatedItems
      };
    });
    
    // Merge updated boxes with any boxes that weren't targeted
    const finalBoxDistributions = allBoxes.map(box => {
      const updatedBox = updatedBoxes.find(updatedBox => updatedBox.boxNumber === box.boxNumber);
      return updatedBox || box;
    });
    
    // Update box distributions with our complete set
    setBoxDistributions(finalBoxDistributions);
    
    // IMPORTANT: Explicitly remove this item from unassigned items to ensure it's fully assigned
    // Use a direct setState instead of a function to ensure it actually updates
    const filteredItems = unassignedItems.filter(item => item.id !== currentItem.id);
    setUnassignedItems(filteredItems);
    
    console.log("Items after removal:", filteredItems);
    
    // Close the dialog
    setAutoSplitDialogOpen(false);
    setCurrentItem(null);
  };

  // Manual split functions
  const handleOpenSplitDialog = (e: React.MouseEvent, item: typeof unassignedItems[0], boxNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSplitTarget({
      ...item,
      targetBox: boxNumber
    });
    setSplitQuantity(Math.min(5, item.quantity));
    setSplitDialogOpen(true);
  };

  const handleSplitConfirm = () => {
    if (!splitTarget) return;
    
    // Validate split quantity
    const quantity = Math.min(splitTarget.quantity, Math.max(1, splitQuantity));
    
    // Add the specified quantity to the box
    handleAddItemToBox(splitTarget.targetBox, splitTarget, quantity);
    
    // Close the dialog
    setSplitDialogOpen(false);
    setSplitTarget(null);
  };
  
  const handleRemoveItemFromBox = (boxNumber: number, productId: string, quantity?: number) => {
    // Find the box and item
    const box = boxDistributions.find(b => b.boxNumber === boxNumber);
    if (!box) return;
    
    const itemInBox = box.items.find(i => i.productId === productId);
    if (!itemInBox) return;
    
    const amountToRemove = quantity || itemInBox.quantity;
    
    // Update box by removing or decreasing the item
    setBoxDistributions(boxDistributions.map(b => {
      if (b.boxNumber === boxNumber) {
        return {
          ...b,
          items: b.items
            .map(i => {
              if (i.productId === productId) {
                return { ...i, quantity: i.quantity - amountToRemove };
              }
              return i;
            })
            .filter(i => i.quantity > 0) // Remove items with 0 quantity
        };
      }
      return b;
    }));
    
    // Return to unassigned items
    const existingUnassigned = unassignedItems.find(i => i.productId === productId);
    if (existingUnassigned) {
      setUnassignedItems(unassignedItems.map(i => {
        if (i.productId === productId) {
          return { ...i, quantity: i.quantity + amountToRemove };
        }
        return i;
      }));
    } else {
      // Add as new unassigned item
      const product = products.find(p => p.id === productId);
      setUnassignedItems([
        ...unassignedItems,
        {
          id: crypto.randomUUID(),
          productId,
          productName: product ? product.name : "Unknown Product",
          quantity: amountToRemove
        }
      ]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Box Distribution</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Items */}
        <div className="border rounded-md p-4">
          <h4 className="font-medium mb-3">Unassigned Items</h4>
          {unassignedItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              All items have been assigned to boxes
            </div>
          ) : (
            <div className="space-y-3">
              {unassignedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Add to Box</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {boxDistributions.map(box => (
                          <DropdownMenuItem 
                            key={box.boxNumber}
                            onClick={() => handleAddItemToBox(box.boxNumber, item, item.quantity)}
                          >
                            Add all to Box {box.boxNumber}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={(e) => handleOpenAutoSplitDialog(e, item)}
                      type="button"
                    >
                      <SplitSquareVertical className="h-4 w-4 mr-1" />
                      Auto Split
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" type="button">
                          Split Manually
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {boxDistributions.map(box => (
                          <DropdownMenuItem 
                            key={box.boxNumber}
                            onClick={(e) => handleOpenSplitDialog(e, item, box.boxNumber)}
                          >
                            Split into Box {box.boxNumber}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Box Management */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Boxes</h4>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAddBox}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Box
            </Button>
          </div>
          
          <div className="space-y-4">
            {boxDistributions.map(box => (
              <div key={box.boxNumber} className="border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium">Box {box.boxNumber}</h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBox(box.boxNumber)}
                    disabled={boxDistributions.length <= 1}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                {box.items.length === 0 ? (
                  <div className="text-center py-2 text-gray-500">
                    No items in this box
                  </div>
                ) : (
                  <div className="space-y-2">
                    {box.items.map(item => (
                      <div key={item.productId} className="flex justify-between items-center text-sm border-b pb-1">
                        <div className="flex-1">
                          <div>{item.productName}</div>
                          <div className="text-gray-500">Qty: {item.quantity}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItemFromBox(box.boxNumber, item.productId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Auto Split Dialog */}
      <Dialog open={autoSplitDialogOpen} onOpenChange={setAutoSplitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto Split Item</DialogTitle>
            <DialogDescription>Distribute items evenly across boxes</DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {currentItem && (
              <>
                <div className="mb-4">
                  <div className="font-medium">{currentItem.productName}</div>
                  <div className="text-sm text-gray-500">Total quantity: {currentItem.quantity}</div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="boxCount">Number of boxes to distribute across:</Label>
                  <Input 
                    id="boxCount"
                    type="number" 
                    min={2} 
                    max={Math.min(10, currentItem.quantity)}
                    value={boxCount}
                    onChange={(e) => setBoxCount(parseInt(e.target.value) || 2)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Each box will receive approximately {Math.floor(currentItem.quantity / boxCount)} items
                    {currentItem.quantity % boxCount > 0 && `, with ${currentItem.quantity % boxCount} boxes receiving one extra item`}
                  </p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoSplitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAutoSplitConfirm}>Auto Split</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manual Split Quantity Dialog */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Split Item Quantity</DialogTitle>
            <DialogDescription>Choose how many items to add to the selected box</DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {splitTarget && (
              <>
                <div className="mb-4">
                  <div className="font-medium">{splitTarget.productName}</div>
                  <div className="text-sm text-gray-500">Available: {splitTarget.quantity}</div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="splitQuantity">Quantity to add to Box {splitTarget.targetBox}:</Label>
                  <Input 
                    id="splitQuantity"
                    type="number" 
                    min={1} 
                    max={splitTarget.quantity}
                    value={splitQuantity}
                    onChange={(e) => setSplitQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSplitConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoxDistributionStep;
