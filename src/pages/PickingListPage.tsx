
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";

const PickingListPage: React.FC = () => {
  // Get the order ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshOrderData } = useData();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we need to highlight a specific box (coming back from printing)
  const searchParams = new URLSearchParams(location.search);
  const nextBox = searchParams.get('nextBox');
  const nextBoxNumber = nextBox ? parseInt(nextBox) : undefined;

  console.log("PickingListPage: Rendering with orderId:", id, "nextBox:", nextBox);

  // Force refresh order data when component mounts to ensure we have latest data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      if (id) {
        try {
          // Force refresh the order data to ensure we have the latest
          await refreshOrderData(id);
          setIsLoading(false);
        } catch (error) {
          console.error("Error refreshing order data:", error);
          setError("Failed to load order data. Please try again.");
          setIsLoading(false);
        }
      } else {
        setError("No order ID provided");
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, refreshOrderData]);

  // Handle navigation errors gracefully
  const handleNavigationError = (errorMsg?: string) => {
    setIsLoading(false);
    const message = errorMsg || "There was an issue loading the order. Please try again.";
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
    
    // Don't navigate away immediately if we have a specific error to show
    if (!errorMsg) {
      setTimeout(() => {
        navigate("/orders");
      }, 3000);
    }
  };

  if (!id) {
    console.error("PickingListPage: No order ID found in URL parameters");
    return (
      <Layout>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No order ID provided in the URL.</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate("/orders")}>
              Back to Orders
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle save in progress state
  const handleSaveStart = () => {
    console.log("Save operation starting");
    setIsLoading(true);
  };

  const handleSaveComplete = (success: boolean, errorMessage?: string) => {
    console.log(`Save operation completed with status: ${success}, message: ${errorMessage || 'none'}`);
    setIsLoading(false);
    if (success) {
      toast({
        title: "Success",
        description: "Order progress saved successfully",
      });
    } else {
      setError(errorMessage || "Unknown error occurred");
      toast({
        title: "Error",
        description: errorMessage || "Failed to save order progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
            <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-lg font-medium">Loading order data...</p>
              <p className="text-sm text-gray-500">Please wait, don't navigate away.</p>
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <PickingList 
          orderId={id} 
          nextBoxToFocus={nextBoxNumber} 
          key={`picking-${id}-${nextBox || 'default'}`} // Force re-render on box change
          onSaveStart={handleSaveStart}
          onSaveComplete={handleSaveComplete}
          onNavigationError={handleNavigationError}
        />
      </div>
    </Layout>
  );
};

export default PickingListPage;
