
import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReturnsComplaintsPage: React.FC = () => {
  const { returns, complaints } = useData();

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Returns & Complaints</h1>
        
        <Tabs defaultValue="returns">
          <TabsList className="mb-4">
            <TabsTrigger value="returns">Returns</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
          </TabsList>
          
          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle>Product Returns</CardTitle>
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
                        <p><strong>Resolution:</strong> {returnItem.resolutionStatus}</p>
                        <p><strong>Date:</strong> {new Date(returnItem.dateReturned).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No returns available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle>Customer Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                {complaints && complaints.length > 0 ? (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <div key={complaint.id} className="p-3 border rounded">
                        <p><strong>Customer:</strong> {complaint.customerName}</p>
                        <p><strong>Type:</strong> {complaint.complaintType}</p>
                        <p><strong>Details:</strong> {complaint.complaintDetails}</p>
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReturnsComplaintsPage;
