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
          stock_level: p.stock_level,
          weight: p.weight,
          requires_weight_input: p.requires_weight_input,
          unit: p.unit,
          required: p.required
        }));
        
        const { data, error } = await supabase
          .from('products')
          .insert(productsToInsert)
          .select();
        
        if (error) throw error;
        
        const newProducts: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          description: p.description,
          stock_level: p.stock_level,
          weight: p.weight,
          requires_weight_input: p.requires_weight_input,
          unit: p.unit,
          required: p.required
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
            stock_level: productData.stock_level,
            weight: productData.weight,
            requires_weight_input: productData.requires_weight_input,
            unit: productData.unit,
            required: productData.required
          })
          .select();
        
        if (error) throw error;
        
        const newProduct: Product = {
          id: data[0].id,
          name: data[0].name,
          sku: data[0].sku,
          description: data[0].description,
          stock_level: data[0].stock_level,
          weight: data[0].weight,
          requires_weight_input: data[0].requires_weight_input,
          unit: data[0].unit,
          required: data[0].required
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
