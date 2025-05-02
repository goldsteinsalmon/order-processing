
import React from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const PickingListPage: React.FC = () => {
  // Get the order ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Check if we need to highlight a specific box (coming back from printing)
  const searchParams = new URLSearchParams(location.search);
  const nextBox = searchParams.get('nextBox');
  const nextBoxNumber = nextBox ? parseInt(nextBox) : undefined;

  console.log("PickingListPage: Rendering with orderId:", id, "nextBox:", nextBox);

  // Handle navigation errors gracefully
  const handleNavigationError = () => {
    setIsLoading(false);
    toast({
      title: "Error",
      description: "There was an issue loading the order. Please try again.",
      variant: "destructive",
    });
    navigate("/orders");
  };

  if (!id) {
    console.error("PickingListPage: No order ID found in URL parameters");
    return (
      <Layout>
        <div className="p-4 text-red-500">
          Error: No order ID provided in the URL.
        </div>
      </Layout>
    );
  }

  // Handle save in progress state
  const handleSaveStart = () => {
    console.log("Save operation starting");
    setIsLoading(true);
  };

  const handleSaveComplete = (success: boolean) => {
    console.log(`Save operation completed with status: ${success}`);
    setIsLoading(false);
    if (success) {
      toast({
        title: "Success",
        description: "Order progress saved successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save order progress. Please try again.",
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
