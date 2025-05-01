
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { format, parseISO } from "date-fns";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { BatchUsage, BatchSummary } from "@/types";

const BatchTrackingPage: React.FC = () => {
  const { completedOrders } = useData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("batch") || "");
  const [batchData, setBatchData] = useState<BatchUsage[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BatchUsage | null;
    direction: 'ascending' | 'descending';
  }>({
    key: 'first_used',
    direction: 'descending'
  });

  // Collect batch data directly from completed orders
  useEffect(() => {
    // If the URL has a batch parameter, set it as the search term
    const batchParam = searchParams.get("batch");
    if (batchParam && searchTerm !== batchParam) {
      setSearchTerm(batchParam);
    }
    
    // Create a map to store consolidated batch information
    const batchMap = new Map<string, BatchUsage>();
    
    // Process all completed orders
    completedOrders.forEach(order => {
      // Skip orders without batch information
      if (!order.batchSummaries || order.batchSummaries.length === 0) return;
      
      // Process each batch summary in the order
      order.batchSummaries.forEach((summary: BatchSummary) => {
        const batchNumber = summary.batchNumber;
        const weight = summary.totalWeight;
        
        // Skip entries with no batch number
        if (!batchNumber || batchNumber === "Unknown") return;
        
        // Get existing entry or create a new one
        if (!batchMap.has(batchNumber)) {
          batchMap.set(batchNumber, {
            id: `batch-${batchNumber}`,
            batch_number: batchNumber,
            product_id: "", // Not needed when consolidating by batch
            product_name: "", // Not needed when consolidating by batch
            total_weight: 0,
            used_weight: 0,
            orders_count: 0,
            first_used: order.created || order.order_date,
            last_used: order.created || order.order_date,
            usedBy: []
          });
        }
        
        const batchEntry = batchMap.get(batchNumber)!;
        
        // Update the weight
        batchEntry.used_weight += weight;
        
        // Update order count if this is a new order
        if (!batchEntry.usedBy!.includes(`order-${order.id}`)) {
          batchEntry.usedBy!.push(`order-${order.id}`);
          batchEntry.orders_count += 1;
        }
        
        // Update dates if needed
        const orderDate = new Date(order.created || order.order_date);
        const firstUsedDate = new Date(batchEntry.first_used);
        const lastUsedDate = new Date(batchEntry.last_used);
        
        if (orderDate < firstUsedDate) {
          batchEntry.first_used = order.created || order.order_date;
        }
        
        if (orderDate > lastUsedDate) {
          batchEntry.last_used = order.created || order.order_date;
        }
      });
    });
    
    // Convert map to array
    setBatchData(Array.from(batchMap.values()));
  }, [completedOrders, searchParams, searchTerm]);
  
  // Handle sorting
  const requestSort = (key: keyof BatchUsage) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply sorting function
  const sortedBatchData = [...batchData].sort((a, b) => {
    if (sortConfig.key === null) {
      return 0;
    }
    
    if (sortConfig.key === 'first_used' || sortConfig.key === 'last_used') {
      const aDate = new Date(a[sortConfig.key]).getTime();
      const bDate = new Date(b[sortConfig.key]).getTime();
      return sortConfig.direction === 'ascending' ? aDate - bDate : bDate - aDate;
    }
    
    if (sortConfig.key === 'used_weight' || sortConfig.key === 'orders_count') {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
    }
    
    const aValue = String(a[sortConfig.key]);
    const bValue = String(b[sortConfig.key]);
    return sortConfig.direction === 'ascending'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
    
  // Filter batch usages based on search term
  const filteredBatchData = sortedBatchData
    .filter(batch => searchTerm === "" || batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
  // Handle clicking on orders count - navigate to completed orders with batch filter
  const handleOrdersClick = (batchNumber: string) => {
    // Navigate to completed orders with this batch number as a query param
    navigate(`/completed-orders?batch=${batchNumber}`);
  };
  
  // Render sort indicator
  const renderSortIndicator = (key: keyof BatchUsage) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    );
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Batch Tracking</h2>
      
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
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => requestSort('batch_number')}
                    >
                      Batch Number {renderSortIndicator('batch_number')}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer"
                      onClick={() => requestSort('used_weight')}
                    >
                      Total Weight (kg) {renderSortIndicator('used_weight')}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer"
                      onClick={() => requestSort('orders_count')}
                    >
                      Orders {renderSortIndicator('orders_count')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => requestSort('first_used')}
                    >
                      First Used {renderSortIndicator('first_used')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort('last_used')}
                    >
                      Last Used {renderSortIndicator('last_used')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatchData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No batch usage records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBatchData.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batch_number}</TableCell>
                        <TableCell className="text-right">
                          {(batch.used_weight / 1000).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            onClick={() => handleOrdersClick(batch.batch_number)}
                          >
                            {batch.orders_count}
                          </Button>
                        </TableCell>
                        <TableCell>{format(parseISO(batch.first_used), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{format(parseISO(batch.last_used), 'dd/MM/yyyy')}</TableCell>
                      </TableRow>
                    ))
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
