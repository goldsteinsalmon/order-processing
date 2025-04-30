
import React, { useEffect } from "react";
import PrintBoxLabel from "@/components/orders/PrintBoxLabel";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrintBoxLabelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the orderId from the URL - /print-box-label/:id
  const pathParts = location.pathname.split('/');
  const orderId = pathParts[2];
  
  // Extract box number from query parameter if present
  const searchParams = new URLSearchParams(location.search);
  const boxNumber = searchParams.get('box');

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
