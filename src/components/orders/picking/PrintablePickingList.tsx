
import React, { forwardRef } from "react";
import { format } from "date-fns";
import { OrderItem, Order } from "@/types";

interface ExtendedOrderItem extends OrderItem {
  checked: boolean;
  batchNumber: string;
}

interface PrintablePickingListProps {
  selectedOrder: Order;
  items: ExtendedOrderItem[];
}

const PrintablePickingList = forwardRef<HTMLDivElement, PrintablePickingListProps>(
  ({ selectedOrder, items }, ref) => {
    // Check if we have any items requiring weight input
    const hasWeightInputItems = items.some(item => item.product.requiresWeightInput);
    
    return (
      <div ref={ref} className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Picking List</h2>
          <p>{format(new Date(), "MMMM d, yyyy")}</p>
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
                    <div className="text-xs italic">(Requires weight input)</div>
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
