
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MissingItem, Customer, Product } from "@/types";

export const useMissingItemData = (toast: any) => {
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);

  // Add missing item
  const addMissingItem = async (missingItem: MissingItem): Promise<MissingItem | null> => {
    try {
      const { data, error } = await supabase
        .from('missing_items')
        .insert({
          order_id: missingItem.order_id,
          product_id: missingItem.product_id,
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
        .eq('id', missingItem.product_id)
        .single();
      
      if (productError) throw productError;
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, customer:customers(*)')
        .eq('id', missingItem.order_id)
        .single();
      
      if (orderError) throw orderError;
      
      // Map to our model types
      const product: Product = {
        id: productData.id,
        name: productData.name,
        sku: productData.sku,
        description: productData.description,
        stock_level: productData.stock_level,
        weight: productData.weight,
        requires_weight_input: productData.requires_weight_input,
        unit: productData.unit,
        required: productData.required
      };
      
      const customer: Customer = {
        id: orderData.customer.id,
        name: orderData.customer.name,
        email: orderData.customer.email,
        phone: orderData.customer.phone,
        address: orderData.customer.address,
        type: orderData.customer.type as "Private" | "Trade",
        account_number: orderData.customer.account_number,
        on_hold: orderData.customer.on_hold,
        hold_reason: orderData.customer.hold_reason,
        needs_detailed_box_labels: orderData.customer.needs_detailed_box_labels
      };
      
      const newMissingItem: MissingItem = {
        id: data[0].id,
        order_id: data[0].order_id,
        product_id: data[0].product_id,
        product: product,
        order: {
          id: orderData.id,
          customer: customer
        },
        quantity: data[0].quantity,
        date: data[0].date,
        status: data[0].status as "Pending" | "Processed" | undefined
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
