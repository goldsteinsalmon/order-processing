
import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type DebugLoaderProps = {
  isLoading: boolean;
  dataLoading?: boolean;
  productsCount?: number;
  context: string;
  error?: string | null;
};

export function DebugLoader({ 
  isLoading, 
  dataLoading, 
  productsCount, 
  context, 
  error 
}: DebugLoaderProps) {
  const [seconds, setSeconds] = useState(0);
  
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

  if (!(isLoading || dataLoading) && !error) {
    return null;
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200 mb-6">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Error in {context}</AlertTitle>
        <AlertDescription>
          <div className="text-sm space-y-1">
            <p>{error}</p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-yellow-50 border-yellow-200 mb-6">
      <AlertTitle className="text-yellow-800">Debug Loading State ({context})</AlertTitle>
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
        </div>
      </AlertDescription>
    </Alert>
  );
}
