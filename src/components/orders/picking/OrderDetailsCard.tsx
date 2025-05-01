
import React from "react";
import { Order, Picker } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface OrderDetailsCardProps {
  selectedOrder: Order;
  selectedPickerId: string;
  onPickerChange: (id: string) => void;
  pickers: Picker[];
}

const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({ 
  selectedOrder, 
  selectedPickerId, 
  onPickerChange, 
  pickers 
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Order Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1 - Customer Info */}
          <div className="space-y-2">
            <div>
              <Label>Customer</Label>
              <div className="font-medium">{selectedOrder.customer.name}</div>
            </div>
            
            <div>
              <Label>Order Date</Label>
              <div>{format(new Date(selectedOrder.order_date), "MMM d, yyyy")}</div>
            </div>
            
            <div>
              <Label>Delivery Method</Label>
              <div>{selectedOrder.delivery_method}</div>
            </div>
          </div>
          
          {/* Column 2 - Notes */}
          <div className="space-y-2">
            {selectedOrder.notes && (
              <div>
                <Label>Notes</Label>
                <div className="text-sm bg-gray-50 p-2 rounded border">
                  {selectedOrder.notes}
                </div>
              </div>
            )}
          </div>
          
          {/* Column 3 - Picker Selection */}
          <div className="space-y-2">
            <div className="bg-blue-50 p-3 rounded-md border-2 border-blue-200">
              <Label htmlFor="picker" className="text-lg font-bold text-blue-700 block mb-2">
                Picked By
              </Label>
              <Select 
                value={selectedPickerId} 
                onValueChange={onPickerChange}
              >
                <SelectTrigger id="picker" className="border-2 border-blue-300 bg-white">
                  <SelectValue placeholder="Select picker" />
                </SelectTrigger>
                <SelectContent>
                  {pickers.map(picker => (
                    <SelectItem key={picker.id} value={picker.id}>
                      {picker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDetailsCard;
