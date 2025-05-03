
import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BatchTrackingPage: React.FC = () => {
  const { batchUsages } = useData();

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Batch Tracking</h1>
        <Card>
          <CardHeader>
            <CardTitle>Batch Usage Records</CardTitle>
          </CardHeader>
          <CardContent>
            {batchUsages && batchUsages.length > 0 ? (
              <div className="space-y-4">
                {batchUsages.map((batch) => (
                  <div key={batch.id} className="p-3 border rounded">
                    <p><strong>Batch Number:</strong> {batch.batchNumber}</p>
                    <p><strong>Product:</strong> {batch.productName}</p>
                    <p><strong>Used Weight:</strong> {batch.usedWeight} of {batch.totalWeight}</p>
                    <p><strong>Orders:</strong> {batch.ordersCount}</p>
                    <p><strong>First Used:</strong> {new Date(batch.firstUsed).toLocaleDateString()}</p>
                    <p><strong>Last Used:</strong> {new Date(batch.lastUsed).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No batch usage data available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BatchTrackingPage;
