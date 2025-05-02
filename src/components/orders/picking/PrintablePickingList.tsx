
import React, { ForwardRefRenderFunction, forwardRef } from "react";
import { OrderBase, OrderItem } from "@/types";
import { format } from "date-fns";
import { ExtendedOrderItem } from "./ItemsTable"; // Import the type from our new file
import { getOrderDate, getCustomerOrderNumber, getDeliveryMethod, getAccountNumber } from "@/utils/propertyHelpers";

interface PrintablePickingListProps {
  selectedOrder: OrderBase;
  items: ExtendedOrderItem[];
  groupByBox?: boolean;
}

const PrintablePickingList: ForwardRefRenderFunction<HTMLDivElement, PrintablePickingListProps> = (
  { selectedOrder, items, groupByBox = false },
  ref
) => {
  // Group items by box if needed
  const groupedItems = React.useMemo(() => {
    if (!groupByBox) return { noBox: items };
    
    return items.reduce((acc, item) => {
      const boxNumber = item.boxNumber || 0;
      if (!acc[boxNumber]) {
        acc[boxNumber] = [];
      }
      acc[boxNumber].push(item);
      return acc;
    }, {} as Record<number, ExtendedOrderItem[]>);
  }, [items, groupByBox]);

  // Format today's date
  const today = format(new Date(), "MMMM d, yyyy");
  
  // Calculate total weight for products that have weight info
  const getTotalWeight = (boxItems: ExtendedOrderItem[]) => {
    return boxItems
      .filter(item => item.product?.requiresWeightInput)
      .reduce((total, item) => {
        const weight = item.pickedWeight || 0;
        return total + weight;
      }, 0);
  };
  
  // Safe getter for order date with fallback
  const orderDate = getOrderDate(selectedOrder);
  const customerOrderNumber = getCustomerOrderNumber(selectedOrder);
  const deliveryMethod = getDeliveryMethod(selectedOrder);
  const customerAccountNumber = selectedOrder.customer ? getAccountNumber(selectedOrder.customer) : undefined;

  return (
    <div ref={ref} className="p-8 bg-white print:text-black">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Picking List</h1>
        <p className="text-sm">Generated on {today}</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold border-b pb-1 mb-2">Customer Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold">Customer:</p>
            <p>{selectedOrder.customer?.name}</p>
            {customerAccountNumber && (
              <p className="text-sm">Account: {customerAccountNumber}</p>
            )}
          </div>
          <div>
            <p><span className="font-bold">Order Date:</span> {orderDate ? format(new Date(orderDate), "MMMM d, yyyy") : 'N/A'}</p>
            <p><span className="font-bold">Delivery Method:</span> {deliveryMethod}</p>
            {customerOrderNumber && (
              <p><span className="font-bold">Customer Order Number:</span> {customerOrderNumber}</p>
            )}
          </div>
        </div>
      </div>

      {groupByBox ? (
        // Render by box
        Object.entries(groupedItems).map(([boxNumberStr, boxItems]) => {
          const boxNumber = parseInt(boxNumberStr, 10);
          const totalWeight = getTotalWeight(boxItems);
          
          return (
            <div key={`print-box-${boxNumber}`} className="mb-6 break-inside-avoid">
              <h2 className="text-xl font-bold border-b pb-1 mb-2">Box {boxNumber}</h2>
              
              <table className="w-full mb-2">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-1">Product</th>
                    <th className="text-right pb-1">Quantity</th>
                    <th className="text-right pb-1">Batch #</th>
                    <th className="text-right pb-1">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {boxItems.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="py-1">{item.product?.name}</td>
                      <td className="py-1 text-right">{item.quantity}</td>
                      <td className="py-1 text-right">{item.batchNumber || ''}</td>
                      <td className="py-1 text-right">
                        {item.product?.requiresWeightInput
                          ? `${item.pickedWeight || '-'} ${item.product?.unit || 'g'}`
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {totalWeight > 0 && (
                <div className="text-right font-bold mt-2">
                  Total Weight: {totalWeight} g
                </div>
              )}
            </div>
          );
        })
      ) : (
        // Render simple list
        <div>
          <h2 className="text-xl font-bold border-b pb-1 mb-2">Items</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-1">Product</th>
                <th className="text-right pb-1">Quantity</th>
                <th className="text-right pb-1">Batch #</th>
                <th className="text-right pb-1">Weight</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-1">{item.product?.name}</td>
                  <td className="py-1 text-right">{item.quantity}</td>
                  <td className="py-1 text-right">{item.batchNumber || ''}</td>
                  <td className="py-1 text-right">
                    {item.product?.requiresWeightInput
                      ? `${item.pickedWeight || '-'} ${item.product?.unit || 'g'}`
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedOrder.notes && (
        <div className="mt-6">
          <h2 className="text-xl font-bold border-b pb-1 mb-2">Notes</h2>
          <p>{selectedOrder.notes}</p>
        </div>
      )}
    </div>
  );
};

export default forwardRef(PrintablePickingList);
