
import React from "react";
import Layout from "@/components/Layout";
import CreateOrderForm from "@/components/orders/CreateOrderForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleBackClick = () => {
    navigate("/orders");
  };
  
  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBackClick} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
        <h2 className="text-2xl font-bold">Create Order</h2>
      </div>
      <p className="text-gray-500 mb-6">Fill in all information below to create a new order</p>
      <CreateOrderForm />
    </Layout>
  );
};

export default CreateOrderPage;
