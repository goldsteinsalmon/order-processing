
import React, { useMemo, useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Edit, ClipboardList } from "lucide-react";
import { useData } from "@/context/DataContext";
import { isSameDayOrder, isNextWorkingDayOrder } from "@/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { adaptCustomerToCamelCase } from "@/utils/typeAdapters";
import { getOrderDate, getHasChanges, getMissingItems, getCompletedBoxes, getBoxDistributions, getPickingInProgress } from "@/utils/propertyHelpers";

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
      const dateA = getOrderDate(a) ? new Date(getOrderDate(a)).getTime() : now;
      const dateB = getOrderDate(b) ? new Date(getOrderDate(b)).getTime() : now;
      
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

  // State for tracking which orders are next day orders
  const [nextDayOrders, setNextDayOrders] = useState<Set<string>>(new Set());
  const [sameDayOrders, setSameDayOrders] = useState<Set<string>>(new Set());

  // Check for same day and next day orders asynchronously
  useEffect(() => {
    const checkOrderDates = async () => {
      const nextDayOrderIds = new Set<string>();
      const sameDayOrderIds = new Set<string>();

      for (const order of sortedOrders) {
        try {
          const orderDateStr = getOrderDate(order);
          if (orderDateStr) {
            if (isSameDayOrder(orderDateStr)) {
              sameDayOrderIds.add(order.id);
            }
            
            // Check asynchronously for next working day orders
            const isNextDay = await isNextWorkingDayOrder(orderDateStr);
            if (isNextDay) {
              nextDayOrderIds.add(order.id);
            }
          }
        } catch (e) {
          console.error("Error checking order dates:", e);
        }
      }

      setNextDayOrders(nextDayOrderIds);
      setSameDayOrders(sameDayOrderIds);
    };

    checkOrderDates();
  }, [sortedOrders]);

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
    const missingItemsList = getMissingItems(order);
    if (missingItemsList && missingItemsList.length > 0) {
      return {
        label: "Missing Items",
        color: "bg-amber-100 text-amber-800"
      };
    }

    // Check for partially picked boxes
    const boxDistributions = getBoxDistributions(order);
    const completedBoxes = getCompletedBoxes(order);
    if (boxDistributions && completedBoxes && 
        boxDistributions.length > 0 && 
        completedBoxes.length > 0 && 
        completedBoxes.length < boxDistributions.length) {
      return {
        label: "Partially Picked",
        color: "bg-purple-100 text-purple-800"
      };
    }

    // Check for picking in progress
    if (getPickingInProgress(order)) {
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
    if (getHasChanges(order)) {
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
      <h2 className="text-2xl font-bold mb-6">Orders</h2>

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
                  // Adapt customer to ensure camelCase properties are available
                  if (order.customer) {
                    order.customer = adaptCustomerToCamelCase(order.customer);
                  }
                  
                  // Use the precomputed checks from state
                  const isSameDay = sameDayOrders.has(order.id);
                  const isNextDay = nextDayOrders.has(order.id);
                  
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
                        {safeFormatDate(getOrderDate(order))}
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
                        
                        {statusDisplay.label === "Missing Items" && getMissingItems(order) && (
                          <div className="text-xs mt-1">
                            {getMissingItems(order).length} item{getMissingItems(order).length > 1 ? 's' : ''} missing
                          </div>
                        )}
                        
                        {statusDisplay.label === "Partially Picked" && getCompletedBoxes(order) && (
                          <div className="text-xs mt-1">
                            {getCompletedBoxes(order).length} of {getBoxDistributions(order).length} boxes picked
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/orders/${order.id}`)}
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
