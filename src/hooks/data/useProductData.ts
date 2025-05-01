
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";

export const useProductData = (toast: any) => {
  const [products, setProducts] = useState<Product[]>([]);

  // Add product
  const addProduct = async (productData: Product | Product[]): Promise<Product | Product[] | null> => {
    try {
      if (Array.isArray(productData)) {
        // Add multiple products
        const productsToInsert = productData.map(p => ({
          name: p.name,
          sku: p.sku,
          description: p.description,
          stock_level: p.stockLevel,
          weight: p.weight,
          requires_weight_input: p.requiresWeightInput,
          unit: p.unit,
          required: p.required
        }));
        
        const { data, error } = await supabase
          .from('products')
          .insert(productsToInsert)
          .select();
        
        if (error) throw error;
        
        const newProducts = data.map((p: any) => ({
          ...p,
          stockLevel: p.stock_level,
          requiresWeightInput: p.requires_weight_input
        }));
        
        setProducts([...products, ...newProducts]);
        return newProducts;
      } else {
        // Add a single product
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: productData.name,
            sku: productData.sku,
            description: productData.description,
            stock_level: productData.stockLevel,
            weight: productData.weight,
            requires_weight_input: productData.requiresWeightInput,
            unit: productData.unit,
            required: productData.required
          })
          .select();
        
        if (error) throw error;
        
        const newProduct = {
          ...data[0],
          stockLevel: data[0].stock_level,
          requiresWeightInput: data[0].requires_weight_input
        };
        
        setProducts([...products, newProduct]);
        return newProduct;
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product.",
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
          stock_level: product.stockLevel,
          weight: product.weight,
          requires_weight_input: product.requiresWeightInput,
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

  return {
    products,
    setProducts,
    addProduct,
    updateProduct
  };
};
