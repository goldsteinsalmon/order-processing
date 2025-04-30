
import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import CreateStandingOrderForm from "@/components/standingOrders/CreateStandingOrderForm";
import { ArrowLeft } from "lucide-react";

const CreateStandingOrderPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/standing-orders")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Create Standing Order</h2>
      </div>

      <div className="mb-6">
        <p className="text-gray-500">Create a recurring order for a customer with a set frequency.</p>
      </div>

      <CreateStandingOrderForm />
    </Layout>
  );
};

export default CreateStandingOrderPage;
