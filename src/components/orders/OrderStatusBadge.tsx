
import React from "react";
import { Badge } from "@/components/ui/badge";

interface OrderStatusBadgeProps {
  status: string;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getStatusColor = (): string => {
    switch (status) {
      case "Completed":
        return "bg-green-500 hover:bg-green-600";
      case "Processing":
        return "bg-blue-500 hover:bg-blue-600";
      case "Pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Missing Items":
        return "bg-orange-500 hover:bg-orange-600";
      case "Cancelled":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <Badge className={`${getStatusColor()} text-white`}>
      {status || "Unknown"}
    </Badge>
  );
};

export default OrderStatusBadge;
