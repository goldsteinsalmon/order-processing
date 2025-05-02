
import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type DebugLoaderProps = {
  isLoading: boolean;
  dataLoading?: boolean;
  productsCount?: number;
  context: string;
};

export function DebugLoader({ isLoading, dataLoading, productsCount, context }: DebugLoaderProps) {
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

  if (!(isLoading || dataLoading)) {
    return null;
  }

  return (
    <Alert className="bg-yellow-50 border-yellow-200">
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
