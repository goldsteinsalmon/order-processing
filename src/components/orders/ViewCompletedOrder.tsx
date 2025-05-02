
import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer } from 'lucide-react';
import { getOrderDate, getPickedBy, getPickedAt } from '@/utils/propertyHelpers';

const ViewCompletedOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { completedOrders } = useData();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Find the selected order
  const selectedOrder = completedOrders.find(order => order.id === id);
  
  // Setup print handler with correct options
  const handlePrint = useReactToPrint({
    documentTitle: `Order - ${selectedOrder?.customer?.name || 'Unknown'} - ${format(new Date(), 'yyyy-MM-dd')}`,
    contentRef: printRef
  });
  
  if (!selectedOrder) {
    return <div>Order not found</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Completed Order #{selectedOrder?.orderNumber || selectedOrder?.order_number || selectedOrder?.id.substring(0, 8)}
        </h2>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print Order
        </Button>
      </div>
      
      <div ref={printRef} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer: {selectedOrder.customer.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Order Date</div>
                <div>{format(new Date(getOrderDate(selectedOrder)), 'MMMM d, yyyy')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Delivery Method</div>
                <div>{selectedOrder.delivery_method}</div>
              </div>
              {getPickedBy(selectedOrder) && (
                <div>
                  <div className="text-sm text-gray-500">Picked By</div>
                  <div>{getPickedBy(selectedOrder)}</div>
                </div>
              )}
              {getPickedAt(selectedOrder) && (
                <div>
                  <div className="text-sm text-gray-500">Picked At</div>
                  <div>{format(new Date(getPickedAt(selectedOrder) as string), 'MMMM d, yyyy h:mm a')}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Product</th>
                  <th className="text-right pb-2">Quantity</th>
                  <th className="text-right pb-2">Batch</th>
                  <th className="text-right pb-2">Weight</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.product.name}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{item.batch_number || 'N/A'}</td>
                    <td className="py-2 text-right">
                      {item.picked_weight 
                        ? `${item.picked_weight} ${item.product.unit || 'g'}`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        
        {selectedOrder.batchSummaries && selectedOrder.batchSummaries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Batch Number</th>
                    <th className="text-right pb-2">Total Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.batchSummaries.map((batch, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{batch.batchNumber}</td>
                      <td className="py-2 text-right">{batch.totalWeight} g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        
        {selectedOrder.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{selectedOrder.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ViewCompletedOrder;
