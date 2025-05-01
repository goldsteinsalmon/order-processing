
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { adaptCustomerToSnakeCase } from "@/lib/utils";

export const useCustomerData = (toastHandler: any) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Add customer
  const addCustomer = async (customer: Customer): Promise<Customer | null> => {
    try {
      // Ensure proper type conversion before inserting into the database
      const customerForDb = adaptCustomerToSnakeCase(customer);
      
      const { data, error } = await supabase
        .from('customers')
        .insert(customerForDb)
        .select();
      
      if (error) throw error;
      
      // Create the new customer object with proper typing
      const newCustomer: Customer = {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        phone: data[0].phone,
        address: data[0].address,
        type: data[0].type as "Trade", // Only Trade type is allowed
        accountNumber: data[0].account_number || "", // Convert to camelCase
        onHold: data[0].on_hold || false,
        holdReason: data[0].hold_reason,
        needsDetailedBoxLabels: data[0].needs_detailed_box_labels || false
      };
      
      setCustomers([...customers, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      toastHandler({
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
      // Ensure proper type conversion before updating the database
      const customerForDb = adaptCustomerToSnakeCase(customer);
      
      const { error } = await supabase
        .from('customers')
        .update(customerForDb)
        .eq('id', customer.id);
      
      if (error) throw error;
      
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      toastHandler({
        title: "Error",
        description: "Failed to update customer.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      
      if (error) throw error;
      
      setCustomers(customers.filter(c => c.id !== customerId));
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      toastHandler({
        title: "Error",
        description: "Failed to delete customer.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  };
};
