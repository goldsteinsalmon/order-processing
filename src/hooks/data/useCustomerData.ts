
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { toast } from "@/hooks/use-toast";
import { adaptCustomerToCamelCase, adaptCustomerToSnakeCase } from "@/utils/typeAdapters";

export const useCustomerData = (toastHandler: any) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Add customer
  const addCustomer = async (customer: Customer): Promise<Customer | null> => {
    try {
      // Convert customer from camelCase to snake_case for database
      const customerForDb = adaptCustomerToSnakeCase(customer);
      
      const { data, error } = await supabase
        .from('customers')
        .insert(customerForDb)
        .select();
      
      if (error) throw error;
      
      // Convert the returned data from snake_case to camelCase
      const newCustomer = adaptCustomerToCamelCase(data[0]);
      
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
      // Convert customer from camelCase to snake_case for database
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

  return {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer
  };
};
