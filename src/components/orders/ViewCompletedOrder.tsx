
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Printer, Weight, Download } from "lucide-react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@/hooks/use-toast";
import PrintablePickingList from "./picking/PrintablePickingList";

const ViewCompletedOrder: React.FC = () => {
  const { completedOrders } = useData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [batchSummaries, setBatchSummaries] = useState<any[]>([]);
  
  const printRef = React.useRef<HTMLDivElement>(null);
  
  // Find the completed order by ID
  useEffect(() => {
    if (id && completedOrders) {
      const order = completedOrders.find(order => order.id === id);
      if (order) {
        setSelectedOrder(order);
        
        // Process batch summaries if they exist or calculate them
        if (order.batchSummaries && order.batchSummaries.length > 0) {
          setBatchSummaries(order.batchSummaries);
        } else if (order.batch_numbers) {
          // We'd need to calculate batch summaries from the items with batch numbers
          // This is a simplified version, ideally we'd calculate actual weights
          const summarizedBatches = new Map<string, number>();
          
          order.items.forEach((item: any) => {
            if (item.batch_number) {
              const weight = item.picked_weight || 
                (item.product.weight ? item.product.weight * item.quantity : 0);
              
              const currentWeight = summarizedBatches.get(item.batch_number) || 0;
              summarizedBatches.set(item.batch_number, currentWeight + weight);
            }
          });
          
          const calculatedSummaries = Array.from(summarizedBatches.entries()).map(([batchNumber, totalWeight]) => ({
            batchNumber,
            totalWeight
          }));
          
          setBatchSummaries(calculatedSummaries);
        }
      }
    }
  }, [id, completedOrders]);
  
  // Handle printing
  const handlePrint = useReactToPrint({
    documentTitle: `Order Details - ${selectedOrder?.customer.name || "Unknown"} - ${format(new Date(), "yyyy-MM-dd")}`,
    content: () => printRef.current,
    onAfterPrint: () => {
      toast({
        title: "Order details printed",
        description: "The order details have been sent to the printer."
      });
    }
  });
  
  if (!selectedOrder) {
    return <div className="p-6">Loading order details...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Details</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate("/completed-orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Order for {selectedOrder.customer.name}</span>
            <span className="text-green-600">{selectedOrder.status}</span>
          </CardTitle>
          <CardDescription>
            Order Date: {format(new Date(selectedOrder.orderDate || selectedOrder.order_date), "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p>Name: {selectedOrder.customer.name}</p>
              <p>Email: {selectedOrder.customer.email}</p>
              <p>Phone: {selectedOrder.customer.phone}</p>
              <p>Address: {selectedOrder.customer.address}</p>
              <p>Type: {selectedOrder.customer.type}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Order Information</h3>
              <p>Delivery Method: {selectedOrder.deliveryMethod || selectedOrder.delivery_method}</p>
              <p>Customer Order Number: {selectedOrder.customerOrderNumber || selectedOrder.customer_order_number || "N/A"}</p>
              <p>Picked By: {selectedOrder.picker || "N/A"}</p>
              <p>Picked At: {selectedOrder.pickedAt ? format(new Date(selectedOrder.pickedAt || selectedOrder.picked_at), "PPpp") : "N/A"}</p>
              {selectedOrder.invoiced && (
                <>
                  <p>Invoice Number: {selectedOrder.invoiceNumber || selectedOrder.invoice_number || "N/A"}</p>
                  <p>Invoice Date: {selectedOrder.invoiceDate ? format(new Date(selectedOrder.invoiceDate || selectedOrder.invoice_date), "PPP") : "N/A"}</p>
                </>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">SKU</th>
                    <th className="text-center py-2">Quantity</th>
                    <th className="text-center py-2">Picked</th>
                    <th className="text-center py-2">Missing</th>
                    <th className="text-left py-2">Batch #</th>
                    <th className="text-right py-2">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">
                        {item.product.name}
                        {item.product.requires_weight_input && (
                          <div className="text-xs italic flex items-center mt-1">
                            <Weight className="h-3 w-3 mr-1" /> Weight recorded
                          </div>
                        )}
                      </td>
                      <td className="py-2">{item.product.sku}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-center">{item.picked_quantity || item.quantity}</td>
                      <td className="py-2 text-center">{item.missing_quantity || 0}</td>
                      <td className="py-2">{item.batch_number || "N/A"}</td>
                      <td className="py-2 text-right">
                        {item.product.requires_weight_input && item.picked_weight ? 
                          `${item.picked_weight} ${item.product.unit || 'g'}` : 
                          item.product.weight ? `${item.product.weight * item.quantity} ${item.product.unit || 'g'}` : "N/A"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {batchSummaries && batchSummaries.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Batch Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {batchSummaries.map((batch, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <p className="font-medium">Batch: {batch.batchNumber}</p>
                    <p>Total Weight: {batch.totalWeight.toFixed(2)} g</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedOrder.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="whitespace-pre-line">{selectedOrder.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Hidden printable version */}
      <div className="hidden">
        <PrintablePickingList
          ref={printRef}
          selectedOrder={selectedOrder}
          items={selectedOrder.items}
          groupByBox={selectedOrder.customer.needsDetailedBoxLabels}
        />
      </div>
    </div>
  );
};

export default ViewCompletedOrder;
