
import React, { useState } from "react";
import Layout from "@/components/Layout";
import CompletedOrders from "@/components/orders/CompletedOrders";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const CompletedOrdersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  return (
    <Layout>
      <div className="mb-4">
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
      <CompletedOrders searchTerm={searchTerm} />
    </Layout>
  );
};

export default CompletedOrdersPage;
