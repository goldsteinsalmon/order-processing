
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import CompletedOrders from "@/components/orders/CompletedOrders";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const CompletedOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get current user to check role
  const isRegularUser = currentUser?.role === "User";
  
  // Extract batch filter from URL if present
  useEffect(() => {
    const batchParam = searchParams.get("batch");
    if (batchParam) {
      setBatchFilter(batchParam);
    } else {
      setBatchFilter("");
    }
  }, [searchParams]);

  // Clear the batch filter
  const clearBatchFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("batch");
    setSearchParams(newParams);
    setBatchFilter("");
  };

  // Navigate to export page
  const handleExport = () => {
    navigate("/export-orders");
  };
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold">Completed Orders</h2>
        </div>
        {/* Hide Invoicing button for regular users */}
        {!isRegularUser && (
          <Button onClick={handleExport}>
            <FileText className="mr-2 h-4 w-4" />
            Invoicing
          </Button>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search completed orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        {batchFilter && (
          <div className="mt-2 flex items-center">
            <span className="text-sm text-muted-foreground mr-2">Filtered by batch:</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              {batchFilter}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 hover:bg-transparent" 
                onClick={clearBatchFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          </div>
        )}
      </div>
      <CompletedOrders searchTerm={searchTerm} batchFilter={batchFilter} />
    </Layout>
  );
};

export default CompletedOrdersPage;
