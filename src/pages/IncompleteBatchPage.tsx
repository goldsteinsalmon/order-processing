
import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IncompleteBatchPage: React.FC = () => {
  const { batchUsages } = useData();
  
  // Filter incomplete batches (where usedWeight < totalWeight)
  const incompleteBatches = batchUsages.filter(
    batch => batch.usedWeight < batch.totalWeight
  );

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Incomplete Batches</h1>
        <Card>
          <CardHeader>
            <CardTitle>Batches With Remaining Weight</CardTitle>
          </CardHeader>
          <CardContent>
            {incompleteBatches.length > 0 ? (
              <div className="space-y-4">
                {incompleteBatches.map((batch) => (
                  <div key={batch.id} className="p-3 border rounded">
                    <p><strong>Batch Number:</strong> {batch.batchNumber}</p>
                    <p><strong>Product:</strong> {batch.productName}</p>
                    <p><strong>Remaining Weight:</strong> {batch.totalWeight - batch.usedWeight} of {batch.totalWeight}</p>
                    <p><strong>Usage:</strong> {((batch.usedWeight / batch.totalWeight) * 100).toFixed(1)}%</p>
                    <p><strong>Last Used:</strong> {new Date(batch.lastUsed).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No incomplete batches available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default IncompleteBatchPage;
