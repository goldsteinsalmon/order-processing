
import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Eye, Edit, Printer } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CompletedOrders: React.FC = () => {
  const { completedOrders } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchFilter = searchParams.get('batch');
  const [filteredOrders, setFilteredOrders] = useState(completedOrders);
  
  useEffect(() => {
    if (batchFilter) {
      // Filter orders by batch number
      const ordersWithBatch = completedOrders.filter(order => {
        // Check if order has batch numbers array
        if (order.batchNumbers && order.batchNumbers.includes(batchFilter)) {
          return true;
        }
        
        // Check if order has a single batch number
        if (order.batchNumber === batchFilter) {
          return true;
        }
        
        // Check if any item in the order uses this batch number
        if (order.items && order.items.some(item => item.batchNumber === batchFilter)) {
          return true;
        }
        
        // Check if any item in pickingProgress uses this batch number
        if (order.pickingProgress?.batchNumbers) {
          return Object.values(order.pickingProgress.batchNumbers).includes(batchFilter);
        }
        
        return false;
      });
      
      setFilteredOrders(ordersWithBatch);
    } else {
      // No filter, show all orders
      setFilteredOrders(completedOrders);
    }
  }, [completedOrders, batchFilter]);
  
  // Sort completed orders by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    return new Date(b.updated || b.orderDate).getTime() - new Date(a.updated || a.orderDate).getTime();
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
      <h2 className="text-2xl font-bold mb-6">
        {batchFilter 
          ? `Completed Orders with Batch #${batchFilter}`
          : "Completed Orders"
        }
      </h2>

      {batchFilter && (
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={() => navigate("/completed-orders")}
        >
          Clear Batch Filter
        </Button>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Picker</TableHead>
              <TableHead>Blown Pouches</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No completed orders found
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => {
                const changeDesc = getChangeDescription(order);
                
                return (
                  <TableRow 
                    key={order.id} 
                    className={order.hasChanges ? "bg-red-50" : ""}
                  >
                    <TableCell>{order.id.substring(0, 8)}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>
                      {format(parseISO(order.orderDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{order.picker || "N/A"}</TableCell>
                    <TableCell>{order.totalBlownPouches || 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/view-completed-order/${order.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/edit-completed-order/${order.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/print-box-label/${order.id}`)}
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </div>
                        
                        {changeDesc && (
                          <div className="text-red-600 text-xs font-medium">
                            Changes: {changeDesc}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CompletedOrders;
