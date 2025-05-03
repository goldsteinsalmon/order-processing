
import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Trash2, Edit, ClipboardList, Calendar, Printer } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, isToday, isYesterday, parseISO, isThisWeek, isThisMonth } from "date-fns";
import { useData } from "@/context/DataContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatOrderDate } from "@/utils/dateUtils";
import EditableCell from "@/components/ui/editable-cell";
import { type Customer } from "@/types";
import OrderStatusBadge from "./OrderStatusBadge";

interface OrdersListProps {
  searchTerm: string;
}

const OrdersList: React.FC<OrdersListProps> = ({ searchTerm }) => {
  const { orders, deleteOrder, updateOrder } = useData();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search in customer name
      const customerNameMatch = order.customer?.name?.toLowerCase().includes(searchLower);
      
      // Search in order ID or number
      const orderIdMatch = order.id?.toLowerCase().includes(searchLower);
      const orderNumberMatch = order.orderNumber ? String(order.orderNumber)?.toLowerCase().includes(searchLower) : false;
      
      // Search in customer order number
      const customerOrderMatch = order.customerOrderNumber?.toLowerCase().includes(searchLower);
      
      // Search in status
      const statusMatch = order.status?.toLowerCase().includes(searchLower);
      
      // Return true if any of the fields match
      return customerNameMatch || orderIdMatch || orderNumberMatch || customerOrderMatch || statusMatch;
    });
  }, [orders, searchTerm]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (isThisWeek(date)) {
      return format(date, "EEEE"); // Day name
    } else if (isThisMonth(date)) {
      return format(date, "d MMM"); // Day + Month abbreviated
    } else {
      return format(date, "d MMM yyyy"); // Full date for older dates
    }
  };

  // Handle order deletion
  const handleDeleteClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowDeleteDialog(true);
  };

  // Confirm order deletion
  const confirmDelete = async () => {
    if (selectedOrderId) {
      await deleteOrder(selectedOrderId);
      setShowDeleteDialog(false);
      setSelectedOrderId(null);
    }
  };

  // Navigate to order details
  const handleRowClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  // Handle order status update
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const updatedOrder = { ...targetOrder, status: newStatus as any };
    await updateOrder(updatedOrder);
  };

  return (
    <>
      <Card className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Required Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell onClick={() => handleRowClick(order.id)}>
                    {order.id.substring(0, 8)}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(order.id)}>
                    {order.customer?.name || "Unknown Customer"}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(order.id)}>
                    {formatDate(order.orderDate)}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(order.id)}>
                    {formatDate(order.requiredDate)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="cursor-pointer">
                          <OrderStatusBadge status={order.status} />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Pending")}>
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Processing")}>
                          Processing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Completed")}>
                          Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Missing Items")}>
                          Missing Items
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Cancelled")}>
                          Cancelled
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}/edit`)
                        }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}/picking`)
                        }}
                        title="Picking List"
                      >
                        <ClipboardList size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(order.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrdersList;
