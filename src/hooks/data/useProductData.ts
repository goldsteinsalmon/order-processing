
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";

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

      // Convert snake_case to camelCase
      const formattedProducts: Product[] = data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        stock_level: product.stock_level,
        weight: product.weight,
        requiresWeightInput: product.requires_weight_input,
        unit: product.unit,
        required: product.required,
      }));
      
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
        // Batch insert
        const dbProducts = newProduct.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description,
          stock_level: product.stock_level,
          weight: product.weight,
          requires_weight_input: product.requiresWeightInput,
          unit: product.unit,
          required: product.required,
        }));
        
        const { data, error } = await supabase
          .from('products')
          .insert(dbProducts)
          .select();
        
        if (error) {
          throw error;
        }

        // Convert the returned data to camelCase
        const addedProducts: Product[] = data.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description,
          stock_level: product.stock_level,
          weight: product.weight,
          requiresWeightInput: product.requires_weight_input,
          unit: product.unit,
          required: product.required,
        }));
        
        setProducts(prevProducts => [...prevProducts, ...addedProducts]);
        
        return addedProducts;
      } else {
        // Single insert
        const dbProduct = {
          id: newProduct.id,
          name: newProduct.name,
          sku: newProduct.sku,
          description: newProduct.description,
          stock_level: newProduct.stock_level,
          weight: newProduct.weight,
          requires_weight_input: newProduct.requiresWeightInput,
          unit: newProduct.unit,
          required: newProduct.required,
        };
        
        const { data, error } = await supabase
          .from('products')
          .insert([dbProduct])
          .select();
        
        if (error) {
          throw error;
        }

        // Convert the returned data to camelCase
        const addedProduct: Product = {
          id: data[0].id,
          name: data[0].name,
          sku: data[0].sku,
          description: data[0].description,
          stock_level: data[0].stock_level,
          weight: data[0].weight,
          requiresWeightInput: data[0].requires_weight_input,
          unit: data[0].unit,
          required: data[0].required,
        };
        
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
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          sku: product.sku,
          description: product.description,
          stock_level: product.stock_level,
          weight: product.weight,
          requires_weight_input: product.requires_weight_input,
          unit: product.unit,
          required: product.required
        })
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
