
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MissingItem, Product } from "@/types";
import { adaptMissingItemToCamelCase, adaptMissingItemToSnakeCase } from "@/utils/typeAdapters";

export const useMissingItemData = (toast: any) => {
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);

  const fetchMissingItems = async () => {
    try {
      const { data, error } = await supabase
        .from('missing_items')
        .select(`
          *,
          product:products(*),
          order:orders(
            id,
            customer:customers(*)
          )
        `);
        
      if (error) {
        throw error;
      }

      // Convert snake_case to camelCase
      const formattedMissingItems: MissingItem[] = data.map(item => {
        // Convert the product object properly
        const product = item.product ? {
          ...item.product,
          requiresWeightInput: item.product.requires_weight_input
        } as Product : undefined;

        return {
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          quantity: item.quantity,
          date: item.date,
          status: item.status,
          product,
          order: item.order ? {
            id: item.order.id,
            customer: item.order.customer
          } : undefined
        };
      });
      
      setMissingItems(formattedMissingItems);
    } catch (error) {
      console.error("Error fetching missing items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch missing items data.",
        variant: "destructive",
      });
    }
  };

  const addMissingItem = async (newMissingItem: MissingItem): Promise<MissingItem | null> => {
    try {
      // Convert to snake_case for database
      const dbMissingItem = adaptMissingItemToSnakeCase(newMissingItem);
      
      const { data, error } = await supabase
        .from('missing_items')
        .insert([dbMissingItem])
        .select(`
          *,
          product:products(*),
          order:orders(
            id,
            customer:customers(*)
          )
        `);
      
      if (error) {
        throw error;
      }

      // Convert the returned item to camelCase
      const addedItem = adaptMissingItemToCamelCase(data[0]);
      
      setMissingItems(prevItems => [...prevItems, addedItem]);
      
      return addedItem;
    } catch (error) {
      console.error("Error adding missing item:", error);
      toast({
        title: "Error",
        description: "Failed to add missing item data.",
        variant: "destructive",
      });
      return null;
    }
  };

  const removeMissingItem = async (missingItemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('missing_items')
        .delete()
        .eq('id', missingItemId);
      
      if (error) {
        throw error;
      }
      
      setMissingItems(prevItems =>
        prevItems.filter(item => item.id !== missingItemId)
      );
      
      return true;
    } catch (error) {
      console.error("Error removing missing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove missing item data.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return {
    missingItems,
    setMissingItems,
    fetchMissingItems,
    addMissingItem,
    removeMissingItem
  };
};
