
import React from 'react';
import { OrderItem } from '@/types';
import { Check, Printer, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// Extended OrderItem type to include UI state properties
export interface ExtendedOrderItem extends OrderItem {
  checked: boolean;
  batchNumber?: string;
  originalQuantity?: number;
  productId: string;
  boxNumber?: number;
  pickedWeight?: number;
  missingQuantity?: number;
}

interface ItemsTableProps {
  items: ExtendedOrderItem[];
  missingItems: { id: string; quantity: number }[];
  onCheckItem: (itemId: string, checked: boolean) => void;
  onBatchNumberChange: (itemId: string, batchNumber: string, boxNumber: number) => void;
  onMissingItemChange: (itemId: string, quantity: number) => void;
  onResolveMissingItem: (itemId: string) => void;
  onWeightChange: (itemId: string, weight: number) => void;
  onPrintBoxLabel: (boxNumber: number) => void;
  onSaveBoxProgress: (boxNumber: number) => void;
  groupByBox?: boolean;
  completedBoxes: number[];
  savedBoxes: number[];
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
  onSaveBoxProgress,
  groupByBox = false,
  completedBoxes = [],
  savedBoxes = []
}) => {
  // Group items by box number if needed
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

  // Helper function to check if a box is complete
  const isBoxComplete = (boxItems: ExtendedOrderItem[]): boolean => {
    // First check if all items are checked
    if (!boxItems.length || !boxItems.every(item => item.checked)) {
      return false;
    }
    
    // Then check if all items have batch numbers
    if (!boxItems.every(item => item.batchNumber?.trim())) {
      return false;
    }
    
    // Finally check if all items that require weight have weights entered
    const weightInputComplete = boxItems
      .filter(item => item.product.requiresWeightInput)
      .every(item => (item.pickedWeight) && 
             (item.pickedWeight > 0));
        
    // If any item requires weight but hasn't been entered, box is not complete
    if (!weightInputComplete) {
      return false;
    }
    
    return true;
  };

  // Helper function to check if quantity has changed
  const hasQuantityChanged = (item: ExtendedOrderItem) => {
    // Only show as changed if originalQuantity is explicitly set and different
    return (item.originalQuantity !== undefined) && 
           (item.originalQuantity !== item.quantity);
  };

  // Render item row
  const renderItemRow = (item: ExtendedOrderItem, boxNumber: number = 0) => {
    // Find if this item has been marked as missing
    const missingItem = missingItems.find(mi => mi.id === item.id);
    const missingQuantity = missingItem ? missingItem.quantity : 0;
    
    // Check if item requires weight input
    const requiresWeightInput = item.product.requiresWeightInput;
    
    // Determine if there's been a quantity change
    const quantityChanged = hasQuantityChanged(item);
    
    // For debugging
    if (quantityChanged) {
      console.log(`Item ${item.product.name} shows as changed:`, {
        originalQuantity: item.originalQuantity,
        currentQuantity: item.quantity
      });
    }
    
    return (
      <tr key={item.id} className={`border-b ${quantityChanged ? 'bg-yellow-50' : ''}`}>
        <td className="p-2">
          <Checkbox 
            checked={item.checked} 
            onCheckedChange={checked => onCheckItem(item.id, !!checked)}
          />
        </td>
        <td className="p-2">
          <div className={quantityChanged ? 'font-medium text-amber-700' : ''}>
            {item.product.name}
          </div>
          {quantityChanged && (
            <div className="text-xs text-amber-700">
              Changed from {item.originalQuantity}
            </div>
          )}
        </td>
        <td className="p-2 text-center">{item.quantity}</td>
        <td className="p-2">
          <Input 
            type="text"
            value={item.batchNumber || ''}
            onChange={e => onBatchNumberChange(item.id, e.target.value, boxNumber)}
            className="w-24"
            placeholder="Batch #"
          />
        </td>
        {requiresWeightInput && (
          <td className="p-2">
            <Input
              type="number"
              value={(item.pickedWeight || '').toString()}
              onChange={e => onWeightChange(item.id, parseFloat(e.target.value) || 0)}
              className="w-24"
              placeholder="Weight"
            />
            <span className="ml-1 text-xs text-gray-500">{item.product.unit || 'g'}</span>
          </td>
        )}
        <td className="p-2">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={missingQuantity.toString()}
              onChange={e => onMissingItemChange(item.id, parseInt(e.target.value, 10) || 0)}
              className="w-16"
              min={0}
              max={item.quantity}
            />
            {missingQuantity > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onResolveMissingItem(item.id)}
                className="text-xs h-8"
              >
                <Check className="h-3 w-3 mr-1" /> Resolved
              </Button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Render a box section
  const renderBoxSection = (boxNumber: number, boxItems: ExtendedOrderItem[]) => {
    // Check if this box number has already been completed
    const isCompleted = completedBoxes.includes(boxNumber);
    const isSaved = savedBoxes.includes(boxNumber);
    const boxIsComplete = isBoxComplete(boxItems);
    
    return (
      <Card 
        key={`box-${boxNumber}`} 
        id={`box-${boxNumber}`}
        className={`mb-6 ${isCompleted ? 'border-green-300 bg-green-50' : ''}`}
      >
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle>Box {boxNumber}</CardTitle>
          <div className="flex items-center space-x-2">
            {boxIsComplete && !isSaved && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onSaveBoxProgress(boxNumber)}
              >
                <Save className="h-4 w-4 mr-2" /> Save Box
              </Button>
            )}
            
            {boxIsComplete && (
              <Button 
                size="sm"
                onClick={() => onPrintBoxLabel(boxNumber)}
                variant={isCompleted ? "outline" : "default"}
              >
                <Printer className="h-4 w-4 mr-2" /> {isCompleted ? "Re-print Label" : "Print Label"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-10">&nbsp;</th>
                  <th className="text-left p-2">Product</th>
                  <th className="p-2 w-20 text-center">Qty</th>
                  <th className="p-2 w-32">Batch #</th>
                  {boxItems.some(item => item.product.requiresWeightInput) && (
                    <th className="p-2 w-32">Weight</th>
                  )}
                  <th className="p-2 w-32">Missing</th>
                </tr>
              </thead>
              <tbody>
                {boxItems.map(item => renderItemRow(item, boxNumber))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render simple list without box grouping
  const renderSimpleList = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 w-10">&nbsp;</th>
              <th className="text-left p-2">Product</th>
              <th className="p-2 w-20 text-center">Qty</th>
              <th className="p-2 w-32">Batch #</th>
              {items.some(item => item.product.requiresWeightInput) && (
                <th className="p-2 w-32">Weight</th>
              )}
              <th className="p-2 w-32">Missing</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => renderItemRow(item))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {groupByBox ? (
        // Render box sections
        Object.entries(groupedItems).map(([boxNumberStr, boxItems]) => {
          const boxNumber = parseInt(boxNumberStr, 10);
          return renderBoxSection(boxNumber, boxItems);
        })
      ) : (
        // Render simple list
        renderSimpleList()
      )}
    </div>
  );
};

export default ItemsTable;
