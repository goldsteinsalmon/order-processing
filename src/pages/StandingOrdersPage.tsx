
import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Eye, FilePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";

const StandingOrdersPage: React.FC = () => {
  const { standingOrders } = useData();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Standing Orders</h2>
        <Button onClick={() => navigate("/create-standing-order")}>
          <FilePlus className="mr-2 h-4 w-4" /> Create Standing Order
        </Button>
      </div>
      
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Frequency</th>
                <th className="px-4 py-3 text-left font-medium">Delivery Method</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {standingOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No standing orders found
                  </td>
                </tr>
              ) : (
                standingOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="px-4 py-3">{order.id.substring(0, 8)}</td>
                    <td className="px-4 py-3">{order.customer.name}</td>
                    <td className="px-4 py-3">{order.schedule.frequency}</td>
                    <td className="px-4 py-3">{order.schedule.deliveryMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {order.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {format(parseISO(order.created), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(`/standing-order-details/${order.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default StandingOrdersPage;
