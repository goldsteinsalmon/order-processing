
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { Toast } from "@/hooks/use-toast";

export const useCustomerData = (toast: any) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Add customer
  const addCustomer = async (customer: Customer): Promise<Customer | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          type: customer.type,
          account_number: customer.accountNumber,
          on_hold: customer.onHold || false,
          hold_reason: customer.holdReason,
          needs_detailed_box_labels: customer.needsDetailedBoxLabels || false
        })
        .select();
      
      if (error) throw error;
      
      const newCustomer = {
        ...data[0],
        accountNumber: data[0].account_number,
        onHold: data[0].on_hold,
        holdReason: data[0].hold_reason,
        needsDetailedBoxLabels: data[0].needs_detailed_box_labels
      };
      
      setCustomers([...customers, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update customer
  const updateCustomer = async (customer: Customer): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          type: customer.type,
          account_number: customer.accountNumber,
          on_hold: customer.onHold || false,
          hold_reason: customer.holdReason,
          needs_detailed_box_labels: customer.needsDetailedBoxLabels || false
        })
        .eq('id', customer.id);
      
      if (error) throw error;
      
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer
  };
};
