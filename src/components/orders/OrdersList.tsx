
import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Trash2, Edit, ClipboardList, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useData } from "@/context/DataContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
      
      // Search in order ID
      const orderIdMatch = order.id?.toLowerCase().includes(searchLower);
      
      // Search in customer order number
      const customerOrderMatch = order.customerOrderNumber?.toLowerCase().includes(searchLower);
      
      // Search in status
      const statusMatch = order.status?.toLowerCase().includes(searchLower);
      
      // Return true if any of the fields match
      return customerNameMatch || orderIdMatch || customerOrderMatch || statusMatch;
    });
  }, [orders, searchTerm]);

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
                <TableHead>Customer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    {order.customer?.name || "Unknown Customer"}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(order.orderDate), "dd/MM/yyyy")}
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
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Order
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}/picking`)}
                        className="flex items-center"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Picking List
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/orders/${order.id}/edit`)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(order.id)}
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
