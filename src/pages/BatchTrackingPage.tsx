
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const BatchTrackingPage: React.FC = () => {
  const { batchUsages } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter batch usages based on search term
  const filteredBatchUsages = batchUsages
    .filter(batch => searchTerm === "" || batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Sort by first used date (oldest first)
      return new Date(a.firstUsed).getTime() - new Date(b.firstUsed).getTime();
    });
    
  // Handle clicking on orders count - navigate to completed orders with batch filter
  const handleOrdersClick = (batchNumber: string) => {
    // Navigate to completed orders with this batch number as a query param
    navigate(`/completed-orders?batch=${batchNumber}`);
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Batch Tracking</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <Input
              placeholder="Search by batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Batch Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead className="text-right">Total Weight (kg)</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead>First Used</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatchUsages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No batch usage records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBatchUsages.map((batch) => {
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                          <TableCell className="text-right">{(batch.usedWeight / 1000).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <button
                              className="text-blue-600 hover:underline cursor-pointer"
                              onClick={() => handleOrdersClick(batch.batchNumber)}
                            >
                              {batch.ordersCount}
                            </button>
                          </TableCell>
                          <TableCell>{format(parseISO(batch.firstUsed), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{format(parseISO(batch.lastUsed), 'dd/MM/yyyy')}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BatchTrackingPage;
