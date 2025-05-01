
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Calendar, AlertTriangle } from "lucide-react";
import { useData } from "@/context/DataContext";
import { supabase } from "@/integrations/supabase/client";

const StandingOrderProcessor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const { toast } = useToast();
  const { processStandingOrders, standingOrders } = useData();
  
  const activeStandingOrders = standingOrders.filter(order => order.active);

  const handleProcessStandingOrders = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // First try to use the edge function directly
      try {
        const { data, error } = await supabase.functions.invoke('process-standing-orders', {
          body: { trigger: 'manual' }
        });

        if (error) throw error;
        
        console.log('Edge function response:', data);
        
        const now = new Date();
        setLastProcessed(now.toISOString());
        
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${data.processed} standing orders.`,
        });
      } catch (edgeError) {
        console.error("Error calling edge function:", edgeError);
        
        // Fall back to client-side processing
        console.log("Falling back to client-side processing");
        await processStandingOrders();
        
        const now = new Date();
        setLastProcessed(now.toISOString());
        
        toast({
          title: "Processing Complete (Client-side)",
          description: "Standing orders have been processed successfully.",
        });
      }
    } catch (error) {
      console.error("Error processing standing orders:", error);
      toast({
        title: "Processing Failed",
        description: "Failed to process standing orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standing Order Processor</CardTitle>
        <CardDescription>
          Manually process standing orders or check the status of automated processing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Active Standing Orders</h3>
            <p className="text-sm text-gray-500">
              {activeStandingOrders.length} active orders ready for processing
            </p>
          </div>
          <Button 
            onClick={handleProcessStandingOrders} 
            disabled={isProcessing || activeStandingOrders.length === 0}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {isProcessing ? "Processing..." : "Process Now"}
          </Button>
        </div>
        
        {lastProcessed && (
          <div className="text-sm text-gray-500 mt-2">
            Last manual processing: {new Date(lastProcessed).toLocaleString()}
          </div>
        )}
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Automatic Processing</AlertTitle>
          <AlertDescription>
            Standing orders are automatically processed every day at midnight. 
            Manual processing should only be used for testing or if the automatic 
            processing has failed.
          </AlertDescription>
        </Alert>
        
        {activeStandingOrders.length === 0 && (
          <Alert variant="default" className="bg-gray-50 border-gray-200">
            <AlertTitle>No Active Standing Orders</AlertTitle>
            <AlertDescription>
              There are no active standing orders to process at this time.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StandingOrderProcessor;
