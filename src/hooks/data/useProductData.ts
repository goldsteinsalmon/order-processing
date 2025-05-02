
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import { adaptProductToCamelCase, adaptProductToSnakeCase } from "@/utils/typeAdapters";
import { useToast } from "@/hooks/use-toast";

export const useProductData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      console.log("useProductData: Setting loading state to true");
      setIsLoading(true);
      console.log("useProductData: Fetching products...");
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) {
        console.error("Error fetching products:", error);
        throw error;
      }

      console.log("Raw products from database:", data);
      console.log(`useProductData: Received ${data?.length || 0} products from database`);
      
      // Convert snake_case to camelCase using adapter
      const formattedProducts: Product[] = data.map(adaptProductToCamelCase);
      console.log("Formatted products after conversion:", formattedProducts);
      
      setProducts(formattedProducts);
      console.log("useProductData: Products state updated with", formattedProducts.length, "items");
      return formattedProducts;
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: `Failed to fetch product data: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
      return [];
    } finally {
      console.log("useProductData: Setting loading state to false");
      setIsLoading(false);
    }
  };

  const addProduct = async (newProduct: Product | Product[]): Promise<Product | Product[] | null> => {
    try {
      if (Array.isArray(newProduct)) {
        // Batch insert - convert each product to snake_case
        const dbProducts = newProduct.map(adaptProductToSnakeCase);
        console.log("Adding batch of products:", dbProducts);
        
        const { data, error } = await supabase
          .from('products')
          .insert(dbProducts)
          .select();
        
        if (error) {
          console.error("Error in batch product insert:", error);
          throw error;
        }

        console.log("Product batch insert response:", data);

        // Convert the returned data to camelCase using adapter
        const addedProducts: Product[] = data.map(adaptProductToCamelCase);
        
        setProducts(prevProducts => [...prevProducts, ...addedProducts]);
        
        return addedProducts;
      } else {
        // Single insert - convert to snake_case
        const dbProduct = adaptProductToSnakeCase(newProduct);
        console.log("Adding single product with snake_case format:", dbProduct);
        
        const { data, error } = await supabase
          .from('products')
          .insert([dbProduct])
          .select();
        
        if (error) {
          console.error("Error in single product insert:", error);
          throw error;
        }

        console.log("Product insert response:", data);

        if (!data || data.length === 0) {
          throw new Error("No data returned from product insert");
        }

        // Convert the returned data to camelCase using adapter
        const addedProduct = adaptProductToCamelCase(data[0]);
        console.log("Converted product after insert:", addedProduct);
        
        setProducts(prevProducts => [...prevProducts, addedProduct]);
        
        return addedProduct;
      }
    } catch (error: any) {
      console.error("Error adding product(s):", error);
      toast({
        title: "Error",
        description: `Failed to add product data: ${error?.message || error?.toString() || "Unknown error"}`,
        variant: "destructive",
      });
      return null;
    }
  };

  // Update product
  const updateProduct = async (product: Product): Promise<boolean> => {
    try {
      // Convert to snake_case for database
      const productForDb = adaptProductToSnakeCase(product);
      console.log("Updating product with snake_case format:", productForDb);
      
      const { error } = await supabase
        .from('products')
        .update(productForDb)
        .eq('id', product.id);
      
      if (error) {
        console.error("Error updating product:", error);
        throw error;
      }
      
      setProducts(products.map(p => p.id === product.id ? product : p));
      return true;
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: `Failed to update product: ${error?.message || error?.toString() || "Unknown error"}`,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete product
  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
      return true;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: `Failed to delete product: ${error?.message || error?.toString() || "Unknown error"}`,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    products,
    setProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    fetchProducts,
    isLoading
  };
};
