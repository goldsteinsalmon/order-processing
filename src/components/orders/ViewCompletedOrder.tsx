
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ViewCompletedOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completedOrders } = useData();

  const order = completedOrders.find(order => order.id === id);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button variant="outline" onClick={() => navigate("/completed-orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Completed Orders
        </Button>
      </div>
    );
  }

  // Calculate order totals
  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
  
  // Get batch numbers map from picking progress
  const batchNumbersMap = order.pickingProgress?.batchNumbers || {};
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/completed-orders")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Completed Order Details</h2>
        </div>
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
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order Date:</dt>
                <dd className="col-span-2">{format(parseISO(order.orderDate), "MMMM d, yyyy")}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Completion Date:</dt>
                <dd className="col-span-2">
                  {order.updated ? format(parseISO(order.updated), "MMMM d, yyyy") : "N/A"}
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Status:</dt>
                <dd className="col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {order.status}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Delivery Method:</dt>
                <dd className="col-span-2">{order.deliveryMethod}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Picker:</dt>
                <dd className="col-span-2">{order.picker || "N/A"}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Batch Number(s):</dt>
                <dd className="col-span-2">
                  {order.batchNumbers ? order.batchNumbers.join(", ") : (order.batchNumber || "N/A")}
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Blown Pouches:</dt>
                <dd className="col-span-2">{order.totalBlownPouches || 0}</dd>
              </div>
              {order.customerOrderNumber && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Customer Order #:</dt>
                  <dd className="col-span-2">{order.customerOrderNumber}</dd>
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
                  <th className="text-right font-medium py-2">Batch Number</th>
                  <th className="text-right font-medium py-2">Blown Pouches</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.product.name}</td>
                    <td className="py-3">{item.product.sku}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">
                      {batchNumbersMap[item.id] || (order.batchNumber || "N/A")}
                    </td>
                    <td className="py-3 text-right">
                      {item.blownPouches || 
                       (order.pickingProgress?.blownPouches?.[item.id] || 0)}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td colSpan={2} className="py-3">Total Items</td>
                  <td className="py-3 text-right">{totalItems}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {order.changes && order.changes.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium py-2">Product</th>
                    <th className="text-right font-medium py-2">Original Quantity</th>
                    <th className="text-right font-medium py-2">Updated Quantity</th>
                    <th className="text-left font-medium py-2">Date Changed</th>
                  </tr>
                </thead>
                <tbody>
                  {order.changes.map((change, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">{change.productName}</td>
                      <td className="py-3 text-right">{change.originalQuantity}</td>
                      <td className="py-3 text-right">{change.newQuantity}</td>
                      <td className="py-3">
                        {change.date ? format(parseISO(change.date), "dd/MM/yyyy HH:mm") : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewCompletedOrder;
