
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { adaptCustomerToSnakeCase, adaptCustomerToCamelCase } from "@/utils/typeAdapters";

export const useCustomerData = (toastHandler: any) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Add customer
  const addCustomer = async (customer: Customer): Promise<Customer | null> => {
    try {
      console.log("Adding customer with data:", customer);
      console.log("Account number:", customer.accountNumber);
      console.log("Needs detailed box labels:", customer.needsDetailedBoxLabels);
      
      // Ensure proper type conversion before inserting into the database
      const customerForDb = adaptCustomerToSnakeCase(customer);
      console.log("Converted customer for DB:", customerForDb);
      console.log("DB account_number:", customerForDb.account_number);
      console.log("DB needs_detailed_box_labels:", customerForDb.needs_detailed_box_labels);
      
      const { data, error } = await supabase
        .from('customers')
        .insert(customerForDb)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log("Supabase response:", data);
      
      if (!data || data.length === 0) {
        throw new Error("No data returned from insert operation");
      }
      
      // Create the new customer object with proper typing
      const newCustomer = adaptCustomerToCamelCase(data[0]);
      
      console.log("Created new customer object:", newCustomer);
      console.log("New customer accountNumber:", newCustomer.accountNumber);
      console.log("New customer needsDetailedBoxLabels:", newCustomer.needsDetailedBoxLabels);
      
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
      console.log("[useCustomerData] Updating customer with data:", customer);
      console.log("[useCustomerData] Account number:", customer.accountNumber);
      console.log("[useCustomerData] Needs detailed box labels:", customer.needsDetailedBoxLabels);
      console.log("[useCustomerData] On hold status:", customer.onHold);
      console.log("[useCustomerData] Hold reason:", customer.holdReason);
      
      // Ensure proper type conversion before updating the database
      const customerForDb = adaptCustomerToSnakeCase(customer);
      console.log("[useCustomerData] Converted customer for DB update:", customerForDb);
      console.log("[useCustomerData] DB account_number:", customerForDb.account_number);
      console.log("[useCustomerData] DB needs_detailed_box_labels:", customerForDb.needs_detailed_box_labels);
      console.log("[useCustomerData] DB on_hold status:", customerForDb.on_hold);
      
      const { error } = await supabase
        .from('customers')
        .update(customerForDb)
        .eq('id', customer.id);
      
      if (error) {
        console.error('[useCustomerData] Supabase update error:', error);
        throw error;
      }
      
      // Update the local state with the updated customer
      // Make sure we're using the fully converted object from the database
      const updatedCustomer = adaptCustomerToCamelCase({...customerForDb, id: customer.id});
      
      console.log("[useCustomerData] Updated customer in state:", updatedCustomer);
      console.log("[useCustomerData] Updated accountNumber:", updatedCustomer.accountNumber);
      console.log("[useCustomerData] Updated needsDetailedBoxLabels:", updatedCustomer.needsDetailedBoxLabels);
      console.log("[useCustomerData] Updated onHold status:", updatedCustomer.onHold);
      
      setCustomers(customers.map(c => c.id === customer.id ? updatedCustomer : c));
      return true;
    } catch (error) {
      console.error('[useCustomerData] Error updating customer:', error);
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
