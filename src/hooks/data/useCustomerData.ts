
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { adaptCustomerToSnakeCase, adaptCustomerToCamelCase } from "@/utils/typeAdapters";

export const useCustomerData = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { toast } = useToast();

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
      console.log("[useCustomerData] Updating customer with data:", customer);
      console.log("[useCustomerData] Account number:", customer.accountNumber || "EMPTY");
      console.log("[useCustomerData] Needs detailed box labels:", customer.needsDetailedBoxLabels);
      console.log("[useCustomerData] On hold status:", customer.onHold);
      console.log("[useCustomerData] Hold reason:", customer.holdReason || "EMPTY");
      
      // Make a deep copy of the customer to avoid reference issues
      const updatedCustomer = { ...customer };
      
      // Ensure all properties are properly set before converting
      if (updatedCustomer.accountNumber === undefined) {
        updatedCustomer.accountNumber = "";
        console.log("[useCustomerData] Setting empty accountNumber");
      }
      
      if (updatedCustomer.needsDetailedBoxLabels === undefined) {
        updatedCustomer.needsDetailedBoxLabels = false;
        console.log("[useCustomerData] Setting default needsDetailedBoxLabels to false");
      }
      
      // Ensure proper type conversion before updating the database
      const customerForDb = adaptCustomerToSnakeCase(updatedCustomer);
      console.log("[useCustomerData] Converted customer for DB update:", customerForDb);
      console.log("[useCustomerData] DB account_number:", customerForDb.account_number || "EMPTY");
      console.log("[useCustomerData] DB needs_detailed_box_labels:", customerForDb.needs_detailed_box_labels);
      console.log("[useCustomerData] DB on_hold status:", customerForDb.on_hold);
      
      const { error } = await supabase
        .from('customers')
        .update(customerForDb)
        .eq('id', updatedCustomer.id);
      
      if (error) {
        console.error('[useCustomerData] Supabase update error:', error);
        throw error;
      }
      
      // Create the updated customer object with proper typing to avoid reference issues
      const finalCustomer = adaptCustomerToCamelCase({...customerForDb, id: updatedCustomer.id});
      
      console.log("[useCustomerData] Updated customer in state:", finalCustomer);
      console.log("[useCustomerData] Updated accountNumber:", finalCustomer.accountNumber || "EMPTY");
      console.log("[useCustomerData] Updated needsDetailedBoxLabels:", finalCustomer.needsDetailedBoxLabels);
      console.log("[useCustomerData] Updated onHold status:", finalCustomer.onHold);
      
      // Update state with the complete updated customer object
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? finalCustomer : c));
      return true;
    } catch (error) {
      console.error('[useCustomerData] Error updating customer:', error);
      toast({
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
      toast({
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
