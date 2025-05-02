
import React, { useEffect, useRef } from "react";
import PrintBoxLabel from "@/components/orders/PrintBoxLabel";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { getCompletedBoxes } from "@/utils/propertyHelpers";

const PrintBoxLabelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, updateOrder } = useData();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Extract the orderId from the URL - /print-box-label/:id
  const pathParts = location.pathname.split('/');
  const orderId = pathParts[2];
  
  // Extract box number from query parameter if present
  const searchParams = new URLSearchParams(location.search);
  const boxNumber = searchParams.get('box');
  
  // Check if this box is allowed to be printed (order exists and if box number is specified, it's a valid box)
  const order = orders.find(order => order.id === orderId);

  // Handle saving data and marking box as completed
  const saveBoxData = () => {
    if (order && boxNumber) {
      const boxNum = parseInt(boxNumber);
      
      // Mark this box as completed
      if (boxNum > 0) {
        // Create copies to avoid directly mutating state
        const updatedCompletedBoxes = [...(getCompletedBoxes(order) || [])];
        const updatedSavedBoxes = [...(order.savedBoxes || [])];
        
        // Mark the box as completed if not already
        if (!updatedCompletedBoxes.includes(boxNum)) {
          updatedCompletedBoxes.push(boxNum);
        }
        
        // Ensure the box is also marked as saved
        if (!updatedSavedBoxes.includes(boxNum)) {
          updatedSavedBoxes.push(boxNum);
        }
        
        // Update the order with this box marked as completed and saved
        updateOrder({
          ...order,
          completedBoxes: updatedCompletedBoxes,
          savedBoxes: updatedSavedBoxes,
          pickedBy: order.pickedBy,
          pickedAt: order.pickedAt || undefined,
          pickingProgress: order.pickingProgress,
          batchNumbers: order.batchNumbers,
          pickingInProgress: true
        });
        
        // Show success toast
        toast({
          title: "Box data saved",
          description: `Box ${boxNum} has been marked as complete.`
        });
      }
    }
  };
  
  // When box number is specified, save it as soon as component mounts
  useEffect(() => {
    // Set document title
    document.title = "Print Box Label";
    
    if (order && boxNumber) {
      const boxNum = parseInt(boxNumber);
      
      // Set more specific document title now that we have order info
      document.title = `Print Box Label - ${order.customer?.name || "Order"} - Box ${boxNum}`;
      
      // Mark this box as completed when the page loads
      saveBoxData();
    }
  }, [order, boxNumber]);

  const handlePrintAndSave = () => {
    // Save box data first to ensure everything is up to date
    saveBoxData();
    
    // Then trigger print
    window.print();
  };

  const handleReturn = () => {
    // Save box data before returning to ensure nothing is lost
    saveBoxData();
    
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
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleReturn}>
            <ArrowLeft className="h-4 w-4 mr-2" /> 
            Back to Picking List
          </Button>
          <Button variant="default" onClick={handlePrintAndSave}>
            <Printer className="h-4 w-4 mr-2" /> 
            Print Label
          </Button>
        </div>
      </div>
      <div ref={printRef}>
        <PrintBoxLabel />
      </div>
    </div>
  );
};

export default PrintBoxLabelPage;
