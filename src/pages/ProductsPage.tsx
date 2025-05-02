
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DebugLoader } from "@/components/ui/debug-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { products, isLoading, refreshData } = useData();
  const navigate = useNavigate();

  console.log("ProductsPage render: isLoading=" + isLoading + ", products.length=" + products.length);

  const handleRetryFetch = async () => {
    try {
      console.log("ProductsPage: Manual refresh requested");
      await refreshData();
    } catch (error) {
      console.error("ProductsPage: Error during manual refresh:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchTermLower) ||
      product.description?.toLowerCase().includes(searchTermLower) ||
      product.sku?.toLowerCase().includes(searchTermLower) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTermLower))
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          {isLoading && (
            <Button variant="outline" onClick={handleRetryFetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
          <Button onClick={() => navigate("/create-product")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      <DebugLoader 
        isLoading={isLoading}
        productsCount={products.length} 
        context="Products Page" 
        onRetry={handleRetryFetch}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border rounded-md">
              <Skeleton className="h-4 w-[80%] mb-2" />
              <Skeleton className="h-4 w-[60%] mb-2" />
              <Skeleton className="h-4 w-[40%]" />
            </div>
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center p-6">
              <h3 className="font-semibold text-lg mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first product to get started
              </p>
              <Button onClick={() => navigate("/create-product")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Product
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedProducts.map((product) => (
            <div key={product.id} className="p-4 border rounded-md bg-white shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">{product.name}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/edit-product/${product.id}`)}
                >
                  Edit
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm">{product.description || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="text-sm">{product.sku || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Barcode</p>
                  <p className="text-sm">{product.barcode || "N/A"}</p>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                  product.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {product.active !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default ProductsPage;
