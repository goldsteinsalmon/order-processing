
import React from 'react';
import { OrderItem } from '@/types';
import { Check, Printer, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  // Helper function to check if a box is complete enough to print
  // Removed batch number requirement - only check if all items are checked
  const isBoxComplete = (boxItems: ExtendedOrderItem[]): boolean => {
    // Check if all items are checked
    if (!boxItems.length || !boxItems.every(item => item.checked)) {
      return false;
    }
    
    // Check if all items that require weight have weights entered
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
    return (item.originalQuantity !== undefined) && 
           (item.originalQuantity !== null) &&
           (item.originalQuantity !== item.quantity);
  };

  // Render a box section
  const renderBoxSection = (boxNumber: number, boxItems: ExtendedOrderItem[]) => {
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Picked</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Batch Number</TableHead>
                {boxItems.some(item => item.product.requiresWeightInput) && (
                  <TableHead>Weight</TableHead>
                )}
                <TableHead>Missing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boxItems.map(item => (
                <TableRow 
                  key={item.id} 
                  className={hasQuantityChanged(item) ? 'bg-yellow-50' : ''}
                >
                  <TableCell>
                    <Checkbox 
                      checked={item.checked} 
                      onCheckedChange={checked => onCheckItem(item.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className={hasQuantityChanged(item) ? 'font-medium text-amber-700' : ''}>
                      {item.product.name}
                    </div>
                    {hasQuantityChanged(item) && (
                      <div className="text-xs text-amber-700">
                        Changed from {item.originalQuantity}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell>
                    <Input 
                      type="text"
                      value={item.batchNumber || ''}
                      onChange={e => onBatchNumberChange(item.id, e.target.value, boxNumber)}
                      className="w-full"
                      placeholder="Enter batch #"
                    />
                  </TableCell>
                  {boxItems.some(item => item.product.requiresWeightInput) && (
                    <TableCell>
                      {item.product.requiresWeightInput ? (
                        <div>
                          <Input
                            type="number"
                            value={(item.pickedWeight || '').toString()}
                            onChange={e => onWeightChange(item.id, parseFloat(e.target.value) || 0)}
                            className="w-full"
                            placeholder="Weight"
                          />
                          <span className="ml-1 text-xs text-gray-500">{item.product.unit || 'g'}</span>
                        </div>
                      ) : null}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={missingItems.find(mi => mi.id === item.id)?.quantity.toString() || '0'}
                        onChange={e => onMissingItemChange(item.id, parseInt(e.target.value, 10) || 0)}
                        className="w-16"
                        min={0}
                        max={item.quantity}
                      />
                      {missingItems.find(mi => mi.id === item.id && mi.quantity > 0) && (
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  // Render simple list without box grouping
  const renderSimpleList = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Items to Pick</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Picked</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Batch Number</TableHead>
                {items.some(item => item.product.requiresWeightInput) && (
                  <TableHead>Weight</TableHead>
                )}
                <TableHead>Missing</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow 
                  key={item.id}
                  className={hasQuantityChanged(item) ? 'bg-yellow-50' : ''}
                >
                  <TableCell>
                    <Checkbox 
                      checked={item.checked} 
                      onCheckedChange={checked => onCheckItem(item.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className={hasQuantityChanged(item) ? 'font-medium text-amber-700' : ''}>
                      {item.product.name}
                    </div>
                    {hasQuantityChanged(item) && (
                      <div className="text-xs text-amber-700">
                        Changed from {item.originalQuantity}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell>
                    <Input 
                      type="text"
                      value={item.batchNumber || ''}
                      onChange={e => onBatchNumberChange(item.id, e.target.value, 0)}
                      className="w-full"
                      placeholder="Enter batch #"
                    />
                  </TableCell>
                  {items.some(item => item.product.requiresWeightInput) && (
                    <TableCell>
                      {item.product.requiresWeightInput ? (
                        <div>
                          <Input
                            type="number"
                            value={(item.pickedWeight || '').toString()}
                            onChange={e => onWeightChange(item.id, parseFloat(e.target.value) || 0)}
                            className="w-full"
                            placeholder="Weight"
                          />
                          <span className="ml-1 text-xs text-gray-500">{item.product.unit || 'g'}</span>
                        </div>
                      ) : null}
                    </TableCell>
                  )}
                  <TableCell>
                    <Input
                      type="number"
                      value={missingItems.find(mi => mi.id === item.id)?.quantity.toString() || '0'}
                      onChange={e => onMissingItemChange(item.id, parseInt(e.target.value, 10) || 0)}
                      className="w-16"
                      min={0}
                      max={item.quantity}
                    />
                  </TableCell>
                  <TableCell>
                    {missingItems.find(mi => mi.id === item.id && mi.quantity > 0) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onResolveMissingItem(item.id)}
                        className="text-xs h-8"
                      >
                        <Check className="h-3 w-3 mr-1" /> Resolved
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
