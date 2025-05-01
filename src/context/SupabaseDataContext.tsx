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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [standingOrders, setStandingOrders] = useState<StandingOrder[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [batchUsages, setBatchUsages] = useState<BatchUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { session } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Create a tracking structure for processed batches to prevent double counting
  const [processedBatchOrderItems, setProcessedBatchOrderItems] = useState<Set<string>>(new Set());

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

  // Add product
  const addProduct = async (productData: Product | Product[]): Promise<Product | Product[] | null> => {
    try {
      if (Array.isArray(productData)) {
        // Add multiple products
        const productsToInsert = productData.map(p => ({
          name: p.name,
          sku: p.sku,
          description: p.description,
          stock_level: p.stockLevel,
          weight: p.weight,
          requires_weight_input: p.requiresWeightInput,
          unit: p.unit,
          required: p.required
        }));
        
        const { data, error } = await supabase
          .from('products')
          .insert(productsToInsert)
          .select();
        
        if (error) throw error;
        
        const newProducts = data.map((p: any) => ({
          ...p,
          stockLevel: p.stock_level,
          requiresWeightInput: p.requires_weight_input
        }));
        
        setProducts([...products, ...newProducts]);
        return newProducts;
      } else {
        // Add a single product
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: productData.name,
            sku: productData.sku,
            description: productData.description,
            stock_level: productData.stockLevel,
            weight: productData.weight,
            requires_weight_input: productData.requiresWeightInput,
            unit: productData.unit,
            required: productData.required
          })
          .select();
        
        if (error) throw error;
        
        const newProduct = {
          ...data[0],
          stockLevel: data[0].stock_level,
          requiresWeightInput: data[0].requires_weight_input
        };
        
        setProducts([...products, newProduct]);
        return newProduct;
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update product
  const updateProduct = async (product: Product): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          sku: product.sku,
          description: product.description,
          stock_level: product.stockLevel,
          weight: product.weight,
          requires_weight_input: product.requiresWeightInput,
          unit: product.unit,
          required: product.required
        })
        .eq('id', product.id);
      
      if (error) throw error;
      
      setProducts(products.map(p => p.id === product.id ? product : p));
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add order
  const addOrder = async (order: Order): Promise<Order | null> => {
    try {
      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: order.customerId,
          customer_order_number: order.customerOrderNumber,
          order_date: order.orderDate,
          required_date: order.requiredDate,
          delivery_method: order.deliveryMethod,
          notes: order.notes,
          status: order.status,
          created: new Date().toISOString()
        })
        .select();
      
      if (orderError) throw orderError;
      
      const newOrderId = orderData[0].id;
      
      // Insert order items
      const orderItemsToInsert = order.items.map(item => ({
        order_id: newOrderId,
        product_id: item.productId,
        quantity: item.quantity,
        original_quantity: item.quantity
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);
      
      if (itemsError) throw itemsError;
      
      // Fetch the newly created order with joined customer and items
      const { data: newOrderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', newOrderId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Fetch the order items with joined product
      const { data: newItemsData, error: newItemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('order_id', newOrderId);
      
      if (newItemsError) throw newItemsError;
      
      const newOrder = {
        ...newOrderData,
        items: newItemsData.map((item: any) => ({
          ...item,
          id: item.id,
          productId: item.product_id,
          product: item.product
        }))
      };
      
      setOrders([...orders, newOrder]);
      return newOrder;
    } catch (error) {
      console.error('Error adding order:', error);
      toast({
        title: "Error",
        description: "Failed to add order.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update order
  const updateOrder = async (updatedOrder: Order): Promise<boolean> => {
    try {
      // Check if the order is in orders list or completedOrders
      const isCompletedOrder = completedOrders.some(o => o.id === updatedOrder.id);
      
      // Update the order details
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_id: updatedOrder.customerId,
          customer_order_number: updatedOrder.customerOrderNumber,
          order_date: updatedOrder.orderDate,
          required_date: updatedOrder.requiredDate,
          delivery_method: updatedOrder.deliveryMethod,
          notes: updatedOrder.notes,
          status: updatedOrder.status,
          picker: updatedOrder.picker,
          is_picked: updatedOrder.isPicked,
          total_blown_pouches: updatedOrder.totalBlownPouches,
          is_modified: updatedOrder.isModified,
          updated: new Date().toISOString(),
          batch_number: updatedOrder.batchNumber,
          has_changes: updatedOrder.hasChanges,
          picked_by: updatedOrder.pickedBy,
          picked_at: updatedOrder.pickedAt,
          picking_in_progress: updatedOrder.pickingInProgress,
          invoiced: updatedOrder.invoiced,
          invoice_number: updatedOrder.invoiceNumber,
          invoice_date: updatedOrder.invoiceDate
        })
        .eq('id', updatedOrder.id);
      
      if (orderError) throw orderError;
      
      // Handle item updates if they exist
      if (updatedOrder.items && updatedOrder.items.length > 0) {
        // Get existing items for this order
        const { data: existingItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', updatedOrder.id);
        
        if (itemsError) throw itemsError;
        
        // Create map of existing items by id
        const existingItemMap = new Map();
        existingItems.forEach((item: any) => {
          existingItemMap.set(item.id, item);
        });
        
        // Process each updated item
        for (const item of updatedOrder.items) {
          if (item.id && existingItemMap.has(item.id)) {
            // Update existing item
            const { error: updateItemError } = await supabase
              .from('order_items')
              .update({
                quantity: item.quantity,
                unavailable_quantity: item.unavailableQuantity,
                is_unavailable: item.isUnavailable,
                blown_pouches: item.blownPouches,
                batch_number: item.batchNumber,
                checked: item.checked,
                missing_quantity: item.missingQuantity,
                picked_quantity: item.pickedQuantity,
                picked_weight: item.pickedWeight,
                original_quantity: item.originalQuantity,
                box_number: item.boxNumber,
                manual_weight: item.manualWeight
              })
              .eq('id', item.id);
            
            if (updateItemError) throw updateItemError;
            
            // Remove from map to track what's been processed
            existingItemMap.delete(item.id);
          } else {
            // Insert new item
            const { error: insertItemError } = await supabase
              .from('order_items')
              .insert({
                order_id: updatedOrder.id,
                product_id: item.productId,
                quantity: item.quantity,
                unavailable_quantity: item.unavailableQuantity,
                is_unavailable: item.isUnavailable,
                blown_pouches: item.blownPouches,
                batch_number: item.batchNumber,
                checked: item.checked,
                missing_quantity: item.missingQuantity,
                picked_quantity: item.pickedQuantity,
                picked_weight: item.pickedWeight,
                original_quantity: item.originalQuantity,
                box_number: item.boxNumber,
                manual_weight: item.manualWeight
              });
            
            if (insertItemError) throw insertItemError;
          }
        }
        
        // Delete any items that were removed
        if (existingItemMap.size > 0) {
          const itemsToDelete = Array.from(existingItemMap.keys());
          const { error: deleteItemsError } = await supabase
            .from('order_items')
            .delete()
            .in('id', itemsToDelete);
          
          if (deleteItemsError) throw deleteItemsError;
        }
      }
      
      // Handle order changes if they exist
      if (updatedOrder.changes && updatedOrder.changes.length > 0) {
        const changesToInsert = updatedOrder.changes.map(change => ({
          order_id: updatedOrder.id,
          product_id: change.productId,
          product_name: change.productName,
          original_quantity: change.originalQuantity,
          new_quantity: change.newQuantity,
          date: change.date || new Date().toISOString()
        }));
        
        const { error: changesError } = await supabase
          .from('order_changes')
          .insert(changesToInsert);
        
        if (changesError) throw changesError;
      }
      
      // Update state based on whether it's a completed order or not
      if (isCompletedOrder) {
        setCompletedOrders(completedOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      } else {
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      // Delete order items first due to foreign key constraints
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;
      
      // Delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (orderError) throw orderError;
      
      setOrders(orders.filter(order => order.id !== orderId));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Complete order (move to completed orders)
  const completeOrder = async (order: Order): Promise<boolean> => {
    try {
      // Update order status to completed
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'Completed',
          updated: new Date().toISOString(),
          batch_number: order.batchNumber,
          picker: order.picker || order.pickedBy
        })
        .eq('id', order.id);
      
      if (orderError) throw orderError;
      
      // Record batch usages if applicable
      if (order.batchNumber || (order.batchNumbers && order.batchNumbers.length > 0)) {
        // Reset processed items tracking
        setProcessedBatchOrderItems(new Set());
        
        // Create batch summary
        const batchSummary = createConsolidatedBatchSummary(order);
        
        // Record batch usages
        await recordBatchUsagesFromSummary(batchSummary, order.id);
      }
      
      // Update local state
      const updatedOrder = { ...order, status: 'Completed', updated: new Date().toISOString() };
      setOrders(orders.filter(o => o.id !== order.id));
      setCompletedOrders([...completedOrders, updatedOrder]);
      
      return true;
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: "Failed to complete order.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add standing order
  const addStandingOrder = async (standingOrder: StandingOrder): Promise<StandingOrder | null> => {
    try {
      // Insert standing order
      const { data: soData, error: soError } = await supabase
        .from('standing_orders')
        .insert({
          customer_id: standingOrder.customerId,
          customer_order_number: standingOrder.customerOrderNumber,
          frequency: standingOrder.schedule.frequency,
          day_of_week: standingOrder.schedule.dayOfWeek,
          day_of_month: standingOrder.schedule.dayOfMonth,
          delivery_method: standingOrder.schedule.deliveryMethod,
          next_delivery_date: standingOrder.schedule.nextDeliveryDate,
          notes: standingOrder.notes,
          active: standingOrder.active,
          next_processing_date: standingOrder.nextProcessingDate
        })
        .select();
      
      if (soError) throw soError;
      
      const newStandingOrderId = soData[0].id;
      
      // Insert standing order items
      const itemsToInsert = standingOrder.items.map(item => ({
        standing_order_id: newStandingOrderId,
        product_id: item.productId,
        quantity: item.quantity
      }));
      
      const { error: itemsError } = await supabase
        .from('standing_order_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
      
      // Fetch the complete standing order including customer
      const { data: newSOData, error: fetchError } = await supabase
        .from('standing_orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', newStandingOrderId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Fetch the standing order items with products
      const { data: newItemsData, error: newItemsError } = await supabase
        .from('standing_order_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('standing_order_id', newStandingOrderId);
      
      if (newItemsError) throw newItemsError;
      
      // Assemble complete standing order object
      const newStandingOrder = {
        ...newSOData,
        items: newItemsData.map((item: any) => ({
          ...item,
          id: item.id,
          productId: item.product_id,
          product: item.product
        })),
        schedule: {
          frequency: newSOData.frequency,
          dayOfWeek: newSOData.day_of_week,
          dayOfMonth: newSOData.day_of_month,
          deliveryMethod: newSOData.delivery_method,
          nextDeliveryDate: newSOData.next_delivery_date
        }
      };
      
      setStandingOrders([...standingOrders, newStandingOrder]);
      return newStandingOrder;
    } catch (error) {
      console.error('Error adding standing order:', error);
      toast({
        title: "Error",
        description: "Failed to add standing order.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update standing order
  const updateStandingOrder = async (standingOrder: StandingOrder): Promise<boolean> => {
    try {
      // Update standing order
      const { error: soError } = await supabase
        .from('standing_orders')
        .update({
          customer_id: standingOrder.customerId,
          customer_order_number: standingOrder.customerOrderNumber,
          frequency: standingOrder.schedule.frequency,
          day_of_week: standingOrder.schedule.dayOfWeek,
          day_of_month: standingOrder.schedule.dayOfMonth,
          delivery_method: standingOrder.schedule.deliveryMethod,
          next_delivery_date: standingOrder.schedule.nextDeliveryDate,
          notes: standingOrder.notes,
          active: standingOrder.active,
          updated: new Date().toISOString(),
          next_processing_date: standingOrder.nextProcessingDate,
          last_processed_date: standingOrder.lastProcessedDate
        })
        .eq('id', standingOrder.id);
      
      if (soError) throw soError;
      
      // Handle items - get existing items
      const { data: existingItems, error: existingItemsError } = await supabase
        .from('standing_order_items')
        .select('*')
        .eq('standing_order_id', standingOrder.id);
      
      if (existingItemsError) throw existingItemsError;
      
      // Create map of existing items
      const existingItemMap = new Map();
      existingItems.forEach((item: any) => {
        existingItemMap.set(item.id, item);
      });
      
      // Process each updated item
      for (const item of standingOrder.items) {
        if (item.id && existingItemMap.has(item.id)) {
          // Update existing item
          const { error: updateItemError } = await supabase
            .from('standing_order_items')
            .update({
              product_id: item.productId,
              quantity: item.quantity
            })
            .eq('id', item.id);
          
          if (updateItemError) throw updateItemError;
          
          // Remove from map to track what's been processed
          existingItemMap.delete(item.id);
        } else {
          // Insert new item
          const { error: insertItemError } = await supabase
            .from('standing_order_items')
            .insert({
              standing_order_id: standingOrder.id,
              product_id: item.productId,
              quantity: item.quantity
            });
          
          if (insertItemError) throw insertItemError;
        }
      }
      
      // Delete any items that were removed
      if (existingItemMap.size > 0) {
        const itemsToDelete = Array.from(existingItemMap.keys());
        const { error:
