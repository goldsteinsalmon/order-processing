
import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const IncompleteBatchPage: React.FC = () => {
  const { orders, batchUsages } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Find all batch numbers that are still in use (incomplete)
  const incompleteBatches = useMemo(() => {
    // Get all batch numbers currently in use in pending/processing orders
    const batchesInUse = new Set<string>();
    orders.forEach(order => {
      if (order.status !== 'Completed' && order.status !== 'Cancelled') {
        if (order.items) {
          order.items.forEach(item => {
            if (item.batchNumber) {
              batchesInUse.add(item.batchNumber);
            }
          });
        }
      }
    });
    
    // Filter batch usages to only include those still in use
    return batchUsages.filter(batch => 
      batchesInUse.has(batch.batchNumber) && 
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, batchUsages, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleViewOrders = (batchNumber: string) => {
    // Find all orders using this batch
    const relevantOrders = orders.filter(order => 
      order.items?.some(item => item.batchNumber === batchNumber)
    );
    
    if (relevantOrders.length === 1) {
      navigate(`/orders/${relevantOrders[0].id}`);
    } else {
      // For multiple orders, we could navigate to a filtered list
      // This is a simplification:
      navigate(`/orders?batch=${batchNumber}`);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Incomplete Batches</h2>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search batch numbers..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      {incompleteBatches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? "No batches match your search." : "No incomplete batches found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incompleteBatches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Batch: {batch.batchNumber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Product</p>
                    <p className="text-sm text-muted-foreground">{batch.productName}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      First Used: {format(parseISO(batch.firstUsed), "dd/MM/yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last Used: {format(parseISO(batch.lastUsed), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Usage</p>
                    <p className="text-sm text-muted-foreground">
                      Total Weight: {batch.totalWeight}g
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Used Weight: {batch.usedWeight}g
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Remaining: {(batch.totalWeight - batch.usedWeight).toFixed(2)}g
                      ({Math.round((batch.usedWeight / batch.totalWeight) * 100)}% used)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Orders</p>
                    <p className="text-sm text-muted-foreground">
                      Used in {batch.ordersCount} {batch.ordersCount === 1 ? "order" : "orders"}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleViewOrders(batch.batchNumber)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Orders
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default IncompleteBatchPage;
