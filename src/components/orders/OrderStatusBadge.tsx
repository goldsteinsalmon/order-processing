
import React from 'react';
import { Badge } from "@/components/ui/badge";

// Updated to include all status types from the Order interface
type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Missing Items' | 'Cancelled' | 'Picking' | 'Modified' | 'Partially Picked';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getStatusVariant = () => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Picking':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Missing Items':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Modified':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'Partially Picked':
        return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Badge className={`font-medium ${getStatusVariant()}`} variant="outline">
      {status}
    </Badge>
  );
};

export default OrderStatusBadge;
