
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
                  <div className="text-sm mt-2">
                    {order.items.length} items
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
