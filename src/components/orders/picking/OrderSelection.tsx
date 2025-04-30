
import React from "react";
import { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface OrderSelectionProps {
  pendingOrders: Order[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
}

const OrderSelection: React.FC<OrderSelectionProps> = ({ 
  pendingOrders, 
  selectedOrderId,
  onSelectOrder 
}) => {
  // Helper function to get status display
  const getStatusDisplay = (order: Order) => {
    if (order.status === "Modified") {
      return <span className="text-blue-600">Modified</span>;
    }
    
    if (order.missingItems && order.missingItems.length > 0) {
      return <span className="text-amber-600">Missing Items</span>;
    }
    
    if (order.boxDistributions && order.completedBoxes && 
        order.completedBoxes.length > 0 && 
        order.completedBoxes.length < order.boxDistributions.length) {
      return <span className="text-purple-600">Partially Picked</span>;
    }
    
    if (order.pickingInProgress) {
      return <span className="text-indigo-600">Picking In Progress</span>;
    }
    
    return <span className="text-gray-600">Pending</span>;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Order to Pick</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingOrders.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No pending orders to pick
            </div>
          ) : (
            pendingOrders.map(order => (
              <Card 
                key={order.id} 
                className={`cursor-pointer transition-all ${
                  selectedOrderId === order.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectOrder(order.id)}
              >
                <CardContent className="p-4">
                  <div className="font-medium">{order.customer.name}</div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(order.orderDate), "MMMM d, yyyy")}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm">
                      {order.items.length} items
                    </div>
                    <div>
                      {getStatusDisplay(order)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSelection;
