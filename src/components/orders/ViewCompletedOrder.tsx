
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Box, Barcode } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface BatchSummaryInfo {
  batchNumber: string;
  totalWeight: number;
  products: {
    name: string;
    quantity: number;
    weight: number;
  }[];
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

  // Calculate order totals
  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
  
  // Create batch summary
  const batchSummary: BatchSummaryInfo[] = calculateBatchSummary();
  
  // Function to calculate batch summary from order data
  function calculateBatchSummary(): BatchSummaryInfo[] {
    const summary: Record<string, BatchSummaryInfo> = {};
    
    // Function to add product to a batch
    const addToBatch = (batchNumber: string, productId: string, quantity: number, weight: number) => {
      if (!batchNumber) return;
      
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      // Calculate weight if not provided
      const productWeight = weight > 0 ? weight : (product.weight ? product.weight * quantity : 0);
      
      if (!summary[batchNumber]) {
        summary[batchNumber] = {
          batchNumber,
          totalWeight: 0,
          products: []
        };
      }
      
      // Check if product already exists in this batch
      const existingProduct = summary[batchNumber].products.find(p => p.name === product.name);
      
      if (existingProduct) {
        existingProduct.quantity += quantity;
        existingProduct.weight += productWeight;
      } else {
        summary[batchNumber].products.push({
          name: product.name,
          quantity,
          weight: productWeight
        });
      }
      
      summary[batchNumber].totalWeight += productWeight;
    };
    
    // Process items in boxes first if available
    if ((order.boxes && order.boxes.length > 0) || 
        (order.boxDistributions && order.boxDistributions.length > 0)) {
      
      const boxes = order.boxDistributions || order.boxes || [];
      
      boxes.forEach(box => {
        if (!box.items || box.items.length === 0) return;
        
        const boxBatch = box.batchNumber || 
          order.batchNumber || 
          (order.batchNumbers && order.batchNumbers.length > 0 ? order.batchNumbers[0] : "Unknown");
        
        box.items.forEach(item => {
          const batchToUse = item.batchNumber || boxBatch;
          const weight = item.weight || 0;
          
          addToBatch(batchToUse, item.productId, item.quantity, weight);
        });
      });
    } 
    // If no boxes, use order items directly
    else if (order.items && order.items.length > 0) {
      const defaultBatch = order.batchNumber || 
        (order.batchNumbers && order.batchNumbers.length > 0 ? order.batchNumbers[0] : "Unknown");
      
      order.items.forEach(item => {
        const batchToUse = item.batchNumber || defaultBatch;
        const weight = item.pickedWeight || 0;
        
        addToBatch(batchToUse, item.productId, item.quantity, weight);
      });
    }
    
    return Object.values(summary);
  }

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
                      {order.items.some(item => item.boxNumber) && (
                        <th className="text-right font-medium py-2">Box</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">{item.product.name}</td>
                        <td className="py-3">{item.product.sku}</td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        {order.items.some(item => item.boxNumber) && (
                          <td className="py-3 text-right">{item.boxNumber || "-"}</td>
                        )}
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td colSpan={2} className="py-3">Total Items</td>
                      <td colSpan={order.items.some(item => item.boxNumber) ? 2 : 1} className="py-3 text-right">{totalItems}</td>
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
              {batchSummary.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No batch information available</p>
              ) : (
                <div className="space-y-6">
                  {batchSummary.map((batch, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold flex items-center">
                          <Barcode className="h-4 w-4 mr-2" />
                          Batch: {batch.batchNumber}
                        </h4>
                        <span className="text-sm font-medium">
                          Total: {(batch.totalWeight / 1000).toFixed(2)} kg
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left font-medium py-2">Product</th>
                              <th className="text-right font-medium py-2">Quantity</th>
                              <th className="text-right font-medium py-2">Weight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batch.products.map((product, productIndex) => (
                              <tr key={productIndex} className="border-b">
                                <td className="py-2">{product.name}</td>
                                <td className="py-2 text-right">{product.quantity}</td>
                                <td className="py-2 text-right">
                                  {(product.weight / 1000).toFixed(2)} kg
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
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
                  {(order.boxDistributions || order.boxes || []).map((box, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold flex items-center">
                          <Box className="h-4 w-4 mr-2" />
                          Box #{box.boxNumber}
                        </h4>
                        {box.batchNumber && (
                          <span className="text-sm font-medium">
                            Batch: {box.batchNumber}
                          </span>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left font-medium py-2">Product</th>
                              <th className="text-right font-medium py-2">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {box.items.map((item, itemIndex) => {
                              const product = products.find(p => p.id === item.productId);
                              return (
                                <tr key={itemIndex} className="border-b">
                                  <td className="py-2">{product?.name || "Unknown Product"}</td>
                                  <td className="py-2 text-right">{item.quantity}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
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
