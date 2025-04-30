
import React, { useEffect } from "react";
import PrintBoxLabel from "@/components/orders/PrintBoxLabel";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";

const PrintBoxLabelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useData();

  // Extract the orderId from the URL - /print-box-label/:id
  const pathParts = location.pathname.split('/');
  const orderId = pathParts[2];
  
  // Extract box number from query parameter if present
  const searchParams = new URLSearchParams(location.search);
  const boxNumber = searchParams.get('box');
  
  // Check if this box is allowed to be printed (order exists and if box number is specified, it's a valid box)
  const orderExists = orders.find(order => order.id === orderId);
  
  // When box number is specified, verify that all previous boxes (except box 0) have been completed
  useEffect(() => {
    // Set document title
    document.title = "Print Box Label";
    
    if (orderExists && boxNumber) {
      const boxNum = parseInt(boxNumber);
      
      // Set more specific document title now that we have order info
      document.title = `Print Box Label - ${orderExists.customer?.name || "Order"} - Box ${boxNum}`;
    }
  }, [orderExists, boxNumber]);

  const handleReturn = () => {
    // Navigate back to picking list for this order
    if (orderId) {
      navigate(`/picking-list/${orderId}`);
    } else {
      navigate("/orders");
    }
  };

  return (
    <div className="print-page">
      <div className="mb-4 py-3 no-print">
        <Button variant="outline" onClick={handleReturn}>
          <ArrowLeft className="h-4 w-4 mr-2" /> 
          Back to Picking List
        </Button>
      </div>
      <PrintBoxLabel />
    </div>
  );
};

export default PrintBoxLabelPage;
