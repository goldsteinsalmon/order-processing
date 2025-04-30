
import React, { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { format, parseISO } from "date-fns";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BatchTrackingPage: React.FC = () => {
  const { batchUsages, products } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  
  // Filter batch usages based on search term and product filter
  const filteredBatchUsages = useMemo(() => {
    return batchUsages
      .filter(batch => 
        (searchTerm === "" || 
         batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (productFilter === "all" || batch.productId === productFilter)
      )
      .sort((a, b) => {
        // Sort by last used date (most recent first)
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      });
  }, [batchUsages, searchTerm, productFilter]);
  
  // Calculate totals
  const totals = useMemo(() => {
    return filteredBatchUsages.reduce((acc, batch) => {
      return {
        totalWeight: acc.totalWeight + batch.totalWeight,
        usedWeight: acc.usedWeight + batch.usedWeight,
        ordersCount: acc.ordersCount + batch.ordersCount
      };
    }, { totalWeight: 0, usedWeight: 0, ordersCount: 0 });
  }, [filteredBatchUsages]);

  // Calculate total weight by product
  const weightByProduct = useMemo(() => {
    const productWeights: Record<string, { total: number, used: number }> = {};
    
    batchUsages.forEach(batch => {
      if (!productWeights[batch.productId]) {
        productWeights[batch.productId] = { total: 0, used: 0 };
      }
      
      productWeights[batch.productId].total += batch.totalWeight;
      productWeights[batch.productId].used += batch.usedWeight;
    });
    
    return productWeights;
  }, [batchUsages]);

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Batch Tracking</h2>
      </div>
      
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Batch Usage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-blue-700 text-sm font-medium">Total Batches</p>
                <p className="text-2xl font-bold">{batchUsages.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-700 text-sm font-medium">Total Weight Tracked</p>
                <p className="text-2xl font-bold">{totals.totalWeight} g</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-md">
                <p className="text-amber-700 text-sm font-medium">Used Weight</p>
                <p className="text-2xl font-bold">{totals.usedWeight} g</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-md">
                <p className="text-purple-700 text-sm font-medium">Orders Processed</p>
                <p className="text-2xl font-bold">{totals.ordersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Total Weight (g)</TableHead>
                    <TableHead className="text-right">Used Weight (g)</TableHead>
                    <TableHead className="text-right">Remaining Weight (g)</TableHead>
                    <TableHead className="text-right">Utilization %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(weightByProduct).map(([productId, weights]) => {
                    const product = products.find(p => p.id === productId);
                    const utilization = weights.total > 0 
                      ? Math.round((weights.used / weights.total) * 100) 
                      : 0;
                      
                    return product ? (
                      <TableRow key={productId}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell className="text-right">{weights.total}</TableCell>
                        <TableCell className="text-right">{weights.used}</TableCell>
                        <TableCell className="text-right">{weights.total - weights.used}</TableCell>
                        <TableCell className="text-right">{utilization}%</TableCell>
                      </TableRow>
                    ) : null;
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
          <div className="w-full sm:w-64">
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Total Weight (g)</TableHead>
                    <TableHead className="text-right">Used Weight (g)</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead>First Used</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatchUsages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No batch usage records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBatchUsages.map((batch) => {
                      const product = products.find(p => p.id === batch.productId);
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                          <TableCell>{batch.productName}</TableCell>
                          <TableCell>{product?.sku || 'N/A'}</TableCell>
                          <TableCell className="text-right">{batch.totalWeight}</TableCell>
                          <TableCell className="text-right">{batch.usedWeight}</TableCell>
                          <TableCell className="text-right">{batch.ordersCount}</TableCell>
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
