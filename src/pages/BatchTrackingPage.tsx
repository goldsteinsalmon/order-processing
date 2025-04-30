
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { BatchUsage } from "@/types";

const BatchTrackingPage: React.FC = () => {
  const { batchUsages, completedOrders, products } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("batch") || "");
  const [validBatchUsages, setValidBatchUsages] = useState<BatchUsage[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BatchUsage | 'productId' | null;
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
          
        // Update batch usage record
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
  }, [batchUsages, completedOrders, searchParams]);
  
  // Get products used for each batch
  const getBatchProducts = (batchNumber: string) => {
    // Find all products used with this batch number
    const productsWithBatch = new Map<string, {name: string, weight: number}>();
    
    completedOrders.forEach(order => {
      // Check if order uses this batch
      const usesBatch = (order.batchNumber === batchNumber) || 
                        (order.batchNumbers && order.batchNumbers.includes(batchNumber));
      
      // If the order uses this batch or we need to check individual items
      if (usesBatch || order.pickingProgress?.batchNumbers) {
        order.items.forEach(item => {
          // Check if this specific item uses the batch number
          const itemUsesBatch = 
            item.batchNumber === batchNumber ||
            (order.pickingProgress?.batchNumbers && 
             order.pickingProgress.batchNumbers[item.id] === batchNumber) ||
            usesBatch;
          
          if (itemUsesBatch) {
            // Get product info
            const productId = item.productId;
            const product = products.find(p => p.id === productId);
            
            if (product) {
              const currentWeight = productsWithBatch.get(productId)?.weight || 0;
              const additionalWeight = item.pickedWeight || (product.weight ? product.weight * item.quantity : item.quantity);
              
              productsWithBatch.set(productId, {
                name: product.name,
                weight: currentWeight + additionalWeight
              });
            }
          }
        });
      }
    });
    
    return Array.from(productsWithBatch.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      weight: data.weight
    }));
  };
  
  // Handle sorting
  const requestSort = (key: keyof BatchUsage | 'productId') => {
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
    
    const aValue = String(a[sortConfig.key as keyof BatchUsage]);
    const bValue = String(b[sortConfig.key as keyof BatchUsage]);
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
  const renderSortIndicator = (key: keyof BatchUsage | 'productId') => {
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
                    <TableHead>
                      Products
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatchUsages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No batch usage records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBatchUsages.map((batch) => {
                      const productsUsed = getBatchProducts(batch.batchNumber);
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                          <TableCell className="text-right">{(batch.usedWeight / 1000).toFixed(2)}</TableCell>
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
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {productsUsed.length > 0 ? (
                                productsUsed.map(product => (
                                  <TooltipProvider key={product.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge 
                                          variant="outline" 
                                          className="bg-blue-50"
                                        >
                                          {product.name.length > 15 
                                            ? `${product.name.substring(0, 15)}...` 
                                            : product.name}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{product.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {(product.weight / 1000).toFixed(2)} kg
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))
                              ) : (
                                <span className="text-gray-400 text-sm">No products found</span>
                              )}
                            </div>
                          </TableCell>
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
