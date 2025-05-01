
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MissingItem } from "@/types";

export const useMissingItemData = (toast: any) => {
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);

  // Add missing item
  const addMissingItem = async (missingItem: MissingItem): Promise<MissingItem | null> => {
    try {
      const { data, error } = await supabase
        .from('missing_items')
        .insert({
          order_id: missingItem.orderId,
          product_id: missingItem.productId,
          quantity: missingItem.quantity,
          date: missingItem.date || new Date().toISOString(),
          status: missingItem.status || 'Pending'
        })
        .select();
      
      if (error) throw error;
      
      // Fetch product and order details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', missingItem.productId)
        .single();
      
      if (productError) throw productError;
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, customer:customers(*)')
        .eq('id', missingItem.orderId)
        .single();
      
      if (orderError) throw orderError;
      
      const newMissingItem = {
        ...data[0],
        orderId: data[0].order_id,
        productId: data[0].product_id,
        product: productData,
        order: orderData
      };
      
      setMissingItems([...missingItems, newMissingItem]);
      return newMissingItem;
    } catch (error) {
      console.error('Error adding missing item:', error);
      toast({
        title: "Error",
        description: "Failed to add missing item.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Remove missing item
  const removeMissingItem = async (missingItemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('missing_items')
        .delete()
        .eq('id', missingItemId);
      
      if (error) throw error;
      
      setMissingItems(missingItems.filter(mi => mi.id !== missingItemId));
      return true;
    } catch (error) {
      console.error('Error removing missing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove missing item.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    missingItems,
    setMissingItems,
    addMissingItem,
    removeMissingItem
  };
};
