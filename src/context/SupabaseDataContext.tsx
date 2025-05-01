
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  OrderItem,
  Box
} from "../types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { format, addDays, addWeeks, addMonths, parseISO } from "date-fns";
import { useSupabaseAuth } from "./SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

// Import the refactored hooks
import { useCustomerData } from "@/hooks/data/useCustomerData";
import { useProductData } from "@/hooks/data/useProductData";
import { useOrderData } from "@/hooks/data/useOrderData";
import { useStandingOrderData } from "@/hooks/data/useStandingOrderData";
import { useReturnData } from "@/hooks/data/useReturnData";
import { useComplaintData } from "@/hooks/data/useComplaintData";
import { useMissingItemData } from "@/hooks/data/useMissingItemData";
import { useUserData } from "@/hooks/data/useUserData";
import { usePickerData } from "@/hooks/data/usePickerData";
import { useBatchUsageData } from "@/hooks/data/useBatchUsageData";

interface DataContextType {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  completedOrders: Order[];
  standingOrders: StandingOrder[];
  returns: Return[];
  complaints: Complaint[];
  missingItems: MissingItem[];
  users: User[];
  pickers: Picker[];
  batchUsages: BatchUsage[];
  addCustomer: (customer: Customer) => Promise<Customer | null>;
  updateCustomer: (customer: Customer) => Promise<boolean>;
  addProduct: (product: Product | Product[]) => Promise<Product | Product[] | null>;
  updateProduct: (product: Product) => Promise<boolean>;
  addOrder: (order: Order) => Promise<Order | null>;
  updateOrder: (order: Order) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
  completeOrder: (order: Order) => Promise<boolean>;
  addStandingOrder: (standingOrder: StandingOrder) => Promise<StandingOrder | null>;
  updateStandingOrder: (standingOrder: StandingOrder) => Promise<boolean>;
  processStandingOrders: () => Promise<void>;
  addReturn: (returnItem: Return) => Promise<Return | null>;
  updateReturn: (returnItem: Return) => Promise<boolean>;
  addComplaint: (complaint: Complaint) => Promise<Complaint | null>;
  updateComplaint: (complaint: Complaint) => Promise<boolean>;
  addMissingItem: (missingItem: MissingItem) => Promise<MissingItem | null>;
  removeMissingItem: (missingItemId: string) => Promise<boolean>;
  addUser: (user: User) => Promise<User | null>;
  updateUser: (user: User) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  addPicker: (picker: Picker) => Promise<Picker | null>;
  updatePicker: (picker: Picker) => Promise<boolean>;
  deletePicker: (pickerId: string) => Promise<boolean>;
  getBatchUsages: () => BatchUsage[];
  getBatchUsageByBatchNumber: (batchNumber: string) => BatchUsage | undefined;
  recordBatchUsage: (batchNumber: string, productId: string, quantity: number, orderId: string, manualWeight?: number) => void;
  recordAllBatchUsagesForOrder: (order: Order) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const SupabaseDataContext = createContext<DataContextType | undefined>(undefined);

export const useSupabaseData = () => {
  const context = useContext(SupabaseDataContext);
  if (!context) {
    throw new Error("useSupabaseData must be used within a SupabaseDataProvider");
  }
  return context;
};

export const SupabaseDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useSupabaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Use our refactored data hooks
  const {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer
  } = useCustomerData(toast);

  const {
    products,
    setProducts,
    addProduct,
    updateProduct
  } = useProductData(toast);

  const {
    orders,
    completedOrders,
    setOrders,
    setCompletedOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    completeOrder
  } = useOrderData(toast);

  const {
    standingOrders,
    setStandingOrders,
    addStandingOrder,
    updateStandingOrder,
    processStandingOrders
  } = useStandingOrderData(toast, addOrder);

  const {
    returns,
    setReturns,
    addReturn,
    updateReturn
  } = useReturnData(toast);

  const {
    complaints,
    setComplaints,
    addComplaint,
    updateComplaint
  } = useComplaintData(toast);

  const {
    missingItems,
    setMissingItems,
    addMissingItem,
    removeMissingItem
  } = useMissingItemData(toast);

  const {
    users,
    setUsers,
    addUser,
    updateUser,
    deleteUser
  } = useUserData(toast);

  const {
    pickers,
    setPickers,
    addPicker,
    updatePicker,
    deletePicker
  } = usePickerData(toast);

  const {
    batchUsages,
    setBatchUsages,
    processedBatchOrderItems,
    setProcessedBatchOrderItems,
    getBatchUsages,
    getBatchUsageByBatchNumber,
    recordBatchUsage,
    recordAllBatchUsagesForOrder
  } = useBatchUsageData(toast, products);

  // Load data when authenticated
  useEffect(() => {
    if (session) {
      refreshData();
    }
  }, [session]);

  // Function to refresh all data from Supabase
  const refreshData = async () => {
    if (!session) return;
    
    setIsLoading(true);
    
    try {
      // Fetch customers
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*');
      
      if (customerError) throw customerError;
      
      // Fetch products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*');
      
      if (productError) throw productError;
      
      // Fetch pending orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .neq('status', 'Completed');
      
      if (orderError) throw orderError;
      
      // Fetch completed orders
      const { data: completedOrderData, error: completedOrderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('status', 'Completed');
      
      if (completedOrderError) throw completedOrderError;
      
      // Fetch order items for all orders
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(*)
        `);
      
      if (orderItemsError) throw orderItemsError;
      
      // Fetch standing orders
      const { data: standingOrderData, error: standingOrderError } = await supabase
        .from('standing_orders')
        .select(`
          *,
          customer:customers(*)
        `);
      
      if (standingOrderError) throw standingOrderError;
      
      // Fetch standing order items
      const { data: standingOrderItemsData, error: standingOrderItemsError } = await supabase
        .from('standing_order_items')
        .select(`
          *,
          product:products(*)
        `);
      
      if (standingOrderItemsError) throw standingOrderItemsError;
      
      // Fetch returns
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select(`
          *,
          product:products(*)
        `);
      
      if (returnsError) throw returnsError;
      
      // Fetch complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          *,
          product:products(*)
        `);
      
      if (complaintsError) throw complaintsError;
      
      // Fetch missing items
      const { data: missingItemsData, error: missingItemsError } = await supabase
        .from('missing_items')
        .select(`
          *,
          product:products(*),
          order:orders(id, customer:customers(*))
        `);
      
      if (missingItemsError) throw missingItemsError;
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) throw usersError;
      
      // Fetch pickers
      const { data: pickersData, error: pickersError } = await supabase
        .from('pickers')
        .select('*');
      
      if (pickersError) throw pickersError;
      
      // Fetch batch usages
      const { data: batchUsagesData, error: batchUsagesError } = await supabase
        .from('batch_usages')
        .select('*');
      
      if (batchUsagesError) throw batchUsagesError;
      
      // Fetch batch usage orders
      const { data: batchUsageOrdersData, error: batchUsageOrdersError } = await supabase
        .from('batch_usage_orders')
        .select('*');
      
      if (batchUsageOrdersError) throw batchUsageOrdersError;
      
      // Process and set data
      setCustomers(customerData as Customer[]);
      setProducts(productData as Product[]);
      
      // Process orders with their items
      const processedOrders = orderData.map((order: any) => {
        const orderItems = orderItemsData.filter((item: any) => item.order_id === order.id);
        return {
          ...order,
          items: orderItems.map((item: any) => ({
            ...item,
            product: item.product
          }))
        };
      });
      
      // Process completed orders with their items
      const processedCompletedOrders = completedOrderData.map((order: any) => {
        const orderItems = orderItemsData.filter((item: any) => item.order_id === order.id);
        return {
          ...order,
          items: orderItems.map((item: any) => ({
            ...item,
            product: item.product
          }))
        };
      });
      
      setOrders(processedOrders);
      setCompletedOrders(processedCompletedOrders);
      
      // Process standing orders with their items
      const processedStandingOrders = standingOrderData.map((standingOrder: any) => {
        const standingOrderItems = standingOrderItemsData.filter(
          (item: any) => item.standing_order_id === standingOrder.id
        );
        
        return {
          ...standingOrder,
          items: standingOrderItems.map((item: any) => ({
            ...item,
            product: item.product
          })),
          schedule: {
            frequency: standingOrder.frequency,
            dayOfWeek: standingOrder.day_of_week,
            dayOfMonth: standingOrder.day_of_month,
            deliveryMethod: standingOrder.delivery_method,
            nextDeliveryDate: standingOrder.next_delivery_date
          }
        };
      });
      
      setStandingOrders(processedStandingOrders);
      setReturns(returnsData as Return[]);
      setComplaints(complaintsData as Complaint[]);
      
      // Process missing items
      const processedMissingItems = missingItemsData.map((item: any) => ({
        ...item,
        order: item.order
      }));
      
      setMissingItems(processedMissingItems);
      setUsers(usersData as User[]);
      setPickers(pickersData as Picker[]);
      
      // Process batch usages with their order references
      const processedBatchUsages = batchUsagesData.map((batchUsage: any) => {
        const usedBy = batchUsageOrdersData
          .filter((item: any) => item.batch_usage_id === batchUsage.id)
          .map((item: any) => item.order_identifier);
        
        return {
          ...batchUsage,
          usedBy: usedBy
        };
      });
      
      setBatchUsages(processedBatchUsages);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
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
    addCustomer,
    updateCustomer,
    addProduct,
    updateProduct,
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
