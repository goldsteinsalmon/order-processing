
import React from "react";
import { format, parseISO } from "date-fns";
import { Edit, FilePlus, ClipboardList } from "lucide-react";
import { useData } from "@/context/DataContext";
import { isSameDayOrder, isNextWorkingDayOrder } from "@/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const OrdersList: React.FC = () => {
  const { orders } = useData();
  const navigate = useNavigate();
  
  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => {
    return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
  });

  // Helper function to generate change description
  const getChangeDescription = (order) => {
    if (!order.changes || order.changes.length === 0) return null;
    
    // Get the list of changed products
    const changedProducts = order.changes.map(change => {
      if (change.originalQuantity === 0) {
        return `Added ${change.newQuantity} ${change.productName}`;
      } else if (change.newQuantity === 0) {
        return `Removed ${change.productName}`;
      } else {
        return `Changed ${change.productName} from ${change.originalQuantity} to ${change.newQuantity}`;
      }
    });
    
    return changedProducts.join("; ");
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Orders</h2>
        <Button onClick={() => navigate("/create-order")}>
          <FilePlus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Order Date</th>
                <th className="px-4 py-3 text-left font-medium">Delivery Method</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  const isSameDay = isSameDayOrder(order.orderDate);
                  const isNextDay = isNextWorkingDayOrder(order.orderDate);
                  const changeDesc = getChangeDescription(order);
                  
                  return (
                    <tr 
                      key={order.id}
                      className={`border-b ${
                        isSameDay ? "bg-red-50" : isNextDay ? "bg-green-50" : order.hasChanges ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">{order.id.substring(0, 8)}</td>
                      <td className="px-4 py-3">{order.customer.name}</td>
                      <td className="px-4 py-3">
                        {format(parseISO(order.orderDate), "dd/MM/yyyy")}
                      </td>
                      <td className="px-4 py-3">{order.deliveryMethod}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                        
                        {order.status === "Modified" && order.picker && (
                          <div className="text-xs mt-1">
                            Picked by: {order.picker}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/order-details/${order.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              View Order
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/picking-list/${order.id}`)}
                            >
                              <ClipboardList className="h-4 w-4 mr-1" />
                              Picking List
                            </Button>
                          </div>
                          
                          {changeDesc && (
                            <div className="text-red-600 text-xs font-medium">
                              Changes: {changeDesc}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
