
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DebugLoader } from "@/components/ui/debug-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => navigate("/create-product")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      
      <div className="relative w-full max-w-md mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <DebugLoader 
        isLoading={isLoading}
        productsCount={products.length} 
        context="Products Page" 
        onRetry={handleRetryFetch}
      />

      {isLoading ? (
        <div className="space-y-2">
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted p-3">
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="py-3 space-y-1">
                  <Skeleton className="h-4 w-[60%] mb-1" />
                  <Skeleton className="h-4 w-[80%]" />
                </div>
              ))}
            </div>
          </div>
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
        <div className="space-y-8">
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Weight (g)</TableHead>
                  <TableHead>Requires Weight</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Add Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.sku || "N/A"}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.weight || "N/A"}</TableCell>
                      <TableCell>{product.requiresWeightInput ? "Yes" : "No"}</TableCell>
                      <TableCell>{product.stock_level || 0}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="w-20" 
                          placeholder="0"
                          disabled
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/edit-product/${product.id}`)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stock Forecast Section */}
          <div>
            <h2 className="text-xl font-semibold mb-1">Stock Forecast (Next 7 Working Days)</h2>
            <p className="text-sm text-gray-500 mb-4">Shows products needed for pending orders by date</p>
            
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>05/05<br/>Mon</TableHead>
                    <TableHead>06/05<br/>Tue</TableHead>
                    <TableHead>07/05<br/>Wed</TableHead>
                    <TableHead>08/05<br/>Thu</TableHead>
                    <TableHead>09/05<br/>Fri</TableHead>
                    <TableHead>12/05<br/>Mon</TableHead>
                    <TableHead>13/05<br/>Tue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProductsPage;
