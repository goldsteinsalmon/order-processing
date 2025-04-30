
import React, { forwardRef } from "react";
import { format } from "date-fns";
import { OrderItem, Order, Box, BoxItem } from "@/types";
import { Package, Weight } from "lucide-react";

interface ExtendedOrderItem extends OrderItem {
  checked: boolean;
  batchNumber: string;
}

interface PrintablePickingListProps {
  selectedOrder: Order;
  items: ExtendedOrderItem[];
  groupByBox?: boolean;
  specificBoxNumber?: number; // Added to allow printing a specific box only
}

const PrintablePickingList = forwardRef<HTMLDivElement, PrintablePickingListProps>(
  ({ selectedOrder, items, groupByBox = false, specificBoxNumber }, ref) => {
    // Check if we have any items requiring weight input
    const hasWeightInputItems = items.some(item => item.product.requiresWeightInput);
    
    // Group items by box if needed
    const groupedItems = React.useMemo(() => {
      // If a specific box number is given, only include those items
      if (specificBoxNumber !== undefined) {
        const boxItems = items.filter(item => item.boxNumber === specificBoxNumber);
        return { [specificBoxNumber]: boxItems };
      }
      
      // Otherwise group all items
      if (!groupByBox && !selectedOrder.customer.needsDetailedBoxLabels) return { 0: items };
      
      return items.reduce((acc, item) => {
        const boxNumber = item.boxNumber || 0;
        if (!acc[boxNumber]) {
          acc[boxNumber] = [];
        }
        acc[boxNumber].push(item);
        return acc;
      }, {} as Record<number, ExtendedOrderItem[]>);
    }, [items, groupByBox, selectedOrder.customer.needsDetailedBoxLabels, specificBoxNumber]);
    
    return (
      <div ref={ref} className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Picking List</h2>
          <p>{format(new Date(), "MMMM d, yyyy")}</p>
          {specificBoxNumber !== undefined && (
            <div className="mt-2 text-xl font-bold">
              Box #{specificBoxNumber}
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold">Customer: {selectedOrder.customer.name}</h3>
          <p>Order Date: {format(new Date(selectedOrder.orderDate), "MMMM d, yyyy")}</p>
          <p>Delivery Method: {selectedOrder.deliveryMethod}</p>
          {selectedOrder.notes && (
            <div className="mt-2">
              <p className="font-bold">Notes:</p>
              <p>{selectedOrder.notes}</p>
            </div>
          )}
        </div>
        
        {/* Render items either grouped by box or all together */}
        {(groupByBox || selectedOrder.customer.needsDetailedBoxLabels) ? (
          // Grouped by box
          Object.entries(groupedItems).map(([boxNumberStr, boxItems]) => {
            const boxNumber = parseInt(boxNumberStr);
            const boxTitle = boxNumber === 0 ? "Unassigned Items" : `Box ${boxNumber}`;
            
            return (
              <div key={boxNumberStr} className="mb-8">
                <h3 className="text-lg font-bold flex items-center mb-2 border-b pb-1">
                  <Package className="mr-2 h-4 w-4" />
                  {boxTitle}
                </h3>
                
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">SKU</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-left py-2">Batch #</th>
                      {hasWeightInputItems && <th className="text-right py-2">Weight (kg)</th>}
                      <th className="text-center py-2">Picked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boxItems.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">
                          {item.product.name}
                          {item.product.requiresWeightInput && (
                            <div className="text-xs italic flex items-center">
                              <Weight className="h-3 w-3 mr-1" />
                              Requires weight input
                            </div>
                          )}
                        </td>
                        <td className="py-2">{item.product.sku}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2">_________________</td>
                        {hasWeightInputItems && (
                          <td className="py-2 text-right">
                            {item.product.requiresWeightInput ? "_________________" : "N/A"}
                          </td>
                        )}
                        <td className="py-2 text-center">□</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        ) : (
          // All items together (original format)
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">SKU</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-left py-2">Batch #</th>
                {hasWeightInputItems && <th className="text-right py-2">Weight (kg)</th>}
                <th className="text-center py-2">Picked</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">
                    {item.product.name}
                    {item.product.requiresWeightInput && (
                      <div className="text-xs italic flex items-center">
                        <Weight className="h-3 w-3 mr-1" />
                        Requires weight input
                      </div>
                    )}
                  </td>
                  <td className="py-2">{item.product.sku}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2">_________________</td>
                  {hasWeightInputItems && (
                    <td className="py-2 text-right">
                      {item.product.requiresWeightInput ? "_________________" : "N/A"}
                    </td>
                  )}
                  <td className="py-2 text-center">□</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        <div className="mt-8">
          <p>Picked by: ________________________</p>
          <p className="mt-4">Signature: ________________________</p>
        </div>
      </div>
    );
  }
);

PrintablePickingList.displayName = "PrintablePickingList";

export default PrintablePickingList;
