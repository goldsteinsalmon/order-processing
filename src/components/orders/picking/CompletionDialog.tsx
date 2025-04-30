
import React from "react";
import { OrderItem } from "@/types";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExtendedOrderItem extends OrderItem {
  checked: boolean;
  batchNumber: string;
}

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingItems: { id: string; quantity: number }[];
  allItems: ExtendedOrderItem[];
  onConfirm: () => void;
}

const CompletionDialog: React.FC<CompletionDialogProps> = ({ 
  open, 
  onOpenChange, 
  missingItems, 
  allItems, 
  onConfirm 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this order as complete?
            {missingItems.length > 0 && (
              <div className="mt-2 text-red-500">
                Warning: This order has missing items.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {missingItems.length > 0 && (
          <div className="my-4">
            <h4 className="font-medium mb-2">Missing Items:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {missingItems.map(mi => {
                const item = allItems.find(i => i.id === mi.id);
                return item ? (
                  <li key={mi.id}>
                    {item.product.name}: {mi.quantity} of {item.quantity}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Complete Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionDialog;
