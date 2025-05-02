
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { Box, BoxItem, Order, Customer } from "@/types";

const BoxLabelPage: React.FC = () => {
  const { orderId, boxNumber } = useParams<{ orderId: string; boxNumber: string }>();
  const navigate = useNavigate();
  const { orders } = useData();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (orderId) {
      const foundOrder = orders.find((o) => o.id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
        setCustomer(foundOrder.customer || null);

        if (boxNumber && foundOrder.boxDistributions) {
          const foundBox = foundOrder.boxDistributions.find(
            (b) => b.boxNumber === parseInt(boxNumber)
          );
          if (foundBox) {
            setBox(foundBox);
          }
        }
      }
    }
  }, [orderId, boxNumber, orders]);

  const handlePrint = useReactToPrint({
    documentTitle: `Box-${boxNumber}-${orderId?.substring(0, 8)}`,
    content: () => printRef.current,
  });

  const handleBack = () => {
    navigate(`/orders/${orderId}/picking`);
  };

  if (!order || !box || !customer) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-medium mb-4">Box label not found</h2>
          <Button onClick={handleBack}>Return to Order</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Box Label</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Picking
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Label
          </Button>
        </div>
      </div>

      {/* Printable box label */}
      <div ref={printRef} className="max-w-xl mx-auto my-8">
        <Card className="border-2 p-0">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Box {boxNumber}</h2>
              <p className="text-gray-500 text-sm">
                Order: {orderId?.substring(0, 8)}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Customer</h3>
              <p className="font-bold">{customer.name}</p>
              <p>{customer.address}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Contents</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">Quantity</th>
                    {customer.needsDetailedBoxLabels && (
                      <th className="text-right py-2">Batch</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {box.items.map((item: BoxItem) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.productName}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      {customer.needsDetailedBoxLabels && (
                        <td className="py-2 text-right">{item.batchNumber || "-"}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-sm text-gray-500 text-center">
              <p>Box {boxNumber} of {order.boxDistributions?.length || "?"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BoxLabelPage;
