
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";

const PickingListPage: React.FC = () => {
  // Get the order ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshOrderData, orders } = useData();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  
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
      
      // Set a timeout to detect if loading takes too long
      const timeout = setTimeout(() => {
        console.error("PickingListPage: Loading timeout exceeded");
        setError("Loading is taking longer than expected. The order might be missing or there could be connection issues.");
      }, 10000); // 10 second timeout
      
      setLoadingTimeout(timeout);
      
      if (!id) {
        clearTimeout(timeout);
        setError("No order ID provided");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("PickingListPage: Attempting to refresh order data for ID:", id);
        
        // Quick check if order exists before refreshing
        const orderExists = orders.some(o => o.id === id);
        if (!orderExists) {
          console.warn("PickingListPage: Order not found in current data, attempting refresh");
        }
        
        // Force refresh the order data to ensure we have the latest
        await refreshOrderData(id);
        
        // Clear timeout as data is loaded
        clearTimeout(timeout);
        setIsLoading(false);
      } catch (error) {
        console.error("PickingListPage: Error refreshing order data:", error);
        clearTimeout(timeout);
        setError("Failed to load order data. Please try again.");
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [id, refreshOrderData, orders]);

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
  };
  
  // Return to orders list
  const handleBackToOrders = () => {
    navigate("/orders");
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
            <Button onClick={handleBackToOrders}>
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
        {/* Back button */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={handleBackToOrders}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </div>
        
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
            <div className="mt-4">
              <Button onClick={handleBackToOrders} size="sm">
                Back to Orders
              </Button>
            </div>
          </Alert>
        )}
        
        {!error && (
          <PickingList 
            orderId={id} 
            nextBoxToFocus={nextBoxNumber} 
            key={`picking-${id}-${nextBox || 'default'}`} // Force re-render on box change
            onSaveStart={handleSaveStart}
            onSaveComplete={handleSaveComplete}
            onNavigationError={handleNavigationError}
          />
        )}
      </div>
    </Layout>
  );
};

export default PickingListPage;
