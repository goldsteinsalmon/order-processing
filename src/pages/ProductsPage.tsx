
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugLoader } from "@/components/ui/debug-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { products, isLoading: dataLoading, fetchProducts } = useData();
  const navigate = useNavigate();

  console.log("ProductsPage render: dataLoading=" + dataLoading + ", isPageLoading=" + isPageLoading + ", products.length=" + products.length);
  console.log("Sorting products:", products);

  // Explicitly fetch products on component mount
  useEffect(() => {
    console.log("ProductsPage: Starting to load products");
    console.log("ProductsPage: Initial dataLoading state:", dataLoading);
    
    const loadProducts = async () => {
      try {
        console.log("ProductsPage: Calling fetchProducts...");
        await fetchProducts();
        console.log("ProductsPage: Products loaded successfully");
      } catch (error) {
        console.error("ProductsPage: Error loading products:", error);
      } finally {
        setIsPageLoading(false);
      }
    };
    
    loadProducts();
  }, [fetchProducts]);

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

  // Default all products to active if not specified
  const activeProducts = sortedProducts.filter((product) => product.active !== false);
  const inactiveProducts = sortedProducts.filter((product) => product.active === false);

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
        <Button onClick={() => navigate("/create-product")} className="ml-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      <DebugLoader 
        isLoading={isPageLoading} 
        dataLoading={dataLoading} 
        productsCount={products.length} 
        context="Products Page" 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {isPageLoading || dataLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[60%]" />
                      <Skeleton className="h-4 w-[40%]" />
                    </div>
                  </CardContent>
                </Card>
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Description: {product.description || "N/A"}</p>
                    <p>SKU: {product.sku || "N/A"}</p>
                    <p>Barcode: {product.barcode || "N/A"}</p>
                    <p>Active: {product.active !== false ? "Yes" : "No"}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/edit-product/${product.id}`)}
                    >
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {isPageLoading || dataLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[60%]" />
                      <Skeleton className="h-4 w-[40%]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeProducts.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="text-center p-6">
                  <h3 className="font-semibold text-lg mb-2">No active products</h3>
                  <p className="text-muted-foreground mb-4">
                    Add a product or activate an existing one
                  </p>
                  <Button onClick={() => navigate("/create-product")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {activeProducts.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Description: {product.description || "N/A"}</p>
                    <p>SKU: {product.sku || "N/A"}</p>
                    <p>Barcode: {product.barcode || "N/A"}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/edit-product/${product.id}`)}
                    >
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="inactive" className="mt-4">
          {isPageLoading || dataLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[60%]" />
                      <Skeleton className="h-4 w-[40%]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : inactiveProducts.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="text-center p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    No inactive products
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Deactivate a product to see it here
                  </p>
                  <Button onClick={() => navigate("/create-product")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {inactiveProducts.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Description: {product.description || "N/A"}</p>
                    <p>SKU: {product.sku || "N/A"}</p>
                    <p>Barcode: {product.barcode || "N/A"}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/edit-product/${product.id}`)}
                    >
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default ProductsPage;
