
import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">New Customer</h2>
        <Button variant="outline" onClick={() => navigate("/customers")}>
          Back to Customers
        </Button>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm">
        {/* Placeholder for the form - will be implemented later */}
        <p className="text-gray-500 mb-4">This feature is under development.</p>
        <Button onClick={() => navigate("/customers")}>Cancel</Button>
      </div>
    </Layout>
  );
};

export default CreateCustomerPage;
