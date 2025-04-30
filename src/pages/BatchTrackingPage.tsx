
import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

const BatchTrackingPage: React.FC = () => {
  const { batchUsages, products, orders, completedOrders } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [selectedBatchOrders, setSelectedBatchOrders] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatchNumber, setSelectedBatchNumber] = useState("");
  
  // Find orders that use a specific batch number
  const findOrdersByBatchNumber = (batchNumber: string) => {
    // Look in both active and completed orders
    const allOrders = [...orders, ...completedOrders];
    
    const ordersUsingBatch = allOrders.filter(order => {
      // Check if order has batch numbers array
      if (order.batchNumbers && order.batchNumbers.includes(batchNumber)) {
        return true;
      }
      
      // Check if order has a single batch number
      if (order.batchNumber === batchNumber) {
        return true;
      }
      
      // Check if any item in the order uses this batch number
      if (order.items && order.items.some(item => item.batchNumber === batchNumber)) {
        return true;
      }
      
      return false;
    });
    
    return ordersUsingBatch;
  };
  
  // Handle clicking on orders count
  const handleOrdersClick = (batchNumber: string) => {
    const ordersForBatch = findOrdersByBatchNumber(batchNumber);
    setSelectedBatchOrders(ordersForBatch);
    setSelectedBatchNumber(batchNumber);
    setIsDialogOpen(true);
  };
  
  // Filter batch usages based on search term and product filter
  const filteredBatchUsages = batchUsages
    .filter(batch => 
      (searchTerm === "" || 
       batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (productFilter === "all" || batch.productId === productFilter)
    )
    .sort((a, b) => {
      // Sort by first used date (oldest first)
      return new Date(a.firstUsed).getTime() - new Date(b.firstUsed).getTime();
    });

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
                    <TableHead className="text-right">Total Weight Used (g)</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead>First Used</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatchUsages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
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
                          <TableCell className="text-right">{batch.usedWeight}</TableCell>
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Orders Using Batch #{selectedBatchNumber}</DialogTitle>
            <DialogDescription>
              This batch has been used in {selectedBatchOrders.length} order(s)
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedBatchOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No orders found using this batch
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedBatchOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                      <TableCell>{order.customer?.name || 'Unknown'}</TableCell>
                      <TableCell>{format(parseISO(order.orderDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === "Completed" 
                            ? "bg-green-100 text-green-800" 
                            : order.status === "In Progress" 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-amber-100 text-amber-800"
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default BatchTrackingPage;
