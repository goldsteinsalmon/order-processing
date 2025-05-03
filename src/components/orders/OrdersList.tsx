
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useData } from "@/context/DataContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to safely format dates
const safeFormatDate = (dateString?: string | null) => {
  if (!dateString) return "Not specified";
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid date";
  }
};

const OrdersList: React.FC = () => {
  const navigate = useNavigate();
  const { orders, customers } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  // Filter orders based on search term, status, and customer
  const filteredOrders = useMemo(() => {
    return orders
      .filter(
        (order) =>
          order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customerOrderNumber?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          )
      )
      .filter((order) =>
        statusFilter === "all" ? true : order.status === statusFilter
      )
      .filter((order) =>
        customerFilter === "all" ? true : order.customer.id === customerFilter
      );
  }, [orders, searchTerm, statusFilter, customerFilter]);

  // Get unique customer list for the filter dropdown
  const uniqueCustomers = useMemo(() => {
    const customersMap = new Map();
    orders.forEach((order) => {
      if (order.customer && !customersMap.has(order.customer.id)) {
        customersMap.set(order.customer.id, order.customer);
      }
    });
    return Array.from(customersMap.values());
  }, [orders]);

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    navigate(`/orders/${orderId}/edit`);
  };

  const handleViewPickingList = (orderId: string) => {
    navigate(`/orders/${orderId}/picking`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Orders</CardTitle>
            <Button onClick={() => navigate("/create-order")}>New Order</Button>
          </div>
          <CardDescription>
            View and manage customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by customer or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64">
              <Select
                value={customerFilter}
                onValueChange={(value) => setCustomerFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Method</TableHead>
                  <TableHead>Customer Order #</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.customer?.name || "Unknown Customer"}
                      </TableCell>
                      <TableCell>
                        {safeFormatDate(order.orderDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadgeColor(order.status)}
                          variant="outline"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.deliveryMethod}</TableCell>
                      <TableCell>
                        {order.customerOrderNumber || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOrder(order.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPickingList(order.id)}
                          >
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Picking List
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersList;
