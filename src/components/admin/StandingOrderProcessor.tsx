
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";

const StandingOrderProcessor: React.FC = () => {
  const { processStandingOrders } = useData();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  // Function to manually trigger the Edge Function
  const triggerProcessing = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-standing-orders', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;
      
      toast({
        title: "Standing Orders Processed",
        description: data.message || `Successfully processed ${data.processed} standing orders`,
        variant: "default",
      });
      
      setLastRun(new Date().toISOString());
    } catch (error) {
      console.error('Error processing standing orders:', error);
      toast({
        title: "Error",
        description: "Failed to process standing orders. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to run the local version of processStandingOrders
  const runLocalProcessing = async () => {
    setIsProcessing(true);
    try {
      await processStandingOrders();
      toast({
        title: "Standing Orders Processed",
        description: "Successfully processed standing orders using the local function",
        variant: "default",
      });
      setLastRun(new Date().toISOString());
    } catch (error) {
      console.error('Error processing standing orders:', error);
      toast({
        title: "Error",
        description: "Failed to process standing orders. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Standing Order Processor</CardTitle>
        <CardDescription>
          Standing orders are automatically processed at midnight every day.
          You can also trigger the process manually.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium">Automatic Processing</h3>
                  <p className="text-sm text-gray-600">
                    Standing orders are automatically processed at midnight by a scheduled job.
                    No user login is required.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium">Manual Processing</h3>
                  <p className="text-sm text-gray-600">
                    You can manually trigger the processing of standing orders using the buttons below.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {lastRun && (
            <div className="text-sm text-gray-500">
              Last run: {new Date(lastRun).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={triggerProcessing} 
          disabled={isProcessing} 
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Process via Edge Function
        </Button>
        <Button 
          onClick={runLocalProcessing} 
          disabled={isProcessing}
          variant="outline" 
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Process Locally
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StandingOrderProcessor;
