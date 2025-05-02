
import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { format } from "date-fns";

const ExportLabelPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders } = useData();
  const printRef = useRef<HTMLDivElement>(null);
  
  const order = orders.find(o => o.id === orderId);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Label-${orderId?.substring(0, 8)}`,
    content: () => printRef.current,
  });
  
  const handleBack = () => {
    navigate(`/orders/${orderId}`);
  };
  
  if (!order || !order.customer) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-medium mb-4">Order not found</h2>
          <Button onClick={() => navigate("/orders")}>Return to Orders</Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shipping Label</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Order
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Label
          </Button>
        </div>
      </div>
      
      {/* Printable shipping label */}
      <div ref={printRef} className="max-w-xl mx-auto my-8">
        <Card className="border-2 p-0">
          <CardContent className="p-8">
            <div className="flex justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold mb-2">SHIP TO:</h2>
                <div className="text-lg">
                  <p className="font-bold">{order.customer.name}</p>
                  <p className="whitespace-pre-line">{order.customer.address}</p>
                  {order.customer.phone && <p>Phone: {order.customer.phone}</p>}
                </div>
              </div>
              
              <div className="text-right">
                <h3 className="font-bold">Order: {orderId?.substring(0, 8)}</h3>
                <p className="text-sm">Date: {format(new Date(order.orderDate || order.order_date), "dd/MM/yyyy")}</p>
                <p className="text-sm">Delivery: {order.deliveryMethod || order.delivery_method}</p>
                {order.customerOrderNumber && (
                  <p className="text-sm">Customer Ref: {order.customerOrderNumber}</p>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-bold mb-2">Order Details:</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Qty</th>
                    <th className="text-left py-1">Product</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-1">{item.quantity}</td>
                      <td className="py-1">{item.product?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {order.notes && (
              <div className="mt-4 p-2 border border-dashed">
                <p className="font-bold">Notes:</p>
                <p>{order.notes}</p>
              </div>
            )}
            
            <div className="mt-8 text-center text-sm">
              <p>Thank you for your order!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExportLabelPage;
