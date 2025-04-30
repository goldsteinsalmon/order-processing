
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Calendar, FilePlus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";

const StandingOrdersPage: React.FC = () => {
  const { standingOrders } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter standing orders based on search term
  const filteredStandingOrders = standingOrders.filter(order => 
    order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.schedule.frequency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.schedule.deliveryMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Standing Orders</h2>
        <Button onClick={() => navigate("/create-standing-order")}>
          <FilePlus className="mr-2 h-4 w-4" /> Create Standing Order
        </Button>
      </div>
      
      {/* Search input */}
      <div className="mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search standing orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
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
              {filteredStandingOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No standing orders found
                  </td>
                </tr>
              ) : (
                filteredStandingOrders.map((order) => (
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
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/standing-order-details/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/edit-standing-order/${order.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/standing-order-schedule/${order.id}`)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
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
