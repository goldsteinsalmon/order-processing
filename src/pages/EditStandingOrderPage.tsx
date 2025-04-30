
import React from "react";
import Layout from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";

const EditStandingOrderPage: React.FC = () => {
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

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/standing-order-details/${order.id}`)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Edit Standing Order</h2>
      </div>
      
      <div className="bg-white p-6 rounded-md shadow-sm">
        <p className="text-gray-500 mb-4">The edit functionality is under development.</p>
        <Button onClick={() => navigate(`/standing-order-details/${order.id}`)}>Cancel</Button>
      </div>
    </Layout>
  );
};

export default EditStandingOrderPage;
