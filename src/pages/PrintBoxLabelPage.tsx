
import React, { useEffect } from "react";
import PrintBoxLabel from "@/components/orders/PrintBoxLabel";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";

const PrintBoxLabelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, updateOrder } = useData();

  // Extract the orderId from the URL - /print-box-label/:id
  const pathParts = location.pathname.split('/');
  const orderId = pathParts[2];
  
  // Extract box number from query parameter if present
  const searchParams = new URLSearchParams(location.search);
  const boxNumber = searchParams.get('box');
  
  // Check if this box is allowed to be printed (order exists and if box number is specified, it's a valid box)
  const order = orders.find(order => order.id === orderId);
  
  // When box number is specified, verify that all previous boxes (except box 0) have been completed
  useEffect(() => {
    // Set document title
    document.title = "Print Box Label";
    
    if (order && boxNumber) {
      const boxNum = parseInt(boxNumber);
      
      // Set more specific document title now that we have order info
      document.title = `Print Box Label - ${order.customer?.name || "Order"} - Box ${boxNum}`;
      
      // Mark this box as completed when the page loads
      if (order && boxNum > 0) {
        const updatedCompletedBoxes = [...(order.completedBoxes || [])];
        if (!updatedCompletedBoxes.includes(boxNum)) {
          updatedCompletedBoxes.push(boxNum);
          
          // Update the order with this box marked as completed
          updateOrder({
            ...order,
            completedBoxes: updatedCompletedBoxes
          });
        }
      }
    }
  }, [order, boxNumber, updateOrder]);

  const handleReturn = () => {
    // Navigate back to picking list for this order
    if (orderId) {
      // If we're printing a specific box, determine the next box to process
      if (boxNumber && order) {
        const currentBoxNum = parseInt(boxNumber);
        
        // Find all possible box numbers from the order's box distributions
        const boxNumbers = order.boxDistributions
          ?.map(box => box.boxNumber)
          .filter(num => num > 0)
          .sort((a, b) => a - b) || [];
        
        // Find the next box after the current one
        const currentBoxIndex = boxNumbers.indexOf(currentBoxNum);
        const nextBoxIndex = currentBoxIndex + 1;
        
        // If there's a next box, redirect to the picking list with that box highlighted
        if (nextBoxIndex < boxNumbers.length) {
          const nextBoxNum = boxNumbers[nextBoxIndex];
          navigate(`/picking-list/${orderId}?nextBox=${nextBoxNum}`);
          return;
        }
      }
      
      // If no specific next box or we're done with all boxes, just go back to the picking list
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
