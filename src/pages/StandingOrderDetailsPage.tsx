import React from "react";
import Layout from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StandingOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { standingOrders } = useData();
  
  const order = standingOrders.find(order => order.id === id);
  
  if (!order) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Standing order not found</h2>
          <Button variant="outline" onClick={() => navigate("/standing-orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Standing Orders
          </Button>
        </div>
      </Layout>
    );
  }
  
  // Get day of week name
  const getDayOfWeekName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };
  
  // Calculate next delivery date based on schedule
  const getScheduleDescription = () => {
    if (order.schedule.frequency === "Weekly") {
      return `Every ${getDayOfWeekName(order.schedule.dayOfWeek || 0)}`;
    } else if (order.schedule.frequency === "Bi-Weekly") {
      return `Every other ${getDayOfWeekName(order.schedule.dayOfWeek || 0)}`;
    } else if (order.schedule.frequency === "Monthly") {
      return `Day ${order.schedule.dayOfMonth || 1} of each month`;
    }
    return "Schedule not specified";
  };

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/standing-orders")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Standing Order Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order ID:</dt>
                <dd className="col-span-2">{order.id}</dd>
              </div>
              {order.created && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Created:</dt>
                  <dd className="col-span-2">{format(parseISO(order.created), "MMMM d, yyyy")}</dd>
                </div>
              )}
              <div className="grid grid-cols-3">
                <dt className="font-medium">Status:</dt>
                <dd className="col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {order.active ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Frequency:</dt>
                <dd className="col-span-2">{order.schedule.frequency}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Schedule:</dt>
                <dd className="col-span-2">{getScheduleDescription()}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Delivery Method:</dt>
                <dd className="col-span-2">{order.schedule.deliveryMethod}</dd>
              </div>
              {order.customer_order_number && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Customer Order #:</dt>
                  <dd className="col-span-2">{order.customer_order_number}</dd>
                </div>
              )}
              {order.notes && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Notes:</dt>
                  <dd className="col-span-2">{order.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-3">
                <dt className="font-medium">Name:</dt>
                <dd className="col-span-2">{order.customer.name}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Type:</dt>
                <dd className="col-span-2">{order.customer.type}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Email:</dt>
                <dd className="col-span-2">{order.customer.email}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Phone:</dt>
                <dd className="col-span-2">{order.customer.phone}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Address:</dt>
                <dd className="col-span-2">{order.customer.address}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-2">Product</th>
                  <th className="text-left font-medium py-2">SKU</th>
                  <th className="text-right font-medium py-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.product.name}</td>
                    <td className="py-3">{item.product.sku}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td colSpan={2} className="py-3">Total Items</td>
                  <td className="py-3 text-right">
                    {order.items.reduce((total, item) => total + item.quantity, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/standing-order-schedule/${order.id}`)}
        >
          View Schedule
        </Button>
        <Button 
          onClick={() => navigate(`/edit-standing-order/${order.id}`)}
        >
          Edit Order
        </Button>
      </div>
    </Layout>
  );
};

export default StandingOrderDetailsPage;
