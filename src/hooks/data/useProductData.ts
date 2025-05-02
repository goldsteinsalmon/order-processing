import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import { adaptProductToCamelCase, adaptProductToSnakeCase } from "@/utils/typeAdapters";

export const useProductData = (toast: any) => {
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }

      // Convert snake_case to camelCase using adapter
      const formattedProducts: Product[] = data.map(adaptProductToCamelCase);
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch product data.",
        variant: "destructive",
      });
    }
  };

  const addProduct = async (newProduct: Product | Product[]): Promise<Product | Product[] | null> => {
    try {
      if (Array.isArray(newProduct)) {
        // Batch insert - convert each product to snake_case
        const dbProducts = newProduct.map(adaptProductToSnakeCase);
        
        const { data, error } = await supabase
          .from('products')
          .insert(dbProducts)
          .select();
        
        if (error) {
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
          throw error;
        }

        // Convert the returned data to camelCase using adapter
        const addedProduct = adaptProductToCamelCase(data[0]);
        
        setProducts(prevProducts => [...prevProducts, addedProduct]);
        
        return addedProduct;
      }
    } catch (error) {
      console.error("Error adding product(s):", error);
      toast({
        title: "Error",
        description: "Failed to add product data.",
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
      
      const { error } = await supabase
        .from('products')
        .update(productForDb)
        .eq('id', product.id);
      
      if (error) throw error;
      
      setProducts(products.map(p => p.id === product.id ? product : p));
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product.",
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
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product.",
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
    deleteProduct
  };
};
