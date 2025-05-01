
import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Edit, FilePlus, ClipboardList } from "lucide-react";
import { useData } from "@/context/DataContext";
import { isSameDayOrder, isNextWorkingDayOrder } from "@/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface OrdersListProps {
  searchTerm?: string;
}

const OrdersList: React.FC<OrdersListProps> = ({ searchTerm = "" }) => {
  const { orders } = useData();
  const navigate = useNavigate();
  
  // Filter orders by search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return orders.filter(order => 
      order.customer?.name?.toLowerCase().includes(lowerSearchTerm) ||
      order.id.toLowerCase().includes(lowerSearchTerm) ||
      order.deliveryMethod?.toLowerCase().includes(lowerSearchTerm) ||
      order.status?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [orders, searchTerm]);
  
  // Sort orders by date closest to now
  const sortedOrders = useMemo(() => {
    const now = new Date().getTime();
    return [...filteredOrders].sort((a, b) => {
      const dateA = a.orderDate ? new Date(a.orderDate).getTime() : now;
      const dateB = b.orderDate ? new Date(b.orderDate).getTime() : now;
      
      // If either date is invalid (NaN), put it at the end
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      
      // Calculate absolute difference from current date
      const diffA = Math.abs(now - dateA);
      const diffB = Math.abs(now - dateB);
      
      // Sort by closest date to now
      return diffA - diffB;
    });
  }, [filteredOrders]);

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

  // Function to determine the order status display
  const getOrderStatusDisplay = (order) => {
    // If the order has explicit status, use that
    if (order.status === "Modified") {
      return {
        label: "Modified",
        color: "bg-blue-100 text-blue-800"
      };
    }
    
    // Check for missing items
    if (order.missingItems && order.missingItems.length > 0) {
      return {
        label: "Missing Items",
        color: "bg-amber-100 text-amber-800"
      };
    }

    // Check for partially picked boxes
    if (order.boxDistributions && order.completedBoxes && 
        order.boxDistributions.length > 0 && 
        order.completedBoxes.length > 0 && 
        order.completedBoxes.length < order.boxDistributions.length) {
      return {
        label: "Partially Picked",
        color: "bg-purple-100 text-purple-800"
      };
    }

    // Check for picking in progress
    if (order.pickingInProgress) {
      return {
        label: "Picking In Progress",
        color: "bg-indigo-100 text-indigo-800"
      };
    }
    
    // Default to pending
    return {
      label: order.status || "Pending",
      color: "bg-blue-100 text-blue-800"
    };
  };

  // Handle navigation to picking list
  const handlePickingListClick = (orderId) => {
    // Ensure we navigate directly to the picking list with this order selected
    navigate(`/picking-list/${orderId}`);
  };
  
  // Determine if an order should be highlighted for changes
  const shouldHighlightChanges = (order) => {
    // Highlight orders with changes regardless of picking status
    if (order.hasChanges) {
      return true;
    }
    return false;
  };

  // Safe format date function
  const safeFormatDate = (dateString) => {
    try {
      if (!dateString) return "Invalid Date";
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return format(date, "dd/MM/yyyy");
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
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
                    {searchTerm ? "No matching orders found" : "No orders found"}
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  // Safely check dates - avoid errors for invalid dates
                  let isSameDay = false;
                  let isNextDay = false;
                  
                  try {
                    if (order.orderDate) {
                      isSameDay = isSameDayOrder(order.orderDate);
                      isNextDay = isNextWorkingDayOrder(order.orderDate);
                    }
                  } catch (e) {
                    console.error("Error checking order dates:", e);
                  }
                  
                  const changeDesc = getChangeDescription(order);
                  const statusDisplay = getOrderStatusDisplay(order);
                  const highlightChanges = shouldHighlightChanges(order);
                  
                  return (
                    <tr 
                      key={order.id}
                      className={`border-b ${
                        isSameDay ? "bg-red-50" : 
                        isNextDay ? "bg-green-50" : 
                        highlightChanges ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">{order.id.substring(0, 8)}</td>
                      <td className="px-4 py-3">{order.customer?.name || "Unknown Customer"}</td>
                      <td className="px-4 py-3">
                        {safeFormatDate(order.orderDate)}
                      </td>
                      <td className="px-4 py-3">{order.deliveryMethod || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.label}
                        </span>
                        
                        {order.status === "Modified" && order.picker && (
                          <div className="text-xs mt-1">
                            Picked by: {order.picker}
                          </div>
                        )}
                        
                        {statusDisplay.label === "Missing Items" && order.missingItems && (
                          <div className="text-xs mt-1">
                            {order.missingItems.length} item{order.missingItems.length > 1 ? 's' : ''} missing
                          </div>
                        )}
                        
                        {statusDisplay.label === "Partially Picked" && order.completedBoxes && (
                          <div className="text-xs mt-1">
                            {order.completedBoxes.length} of {order.boxDistributions.length} boxes picked
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
                              onClick={() => handlePickingListClick(order.id)}
                            >
                              <ClipboardList className="h-4 w-4 mr-1" />
                              Picking List
                            </Button>
                          </div>
                          
                          {/* Show change description for all modified orders */}
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
