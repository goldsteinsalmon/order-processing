
import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CustomerDetailsPage: React.FC = () => {
  const { customers } = useData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const customer = customers.find(customer => customer.id === id);

  if (!customer) {
    return (
      <Layout>
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/customers")} className="mr-4">
            <ArrowLeft className="mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Customer Not Found</h2>
        </div>
        <div className="bg-white p-6 rounded-md shadow-sm">
          <p>The customer you're looking for doesn't exist or may have been removed.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/customers")} className="mr-4">
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">{customer.name}</h2>
        {customer.onHold && (
          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            On Hold
          </span>
        )}
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-600">Name:</span>
                <span className="col-span-2 font-medium">{customer.name}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-600">Type:</span>
                <span className="col-span-2 font-medium">{customer.type}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-600">Email:</span>
                <span className="col-span-2 font-medium">{customer.email}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-600">Phone:</span>
                <span className="col-span-2 font-medium">{customer.phone}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <p className="text-gray-700 whitespace-pre-line">{customer.address}</p>
            
            {customer.onHold && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-red-700 mb-2">Account on Hold</h3>
                {customer.holdReason && (
                  <p className="text-gray-700">{customer.holdReason}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomerDetailsPage;
