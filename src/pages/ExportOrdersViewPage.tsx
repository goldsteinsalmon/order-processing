import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Printer } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { getItemWeight } from "@/utils/exportUtils";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@/hooks/use-toast";
import { OrderItem } from "@/types";

const ExportOrdersViewPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completedOrders, updateOrder } = useData();
  const [selectedOrders, setSelectedOrders] = useState<Array<any>>([]);
  const printRef = React.useRef<HTMLDivElement>(null);

  // Extract selected orders based on IDs from location state
  useEffect(() => {
    const state = location.state as { selectedOrderIds?: string[] };
    if (!state || !state.selectedOrderIds || state.selectedOrderIds.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to export from the export page.",
        variant: "destructive"
      });
      navigate("/export-orders");
      return;
    }

    const ordersToExport = completedOrders.filter(order => 
      state.selectedOrderIds!.includes(order.id)
    );
    
    if (ordersToExport.length === 0) {
      toast({
        title: "Orders not found",
        description: "The selected orders could not be found.",
        variant: "destructive"
      });
      navigate("/export-orders");
      return;
    }

    setSelectedOrders(ordersToExport);
    
    // Mark orders as invoiced immediately when viewing the export
    const notInvoicedOrders = ordersToExport.filter(order => !order.invoiced);
    if (notInvoicedOrders.length > 0) {
      notInvoicedOrders.forEach(order => {
        updateOrder({
          ...order,
          invoiced: true,
          invoiceDate: new Date().toISOString(),
        });
      });
      
      toast({
        title: "Orders marked as invoiced",
        description: `${notInvoicedOrders.length} orders have been marked as invoiced.`
      });
    }
  }, [location, completedOrders, navigate, toast, updateOrder]);

  // Print functionality
  const handlePrint = useReactToPrint({
    documentTitle: `Order-Export-${format(new Date(), 'yyyy-MM-dd')}`,
    contentRef: printRef,
    onAfterPrint: () => {
      toast({
        title: "Print completed",
        description: "The export has been sent to your printer."
      });
    }
  });

  // New function to aggregate items by product
  const aggregateOrderItems = (order: any): OrderItem[] => {
    // Create a map to combine same products
    const productMap = new Map<string, OrderItem & { totalWeight: number }>();
    
    // Process all items in the order
    order.items.forEach((item: OrderItem) => {
      const productId = item.product_id;
      
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          ...item,
          quantity: 0,
          totalWeight: 0
        });
      }
      
      const existingItem = productMap.get(productId)!;
      existingItem.quantity += item.quantity;
      
      // Add weights if available
      const weight = getItemWeight(item);
      if (weight > 0) {
        existingItem.totalWeight += weight;
      }
    });
    
    return Array.from(productMap.values());
  };

  // Return to export page
  const handleBack = () => {
    navigate("/export-orders");
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Export Preview</h2>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print Export
        </Button>
      </div>

      {/* Main content - this is both displayed on screen and used for printing */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div ref={printRef}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Order Export</h1>
            <p className="text-gray-500">Generated on {format(new Date(), "PPP")}</p>
            <p className="text-gray-500">Total Orders: {selectedOrders.length}</p>
          </div>
          
          {selectedOrders.map(order => {
            // Get aggregated items for this order
            const aggregatedItems = aggregateOrderItems(order);
            
            return (
              <div key={order.id} className="mb-8 pb-6 border-b border-gray-200">
                {/* Customer name now bigger and more prominent */}
                <h2 className="text-2xl font-bold mb-2 text-primary">
                  {order.customer.name}
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    {order.customer.accountNumber && (
                      <p className="text-sm text-gray-600">Account #: {order.customer.accountNumber}</p>
                    )}
                    {order.customerOrderNumber && (
                      <p className="text-sm text-gray-600">Customer Order #: {order.customerOrderNumber}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{format(parseISO(order.orderDate), "PPP")}</p>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2 mt-4">Items</h3>
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="py-2 text-left">SKU</th>
                      <th className="py-2 text-left">Product</th>
                      <th className="py-2 text-left">Quantity</th>
                      <th className="py-2 text-left">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedItems.map((item: any, idx: number) => {
                      // Use totalWeight if available, otherwise calculate from getItemWeight
                      const weight = item.totalWeight > 0 ? item.totalWeight : getItemWeight(item);
                      const weightValue = weight > 0 ? `${(weight / 1000).toFixed(3)} kg` : "-";
                      
                      return (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-2">{item.product.sku}</td>
                          <td className="py-2">{item.product.name}</td>
                          <td className="py-2">{item.quantity}</td>
                          <td className="py-2">{weightValue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    Order completed and invoiced on {format(new Date(), "PPP")}
                  </p>
                </div>
              </div>
            );
          })}
          
          <div className="mt-10 pt-4 border-t border-gray-300 text-sm text-gray-500">
            <p>This document was generated from the order management system.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExportOrdersViewPage;
