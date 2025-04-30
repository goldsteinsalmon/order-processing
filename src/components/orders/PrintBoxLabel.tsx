
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Printer } from "lucide-react";

const PrintBoxLabel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, completedOrders } = useData();
  const [labelCount, setLabelCount] = useState<number>(1);
  
  // Check in both orders and completedOrders since the order might have just been moved
  const order = [...orders, ...completedOrders].find(order => order.id === id);

  // Hide navbar on print page load
  useEffect(() => {
    document.title = `Box Label - ${order?.customer.name || "Order"}`;
  }, [order]);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleBackToOrders = () => {
    navigate("/");
  };

  return (
    <div>
      {/* Controls - hidden during printing */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBackToOrders} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Button>
          <h2 className="text-2xl font-bold">Print Box Labels</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="labelCount" className="mr-2">Number of Labels:</label>
            <Input 
              id="labelCount"
              type="number" 
              min="1" 
              max="20"
              value={labelCount} 
              onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
              className="w-20" 
            />
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Labels for printing */}
      <div>
        {Array.from({ length: labelCount }).map((_, index) => (
          <div key={index} className="box-label border rounded-lg mb-4">
            <div className="box-label-content p-6">
              <div className="flex flex-col items-center">
                {/* Customer name in large font */}
                <h1 className="text-4xl font-bold text-center mb-2">{order.customer.name}</h1>
                
                {/* Order ID in smaller font */}
                <p className="text-sm mb-4">Order: {order.id}</p>
                
                {/* Products and quantities */}
                <div className="w-full">
                  {order.items.map((item) => (
                    <div key={item.id} className="text-sm mb-1 flex justify-between">
                      <span>{item.product.name}</span>
                      <span>{item.quantity} {item.product.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintBoxLabel;
