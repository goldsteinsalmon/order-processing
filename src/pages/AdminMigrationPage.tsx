
import React, { useState } from 'react';
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { runOrderNumberMigration } from "@/scripts/runMigration";

const AdminMigrationPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const handleOrderNumberMigration = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      console.log("Starting migration process...");
      const success = await runOrderNumberMigration();
      
      if (success) {
        setResult({
          success: true,
          message: "Order number sequence has been updated to start at 1001 for new orders."
        });
      } else {
        throw new Error("Migration failed. Check console for details.");
      }
    } catch (error) {
      console.error("Migration execution error:", error);
      setResult({
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Migrations</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Number Sequence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Run this migration to ensure that new orders start with order number 1001.
              This will only affect new orders created after running the migration.
            </p>
            
            <Button 
              onClick={handleOrderNumberMigration}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Running...
                </>
              ) : (
                "Update Order Number Sequence"
              )}
            </Button>
            
            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminMigrationPage;
