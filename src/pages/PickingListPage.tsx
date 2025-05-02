
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const PickingListPage: React.FC = () => {
  // Get the order ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we need to highlight a specific box (coming back from printing)
  const searchParams = new URLSearchParams(location.search);
  const nextBox = searchParams.get('nextBox');
  const nextBoxNumber = nextBox ? parseInt(nextBox) : undefined;

  console.log("PickingListPage: Rendering with orderId:", id, "nextBox:", nextBox);

  // Clear any previous errors when component loads or ID changes
  useEffect(() => {
    setError(null);
  }, [id]);

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
              <p className="text-lg font-medium">Saving progress...</p>
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
