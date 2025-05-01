
import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Eye, Edit, Printer, ArrowUp, ArrowDown } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { adaptCustomerToCamelCase } from "@/utils/typeAdapters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CompletedOrdersProps {
  searchTerm?: string;
  batchFilter?: string;
}

// Define sort directions and sortable fields
type SortDirection = "asc" | "desc";
type SortableField = "id" | "customer" | "orderDate" | "completedDate" | "batchNumbers" | "picker" | "blownPouches" | "invoiceStatus";

const CompletedOrders: React.FC<CompletedOrdersProps> = ({ 
  searchTerm = "", 
  batchFilter = "" 
}) => {
  const { completedOrders, products } = useData();
  const navigate = useNavigate();
  const [filteredOrders, setFilteredOrders] = useState(completedOrders);
  const [searchParams] = useSearchParams();
  const batchFilterParam = searchParams.get('batch') || batchFilter;
  const { currentUser } = useAuth(); // Get current user to check role
  const isRegularUser = currentUser?.role === "User";
  
  // Add sorting state
  const [sortField, setSortField] = useState<SortableField>("completedDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Handle sorting logic
  const handleSort = (field: SortableField) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Default to descending when changing sort field
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Render sort icon
  const renderSortIcon = (field: SortableField) => {
    if (sortField !== field) {
      return <span className="ml-1 opacity-0 group-hover:opacity-50"><ArrowUp className="h-3 w-3" /></span>;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-1 h-3 w-3" /> : 
      <ArrowDown className="ml-1 h-3 w-3" />;
  };
  
  useEffect(() => {
    // Process customers to ensure camelCase properties
    const processedOrders = completedOrders.map(order => ({
      ...order,
      customer: order.customer ? adaptCustomerToCamelCase(order.customer) : order.customer
    }));
    
    if (batchFilterParam) {
      // Filter orders by batch number
      const ordersWithBatch = processedOrders.filter(order => {
        // Check if order has batch numbers array
        if (order.batchNumbers && order.batchNumbers.includes(batchFilterParam)) {
          return true;
        }
        
        // Check if order has a single batch number
        if (order.batchNumber === batchFilterParam) {
          return true;
        }
        
        // Check if any item in the order uses this batch number
        if (order.items && order.items.some(item => item.batchNumber === batchFilterParam)) {
          return true;
        }
        
        // Check if any item in pickingProgress uses this batch number
        if (order.pickingProgress?.batchNumbers) {
          return Object.values(order.pickingProgress.batchNumbers).includes(batchFilterParam);
        }

        // Check if any box or box item uses this batch number
        if (order.boxDistributions) {
          return order.boxDistributions.some(box => 
            box.batchNumber === batchFilterParam || 
            box.items.some(item => item.batchNumber === batchFilterParam)
          );
        }
        
        return false;
      });
      
      setFilteredOrders(ordersWithBatch);
    } else if (searchTerm) {
      // Filter by search term
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = processedOrders.filter(order => {
        // Search in customer name
        if (order.customer.name.toLowerCase().includes(searchTermLower)) {
          return true;
        }
        
        // Search in order ID
        if (order.id.toLowerCase().includes(searchTermLower)) {
          return true;
        }
        
        // Search in customer order number
        if (order.customerOrderNumber?.toLowerCase().includes(searchTermLower)) {
          return true;
        }
        
        // Search in picker name
        if (order.picker?.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        // Search in batch numbers
        if (order.batchNumber?.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        if (order.batchNumbers?.some(batch => 
          batch.toLowerCase().includes(searchTermLower))
        ) {
          return true;
        }
        
        return false;
      });
      
      setFilteredOrders(filtered);
    } else {
      // No filter, show all orders
      setFilteredOrders(processedOrders);
    }
  }, [completedOrders, batchFilterParam, searchTerm]);
  
  // Sort orders based on current sort field and direction
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const sortMultiplier = sortDirection === "asc" ? 1 : -1;
    
    switch (sortField) {
      case "id":
        return sortMultiplier * a.id.localeCompare(b.id);
      
      case "customer":
        return sortMultiplier * a.customer.name.localeCompare(b.customer.name);
      
      case "orderDate":
        const dateA = new Date(a.orderDate).getTime();
        const dateB = new Date(b.orderDate).getTime();
        return sortMultiplier * (dateA - dateB);
        
      case "completedDate":
        // Use updated timestamp if available (which indicates when the order was completed)
        const completedA = a.updated ? new Date(a.updated).getTime() : new Date(a.orderDate).getTime();
        const completedB = b.updated ? new Date(b.updated).getTime() : new Date(b.orderDate).getTime();
        return sortMultiplier * (completedA - completedB);
        
      case "batchNumbers":
        const batchA = getBatchNumbers(a) || "";
        const batchB = getBatchNumbers(b) || "";
        return sortMultiplier * batchA.localeCompare(batchB);
        
      case "picker":
        const pickerA = getPickerName(a) || "";
        const pickerB = getPickerName(b) || "";
        return sortMultiplier * pickerA.localeCompare(pickerB);
        
      case "blownPouches":
        const blownA = a.totalBlownPouches || 0;
        const blownB = b.totalBlownPouches || 0;
        return sortMultiplier * (blownA - blownB);
      
      case "invoiceStatus":
        // Sort by invoice status (invoiced first) and then by invoice date
        if (a.invoiced === b.invoiced) {
          // If both are invoiced or both are not invoiced, sort by invoice date
          const invoiceDateA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
          const invoiceDateB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
          return sortMultiplier * (invoiceDateA - invoiceDateB);
        }
        // Otherwise, sort by invoiced status (true comes first)
        return sortMultiplier * (a.invoiced ? -1 : 1);
        
      default:
        return 0;
    }
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

  // Helper function to get batch numbers as a string
  const getBatchNumbers = (order) => {
    if (order.batchNumbers && order.batchNumbers.length > 0) {
      return order.batchNumbers.join(", ");
    }
    
    if (order.batchNumber) {
      return order.batchNumber;
    }
    
    // Check boxes for batch numbers
    if (order.boxDistributions) {
      const batchSet = new Set<string>();
      order.boxDistributions.forEach(box => {
        if (box.batchNumber) {
          batchSet.add(box.batchNumber);
        }
        
        box.items.forEach(item => {
          if (item.batchNumber) {
            batchSet.add(item.batchNumber);
          }
        });
      });
      
      if (batchSet.size > 0) {
        return Array.from(batchSet).join(", ");
      }
    }
    
    return "N/A";
  };

  // Get the picker name from either picker field or pickedBy field
  const getPickerName = (order) => {
    if (order.picker) {
      return order.picker;
    } else if (order.pickedBy) {
      // This is a fallback in case picker name isn't saved but ID is
      return order.pickedBy;
    }
    return "N/A";
  };

  // Format the completed date/time with both date and time
  const formatCompletedDate = (order) => {
    if (order.updated) {
      const date = parseISO(order.updated);
      return format(date, "dd/MM/yyyy HH:mm");
    }
    return "N/A";
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {batchFilterParam 
          ? `Completed Orders with Batch #${batchFilterParam}`
          : "Completed Orders"
        }
      </h2>

      {batchFilterParam && (
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={() => navigate("/completed-orders")}
        >
          Clear Batch Filter
        </Button>
      )}

      <div className="text-sm text-gray-500 mb-4">
        {sortField === "completedDate" && sortDirection === "desc" 
          ? "Sorted by completion date (newest first)" 
          : `Sorted by ${sortField} (${sortDirection === "asc" ? "ascending" : "descending"})`}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer group"
                onClick={() => handleSort("id")}
              >
                Order ID {renderSortIcon("id")}
              </TableHead>
              <TableHead 
                className="cursor-pointer group"
                onClick={() => handleSort("customer")}
              >
                Customer {renderSortIcon("customer")}
              </TableHead>
              <TableHead 
                className="cursor-pointer group"
                onClick={() => handleSort("orderDate")}
              >
                Order Date {renderSortIcon("orderDate")}
              </TableHead>
              <TableHead 
                className="cursor-pointer group"
                onClick={() => handleSort("completedDate")}
              >
                Completed On {renderSortIcon("completedDate")}
              </TableHead>
              <TableHead 
                className="cursor-pointer group"
                onClick={() => handleSort("batchNumbers")}
              >
                Batch Numbers {renderSortIcon("batchNumbers")}
              </TableHead>
              <TableHead 
                className="cursor-pointer group"
                onClick={() => handleSort("picker")}
              >
                Picker {renderSortIcon("picker")}
              </TableHead>
              <TableHead 
                className="cursor-pointer group"
                onClick={() => handleSort("blownPouches")}
              >
                Blown Pouches {renderSortIcon("blownPouches")}
              </TableHead>
              <TableHead 
                className="cursor-pointer group"
                onClick={() => handleSort("invoiceStatus")}
              >
                Invoice Status {renderSortIcon("invoiceStatus")}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500">
                  No completed orders found
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => {
                const changeDesc = getChangeDescription(order);
                const batchNumbers = getBatchNumbers(order);
                
                return (
                  <TableRow 
                    key={order.id} 
                    className={order.hasChanges ? "bg-red-50" : ""}
                  >
                    <TableCell>{order.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      <div>
                        {order.customer.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(order.orderDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{formatCompletedDate(order)}</TableCell>
                    <TableCell>{batchNumbers}</TableCell>
                    <TableCell>{getPickerName(order)}</TableCell>
                    <TableCell>{order.totalBlownPouches || 0}</TableCell>
                    <TableCell>
                      {order.invoiced ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Invoiced
                          </span>
                          {order.invoiceDate && (
                            <span className="text-xs text-muted-foreground mt-1">
                              {format(parseISO(order.invoiceDate), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Not Invoiced
                        </span>
                      )}
                    </TableCell>
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
                          {/* Hide Edit button for regular users */}
                          {!isRegularUser && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/edit-completed-order/${order.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
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
