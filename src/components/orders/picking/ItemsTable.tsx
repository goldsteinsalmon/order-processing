import React from "react";
import { OrderItem } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Weight, Package, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExtendedOrderItem extends OrderItem {
  checked: boolean;
  batchNumber: string;
  originalQuantity?: number;
}

interface ItemsTableProps {
  items: ExtendedOrderItem[];
  missingItems: { id: string; quantity: number }[];
  onCheckItem: (itemId: string, checked: boolean) => void;
  onBatchNumberChange: (itemId: string, batchNumber: string) => void;
  onMissingItemChange: (itemId: string, quantity: number) => void;
  onResolveMissingItem?: (itemId: string) => void;
  onWeightChange?: (itemId: string, weight: number) => void;
  onPrintBoxLabel?: (boxNumber: number) => void;
  groupByBox?: boolean;
  completedBoxes?: number[];
}

const ItemsTable: React.FC<ItemsTableProps> = ({ 
  items, 
  missingItems, 
  onCheckItem, 
  onBatchNumberChange, 
  onMissingItemChange,
  onResolveMissingItem,
  onWeightChange,
  onPrintBoxLabel,
  groupByBox = false,
  completedBoxes = []
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
  
  // Group items by box number if groupByBox is enabled
  const groupedItems = React.useMemo(() => {
    if (!groupByBox) return { noBox: items };
    
    return items.reduce((acc, item) => {
      const boxNumber = item.boxNumber || 0;
      if (!acc[boxNumber]) {
        acc[boxNumber] = [];
      }
      acc[boxNumber].push(item);
      return acc;
    }, {} as Record<number, ExtendedOrderItem[]>);
  }, [items, groupByBox]);
  
  // Check if all items in a box are checked
  const isBoxComplete = (boxItems: ExtendedOrderItem[]): boolean => {
    return boxItems.length > 0 && boxItems.every(item => item.checked);
  };

  // Sort box numbers to ensure sequential processing
  const boxNumbers = Object.keys(groupedItems).map(Number).sort((a, b) => a - b);
  
  // If not grouping by box, render the standard table
  if (!groupByBox) {
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
                          disabled={itemChanged}
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
  }
  
  // Group by box rendering
  return (
    <div className="space-y-6">
      {boxNumbers.map((boxNumber, index) => {
        const boxItems = groupedItems[boxNumber];
        const boxTitle = boxNumber === 0 ? "Unassigned Items" : `Box ${boxNumber}`;
        const boxComplete = isBoxComplete(boxItems);
        const isBoxPrinted = completedBoxes.includes(boxNumber);
        const previousBoxPrinted = index === 0 || boxNumbers[index - 1] === 0 || completedBoxes.includes(boxNumbers[index - 1]);
        const isBoxDisabled = index > 0 && boxNumbers[index - 1] !== 0 && !completedBoxes.includes(boxNumbers[index - 1]);
        
        return (
          <Card 
            key={boxNumber} 
            className={`
              ${boxComplete ? "border-green-500 border-2" : ""}
              ${isBoxDisabled ? "opacity-60" : ""}
            `}
          >
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                {boxTitle}
                {boxComplete && !isBoxPrinted && (
                  <Badge className="ml-2 bg-green-500">Ready to Print</Badge>
                )}
                {isBoxPrinted && (
                  <Badge className="ml-2 bg-blue-500">Label Printed</Badge>
                )}
              </CardTitle>
              {boxNumber > 0 && onPrintBoxLabel && boxComplete && (
                <Button 
                  size="sm"
                  variant={isBoxPrinted ? "outline" : "default"}
                  className="flex items-center"
                  onClick={() => onPrintBoxLabel(boxNumber)}
                  disabled={isBoxDisabled || !previousBoxPrinted}
                >
                  <Printer className="mr-1 h-4 w-4" />
                  {isBoxPrinted ? "Print Again" : "Print Label"}
                </Button>
              )}
            </CardHeader>
            <CardContent className={isBoxDisabled ? "pointer-events-none" : ""}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Picked</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Missing</TableHead>
                      {boxItems.some(item => item.product.requiresWeightInput) && (
                        <TableHead>Weight (kg)</TableHead>
                      )}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boxItems.map(item => {
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
                              disabled={itemChanged || isBoxDisabled}
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
                              disabled={isBoxDisabled}
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
                              disabled={isBoxDisabled}
                            />
                          </TableCell>
                          {boxItems.some(item => item.product.requiresWeightInput) && (
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
                                  disabled={isBoxDisabled}
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
                                disabled={isBoxDisabled}
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
      })}
    </div>
  );
};

export default ItemsTable;
