
import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ReturnsPage: React.FC = () => {
  const { returns, complaints } = useData();

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Returns</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Returns</CardTitle>
          </CardHeader>
          <CardContent>
            {returns && returns.length > 0 ? (
              <div className="space-y-4">
                {returns.map((returnItem) => (
                  <div key={returnItem.id} className="p-3 border rounded">
                    <p><strong>Customer:</strong> {returnItem.customerName}</p>
                    <p><strong>Product:</strong> {returnItem.productSku}</p>
                    <p><strong>Quantity:</strong> {returnItem.quantity}</p>
                    <p><strong>Status:</strong> {returnItem.returnStatus}</p>
                    <p><strong>Date:</strong> {new Date(returnItem.dateReturned).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No returns available.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            {complaints && complaints.length > 0 ? (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="p-3 border rounded">
                    <p><strong>Customer:</strong> {complaint.customerName}</p>
                    <p><strong>Type:</strong> {complaint.complaintType}</p>
                    <p><strong>Status:</strong> {complaint.resolutionStatus}</p>
                    <p><strong>Date:</strong> {new Date(complaint.dateSubmitted).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No complaints available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReturnsPage;
