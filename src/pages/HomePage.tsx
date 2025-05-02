
import React, { useEffect } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from "date-fns";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { Navigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const { orders, completedOrders, products, customers, missingItems } = useData();
  const { user, isLoading } = useSupabaseAuth();

  useEffect(() => {
    // Debug logging for authentication state on homepage
    console.log("HomePage rendering:", { isAuthenticated: !!user, isLoading, userRole: user?.user_metadata?.role });
  }, [user, isLoading]);

  // If we're still loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    console.log("HomePage: Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Count orders by status
  const orderStatusCounts = React.useMemo(() => {
    const statuses = ["Pending", "Processing", "Completed", "Missing Items", "Cancelled", "Modified", "Partially Picked"];
    return statuses.map(status => ({
      name: status,
      count: orders.filter(order => order.status === status).length + 
             (status === "Completed" ? completedOrders.length : 0)
    }));
  }, [orders, completedOrders]);

  // Count recent orders in the last 7 days
  const recentOrdersData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, "MMM dd"),
        fullDate: date,
        count: 0
      };
    });

    // Count orders for each day
    [...orders, ...completedOrders].forEach(order => {
      const orderDate = new Date(order.orderDate || order.order_date);
      const dayIndex = last7Days.findIndex(day => 
        format(day.fullDate, "yyyy-MM-dd") === format(orderDate, "yyyy-MM-dd")
      );
      if (dayIndex !== -1) {
        last7Days[dayIndex].count += 1;
      }
    });

    return last7Days;
  }, [orders, completedOrders]);

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.length + completedOrders.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Missing Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {missingItems.length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Orders (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentOrdersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HomePage;
