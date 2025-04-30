
import React from "react";
import { format, parseISO } from "date-fns";
import { Eye, Printer } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CompletedOrders: React.FC = () => {
  const { completedOrders } = useData();
  const navigate = useNavigate();
  
  // Sort completed orders by date (newest first)
  const sortedOrders = [...completedOrders].sort((a, b) => {
    return new Date(b.updated || b.orderDate).getTime() - new Date(a.updated || a.orderDate).getTime();
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Completed Orders</h2>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Order Date</th>
                <th className="px-4 py-3 text-left font-medium">Picker</th>
                <th className="px-4 py-3 text-left font-medium">Batch Number</th>
                <th className="px-4 py-3 text-left font-medium">Blown Pouches</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No completed orders found
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="px-4 py-3">{order.id.substring(0, 8)}</td>
                    <td className="px-4 py-3">{order.customer.name}</td>
                    <td className="px-4 py-3">
                      {format(parseISO(order.orderDate), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-3">{order.picker || "N/A"}</td>
                    <td className="px-4 py-3">{order.batchNumber || "N/A"}</td>
                    <td className="px-4 py-3">{order.totalBlownPouches || 0}</td>
                    <td className="px-4 py-3 flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(`/order-details/${order.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(`/print-box-label/${order.id}`)}
                      >
                        <Printer className="h-4 w-4" />
                        <span className="sr-only">Print Label</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompletedOrders;
