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
import { BatchUsage } from "@/types";

const BatchTrackingPage: React.FC = () => {
  const { batchUsages, completedOrders } = useData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("batch") || "");
  const [validBatchUsages, setValidBatchUsages] = useState<BatchUsage[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BatchUsage | null;
    direction: 'ascending' | 'descending';
  }>({
    key: 'firstUsed',
    direction: 'descending'
  });
  
  // Validate batch usages against completed orders to fix any potential issues
  useEffect(() => {
    // If the URL has a batch parameter, set it as the search term
    const batchParam = searchParams.get("batch");
    if (batchParam && searchTerm !== batchParam) {
      setSearchTerm(batchParam);
    }
    
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
    
    // Group batch usages by batch number to consolidate duplicate entries
    const batchUsageMap = new Map<string, BatchUsage>();
    
    filteredBatchUsages.forEach(usage => {
      const key = usage.batchNumber;
      
      if (batchUsageMap.has(key)) {
        // Update existing entry by combining data
        const existingUsage = batchUsageMap.get(key)!;
        
        // Use the earliest first used date
        const firstUsedDate = new Date(usage.firstUsed) < new Date(existingUsage.firstUsed)
          ? usage.firstUsed : existingUsage.firstUsed;
        
        // Use the latest last used date
        const lastUsedDate = new Date(usage.lastUsed) > new Date(existingUsage.lastUsed)
          ? usage.lastUsed : existingUsage.lastUsed;
          
        // Update batch usage record - make sure we're not double counting weights
        batchUsageMap.set(key, {
          ...existingUsage,
          usedWeight: existingUsage.usedWeight + usage.usedWeight,
          firstUsed: firstUsedDate,
          lastUsed: lastUsedDate,
        });
      } else {
        // Add new entry
        batchUsageMap.set(key, usage);
      }
    });
    
    // Convert map back to array
    const consolidatedBatchUsages = Array.from(batchUsageMap.values());
    setValidBatchUsages(consolidatedBatchUsages);
  }, [batchUsages, completedOrders, searchParams, searchTerm]);
  
  // Handle sorting
  const requestSort = (key: keyof BatchUsage) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply sorting function
  const sortedBatchUsages = [...validBatchUsages].sort((a, b) => {
    if (sortConfig.key === null) {
      return 0;
    }
    
    if (sortConfig.key === 'firstUsed' || sortConfig.key === 'lastUsed') {
      const aDate = new Date(a[sortConfig.key]).getTime();
      const bDate = new Date(b[sortConfig.key]).getTime();
      return sortConfig.direction === 'ascending' ? aDate - bDate : bDate - aDate;
    }
    
    if (sortConfig.key === 'usedWeight' || sortConfig.key === 'ordersCount') {
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
  const filteredBatchUsages = sortedBatchUsages
    .filter(batch => searchTerm === "" || batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
                      onClick={() => requestSort('batchNumber')}
                    >
                      Batch Number {renderSortIndicator('batchNumber')}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer"
                      onClick={() => requestSort('usedWeight')}
                    >
                      Total Weight (kg) {renderSortIndicator('usedWeight')}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer"
                      onClick={() => requestSort('ordersCount')}
                    >
                      Orders {renderSortIndicator('ordersCount')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => requestSort('firstUsed')}
                    >
                      First Used {renderSortIndicator('firstUsed')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort('lastUsed')}
                    >
                      Last Used {renderSortIndicator('lastUsed')}
                    </TableHead>
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
                    filteredBatchUsages.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                        <TableCell className="text-right">
                          {(batch.usedWeight / 1000).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            onClick={() => handleOrdersClick(batch.batchNumber)}
                          >
                            {batch.ordersCount}
                          </Button>
                        </TableCell>
                        <TableCell>{format(parseISO(batch.firstUsed), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{format(parseISO(batch.lastUsed), 'dd/MM/yyyy')}</TableCell>
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
