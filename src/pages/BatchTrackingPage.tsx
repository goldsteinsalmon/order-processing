
import React, { useState, useEffect } from "react";
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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BatchTrackingPage: React.FC = () => {
  const { batchUsages, completedOrders, recordAllBatchUsagesForOrder } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [validBatchUsages, setValidBatchUsages] = useState([...batchUsages]);
  
  // Validate batch usages against completed orders to fix any potential issues
  useEffect(() => {
    // Collect all batch numbers from completed orders
    const validBatchNumbers = new Set();
    
    completedOrders.forEach(order => {
      // Check if order has a batch number array
      if (order.batchNumbers && Array.isArray(order.batchNumbers)) {
        order.batchNumbers.forEach(batch => {
          if (batch) validBatchNumbers.add(batch);
        });
      }
      
      // Check if order has a single batch number
      if (order.batchNumber) {
        validBatchNumbers.add(order.batchNumber);
      }
      
      // Check individual items for batch numbers
      order.items.forEach(item => {
        if (item.batchNumber) {
          validBatchNumbers.add(item.batchNumber);
        }
      });
      
      // Check the pickingProgress batchNumbers mapping
      if (order.pickingProgress?.batchNumbers) {
        Object.values(order.pickingProgress.batchNumbers).forEach(batch => {
          if (batch) validBatchNumbers.add(batch);
        });
      }
    });
    
    // Filter batch usages to only include those that are in completed orders
    const filteredBatchUsages = batchUsages.filter(usage => 
      validBatchNumbers.has(usage.batchNumber)
    );
    
    setValidBatchUsages(filteredBatchUsages);
  }, [batchUsages, completedOrders]);
  
  // Filter batch usages based on search term
  const filteredBatchUsages = validBatchUsages
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
  
  // Function to reprocess all orders to fix any missing batch usage records
  const handleReprocessBatchUsages = () => {
    // Process each completed order to ensure all batch usages are recorded
    completedOrders.forEach(order => {
      recordAllBatchUsagesForOrder(order);
    });
    
    toast.success("Batch usage records have been reprocessed.");
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Batch Tracking</h2>
        <Button onClick={handleReprocessBatchUsages} variant="outline">
          Reprocess Batch Records
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Batch Details</CardTitle>
            <CardDescription>
              Track batch usage across all orders
            </CardDescription>
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
