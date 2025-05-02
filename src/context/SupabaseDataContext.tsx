import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Customer,
  Product,
  Order,
  StandingOrder,
  Return,
  Complaint,
  MissingItem,
  User,
  Picker,
  BatchUsage,
} from "@/types";
import {
  adaptCustomerToCamelCase,
  adaptProductToCamelCase,
  adaptOrderToCamelCase,
  adaptReturnToCamelCase,
  adaptComplaintToCamelCase,
  adaptMissingItemToCamelCase,
  adaptBatchUsageToCamelCase,
  adaptCustomerToSnakeCase
} from "@/utils/typeAdapters";
import { useToast } from "@/hooks/use-toast";
import { useMissingItemData } from "@/hooks/data/useMissingItemData";
import { useReturnData } from "@/hooks/data/useReturnData";

// Define the interface for SupabaseDataContext
interface SupabaseDataContextType {
  customers: any[];
  products: any[];
  orders: any[];
  completedOrders: any[];
  standingOrders: any[];
  returns: any[];
  complaints: any[];
  missingItems: any[];
  users: any[];
  pickers: any[];
  batchUsages: any[];
  nonWorkingDays: any[];
  addNonWorkingDay: (date: string, description?: string) => Promise<any | null>;
  updateNonWorkingDay: (id: string, description: string) => Promise<boolean>;
  deleteNonWorkingDay: (id: string) => Promise<boolean>;
  addCustomer: (customer: any) => Promise<any | null>;
  updateCustomer: (customer: any) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  addProduct: (product: any | any[]) => Promise<any | any[] | null>;
  updateProduct: (product: any) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  addOrder: (order: any) => Promise<any | null>;
  updateOrder: (order: any) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
  completeOrder: (order: any) => Promise<boolean>;
  addStandingOrder: (standingOrder: any) => Promise<any | null>;
  updateStandingOrder: (standingOrder: any) => Promise<boolean>;
  processStandingOrders: () => Promise<void>;
  addReturn: (returnItem: any) => Promise<any | null>;
  updateReturn: (returnItem: any) => Promise<boolean>;
  addComplaint: (complaint: any) => Promise<any | null>;
  updateComplaint: (complaint: any) => Promise<boolean>;
  addMissingItem: (missingItem: any) => Promise<any | null>;
  removeMissingItem: (missingItemId: string) => Promise<boolean>;
  addUser: (user: any) => Promise<any | null>;
  updateUser: (user: any) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  addPicker: (picker: any) => Promise<any | null>;
  updatePicker: (picker: any) => Promise<boolean>;
  deletePicker: (pickerId: string) => Promise<boolean>;
  getBatchUsages: () => any[];
  getBatchUsageByBatchNumber: (batchNumber: string) => any | undefined;
  recordBatchUsage: (batchNumber: string, productId: string, quantity: number, orderId: string, manualWeight?: number) => void;
  recordAllBatchUsagesForOrder: (order: any) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

// Create the context
const SupabaseDataContext = createContext<SupabaseDataContextType | undefined>(undefined);

// Custom hook for using Supabase data
export const useSupabaseData = (): SupabaseDataContextType => {
  const context = useContext(SupabaseDataContext);
  if (!context) {
    throw new Error("useSupabaseData must be used within a SupabaseDataProvider");
  }
  return context;
};

// Provider component
export const SupabaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for storing data
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [standingOrders, setStandingOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [missingItems, setMissingItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pickers, setPickers] = useState<any[]>([]);
  const [batchUsages, setBatchUsages] = useState<any[]>([]);
  const [nonWorkingDays, setNonWorkingDays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Function to refresh all data from Supabase
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Fetch customers
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*');
      
      if (customerError) {
        console.error("Error fetching customers:", customerError);
      } else {
        setCustomers(customerData);
      }
      
      // Fetch products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*');
      
      if (productError) {
        console.error("Error fetching products:", productError);
      } else {
        setProducts(productData);
      }
      
      // Fetch orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, customer:customers(*), items:order_items(*, product:products(*))');
      
      if (orderError) {
        console.error("Error fetching orders:", orderError);
      } else {
        setOrders(orderData);
      }
      
      // Fetch completed orders
      const { data: completedOrderData, error: completedOrderError } = await supabase
        .from('completed_orders')
        .select('*, customer:customers(*), items:order_items(*, product:products(*))');
      
      if (completedOrderError) {
        console.error("Error fetching completed orders:", completedOrderError);
      } else {
        setCompletedOrders(completedOrderData);
      }
      
      // Fetch standing orders
      const { data: standingOrderData, error: standingOrderError } = await supabase
        .from('standing_orders')
        .select('*, customer:customers(*), items:standing_order_items(*, product:products(*))');
      
      if (standingOrderError) {
        console.error("Error fetching standing orders:", standingOrderError);
      } else {
        setStandingOrders(standingOrderData);
      }
      
      // For Returns
      if (!customerError && !productError) {
        const { data: returnData, error: returnError } = await supabase
          .from('returns')
          .select('*, product:products(*)');
        
        if (returnError) {
          console.error("Error fetching returns:", returnError);
        } else {
          // Convert data from snake_case to camelCase
          const formattedReturns = returnData.map(item => adaptReturnToCamelCase(item));
          setReturns(formattedReturns);
        }
      }
      
      // For Complaints
      if (!customerError && !productError) {
        const { data: complaintData, error: complaintError } = await supabase
          .from('complaints')
          .select('*, product:products(*)');
        
        if (complaintError) {
          console.error("Error fetching complaints:", complaintError);
        } else {
          // Convert data from snake_case to camelCase
          const formattedComplaints = complaintData.map(item => adaptComplaintToCamelCase(item));
          setComplaints(formattedComplaints);
        }
      }
      
      // For Missing Items
      if (!customerError && !productError) {
        const { data: missingItemData, error: missingItemError } = await supabase
          .from('missing_items')
          .select(`
            *,
            product:products(*),
            order:orders(
              id,
              customer:customers(*)
            )
          `);
        
        if (missingItemError) {
          console.error("Error fetching missing items:", missingItemError);
        } else {
          // Convert data from snake_case to camelCase
          const formattedMissingItems = missingItemData.map(item => adaptMissingItemToCamelCase(item));
          setMissingItems(formattedMissingItems);
        }
      }
      
      // Fetch users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*');
      
      if (userError) {
        console.error("Error fetching users:", userError);
      } else {
        setUsers(userData);
      }
      
      // Fetch pickers
      const { data: pickerData, error: pickerError } = await supabase
        .from('pickers')
        .select('*');
      
      if (pickerError) {
        console.error("Error fetching pickers:", pickerError);
      } else {
        setPickers(pickerData);
      }
      
      // For batch usages
      if (!customerError && !productError) {
        const { data: batchUsageData, error: batchUsageError } = await supabase
          .from('batch_usages')
          .select('*, batch_usage_orders(*)');
        
        if (batchUsageError) {
          console.error("Error fetching batch usages:", batchUsageError);
        } else {
          // Convert data from snake_case to camelCase
          const formattedBatchUsages = batchUsageData.map(item => adaptBatchUsageToCamelCase({
            ...item,
            usedBy: item.batch_usage_orders?.map((order: any) => order.order_identifier) || []
          }));
          setBatchUsages(formattedBatchUsages);
        }
      }
      
      // Fetch non-working days
      const { data: nonWorkingDaysData, error: nonWorkingDaysError } = await supabase
        .from('non_working_days')
        .select('*')
        .order('date', { ascending: true });
      
      if (nonWorkingDaysError) {
        console.error("Error fetching non-working days:", nonWorkingDaysError);
      } else {
        setNonWorkingDays(nonWorkingDaysData);
      }
      
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD operations for customers
  const addCustomer = async (customer: any): Promise<any | null> => {
    try {
      console.log("SupabaseDataContext - Adding customer:", customer);
      console.log("SupabaseDataContext - With account_number:", customer.account_number || "EMPTY");
      console.log("SupabaseDataContext - With needs_detailed_box_labels:", customer.needs_detailed_box_labels);
      
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select();
      
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      
      console.log("SupabaseDataContext - Added customer response:", data[0]);
      
      setCustomers(prev => [...prev, data[0]]);
      return data[0];
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Error",
        description: "Failed to add customer.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCustomer = async (customer: any): Promise<boolean> => {
    try {
      console.log("SupabaseDataContext updateCustomer - Received customer:", customer);
      console.log("SupabaseDataContext updateCustomer - With account_number:", customer.account_number || "EMPTY");
      console.log("SupabaseDataContext updateCustomer - With on_hold:", customer.on_hold);
      console.log("SupabaseDataContext updateCustomer - With hold_reason:", customer.hold_reason || "EMPTY");
      console.log("SupabaseDataContext updateCustomer - With needs_detailed_box_labels:", customer.needs_detailed_box_labels);
      
      // Convert to snake_case before sending to database
      const customerForDb = { ...customer };
      console.log("SupabaseDataContext updateCustomer - Customer for DB update:", customerForDb);
      
      const { data, error } = await supabase
        .from('customers')
        .update(customerForDb)
        .eq('id', customer.id)
        .select();
      
      if (error) {
        console.error("Supabase update customer error:", error);
        throw error;
      }
      
      console.log("SupabaseDataContext updateCustomer - Update response:", data);
      
      // Update the customers state with the updated customer
      setCustomers(prev =>
        prev.map(c => c.id === customer.id ? data[0] : c)
      );
      
      return true;
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error",
        description: "Failed to update customer.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      
      if (error) {
        throw error;
      }
      
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer.",
        variant: "destructive",
      });
      return false;
    }
  };

  // CRUD operations for products
  const addProduct = async (product: any | any[]): Promise<any | any[] | null> => {
    try {
      if (Array.isArray(product)) {
        const { data, error } = await supabase
          .from('products')
          .insert(product)
          .select();
        
        if (error) {
          throw error;
        }
        
        setProducts(prev => [...prev, ...data]);
        return data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select();
        
        if (error) {
          throw error;
        }
        
        setProducts(prev => [...prev, data[0]]);
        return data[0];
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProduct = async (product: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update(product)
        .eq('id', product.id);
      
      if (error) {
        throw error;
      }
      
      setProducts(prev =>
        prev.map(p => p.id === product.id ? product : p)
      );
      
      return true;
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) {
        throw error;
      }
      
      setProducts(prev => prev.filter(p => p.id !== productId));
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
      return false;
    }
  };

  // CRUD operations for orders
  const addOrder = async (order: any): Promise<any | null> => {
    try {
      // First, insert the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: order.id,
          customer_id: order.customer_id,
          customer_order_number: order.customer_order_number,
          order_date: order.order_date,
          required_date: order.required_date,
          delivery_method: order.delivery_method,
          status: order.status,
          notes: order.notes,
          is_picked: order.is_picked || false,
          from_standing_order: order.from_standing_order
        }])
        .select();
      
      if (orderError) {
        throw orderError;
      }
      
      const newOrder = orderData[0];
      
      // Then, insert order items if they exist
      if (order.items && order.items.length > 0) {
        const orderItems = order.items.map((item: any) => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) {
          throw itemsError;
        }
      }
      
      // Refresh orders to get the new order with items
      await refreshData();
      
      return newOrder;
    } catch (error) {
      console.error("Error adding order:", error);
      toast({
        title: "Error",
        description: "Failed to add order.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateOrder = async (order: any): Promise<boolean> => {
    try {
      // Update the main order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_id: order.customer_id,
          customer_order_number: order.customer_order_number,
          order_date: order.order_date,
          required_date: order.required_date,
          delivery_method: order.delivery_method,
          status: order.status,
          notes: order.notes,
          is_picked: order.is_picked,
          total_blown_pouches: order.total_blown_pouches,
          is_modified: order.is_modified,
          batch_number: order.batch_number,
          has_changes: order.has_changes,
          from_standing_order: order.from_standing_order,
          picking_in_progress: order.picking_in_progress,
          picked_by: order.picked_by,
          picked_at: order.picked_at,
          invoiced: order.invoiced,
          invoice_number: order.invoice_number,
          invoice_date: order.invoice_date
        })
        .eq('id', order.id);
      
      if (orderError) {
        throw orderError;
      }
      
      // Update items if they exist
      if (order.items && order.items.length > 0) {
        // First, delete existing items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', order.id);
        
        if (deleteError) {
          throw deleteError;
        }
        
        // Then, insert updated items
        const orderItems = order.items.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unavailable_quantity: item.unavailable_quantity || 0,
          is_unavailable: item.is_unavailable || false,
          blown_pouches: item.blown_pouches || 0,
          batch_number: item.batch_number || '',
          checked: item.checked || false,
          missing_quantity: item.missing_quantity || 0,
          picked_quantity: item.picked_quantity || 0,
          picked_weight: item.picked_weight,
          original_quantity: item.original_quantity,
          box_number: item.box_number,
          manual_weight: item.manual_weight
        }));
        
        const { error: insertError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (insertError) {
          throw insertError;
        }
      }
      
      // Refresh orders to get updated order with items
      await refreshData();
      
      return true;
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      // Delete order items first
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) {
        throw itemsError;
      }
      
      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (orderError) {
        throw orderError;
      }
      
      setOrders(prev => prev.filter(o => o.id !== orderId));
      return true;
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order.",
        variant: "destructive",
      });
      return false;
    }
  };

  const completeOrder = async (order: any): Promise<boolean> => {
    try {
      // Move order to completed_orders table
      const { data, error: completeError } = await supabase
        .from('completed_orders')
        .insert([{
          id: order.id,
          customer_id: order.customer_id,
          customer_order_number: order.customer_order_number,
          order_date: order.order_date,
          required_date: order.required_date,
          delivery_method: order.delivery_method,
          status: order.status,
          notes: order.notes,
          is_picked: true,
          total_blown_pouches: order.total_blown_pouches,
          picked_by: order.picked_by,
          picked_at: order.picked_at,
          batch_number: order.batch_number,
          created: order.created,
          updated: new Date().toISOString()
        }])
        .select();
      
      if (completeError) {
        throw completeError;
      }
      
      // Delete from orders table
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Update state
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setCompletedOrders(prev => [...prev, data[0]]);
      
      return true;
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "Error",
        description: "Failed to complete order.",
        variant: "destructive",
      });
      return false;
    }
  };

  // CRUD operations for standing orders
  const addStandingOrder = async (standingOrder: any): Promise<any | null> => {
    try {
      // Similar implementation to addOrder
      const { data, error } = await supabase
        .from('standing_orders')
        .insert([{
          customer_id: standingOrder.customer_id,
          customer_order_number: standingOrder.customer_order_number,
          frequency: standingOrder.frequency,
          day_of_week: standingOrder.day_of_week,
          day_of_month: standingOrder.day_of_month,
          next_delivery_date: standingOrder.next_delivery_date,
          delivery_method: standingOrder.delivery_method,
          notes: standingOrder.notes,
          active: standingOrder.active,
          next_processing_date: standingOrder.next_processing_date
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      const newStandingOrder = data[0];
      
      // Insert standing order items if they exist
      if (standingOrder.items && standingOrder.items.length > 0) {
        const items = standingOrder.items.map((item: any) => ({
          standing_order_id: newStandingOrder.id,
          product_id: item.product_id,
          quantity: item.quantity
        }));
        
        const { error: itemsError } = await supabase
          .from('standing_order_items')
          .insert(items);
        
        if (itemsError) {
          throw itemsError;
        }
      }
      
      // Refresh data
      await refreshData();
      
      return newStandingOrder;
    } catch (error) {
      console.error("Error adding standing order:", error);
      toast({
        title: "Error",
        description: "Failed to add standing order.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateStandingOrder = async (standingOrder: any): Promise<boolean> => {
    try {
      // Similar implementation to updateOrder
      const { error } = await supabase
        .from('standing_orders')
        .update({
          customer_id: standingOrder.customer_id,
          customer_order_number: standingOrder.customer_order_number,
          frequency: standingOrder.frequency,
          day_of_week: standingOrder.day_of_week,
          day_of_month: standingOrder.day_of_month,
          next_delivery_date: standingOrder.next_delivery_date,
          delivery_method: standingOrder.delivery_method,
          notes: standingOrder.notes,
          active: standingOrder.active,
          next_processing_date: standingOrder.next_processing_date,
          last_processed_date: standingOrder.last_processed_date
        })
        .eq('id', standingOrder.id);
      
      if (error) {
        throw error;
      }
      
      // Update items if they exist
      if (standingOrder.items && standingOrder.items.length > 0) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('standing_order_items')
          .delete()
          .eq('standing_order_id', standingOrder.id);
        
        if (deleteError) {
          throw deleteError;
        }
        
        // Insert updated items
        const items = standingOrder.items.map((item: any) => ({
          standing_order_id: standingOrder.id,
          product_id: item.product_id,
          quantity: item.quantity
        }));
        
        const { error: insertError } = await supabase
          .from('standing_order_items')
          .insert(items);
        
        if (insertError) {
          throw insertError;
        }
      }
      
      // Refresh data
      await refreshData();
      
      return true;
    } catch (error) {
      console.error("Error updating standing order:", error);
      toast({
        title: "Error",
        description: "Failed to update standing order.",
        variant: "destructive",
      });
      return false;
    }
  };

  const processStandingOrders = async (): Promise<void> => {
    try {
      // Call edge function or direct database function to process standing orders
      const { data, error } = await supabase.functions.invoke('process-standing-orders', {
        body: { trigger: 'manual' }
      });
      
      if (error) {
        throw error;
      }
      
      // Refresh data to get newly created orders
      await refreshData();
      
      toast({
        title: "Success",
        description: "Standing orders processed successfully."
      });
    } catch (error) {
      console.error("Error processing standing orders:", error);
      toast({
        title: "Error",
        description: "Failed to process standing orders.",
        variant: "destructive",
      });
    }
  };

  // Missing items operations
  const addMissingItem = async (missingItem: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('missing_items')
        .insert([missingItem])
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
      
      // Convert to camelCase
      const formattedMissingItem = adaptMissingItemToCamelCase(data[0]);
      
      setMissingItems(prev => [...prev, formattedMissingItem]);
      return formattedMissingItem;
    } catch (error) {
      console.error("Error adding missing item:", error);
      toast({
        title: "Error",
        description: "Failed to add missing item.",
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
      
      setMissingItems(prev => prev.filter(item => item.id !== missingItemId));
      return true;
    } catch (error) {
      console.error("Error removing missing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove missing item.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Return operations
  const addReturn = async (returnItem: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .insert([returnItem])
        .select('*, product:products(*)');
      
      if (error) {
        throw error;
      }
      
      // Convert to camelCase
      const formattedReturn = adaptReturnToCamelCase(data[0]);
      
      setReturns(prev => [...prev, formattedReturn]);
      return formattedReturn;
    } catch (error) {
      console.error("Error adding return:", error);
      toast({
        title: "Error",
        description: "Failed to add return.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateReturn = async (returnItem: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('returns')
        .update(returnItem)
        .eq('id', returnItem.id);
      
      if (error) {
        throw error;
      }
      
      const { data, error: fetchError } = await supabase
        .from('returns')
        .select('*, product:products(*)')
        .eq('id', returnItem.id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Convert to camelCase
      const formattedReturn = adaptReturnToCamelCase(data);
      
      setReturns(prev => prev.map(r => r.id === returnItem.id ? formattedReturn : r));
      return true;
    } catch (error) {
      console.error("Error updating return:", error);
      toast({
        title: "Error",
        description: "Failed to update return.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Complaint operations
  const addComplaint = async (complaint: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert([complaint])
        .select('*, product:products(*)');
      
      if (error) {
        throw error;
      }
      
      // Convert to camelCase
      const formattedComplaint = adaptComplaintToCamelCase(data[0]);
      
      setComplaints(prev => [...prev, formattedComplaint]);
      return formattedComplaint;
    } catch (error) {
      console.error("Error adding complaint:", error);
      toast({
        title: "Error",
        description: "Failed to add complaint.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateComplaint = async (complaint: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update(complaint)
        .eq('id', complaint.id);
      
      if (error) {
        throw error;
      }
      
      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select('*, product:products(*)')
        .eq('id', complaint.id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Convert to camelCase
      const formattedComplaint = adaptComplaintToCamelCase(data);
      
      setComplaints(prev => prev.map(c => c.id === complaint.id ? formattedComplaint : c));
      return true;
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast({
        title: "Error",
        description: "Failed to update complaint.",
        variant: "destructive",
      });
      return false;
    }
  };

  // User operations
  const addUser = async (user: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select();
      
      if (error) {
        throw error;
      }
      
      setUsers(prev => [...prev, data[0]]);
      return data[0];
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateUser = async (user: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update(user)
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Picker operations
  const addPicker = async (picker: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('pickers')
        .insert([picker])
        .select();
      
      if (error) {
        throw error;
      }
      
      setPickers(prev => [...prev, data[0]]);
      return data[0];
    } catch (error) {
      console.error("Error adding picker:", error);
      toast({
        title: "Error",
        description: "Failed to add picker.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePicker = async (picker: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .update(picker)
        .eq('id', picker.id);
      
      if (error) {
        throw error;
      }
      
      setPickers(prev => prev.map(p => p.id === picker.id ? picker : p));
      return true;
    } catch (error) {
      console.error("Error updating picker:", error);
      toast({
        title: "Error",
        description: "Failed to update picker.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePicker = async (pickerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .delete()
        .eq('id', pickerId);
      
      if (error) {
        throw error;
      }
      
      setPickers(prev => prev.filter(p => p.id !== pickerId));
      return true;
    } catch (error) {
      console.error("Error deleting picker:", error);
      toast({
        title: "Error",
        description: "Failed to delete picker.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Batch usage operations
  const getBatchUsages = () => batchUsages;

  const getBatchUsageByBatchNumber = (batchNumber: string) => {
    return batchUsages.find(bu => bu.batchNumber === batchNumber);
  };

  const recordBatchUsage = async (
    batchNumber: string,
    productId: string,
    quantity: number,
    orderId: string,
    manualWeight?: number
  ) => {
    try {
      // Find product
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      // Check if batch usage already exists
      let existingBatchUsage = batchUsages.find(bu => bu.batchNumber === batchNumber);
      
      if (existingBatchUsage) {
        // Update existing batch usage
        const { error } = await supabase
          .from('batch_usages')
          .update({
            used_weight: existingBatchUsage.used_weight + (manualWeight || 0),
            orders_count: existingBatchUsage.orders_count + 1,
            last_used: new Date().toISOString()
          })
          .eq('batch_number', batchNumber);
        
        if (error) {
          throw error;
        }
        
        // Add batch usage order
        const { error: orderError } = await supabase
          .from('batch_usage_orders')
          .insert([{
            batch_usage_id: existingBatchUsage.id,
            order_identifier: orderId
          }]);
        
        if (orderError) {
          throw orderError;
        }
      } else {
        // Create new batch usage
        const { data, error } = await supabase
          .from('batch_usages')
          .insert([{
            batch_number: batchNumber,
            product_id: productId,
            product_name: product.name,
            total_weight: manualWeight || 0,
            used_weight: manualWeight || 0,
            orders_count: 1,
            first_used: new Date().toISOString(),
            last_used: new Date().toISOString()
          }])
          .select();
        
        if (error) {
          throw error;
        }
        
        // Add batch usage order
        const { error: orderError } = await supabase
          .from('batch_usage_orders')
          .insert([{
            batch_usage_id: data[0].id,
            order_identifier: orderId
          }]);
        
        if (orderError) {
          throw orderError;
        }
      }
      
      // Refresh data
      await refreshData();
      
    } catch (error) {
      console.error("Error recording batch usage:", error);
      toast({
        title: "Error",
        description: "Failed to record batch usage.",
        variant: "destructive",
      });
    }
  };

  const recordAllBatchUsagesForOrder = async (order: any) => {
    try {
      if (!order.items || order.items.length === 0) {
        return;
      }
      
      // Group by batch number
      const batchGroups: Record<string, { productId: string, weight: number }> = {};
      
      order.items.forEach((item: any) => {
        if (!item.batchNumber) return;
        
        const batchNumber = item.batchNumber;
        
        if (!batchGroups[batchNumber]) {
          batchGroups[batchNumber] = {
            productId: item.productId || item.product_id,
            weight: 0
          };
        }
        
        batchGroups[batchNumber].weight += (item.pickedWeight || item.picked_weight || 0);
      });
      
      // Record each batch usage
      for (const [batchNumber, data] of Object.entries(batchGroups)) {
        await recordBatchUsage(
          batchNumber,
          data.productId,
          0,
          order.id,
          data.weight
        );
      }
      
    } catch (error) {
      console.error("Error recording all batch usages:", error);
      toast({
        title: "Error",
        description: "Failed to record all batch usages.",
        variant: "destructive",
      });
    }
  };

  // CRUD operations for non-working days
  const addNonWorkingDay = async (date: string, description?: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('non_working_days')
        .insert([{ 
          date, 
          description: description || null 
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      setNonWorkingDays(prev => [...prev, data[0]]);
      return data[0];
    } catch (error) {
      console.error("Error adding non-working day:", error);
      toast({
        title: "Error",
        description: "Failed to add non-working day.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateNonWorkingDay = async (id: string, description: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('non_working_days')
        .update({ description })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setNonWorkingDays(prev =>
        prev.map(day => day.id === id ? { ...day, description } : day)
      );
      
      return true;
    } catch (error) {
      console.error("Error updating non-working day:", error);
      toast({
        title: "Error",
        description: "Failed to update non-working day.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteNonWorkingDay = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('non_working_days')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setNonWorkingDays(prev => prev.filter(day => day.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting non-working day:", error);
      toast({
        title: "Error",
        description: "Failed to delete non-working day.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Value object for the context provider
  const value: SupabaseDataContextType = {
    customers,
    products,
    orders,
    completedOrders,
    standingOrders,
    returns,
    complaints,
    missingItems,
    users,
    pickers,
    batchUsages,
    nonWorkingDays,
    addNonWorkingDay,
    updateNonWorkingDay,
    deleteNonWorkingDay,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
    updateOrder,
    deleteOrder,
    completeOrder,
    addStandingOrder,
    updateStandingOrder,
    processStandingOrders,
    addReturn,
    updateReturn,
    addComplaint,
    updateComplaint,
    addMissingItem,
    removeMissingItem,
    addUser,
    updateUser,
    deleteUser,
    addPicker,
    updatePicker,
    deletePicker,
    getBatchUsages,
    getBatchUsageByBatchNumber,
    recordBatchUsage,
    recordAllBatchUsagesForOrder,
    refreshData,
    isLoading
  };

  return <SupabaseDataContext.Provider value={value}>{children}</SupabaseDataContext.Provider>;
};

export default SupabaseDataProvider;
