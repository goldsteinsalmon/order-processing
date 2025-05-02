
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
      console.log("[useProductData] Starting to fetch products");
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) {
        console.error("[useProductData] Error fetching products:", error);
        throw error;
      }

      console.log(`[useProductData] Successfully fetched ${data?.length || 0} products`);
      
      // Convert snake_case to camelCase using adapter
      const formattedProducts: Product[] = data.map(adaptProductToCamelCase);
      
      setProducts(formattedProducts);
      return formattedProducts;
    } catch (error: any) {
      console.error("[useProductData] Error in fetchProducts:", error);
      toast({
        title: "Error",
        description: `Failed to fetch products: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
      return [];
    } finally {
      console.log("[useProductData] Completed fetchProducts, setting isLoading to false");
      setIsLoading(false);
    }
  };

  const addProduct = async (newProduct: Product | Product[]): Promise<Product | Product[] | null> => {
    try {
      console.log("[useProductData] Starting addProduct");
      setIsLoading(true); 
      
      if (Array.isArray(newProduct)) {
        // Batch insert - convert each product to snake_case
        const dbProducts = newProduct.map(adaptProductToSnakeCase);
        
        const { data, error } = await supabase
          .from('products')
          .insert(dbProducts)
          .select();
        
        if (error) {
          console.error("[useProductData] Error in batch product insert:", error);
          throw error;
        }

        // Convert the returned data to camelCase using adapter
        const addedProducts: Product[] = data.map(adaptProductToCamelCase);
        
        setProducts(prevProducts => [...prevProducts, ...addedProducts]);
        
        return addedProducts;
      } else {
        // Single insert - convert to snake_case
        const dbProduct = adaptProductToSnakeCase(newProduct);
        
        const { data, error } = await supabase
          .from('products')
          .insert([dbProduct])
          .select();
        
        if (error) {
          console.error("[useProductData] Error in single product insert:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          throw new Error("No data returned from product insert");
        }

        // Convert the returned data to camelCase using adapter
        const addedProduct = adaptProductToCamelCase(data[0]);
        
        setProducts(prevProducts => [...prevProducts, addedProduct]);
        
        return addedProduct;
      }
    } catch (error: any) {
      console.error("[useProductData] Error in addProduct:", error);
      toast({
        title: "Error",
        description: `Failed to add product: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
      return null;
    } finally {
      console.log("[useProductData] Completed addProduct, setting isLoading to false");
      setIsLoading(false);
    }
  };

  // Update product
  const updateProduct = async (product: Product): Promise<boolean> => {
    try {
      console.log("[useProductData] Starting updateProduct");
      setIsLoading(true);
      
      // Convert to snake_case for database
      const productForDb = adaptProductToSnakeCase(product);
      
      const { error } = await supabase
        .from('products')
        .update(productForDb)
        .eq('id', product.id);
      
      if (error) {
        console.error("[useProductData] Error updating product:", error);
        throw error;
      }
      
      setProducts(products.map(p => p.id === product.id ? product : p));
      return true;
    } catch (error: any) {
      console.error('[useProductData] Error in updateProduct:', error);
      toast({
        title: "Error",
        description: `Failed to update product: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
      return false;
    } finally {
      console.log("[useProductData] Completed updateProduct, setting isLoading to false");
      setIsLoading(false);
    }
  };

  // Delete product
  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      console.log("[useProductData] Starting deleteProduct");
      setIsLoading(true);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
      return true;
    } catch (error: any) {
      console.error('[useProductData] Error in deleteProduct:', error);
      toast({
        title: "Error",
        description: `Failed to delete product: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
      return false;
    } finally {
      console.log("[useProductData] Completed deleteProduct, setting isLoading to false");
      setIsLoading(false);
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
