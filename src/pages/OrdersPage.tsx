
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import OrdersList from "@/components/orders/OrdersList";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DebugLoader } from "@/components/ui/debug-loader";

const OrdersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { orders, isLoading, refreshData } = useData();
  const navigate = useNavigate();
  
  // Add useEffect to refresh data when the component mounts
  useEffect(() => {
    console.log("OrdersPage: Refreshing data on mount");
    refreshData();
  }, [refreshData]);
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => navigate("/create-order")} className="ml-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>
      
      <DebugLoader isLoading={isLoading} context="Orders Page" />
      
      {!isLoading && orders.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center p-6">
              <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first order to get started
              </p>
              <Button onClick={() => navigate("/create-order")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Order
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <OrdersList searchTerm={searchTerm} />
      )}
    </Layout>
  );
};

export default OrdersPage;
