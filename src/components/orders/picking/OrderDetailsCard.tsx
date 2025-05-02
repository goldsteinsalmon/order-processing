
import React from "react";
import { Order, Picker } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isValid } from "date-fns";
import { getOrderDate, getDeliveryMethod } from "@/utils/propertyHelpers";

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
  // Format date safely - add validation to prevent invalid date errors
  const formatSafeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isValid(date) ? format(date, "MMMM d, yyyy") : "Invalid date";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };
  
  // Get order date using the helper function
  const orderDate = getOrderDate(selectedOrder);
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="space-y-6 col-span-2">
            <h2 className="text-2xl font-bold">Order Details</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500 block mb-1">Customer</Label>
                <div className="font-medium text-lg">{selectedOrder.customer.name}</div>
              </div>
              
              <div>
                <Label className="text-gray-500 block mb-1">Order Date</Label>
                <div className="font-medium">
                  {orderDate ? 
                    formatSafeDate(orderDate) : 
                    "No date specified"}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500 block mb-1">Delivery Method</Label>
                <div className="font-medium">{getDeliveryMethod(selectedOrder)}</div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Picker Selection */}
          <div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h3 className="text-xl font-bold text-blue-700 mb-4">Picked By</h3>
              <Select 
                value={selectedPickerId} 
                onValueChange={onPickerChange}
              >
                <SelectTrigger id="picker" className="w-full border border-gray-300 bg-white">
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
