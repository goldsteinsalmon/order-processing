
import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";

type DebugLoaderProps = {
  isLoading: boolean;
  dataLoading?: boolean;
  productsCount?: number;
  context: string;
  error?: string | null;
  onRetry?: () => void;
};

export function DebugLoader({ 
  isLoading, 
  dataLoading, 
  productsCount, 
  context, 
  error,
  onRetry
}: DebugLoaderProps) {
  const [seconds, setSeconds] = useState(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  
  useEffect(() => {
    if (isLoading || dataLoading) {
      const interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setSeconds(0);
    }
  }, [isLoading, dataLoading]);

  // Show nothing if not loading and no error
  if (!(isLoading || dataLoading) && !error) {
    return null;
  }

  // If loading has taken more than 10 seconds, show extended info
  const showExtendedInfo = seconds > 10;

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200 mb-6">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Error in {context}</AlertTitle>
        <AlertDescription>
          <div className="text-sm space-y-1">
            <p>{error}</p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="mr-2 h-3 w-3" /> Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={showExtendedInfo ? "bg-orange-50 border-orange-200 mb-6" : "bg-yellow-50 border-yellow-200 mb-6"}>
      <AlertTitle className={showExtendedInfo ? "text-orange-800" : "text-yellow-800"}>
        {showExtendedInfo ? (
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Extended Loading in {context}
          </div>
        ) : (
          `Debug Loading State (${context})`
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="text-sm space-y-1">
          <p>Time elapsed: {seconds} seconds</p>
          <p>Page loading: <span className={isLoading ? "text-red-500 font-bold" : "text-green-500"}>
            {isLoading ? "TRUE" : "false"}
          </span></p>
          <p>Data loading: <span className={dataLoading ? "text-red-500 font-bold" : "text-green-500"}>
            {dataLoading ? "TRUE" : "false"}
          </span></p>
          {productsCount !== undefined && (
            <p>Products count: {productsCount}</p>
          )}
          
          {showExtendedInfo && (
            <>
              <Separator className="my-2" />
              <div className="mt-2">
                <p className="font-semibold text-orange-800">Troubleshooting:</p>
                <button 
                  onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                  className="text-sm text-orange-700 underline mt-1"
                >
                  {showTroubleshooting ? "Hide troubleshooting tips" : "Show troubleshooting tips"}
                </button>
                
                {showTroubleshooting && (
                  <ul className="list-disc list-inside mt-2 text-xs space-y-1 text-orange-800">
                    <li>Check your network connection to Supabase</li>
                    <li>Verify that your Supabase project is online</li>
                    <li>Check that you have data in your database tables</li>
                    <li>Ensure Row Level Security (RLS) policies are configured correctly</li>
                    <li>Check the browser console for errors</li>
                    <li>Try refreshing the page</li>
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
