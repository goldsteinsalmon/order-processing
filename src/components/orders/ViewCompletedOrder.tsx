import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Box, Barcode, FileDown, Check } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BatchSummary } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { exportOrdersToCsv, generateCsvFilename } from "@/utils/exportUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReactToPrint } from "react-to-print";

// Type for product summary used in order items view
interface ProductSummary {
  productId: string;
  productName: string;
  sku: string;
  isWeighted: boolean;
  quantity: number;
  totalWeight: number;
}

const ViewCompletedOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completedOrders, products, updateOrder } = useData();
  const { toast } = useToast();
  const [invoiceNumber, setInvoiceNumber] = React.useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const order = completedOrders.find(order => order.id === id);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button variant="outline" onClick={() => navigate("/completed-orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Completed Orders
        </Button>
      </div>
    );
  }

  // Export this individual order to PDF
  const handleExportOrder = useReactToPrint({
    documentTitle: `order-${order.id.substring(0, 8)}-${format(new Date(), 'yyyy-MM-dd')}`,
    contentRef: printRef,
    onAfterPrint: () => {
      toast({
        title: "Export successful",
        description: `Order ${order.id.substring(0, 8)} has been exported to PDF.`
      });
    }
  });
  
  // Mark order as invoiced
  const handleMarkInvoiced = () => {
    if (!invoiceNumber) {
      toast({
        title: "Invoice number required",
        description: "Please enter an invoice number.",
        variant: "destructive"
      });
      return;
    }
    
    updateOrder({
      ...order,
      invoiced: true,
      invoiceNumber,
      invoiceDate: new Date().toISOString()
    });
    
    toast({
      title: "Order marked as invoiced",
      description: `Order ${order.id.substring(0, 8)} has been marked as invoiced with invoice #${invoiceNumber}.`
    });
    
    // Reset invoice number
    setInvoiceNumber("");
  };
  
  // Remove invoiced status
  const handleRemoveInvoiced = () => {
    updateOrder({
      ...order,
      invoiced: false,
      invoiceNumber: undefined,
      invoiceDate: undefined
    });
    
    toast({
      title: "Invoice status removed",
      description: `Invoice status has been removed from order ${order.id.substring(0, 8)}.`
    });
  };

  // Check if any items have a weight defined
  const hasWeightedProducts = order.items.some(item => {
    const product = products.find(p => p.id === item.productId);
    return product?.requiresWeightInput || item.manualWeight || 
           (order.boxDistributions && order.boxDistributions.some(box => 
             box.items.some(boxItem => 
               boxItem.productId === item.productId && boxItem.weight > 0
             )
           ));
  });
  
  // Function to determine if an item has a required weight input
  const isWeightedProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.requiresWeightInput;
  };
  
  // Create consolidated product summaries - group by product and aggregate quantities and weights
  const createProductSummaries = (): ProductSummary[] => {
    const summaryMap: Record<string, ProductSummary> = {};
    
    // Process each order item
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      
      // Calculate total weight for this product
      let totalProductWeight = 0;
      
      // Check if boxes/boxDistributions exist and contain this product
      if (order.boxDistributions && order.boxDistributions.length > 0) {
        // First try to get weight from box distributions
        order.boxDistributions.forEach(box => {
          const boxItems = box.items.filter(boxItem => boxItem.productId === item.productId);
          
          boxItems.forEach(boxItem => {
            // Use boxItem.weight as it's the manually entered weight
            const weight = boxItem.weight || 0;
            totalProductWeight += weight;
          });
        });
      }
      
      // If no weight from boxes, try the item's weights
      if (totalProductWeight === 0) {
        if (item.manualWeight && item.manualWeight > 0) {
          totalProductWeight = item.manualWeight;
        } else if (item.pickedWeight && item.pickedWeight > 0) {
          totalProductWeight = item.pickedWeight;
        } else if (product.weight) {
          totalProductWeight = product.weight * item.quantity;
        }
      }
      
      // Initialize or update the product summary
      if (!summaryMap[product.id]) {
        summaryMap[product.id] = {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          isWeighted: !!product.requiresWeightInput,
          quantity: item.quantity,
          totalWeight: totalProductWeight
        };
      } else {
        // Update existing product summary
        const summary = summaryMap[product.id];
        summary.quantity += item.quantity;
        summary.totalWeight += totalProductWeight;
      }
    });
    
    return Object.values(summaryMap);
  };
  
  const productSummaries = createProductSummaries();
  
  // Calculate total weight from product summaries
  const totalWeight = productSummaries.reduce((total, product) => total + product.totalWeight, 0);
  
  // Calculate total items
  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

  // Get batch summaries - either from the saved summaries or calculate them
  const getBatchSummaries = (): BatchSummary[] => {
    console.log("Getting batch summaries for order:", order.id);
    
    // Use pre-calculated batch summaries if available (from PickingList)
    if (order.batchSummaries && order.batchSummaries.length > 0) {
      console.log("Using pre-calculated batch summaries:", order.batchSummaries);
      return order.batchSummaries;
    }
    
    // Create a map to aggregate weights by batch number
    const batchWeightMap: Record<string, number> = {};
    
    console.log("No pre-calculated summaries, generating from box data");
    
    // Process box distributions if they exist (primary source for batch data)
    if (order.boxDistributions && order.boxDistributions.length > 0) {
      order.boxDistributions.forEach(box => {
        // Box-level batch number as default
        const boxBatchNumber = box.batchNumber || "Unknown";
        
        // Process each item in the box
        box.items.forEach(boxItem => {
          // Use item-specific batch number if available, otherwise use box batch number
          const batchNumber = boxItem.batchNumber || boxBatchNumber;
          const weight = boxItem.weight || 0;
          
          // Add weight to the appropriate batch
          if (!batchWeightMap[batchNumber]) {
            batchWeightMap[batchNumber] = 0;
          }
          batchWeightMap[batchNumber] += weight;
        });
      });
      
      console.log("Generated batch weights from boxes:", batchWeightMap);
    }
    // If no box distributions, try order-level batch information
    else if (order.items && order.items.length > 0) {
      // Default batch number from order
      const defaultBatchNumber = order.batchNumber || 
                                (order.batchNumbers && order.batchNumbers.length > 0 ? 
                                 order.batchNumbers[0] : "Unknown");
      
      // Process all items
      order.items.forEach(item => {
        const batchNumber = item.batchNumber || defaultBatchNumber;
        let weight = 0;
        
        // Calculate weight based on available data
        if (item.manualWeight && item.manualWeight > 0) {
          weight = item.manualWeight;
        } else if (item.pickedWeight && item.pickedWeight > 0) {
          weight = item.pickedWeight;
        } else {
          const product = products.find(p => p.id === item.productId);
          if (product && product.weight) {
            weight = product.weight * item.quantity;
          }
        }
        
        // Add weight to the appropriate batch
        if (!batchWeightMap[batchNumber]) {
          batchWeightMap[batchNumber] = 0;
        }
        batchWeightMap[batchNumber] += weight;
      });
      
      console.log("Generated batch weights from items:", batchWeightMap);
    }
    // If no batch information found but we have order.batchNumbers, create entries with zero weight
    else if (order.batchNumbers && order.batchNumbers.length > 0) {
      order.batchNumbers.forEach(batchNum => {
        batchWeightMap[batchNum] = 0;
      });
    }
    // If single batchNumber exists, add it
    else if (order.batchNumber) {
      batchWeightMap[order.batchNumber] = 0;
    }
    
    // Convert the map to array of BatchSummary objects
    return Object.entries(batchWeightMap).map(([batchNumber, totalWeight]) => ({
      batchNumber,
      totalWeight
    }));
  };
  
  const batchSummaries = getBatchSummaries();

  // Improved function to get weight from box items, considering all sources of weight data
  const getItemWeight = (boxItem: any, boxNumber: number): number => {
    // CRITICAL FIX: Always prioritize the specific weight assigned to this box item
    // as the weights may differ between boxes for the same product
    if (boxItem.weight !== undefined && boxItem.weight > 0) {
      return boxItem.weight;
    }
    
    // If no weight directly on the box item, try to find weight information from order items
    // that might be box-specific
    if (order.items) {
      const orderItem = order.items.find(item => 
        item.productId === boxItem.productId && 
        item.boxNumber === boxNumber
      );
      
      if (orderItem) {
        if (orderItem.manualWeight && orderItem.manualWeight > 0) {
          return orderItem.manualWeight;
        }
        if (orderItem.pickedWeight && orderItem.pickedWeight > 0) {
          return orderItem.pickedWeight;
        }
      }
      
      // If no box-specific item found, try to find general item information
      const generalOrderItem = order.items.find(item => 
        item.productId === boxItem.productId
      );
      
      if (generalOrderItem) {
        if (generalOrderItem.manualWeight && generalOrderItem.manualWeight > 0) {
          return generalOrderItem.manualWeight;
        }
        if (generalOrderItem.pickedWeight && generalOrderItem.pickedWeight > 0) {
          return generalOrderItem.pickedWeight;
        }
      }
    }
    
    // If no weight found in order items, use product default weight if applicable
    const product = products.find(p => p.id === boxItem.productId);
    if (product && product.weight) {
      return product.weight * boxItem.quantity;
    }
    
    // No weight information found
    return 0;
  };

  // Calculate box weights by properly handling all potential weight sources
  const calculateBoxWeight = (box: any): number => {
    if (!box.items || !Array.isArray(box.items)) return 0;
    
    // Sum weights from all items, using our improved weight retrieval function
    return box.items.reduce((total: number, item: any) => {
      const itemWeight = getItemWeight(item, box.boxNumber);
      return total + itemWeight;
    }, 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/completed-orders")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">View Completed Order</h2>
        </div>
        <Button onClick={handleExportOrder}>
          <FileDown className="h-4 w-4 mr-2" /> Export Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Order Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order ID:</dt>
                <dd className="col-span-2">{order.id}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order Date:</dt>
                <dd className="col-span-2">{format(parseISO(order.orderDate || order.created), "MMMM d, yyyy")}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Status:</dt>
                <dd className="col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {order.status}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Invoice Status:</dt>
                <dd className="col-span-2">
                  {order.invoiced ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Invoiced
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Not Invoiced
                    </span>
                  )}
                </dd>
              </div>
              {order.invoiced && order.invoiceNumber && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Invoice Number:</dt>
                  <dd className="col-span-2">{order.invoiceNumber}</dd>
                </div>
              )}
              {order.invoiced && order.invoiceDate && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Invoice Date:</dt>
                  <dd className="col-span-2">{format(parseISO(order.invoiceDate), "MMMM d, yyyy")}</dd>
                </div>
              )}
              <div className="grid grid-cols-3">
                <dt className="font-medium">Delivery Method:</dt>
                <dd className="col-span-2">{order.deliveryMethod}</dd>
              </div>
              {order.picker && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Picked By:</dt>
                  <dd className="col-span-2">{order.picker}</dd>
                </div>
              )}
              {order.batchNumber && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Batch Number:</dt>
                  <dd className="col-span-2">{order.batchNumber}</dd>
                </div>
              )}
              {order.batchNumbers && order.batchNumbers.length > 0 && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Batch Numbers:</dt>
                  <dd className="col-span-2">{order.batchNumbers.join(", ")}</dd>
                </div>
              )}
              {order.customerOrderNumber && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Customer Order #:</dt>
                  <dd className="col-span-2">{order.customerOrderNumber}</dd>
                </div>
              )}
              {order.notes && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Notes:</dt>
                  <dd className="col-span-2">{order.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Customer Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-3">
                <dt className="font-medium">Name:</dt>
                <dd className="col-span-2">{order.customer.name}</dd>
              </div>
              {order.customer.accountNumber && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Account Number:</dt>
                  <dd className="col-span-2">{order.customer.accountNumber}</dd>
                </div>
              )}
              <div className="grid grid-cols-3">
                <dt className="font-medium">Type:</dt>
                <dd className="col-span-2">{order.customer.type}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Email:</dt>
                <dd className="col-span-2">{order.customer.email}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Phone:</dt>
                <dd className="col-span-2">{order.customer.phone}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Address:</dt>
                <dd className="col-span-2">{order.customer.address}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      
      {/* Invoice management section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
        </CardHeader>
        <CardContent>
          {order.invoiced ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  This order is marked as invoiced with invoice #{order.invoiceNumber} 
                  on {order.invoiceDate ? format(parseISO(order.invoiceDate), "MMMM d, yyyy") : "unknown date"}.
                </p>
              </div>
              <Button variant="outline" onClick={handleRemoveInvoiced}>
                Remove Invoice Status
              </Button>
            </div>
          ) : (
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="new-invoice-number">Invoice Number</Label>
                <Input 
                  id="new-invoice-number" 
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                />
              </div>
              <Button 
                className="mb-[1px]" 
                onClick={handleMarkInvoiced}
                disabled={!invoiceNumber}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark as Invoiced
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="order-items" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="order-items">Order Items</TabsTrigger>
          <TabsTrigger value="batch-summary">Batch Summary</TabsTrigger>
          {(order.boxes || order.boxDistributions) && (
            <TabsTrigger value="boxes">Boxes</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="order-items">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productSummaries.map((summary) => (
                      <TableRow key={summary.productId}>
                        <TableCell>
                          {summary.productName}
                          {summary.isWeighted && (
                            <span className="text-xs text-gray-500 ml-1">(Weighed)</span>
                          )}
                        </TableCell>
                        <TableCell>{summary.sku}</TableCell>
                        <TableCell className="text-right">{summary.quantity}</TableCell>
                        <TableCell className="text-right">
                          {summary.totalWeight > 0
                            ? `${(summary.totalWeight / 1000).toFixed(2)} kg`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell>Total</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">{totalItems}</TableCell>
                      <TableCell className="text-right">
                        {totalWeight > 0 ? `${(totalWeight / 1000).toFixed(2)} kg` : "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="batch-summary">
          <Card>
            <CardHeader>
              <CardTitle>Batch Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {batchSummaries.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No batch information available</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Number</TableHead>
                        <TableHead className="text-right">Total Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchSummaries.map((batch, index) => (
                        <TableRow key={index}>
                          <TableCell className="py-3 flex items-center">
                            <Barcode className="h-4 w-4 mr-2" />
                            {batch.batchNumber}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {batch.totalWeight > 0
                              ? `${(batch.totalWeight / 1000).toFixed(2)} kg`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-medium">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {batchSummaries.reduce((total, batch) => total + batch.totalWeight, 0) > 0 
                            ? `${(batchSummaries.reduce((total, batch) => total + batch.totalWeight, 0) / 1000).toFixed(2)} kg` 
                            : "-"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {(order.boxes || order.boxDistributions) && (
          <TabsContent value="boxes">
            <Card>
              <CardHeader>
                <CardTitle>Boxes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(order.boxDistributions || order.boxes || []).map((box, index) => {
                    // Use our improved function to calculate box weight
                    const boxTotalWeight = calculateBoxWeight(box);
                    
                    return (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold flex items-center">
                            <Box className="h-4 w-4 mr-2" />
                            Box #{box.boxNumber}
                          </h4>
                          <div className="flex items-center gap-4">
                            {box.batchNumber && (
                              <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                                Batch: {box.batchNumber}
                              </span>
                            )}
                            <span className="text-sm font-medium">
                              Total: {boxTotalWeight > 0 ? `${(boxTotalWeight / 1000).toFixed(2)} kg` : "-"}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Weight</TableHead>
                                {box.items.some(item => item.batchNumber) && (
                                  <TableHead className="text-right">Batch</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {box.items.map((item, itemIndex) => {
                                const product = products.find(p => p.id === item.productId);
                                const itemWeight = getItemWeight(item, box.boxNumber);
                                const isWeighted = isWeightedProduct(item.productId);
                                
                                return (
                                  <TableRow key={itemIndex}>
                                    <TableCell>
                                      {product?.name || "Unknown Product"}
                                      {isWeighted && (
                                        <span className="text-xs text-gray-500 ml-1">(Weighed)</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">
                                      {itemWeight > 0 
                                        ? `${(itemWeight / 1000).toFixed(2)} kg` 
                                        : "-"}
                                    </TableCell>
                                    {box.items.some(item => item.batchNumber) && (
                                      <TableCell className="text-right">
                                        {item.batchNumber || box.batchNumber || "-"}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Hidden printable content for PDF export */}
      <div className="hidden">
        <div ref={printRef} className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Order #{order.id.substring(0, 8)}</h1>
            <p className="text-gray-500">Generated on {format(new Date(), "PPP")}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-medium">{order.customer.name}</p>
              {order.customer.accountNumber && (
                <p className="text-sm text-gray-600">Account #: {order.customer.accountNumber}</p>
              )}
              {order.customerOrderNumber && (
                <p className="text-sm text-gray-600">Customer Order #: {order.customerOrderNumber}</p>
              )}
            </div>
            <div>
              <p className="text-gray-500">Order Date</p>
              <p className="font-medium">{format(parseISO(order.orderDate), "PPP")}</p>
              <p className="text-sm text-gray-600">Status: {order.status}</p>
            </div>
          </div>
          
          <h3 className="font-medium mb-2 mt-4">Order Items</h3>
          <table className="min-w-full border-collapse mb-4">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2 text-left">Product</th>
                <th className="py-2 text-left">SKU</th>
                <th className="py-2 text-right">Quantity</th>
                <th className="py-2 text-right">Weight</th>
              </tr>
            </thead>
            <tbody>
              {createProductSummaries().map((summary) => (
                <tr key={summary.productId} className="border-b border-gray-200">
                  <td className="py-2">{summary.productName}</td>
                  <td className="py-2">{summary.sku}</td>
                  <td className="py-2 text-right">{summary.quantity}</td>
                  <td className="py-2 text-right">
                    {summary.totalWeight > 0
                      ? `${(summary.totalWeight / 1000).toFixed(2)} kg`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {batchSummaries.length > 0 && (
            <>
              <h3 className="font-medium mb-2 mt-4">Batch Summary</h3>
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-2 text-left">Batch Number</th>
                    <th className="py-2 text-right">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {batchSummaries.map((batch, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2">{batch.batchNumber}</td>
                      <td className="py-2 text-right">
                        {batch.totalWeight > 0
                          ? `${(batch.totalWeight / 1000).toFixed(2)} kg`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-gray-500">
            <p>This document was generated from the order management system.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCompletedOrder;
