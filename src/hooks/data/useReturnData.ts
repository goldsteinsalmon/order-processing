
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Return } from "@/types";
import { adaptReturnToCamelCase } from "@/utils/typeAdapters";

export const useReturnData = (toast: any) => {
  const [returns, setReturns] = useState<Return[]>([]);

  const fetchReturns = async () => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*, product:products(*)');
        
      if (error) {
        throw error;
      }

      // Convert snake_case to camelCase
      const formattedReturns: Return[] = data.map(returnData => adaptReturnToCamelCase(returnData));
      
      setReturns(formattedReturns);
    } catch (error) {
      console.error("Error fetching returns:", error);
      toast({
        title: "Error",
        description: "Failed to fetch returns data.",
        variant: "destructive",
      });
    }
  };

  const addReturn = async (newReturn: Return): Promise<Return | null> => {
    try {
      // Convert camelCase to snake_case for database
      const dbReturn = {
        id: newReturn.id,
        customer_id: newReturn.customerId,
        customer_name: newReturn.customerName,
        customer_type: newReturn.customerType,
        contact_email: newReturn.contactEmail,
        contact_phone: newReturn.contactPhone,
        date_returned: newReturn.dateReturned,
        order_number: newReturn.orderNumber,
        invoice_number: newReturn.invoiceNumber,
        product_id: newReturn.productId,
        product_sku: newReturn.productSku,
        quantity: newReturn.quantity,
        reason: newReturn.reason,
        returns_required: newReturn.returnsRequired,
        return_status: newReturn.returnStatus,
        resolution_status: newReturn.resolutionStatus,
        resolution_notes: newReturn.resolutionNotes,
        created: newReturn.created
      };
      
      const { data, error } = await supabase
        .from('returns')
        .insert([dbReturn])
        .select('*, product:products(*)');
      
      if (error) {
        throw error;
      }

      // Convert the returned snake_case data to camelCase
      const addedReturn = adaptReturnToCamelCase(data[0]);
      
      setReturns(prevReturns => [...prevReturns, addedReturn]);
      
      return addedReturn;
    } catch (error) {
      console.error("Error adding return:", error);
      toast({
        title: "Error",
        description: "Failed to add return data.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateReturn = async (updatedReturn: Return): Promise<boolean> => {
    try {
      // Convert camelCase to snake_case for database
      const dbReturn = {
        id: updatedReturn.id,
        customer_id: updatedReturn.customerId,
        customer_name: updatedReturn.customerName,
        customer_type: updatedReturn.customerType,
        contact_email: updatedReturn.contactEmail,
        contact_phone: updatedReturn.contactPhone,
        date_returned: updatedReturn.dateReturned,
        order_number: updatedReturn.orderNumber,
        invoice_number: updatedReturn.invoiceNumber,
        product_id: updatedReturn.productId,
        product_sku: updatedReturn.productSku,
        quantity: updatedReturn.quantity,
        reason: updatedReturn.reason,
        returns_required: updatedReturn.returnsRequired,
        return_status: updatedReturn.returnStatus,
        resolution_status: updatedReturn.resolutionStatus,
        resolution_notes: updatedReturn.resolutionNotes,
        updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('returns')
        .update(dbReturn)
        .eq('id', updatedReturn.id);
      
      if (error) {
        throw error;
      }
      
      setReturns(prevReturns =>
        prevReturns.map(returnItem =>
          returnItem.id === updatedReturn.id ? updatedReturn : returnItem
        )
      );
      
      return true;
    } catch (error) {
      console.error("Error updating return:", error);
      toast({
        title: "Error",
        description: "Failed to update return data.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return {
    returns,
    setReturns,
    fetchReturns,
    addReturn,
    updateReturn
  };
};
