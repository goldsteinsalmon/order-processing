
import React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Box, Product } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
    if (boxToRemove) {
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
    }
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
      const product = products.find(p => p.id === item.productId);
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
                          Add to Box {box.boxNumber}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
      
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Items
        </Button>
        <Button 
          type="button" 
          onClick={onSubmit}
          disabled={!areAllItemsAssigned}
        >
          Create Order
        </Button>
      </div>
    </div>
  );
};

export default BoxDistributionStep;
