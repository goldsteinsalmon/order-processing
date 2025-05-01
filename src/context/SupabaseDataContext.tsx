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
  deleteCustomer: (customerId: string) => Promise<boolean>;
  addProduct: (product: Product | Product[]) => Promise<Product | Product[] | null>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
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
    products,
    setProducts,
    addProduct,
    updateProduct,
    deleteProduct
  } = useProductData(toast);

  const {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  } = useCustomerData(toast);

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
      // Fetch different data types
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
      
      // Process and set data with proper typing
      const mappedCustomers: Customer[] = customerData.map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        address: item.address,
        type: item.type as "Private" | "Trade",
        accountNumber: item.account_number,
        onHold: item.on_hold,
        holdReason: item.hold_reason,
        needsDetailedBoxLabels: item.needs_detailed_box_labels
      }));
      
      // Fetch products
      const mappedProducts: Product[] = productData.map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        stock_level: item.stock_level,
        weight: item.weight,
        requires_weight_input: item.requires_weight_input,
        unit: item.unit,
        required: item.required
      }));

      // Helper function to map customer data
      const mapCustomer = (customerData: any): Customer => ({
        id: customerData.id,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        type: customerData.type as "Private" | "Trade",
        accountNumber: customerData.account_number,
        onHold: customerData.on_hold,
        holdReason: customerData.hold_reason,
        needsDetailedBoxLabels: customerData.needs_detailed_box_labels
      });

      // Helper function to map product data
      const mapProduct = (productData: any): Product => ({
        id: productData.id,
        name: productData.name,
        sku: productData.sku,
        description: productData.description,
        stock_level: productData.stock_level,
        weight: productData.weight,
        requires_weight_input: productData.requires_weight_input,
        unit: productData.unit,
        required: productData.required
      });

      // Process orders with their items
      const processedOrders = orderData.map((order: any) => {
        const orderItems = orderItemsData.filter((item: any) => item.order_id === order.id);
        return {
          ...order,
          customerId: order.customer_id,
          customerOrderNumber: order.customer_order_number,
          orderDate: order.order_date,
          requiredDate: order.required_date,
          deliveryMethod: order.delivery_method as "Delivery" | "Collection",
          isPicked: order.is_picked,
          totalBlownPouches: order.total_blown_pouches,
          isModified: order.is_modified,
          fromStandingOrder: order.from_standing_order,
          hasChanges: order.has_changes,
          pickedBy: order.picked_by,
          pickedAt: order.picked_at,
          pickingInProgress: order.picking_in_progress,
          invoiced: order.invoiced,
          invoiceNumber: order.invoice_number,
          invoiceDate: order.invoice_date,
          customer: mapCustomer(order.customer),
          items: orderItems.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            product: mapProduct(item.product),
            quantity: item.quantity,
            unavailableQuantity: item.unavailable_quantity,
            isUnavailable: item.is_unavailable,
            blownPouches: item.blown_pouches,
            batchNumber: item.batch_number,
            checked: item.checked,
            missingQuantity: item.missing_quantity,
            pickedQuantity: item.picked_quantity,
            pickedWeight: item.picked_weight,
            originalQuantity: item.original_quantity,
            boxNumber: item.box_number,
            manualWeight: item.manual_weight
          }))
        };
      });
      
      // Process completed orders with their items
      const processedCompletedOrders = completedOrderData.map((order: any) => {
        const orderItems = orderItemsData.filter((item: any) => item.order_id === order.id);
        return {
          ...order,
          customerId: order.customer_id,
          customerOrderNumber: order.customer_order_number,
          orderDate: order.order_date,
          requiredDate: order.required_date,
          deliveryMethod: order.delivery_method as "Delivery" | "Collection",
          isPicked: order.is_picked,
          totalBlownPouches: order.total_blown_pouches,
          isModified: order.is_modified,
          fromStandingOrder: order.from_standing_order,
          hasChanges: order.has_changes,
          pickedBy: order.picked_by,
          pickedAt: order.picked_at,
          pickingInProgress: order.picking_in_progress,
          invoiced: order.invoiced,
          invoiceNumber: order.invoice_number,
          invoiceDate: order.invoice_date,
          customer: mapCustomer(order.customer),
          items: orderItems.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            product: mapProduct(item.product),
            quantity: item.quantity,
            unavailableQuantity: item.unavailable_quantity,
            isUnavailable: item.is_unavailable,
            blownPouches: item.blown_pouches,
            batchNumber: item.batch_number,
            checked: item.checked,
            missingQuantity: item.missing_quantity,
            pickedQuantity: item.picked_quantity,
            pickedWeight: item.picked_weight,
            originalQuantity: item.original_quantity,
            boxNumber: item.box_number,
            manualWeight: item.manual_weight
          }))
        };
      });
      
      // Process standing orders with their items
      const processedStandingOrders = standingOrderData.map((standingOrder: any) => {
        const standingOrderItems = standingOrderItemsData.filter(
          (item: any) => item.standing_order_id === standingOrder.id
        );
        
        return {
          ...standingOrder,
          customerId: standingOrder.customer_id,
          customerOrderNumber: standingOrder.customer_order_number,
          lastProcessedDate: standingOrder.last_processed_date,
          nextProcessingDate: standingOrder.next_processing_date,
          customer: mapCustomer(standingOrder.customer),
          items: standingOrderItems.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            product: mapProduct(item.product),
            quantity: item.quantity
          })),
          schedule: {
            frequency: standingOrder.frequency as "Weekly" | "Bi-Weekly" | "Monthly",
            dayOfWeek: standingOrder.day_of_week,
            dayOfMonth: standingOrder.day_of_month,
            deliveryMethod: standingOrder.delivery_method as "Delivery" | "Collection",
            nextDeliveryDate: standingOrder.next_delivery_date
          }
        };
      });
      
      // Process returns
      const processedReturns: Return[] = returnsData.map((item: any) => ({
        id: item.id,
        customer_id: item.customer_id,
        customer_type: item.customer_type as "Private" | "Trade",
        customer_name: item.customer_name,
        contact_email: item.contact_email,
        contact_phone: item.contact_phone,
        date_returned: item.date_returned,
        order_number: item.order_number,
        invoice_number: item.invoice_number,
        product_sku: item.product_sku,
        product_id: item.product_id,
        product: mapProduct(item.product),
        quantity: item.quantity,
        reason: item.reason,
        returns_required: item.returns_required as "Yes" | "No",
        return_status: item.return_status as "Pending" | "Processing" | "Completed" | "No Return Required",
        resolution_status: item.resolution_status as "Open" | "In Progress" | "Resolved",
        resolution_notes: item.resolution_notes,
        created: item.created,
        updated: item.updated
      }));
      
      // Process complaints
      const processedComplaints: Complaint[] = complaintsData.map((item: any) => ({
        id: item.id,
        customer_type: item.customer_type as "Private" | "Trade",
        customer_name: item.customer_name,
        customer_id: item.customer_id,
        contact_email: item.contact_email,
        contact_phone: item.contact_phone,
        date_submitted: item.date_submitted,
        order_number: item.order_number,
        invoice_number: item.invoice_number,
        product_sku: item.product_sku,
        product_id: item.product_id,
        product: item.product ? mapProduct(item.product) : undefined,
        complaint_type: item.complaint_type,
        complaint_details: item.complaint_details,
        returns_required: item.returns_required as "Yes" | "No",
        return_status: item.return_status as "Pending" | "Processing" | "Completed" | "No Return Required",
        resolution_status: item.resolution_status as "Open" | "In Progress" | "Resolved",
        resolution_notes: item.resolution_notes,
        created: item.created,
        updated: item.updated
      }));
      
      // Process missing items
      const processedMissingItems: MissingItem[] = missingItemsData.map((item: any) => {
        const customerData = item.order?.customer;
        const customer = customerData ? mapCustomer(customerData) : undefined;
        
        return {
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          product: mapProduct(item.product),
          quantity: item.quantity,
          date: item.date,
          status: item.status as "Pending" | "Processed" | undefined,
          order: {
            id: item.order?.id,
            customer: customer!
          }
        };
      });
      
      // Process batch usages
      const processedBatchUsages: BatchUsage[] = batchUsagesData.map((batchUsage: any) => {
        const usedBy = batchUsageOrdersData
          .filter((item: any) => item.batch_usage_id === batchUsage.id)
          .map((item: any) => item.order_identifier);
        
        return {
          id: batchUsage.id,
          batch_number: batchUsage.batch_number,
          product_id: batchUsage.product_id,
          product_name: batchUsage.product_name,
          total_weight: batchUsage.total_weight,
          used_weight: batchUsage.used_weight,
          orders_count: batchUsage.orders_count,
          first_used: batchUsage.first_used,
          last_used: batchUsage.last_used,
          usedBy: usedBy
        };
      });
      
      setCustomers(mappedCustomers);
      setProducts(mappedProducts);
      setOrders(processedOrders);
      setCompletedOrders(processedCompletedOrders);
      setStandingOrders(processedStandingOrders);
      setReturns(processedReturns);
      setComplaints(processedComplaints);
      setMissingItems(processedMissingItems);
      setUsers(usersData as User[]);
      setPickers(pickersData as Picker[]);
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
