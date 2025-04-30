
import React from "react";
import { OrderItem } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Weight } from "lucide-react";

interface ExtendedOrderItem extends OrderItem {
  checked: boolean;
  batchNumber: string;
  originalQuantity?: number; // Added to track original quantity for highlighting changes
}

interface ItemsTableProps {
  items: ExtendedOrderItem[];
  missingItems: { id: string; quantity: number }[];
  onCheckItem: (itemId: string, checked: boolean) => void;
  onBatchNumberChange: (itemId: string, batchNumber: string) => void;
  onMissingItemChange: (itemId: string, quantity: number) => void;
  onResolveMissingItem?: (itemId: string) => void;
  onWeightChange?: (itemId: string, weight: number) => void;
}

const ItemsTable: React.FC<ItemsTableProps> = ({ 
  items, 
  missingItems, 
  onCheckItem, 
  onBatchNumberChange, 
  onMissingItemChange,
  onResolveMissingItem,
  onWeightChange
}) => {
  // Helper function to determine if an item has changed quantity
  const hasQuantityChanged = (item: ExtendedOrderItem) => {
    return item.originalQuantity !== undefined && item.originalQuantity !== item.quantity;
  };

  // Helper function to get change description for an item
  const getChangeDescription = (item: ExtendedOrderItem) => {
    if (!hasQuantityChanged(item)) return null;
    
    if (item.originalQuantity === 0) {
      return `Added ${item.quantity} ${item.product.name}`;
    } else if (item.quantity === 0) {
      return `Removed ${item.product.name}`;
    } else {
      return `Changed from ${item.originalQuantity} to ${item.quantity}`;
    }
  };

  return (
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
                {items.some(item => item.product.requiresWeightInput) && (
                  <TableHead>Weight (kg)</TableHead>
                )}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const missingItem = missingItems.find(mi => mi.id === item.id);
                const missingQuantity = missingItem ? missingItem.quantity : 0;
                const hasMissingItems = missingQuantity > 0;
                const requiresWeightInput = item.product.requiresWeightInput;
                const itemChanged = hasQuantityChanged(item);
                
                return (
                  <TableRow 
                    key={item.id}
                    className={itemChanged ? "bg-red-50" : ""}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={item.checked} 
                        onCheckedChange={(checked) => 
                          onCheckItem(item.id, checked === true)
                        }
                        disabled={itemChanged} // Disable checkbox for items that have changed
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-gray-500">{item.product.sku}</div>
                      {requiresWeightInput && (
                        <div className="text-xs text-blue-600 font-medium flex items-center mt-1">
                          <Weight className="h-3 w-3 mr-1" /> 
                          Requires weight input
                        </div>
                      )}
                      {itemChanged && (
                        <div className="text-red-600 text-xs font-medium mt-1">
                          {getChangeDescription(item)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter batch #"
                        value={item.batchNumber}
                        onChange={(e) => onBatchNumberChange(item.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="0"
                        max={item.quantity}
                        placeholder="0"
                        value={missingQuantity || ""}
                        onChange={(e) => onMissingItemChange(
                          item.id, 
                          Math.min(parseInt(e.target.value) || 0, item.quantity)
                        )}
                      />
                    </TableCell>
                    {items.some(item => item.product.requiresWeightInput) && (
                      <TableCell>
                        {requiresWeightInput ? (
                          <Input 
                            type="number"
                            min="0"
                            step="0.001"
                            placeholder="Enter weight"
                            value={item.pickedWeight ? (item.pickedWeight / 1000) : ""}
                            onChange={(e) => onWeightChange && onWeightChange(
                              item.id, 
                              parseFloat(e.target.value) * 1000 || 0
                            )}
                            className="bg-blue-50"
                          />
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {hasMissingItems && onResolveMissingItem && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex items-center gap-1"
                          onClick={() => onResolveMissingItem(item.id)}
                        >
                          <Check className="h-4 w-4" />
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemsTable;
