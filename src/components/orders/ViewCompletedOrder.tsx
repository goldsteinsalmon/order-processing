import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Box, Barcode } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Type for product summary used in order items view
interface ProductSummary {
  productId: string;
  productName: string;
  sku: string;
  isWeighted: boolean;
  quantity: number;
  totalWeight: number;
}

// Type for batch summaries
interface BatchSummary {
  batchNumber: string;
  totalWeight: number;
}

const ViewCompletedOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completedOrders, products } = useData();

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
            // Use boxItem.weight as it's the manual weight
            const weight = boxItem.weight || 0;
            totalProductWeight += weight;
            console.log(`Product ${product.name} in box ${box.boxNumber}: weight=${weight}g`);
          });
        });
      }
      
      // If no weight from boxes, try the item's weights
      if (totalProductWeight === 0) {
        if (item.manualWeight && item.manualWeight > 0) {
          totalProductWeight = item.manualWeight;
          console.log(`Using manual weight for ${product.name}: ${totalProductWeight}g`);
        } else if (item.pickedWeight && item.pickedWeight > 0) {
          totalProductWeight = item.pickedWeight;
          console.log(`Using picked weight for ${product.name}: ${totalProductWeight}g`);
        } else if (product.weight) {
          totalProductWeight = product.weight * item.quantity;
          console.log(`Using calculated weight for ${product.name}: ${totalProductWeight}g`);
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

  // Create batch summaries - IMPROVED to show only batch number and total weight
  const createBatchSummaries = (): BatchSummary[] => {
    const batchMap: Record<string, BatchSummary> = {};
    
    // First check if we have box distributions with batch numbers
    if (order.boxDistributions && order.boxDistributions.length > 0) {
      console.log("Processing boxes for batch summary");
      
      // Process each box
      order.boxDistributions.forEach(box => {
        // Get batch number from box, or use individual item batch numbers
        const boxBatchNumber = box.batchNumber || "Unknown";
        console.log(`Processing box #${box.boxNumber} with batch ${boxBatchNumber}`);
        
        // Initialize the batch if not exists
        if (!batchMap[boxBatchNumber]) {
          batchMap[boxBatchNumber] = {
            batchNumber: boxBatchNumber,
            totalWeight: 0
          };
        }
        
        // Process items in this box with this batch number
        let boxItemsWeight = 0;
        box.items.forEach(item => {
          // Use item specific batch number if available, otherwise use box batch number
          const itemBatchNumber = item.batchNumber || boxBatchNumber;
          
          // If this item has a different batch than the box, handle separately
          if (itemBatchNumber !== boxBatchNumber) {
            if (!batchMap[itemBatchNumber]) {
              batchMap[itemBatchNumber] = {
                batchNumber: itemBatchNumber,
                totalWeight: 0
              };
            }
            // Add this item's weight to its specific batch
            const itemWeight = item.weight || 0;
            batchMap[itemBatchNumber].totalWeight += itemWeight;
            console.log(`Item with batch ${itemBatchNumber} in box #${box.boxNumber}: added ${itemWeight}g`);
          } else {
            // Add to box total for the box's batch number
            const itemWeight = item.weight || 0;
            boxItemsWeight += itemWeight;
          }
        });
        
        // Add all items that have the box's batch number
        batchMap[boxBatchNumber].totalWeight += boxItemsWeight;
        console.log(`Added ${boxItemsWeight}g to batch ${boxBatchNumber} from box #${box.boxNumber}`);
      });
    } 
    // If no box distributions, fall back to order-level and item-level batch information
    else {
      console.log("No boxes found, falling back to order-level batch information");
      
      // First look for batch numbers at the order level
      const orderBatchNumbers: string[] = [];
      
      // Add order.batchNumbers array if exists
      if (order.batchNumbers && order.batchNumbers.length > 0) {
        orderBatchNumbers.push(...order.batchNumbers);
        console.log(`Found order batch numbers: ${orderBatchNumbers.join(', ')}`);
      }
      // Otherwise add single batchNumber if exists
      else if (order.batchNumber) {
        orderBatchNumbers.push(order.batchNumber);
        console.log(`Found single order batch number: ${order.batchNumber}`);
      }
      
      // If no batch numbers at order level, use "Unknown"
      if (orderBatchNumbers.length === 0) {
        orderBatchNumbers.push("Unknown");
        console.log("No batch numbers found, using 'Unknown'");
      }
      
      // Process each item and assign to appropriate batch
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
        
        // Get the item's batch number, or fall back to the first order batch number
        const itemBatchNumber = item.batchNumber || orderBatchNumbers[0];
        
        // Initialize batch if not exists
        if (!batchMap[itemBatchNumber]) {
          batchMap[itemBatchNumber] = {
            batchNumber: itemBatchNumber,
            totalWeight: 0
          };
        }
        
        // Calculate item weight
        let itemWeight = 0;
        if (item.manualWeight && item.manualWeight > 0) {
          itemWeight = item.manualWeight;
          console.log(`Using manual weight for ${product.name} in batch ${itemBatchNumber}: ${itemWeight}g`);
        } else if (item.pickedWeight && item.pickedWeight > 0) {
          itemWeight = item.pickedWeight;
          console.log(`Using picked weight for ${product.name} in batch ${itemBatchNumber}: ${itemWeight}g`);
        } else if (product.weight) {
          itemWeight = product.weight * item.quantity;
          console.log(`Using calculated weight for ${product.name} in batch ${itemBatchNumber}: ${itemWeight}g`);
        }
        
        // Add to batch total
        batchMap[itemBatchNumber].totalWeight += itemWeight;
      });
    }
    
    // Log the final batch summaries
    Object.entries(batchMap).forEach(([batchNumber, summary]) => {
      console.log(`Batch ${batchNumber}: total weight ${summary.totalWeight}g`);
    });
    
    return Object.values(batchMap);
  };
  
  const batchSummaries = createBatchSummaries();

  // Calculate box weights
  const calculateBoxWeight = (box: any): number => {
    return box.items.reduce((total: number, item: any) => total + (item.weight || 0), 0);
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium py-2">Product</th>
                      <th className="text-left font-medium py-2">SKU</th>
                      <th className="text-right font-medium py-2">Quantity</th>
                      <th className="text-right font-medium py-2">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSummaries.map((summary) => (
                      <tr key={summary.productId} className="border-b">
                        <td className="py-3">
                          {summary.productName}
                          {summary.isWeighted && (
                            <span className="text-xs text-gray-500 ml-1">(Weighed)</span>
                          )}
                        </td>
                        <td className="py-3">{summary.sku}</td>
                        <td className="py-3 text-right">{summary.quantity}</td>
                        <td className="py-3 text-right">
                          {summary.totalWeight > 0
                            ? `${(summary.totalWeight / 1000).toFixed(2)} kg`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td className="py-3">Total</td>
                      <td className="py-3"></td>
                      <td className="py-3 text-right">{totalItems}</td>
                      <td className="py-3 text-right">
                        {totalWeight > 0 ? `${(totalWeight / 1000).toFixed(2)} kg` : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium py-2">Batch Number</th>
                        <th className="text-right font-medium py-2">Total Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchSummaries.map((batch, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 flex items-center">
                            <Barcode className="h-4 w-4 mr-2" />
                            {batch.batchNumber}
                          </td>
                          <td className="py-3 text-right">
                            {batch.totalWeight > 0
                              ? `${(batch.totalWeight / 1000).toFixed(2)} kg`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left font-medium py-2">Product</th>
                                <th className="text-right font-medium py-2">Quantity</th>
                                <th className="text-right font-medium py-2">Weight</th>
                                {box.items.some(item => item.batchNumber) && (
                                  <th className="text-right font-medium py-2">Batch</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {box.items.map((item, itemIndex) => {
                                const product = products.find(p => p.id === item.productId);
                                return (
                                  <tr key={itemIndex} className="border-b">
                                    <td className="py-2">
                                      {product?.name || "Unknown Product"}
                                      {isWeightedProduct(item.productId) && (
                                        <span className="text-xs text-gray-500 ml-1">(Weighed)</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right">{item.quantity}</td>
                                    <td className="py-2 text-right">
                                      {item.weight > 0 
                                        ? `${(item.weight / 1000).toFixed(2)} kg` 
                                        : isWeightedProduct(item.productId) 
                                          ? "Missing weight" 
                                          : "-"}
                                    </td>
                                    {box.items.some(item => item.batchNumber) && (
                                      <td className="py-2 text-right">
                                        {item.batchNumber || box.batchNumber || "-"}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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
    </div>
  );
};

export default ViewCompletedOrder;
