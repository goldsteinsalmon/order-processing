
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Return, Product } from "@/types";

export const useReturnData = (toast: any) => {
  const [returns, setReturns] = useState<Return[]>([]);

  // Add return
  const addReturn = async (returnItem: Return): Promise<Return | null> => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .insert({
          customer_id: returnItem.customer_id,
          customer_type: returnItem.customer_type,
          customer_name: returnItem.customer_name,
          contact_email: returnItem.contact_email,
          contact_phone: returnItem.contact_phone,
          date_returned: returnItem.date_returned,
          order_number: returnItem.order_number,
          invoice_number: returnItem.invoice_number,
          product_id: returnItem.product_id,
          product_sku: returnItem.product_sku,
          quantity: returnItem.quantity,
          reason: returnItem.reason,
          returns_required: returnItem.returns_required,
          return_status: returnItem.return_status,
          resolution_status: returnItem.resolution_status,
          resolution_notes: returnItem.resolution_notes,
          created: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      // Fetch product details for the newly created return
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', returnItem.product_id)
        .single();
      
      if (productError) throw productError;
      
      // Map to our Product model
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
      
      const newReturn: Return = {
        id: data[0].id,
        customer_id: data[0].customer_id,
        customer_type: data[0].customer_type as "Private" | "Trade",
        customer_name: data[0].customer_name,
        contact_email: data[0].contact_email,
        contact_phone: data[0].contact_phone,
        date_returned: data[0].date_returned,
        order_number: data[0].order_number,
        invoice_number: data[0].invoice_number,
        product_id: data[0].product_id,
        product_sku: data[0].product_sku,
        product: product,
        quantity: data[0].quantity,
        reason: data[0].reason,
        returns_required: data[0].returns_required as "Yes" | "No",
        return_status: data[0].return_status as "Pending" | "Processing" | "Completed" | "No Return Required",
        resolution_status: data[0].resolution_status as "Open" | "In Progress" | "Resolved",
        resolution_notes: data[0].resolution_notes,
        created: data[0].created,
        updated: data[0].updated
      };
      
      setReturns([...returns, newReturn]);
      return newReturn;
    } catch (error) {
      console.error('Error adding return:', error);
      toast({
        title: "Error",
        description: "Failed to add return.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update return
  const updateReturn = async (returnItem: Return): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('returns')
        .update({
          customer_id: returnItem.customer_id,
          customer_type: returnItem.customer_type,
          customer_name: returnItem.customer_name,
          contact_email: returnItem.contact_email,
          contact_phone: returnItem.contact_phone,
          date_returned: returnItem.date_returned,
          order_number: returnItem.order_number,
          invoice_number: returnItem.invoice_number,
          product_id: returnItem.product_id,
          product_sku: returnItem.product_sku,
          quantity: returnItem.quantity,
          reason: returnItem.reason,
          returns_required: returnItem.returns_required,
          return_status: returnItem.return_status,
          resolution_status: returnItem.resolution_status,
          resolution_notes: returnItem.resolution_notes,
          updated: new Date().toISOString()
        })
        .eq('id', returnItem.id);
      
      if (error) throw error;
      
      setReturns(returns.map(r => r.id === returnItem.id ? returnItem : r));
      return true;
    } catch (error) {
      console.error('Error updating return:', error);
      toast({
        title: "Error",
        description: "Failed to update return.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    returns,
    setReturns,
    addReturn,
    updateReturn
  };
};
