
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Return } from "@/types";

export const useReturnData = (toast: any) => {
  const [returns, setReturns] = useState<Return[]>([]);

  // Add return
  const addReturn = async (returnItem: Return): Promise<Return | null> => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .insert({
          customer_id: returnItem.customerId,
          customer_type: returnItem.customerType,
          customer_name: returnItem.customerName,
          contact_email: returnItem.contactEmail,
          contact_phone: returnItem.contactPhone,
          date_returned: returnItem.dateReturned,
          order_number: returnItem.orderNumber,
          invoice_number: returnItem.invoiceNumber,
          product_id: returnItem.product.id,
          product_sku: returnItem.productSku,
          quantity: returnItem.quantity,
          reason: returnItem.reason,
          returns_required: returnItem.returnsRequired,
          return_status: returnItem.returnStatus,
          resolution_status: returnItem.resolutionStatus,
          resolution_notes: returnItem.resolutionNotes,
          created: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      // Fetch product details for the newly created return
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', returnItem.product.id)
        .single();
      
      if (productError) throw productError;
      
      const newReturn = {
        ...data[0],
        customerType: data[0].customer_type,
        customerName: data[0].customer_name,
        customerId: data[0].customer_id,
        contactEmail: data[0].contact_email,
        contactPhone: data[0].contact_phone,
        dateReturned: data[0].date_returned,
        orderNumber: data[0].order_number,
        invoiceNumber: data[0].invoice_number,
        productSku: data[0].product_sku,
        product: productData,
        returnsRequired: data[0].returns_required,
        returnStatus: data[0].return_status,
        resolutionStatus: data[0].resolution_status,
        resolutionNotes: data[0].resolution_notes,
        created: data[0].created
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
          customer_id: returnItem.customerId,
          customer_type: returnItem.customerType,
          customer_name: returnItem.customerName,
          contact_email: returnItem.contactEmail,
          contact_phone: returnItem.contactPhone,
          date_returned: returnItem.dateReturned,
          order_number: returnItem.orderNumber,
          invoice_number: returnItem.invoiceNumber,
          product_id: returnItem.product.id,
          product_sku: returnItem.productSku,
          quantity: returnItem.quantity,
          reason: returnItem.reason,
          returns_required: returnItem.returnsRequired,
          return_status: returnItem.returnStatus,
          resolution_status: returnItem.resolutionStatus,
          resolution_notes: returnItem.resolutionNotes,
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
