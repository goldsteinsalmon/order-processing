
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { adaptOrderToCamelCase, adaptOrderToSnakeCase } from '@/utils/typeAdapters';
import { 
  Order, OrderItem, Product, Customer, User, 
  Picker, MissingItem, Return, Complaint, StandingOrder,
  BatchUsage
} from '@/types';

// Define the shape of our context data
interface DataContextType {
  orders: Order[];
  completedOrders: Order[];
  products: Product[];
  customers: Customer[];
  users: User[];
  pickers: Picker[];
  missingItems: MissingItem[];
  returns: Return[];
  complaints: Complaint[];
  standingOrders: StandingOrder[];
  batchUsages: BatchUsage[];
  
  // Order operations
  addOrder: (order: Partial<Order>) => Promise<Order | null>;
  updateOrder: (order: Order) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
  completeOrder: (order: Order) => Promise<boolean>;
  
  // Product operations
  addProduct: (product: Partial<Product>) => Promise<Product | null>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  
  // Customer operations
  addCustomer: (customer: Partial<Customer>) => Promise<Customer | null>;
  updateCustomer: (customer: Customer) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  
  // Picker operations
  addPicker: (picker: Partial<Picker>) => Promise<Picker | null>;
  updatePicker: (picker: Picker) => Promise<boolean>;
  deletePicker: (pickerId: string) => Promise<boolean>;
  
  // Missing item operations
  addMissingItem: (item: Partial<MissingItem>) => Promise<MissingItem | null>;
  removeMissingItem: (itemId: string) => Promise<boolean>;
  
  // Batch usage tracking
  recordBatchUsage: (
    batchNumber: string, 
    productId: string, 
    quantity: number, 
    orderId: string, 
    weight?: number
  ) => Promise<boolean>;
  
  // Standing order operations
  processStandingOrders: () => Promise<boolean>;
}

// Create the context with default values
const DataContext = createContext<DataContextType>({
  orders: [],
  completedOrders: [],
  products: [],
  customers: [],
  users: [],
  pickers: [],
  missingItems: [],
  returns: [],
  complaints: [],
  standingOrders: [],
  batchUsages: [],
  
  // Default functions that will be overridden by the provider
  addOrder: async () => null,
  updateOrder: async () => false,
  deleteOrder: async () => false,
  completeOrder: async () => false,
  
  addProduct: async () => null,
  updateProduct: async () => false,
  deleteProduct: async () => false,
  
  addCustomer: async () => null,
  updateCustomer: async () => false,
  deleteCustomer: async () => false,
  
  addPicker: async () => null,
  updatePicker: async () => false,
  deletePicker: async () => false,
  
  addMissingItem: async () => null,
  removeMissingItem: async () => false,
  
  recordBatchUsage: async () => false,
  
  processStandingOrders: async () => false
});

// Create the provider component
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [standingOrders, setStandingOrders] = useState<StandingOrder[]>([]);
  const [batchUsages, setBatchUsages] = useState<BatchUsage[]>([]);
  
  // Load data on initial mount
  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchCustomers();
    fetchUsers();
    fetchPickers();
    fetchMissingItems();
    fetchReturns();
    fetchComplaints();
    fetchStandingOrders();
    fetchBatchUsages();
    fetchCompletedOrders();
  }, []);
  
  // Fetch functions
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(*, product:products(*))
        `);
      
      if (error) throw error;
      
      // Map the data to adapt snake_case to camelCase
      const adaptedOrders = data.map(adaptOrderToCamelCase);
      setOrders(adaptedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  const fetchCompletedOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('completed_orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(*, product:products(*))
        `);
      
      if (error) throw error;
      
      // Map the data to adapt snake_case to camelCase
      const adaptedOrders = data.map(adaptOrderToCamelCase);
      setCompletedOrders(adaptedOrders);
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    }
  };
  
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) throw error;
      
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      
      if (error) throw error;
      
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  const fetchPickers = async () => {
    try {
      const { data, error } = await supabase
        .from('pickers')
        .select('*');
      
      if (error) throw error;
      
      setPickers(data);
    } catch (error) {
      console.error('Error fetching pickers:', error);
    }
  };
  
  const fetchMissingItems = async () => {
    try {
      const { data, error } = await supabase
        .from('missing_items')
        .select(`
          *,
          product:products(*),
          order:orders(id, customer:customers(*))
        `);
      
      if (error) throw error;
      
      setMissingItems(data);
    } catch (error) {
      console.error('Error fetching missing items:', error);
    }
  };
  
  const fetchReturns = async () => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          product:products(*)
        `);
      
      if (error) throw error;
      
      setReturns(data);
    } catch (error) {
      console.error('Error fetching returns:', error);
    }
  };
  
  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          product:products(*)
        `);
      
      if (error) throw error;
      
      setComplaints(data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };
  
  const fetchStandingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('standing_orders')
        .select(`
          *,
          items:standing_order_items(*)
        `);
      
      if (error) throw error;
      
      setStandingOrders(data);
    } catch (error) {
      console.error('Error fetching standing orders:', error);
    }
  };
  
  const fetchBatchUsages = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_usages')
        .select('*');
      
      if (error) throw error;
      
      setBatchUsages(data);
    } catch (error) {
      console.error('Error fetching batch usages:', error);
    }
  };
  
  // Order operations
  const addOrder = async (order: Partial<Order>): Promise<Order | null> => {
    try {
      // Convert camelCase to snake_case for DB insert
      const dbOrder = adaptOrderToSnakeCase(order);
      
      const { data, error } = await supabase
        .from('orders')
        .insert([dbOrder])
        .select();
      
      if (error) throw error;
      
      const newOrder = adaptOrderToCamelCase(data[0]);
      setOrders([...orders, newOrder]);
      return newOrder;
    } catch (error) {
      console.error('Error adding order:', error);
      return null;
    }
  };
  
  const updateOrder = async (order: Order): Promise<boolean> => {
    try {
      // Convert camelCase to snake_case for DB insert
      const dbOrder = adaptOrderToSnakeCase(order);
      
      const { error } = await supabase
        .from('orders')
        .update(dbOrder)
        .eq('id', order.id);
      
      if (error) throw error;
      
      const adaptedOrder = adaptOrderToCamelCase(order);
      setOrders(orders.map(o => o.id === order.id ? adaptedOrder : o));
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  };
  
  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      // First delete all order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;
      
      // Then delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (error) throw error;
      
      setOrders(orders.filter(o => o.id !== orderId));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  };
  
  const completeOrder = async (order: Order): Promise<boolean> => {
    try {
      // Convert to snake_case
      const dbOrder = adaptOrderToSnakeCase(order);
      
      // Add to completed orders
      const { error: insertError } = await supabase
        .from('completed_orders')
        .insert([dbOrder]);
      
      if (insertError) throw insertError;
      
      // Delete from orders
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
      
      if (deleteError) throw deleteError;
      
      // Update state
      const adaptedOrder = adaptOrderToCamelCase(order);
      setCompletedOrders([adaptedOrder, ...completedOrders]);
      setOrders(orders.filter(o => o.id !== order.id));
      return true;
    } catch (error) {
      console.error('Error completing order:', error);
      return false;
    }
  };
  
  // Product operations
  const addProduct = async (product: Partial<Product>): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();
      
      if (error) throw error;
      
      const newProduct = data[0];
      setProducts([...products, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      return null;
    }
  };
  
  const updateProduct = async (product: Product): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update(product)
        .eq('id', product.id);
      
      if (error) throw error;
      
      setProducts(products.map(p => p.id === product.id ? product : p));
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  };
  
  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  };
  
  // Customer operations
  const addCustomer = async (customer: Partial<Customer>): Promise<Customer | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select();
      
      if (error) throw error;
      
      const newCustomer = data[0];
      setCustomers([...customers, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      return null;
    }
  };
  
  const updateCustomer = async (customer: Customer): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', customer.id);
      
      if (error) throw error;
      
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  };
  
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
      return false;
    }
  };
  
  // Picker operations
  const addPicker = async (picker: Partial<Picker>): Promise<Picker | null> => {
    try {
      const { data, error } = await supabase
        .from('pickers')
        .insert([picker])
        .select();
      
      if (error) throw error;
      
      const newPicker = data[0];
      setPickers([...pickers, newPicker]);
      return newPicker;
    } catch (error) {
      console.error('Error adding picker:', error);
      return null;
    }
  };
  
  const updatePicker = async (picker: Picker): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .update(picker)
        .eq('id', picker.id);
      
      if (error) throw error;
      
      setPickers(pickers.map(p => p.id === picker.id ? picker : p));
      return true;
    } catch (error) {
      console.error('Error updating picker:', error);
      return false;
    }
  };
  
  const deletePicker = async (pickerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .delete()
        .eq('id', pickerId);
      
      if (error) throw error;
      
      setPickers(pickers.filter(p => p.id !== pickerId));
      return true;
    } catch (error) {
      console.error('Error deleting picker:', error);
      return false;
    }
  };
  
  // Missing item operations
  const addMissingItem = async (item: Partial<MissingItem>): Promise<MissingItem | null> => {
    try {
      // Check if this missing item already exists
      const existingItem = missingItems.find(mi => mi.id === item.id);
      if (existingItem) {
        // Update existing item instead
        const { error } = await supabase
          .from('missing_items')
          .update({
            quantity: item.quantity,
            status: item.status || 'Pending',
            date: item.date || new Date().toISOString()
          })
          .eq('id', item.id);
        
        if (error) throw error;
        
        const updatedItems = missingItems.map(mi => 
          mi.id === item.id ? { ...mi, ...item } : mi
        );
        setMissingItems(updatedItems);
        return updatedItems.find(mi => mi.id === item.id);
      }
      
      // Insert new missing item
      const { data, error } = await supabase
        .from('missing_items')
        .insert([{
          id: item.id,
          order_id: item.orderId || item.order_id,
          product_id: item.productId || item.product_id,
          quantity: item.quantity,
          status: item.status || 'Pending',
          date: item.date || new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      
      const newItem = data[0];
      setMissingItems([...missingItems, { 
        ...newItem,
        product: products.find(p => p.id === newItem.product_id),
        order: {
          id: newItem.order_id,
          customer: customers.find(c => c.id === item.order?.customer?.id)
        }
      }]);
      
      return newItem;
    } catch (error) {
      console.error('Error adding missing item:', error);
      return null;
    }
  };
  
  const removeMissingItem = async (itemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('missing_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      setMissingItems(missingItems.filter(item => item.id !== itemId));
      return true;
    } catch (error) {
      console.error('Error removing missing item:', error);
      return false;
    }
  };
  
  // Batch usage tracking
  const recordBatchUsage = async (
    batchNumber: string, 
    productId: string, 
    quantity: number, 
    orderId: string, 
    weight?: number
  ): Promise<boolean> => {
    try {
      // Find the product to get its name
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');
      
      // Check if this batch usage already exists
      const existingBatch = batchUsages.find(batch => 
        batch.batch_number === batchNumber && 
        batch.product_id === productId
      );
      
      const now = new Date().toISOString();
      
      if (existingBatch) {
        // Update existing batch usage
        const { error } = await supabase
          .from('batch_usages')
          .update({
            used_weight: existingBatch.used_weight + (weight || quantity),
            last_used: now,
            orders_count: existingBatch.orders_count + 1
          })
          .eq('id', existingBatch.id);
        
        if (error) throw error;
        
        // Link this batch to the order
        const { error: linkError } = await supabase
          .from('batch_usage_orders')
          .insert([{
            batch_usage_id: existingBatch.id,
            order_identifier: orderId
          }]);
        
        if (linkError) throw linkError;
        
        // Update state
        const updatedBatches = batchUsages.map(batch => {
          if (batch.id === existingBatch.id) {
            return {
              ...batch,
              used_weight: batch.used_weight + (weight || quantity),
              last_used: now,
              orders_count: batch.orders_count + 1
            };
          }
          return batch;
        });
        setBatchUsages(updatedBatches);
      } else {
        // Create new batch usage
        const newBatch = {
          batch_number: batchNumber,
          product_id: productId,
          product_name: product.name,
          total_weight: product.weight || 0,
          used_weight: weight || quantity,
          first_used: now,
          last_used: now,
          orders_count: 1
        };
        
        const { data, error } = await supabase
          .from('batch_usages')
          .insert([newBatch])
          .select();
        
        if (error) throw error;
        
        // Link this batch to the order
        const { error: linkError } = await supabase
          .from('batch_usage_orders')
          .insert([{
            batch_usage_id: data[0].id,
            order_identifier: orderId
          }]);
        
        if (linkError) throw linkError;
        
        // Update state
        setBatchUsages([...batchUsages, data[0]]);
      }
      
      return true;
    } catch (error) {
      console.error('Error recording batch usage:', error);
      return false;
    }
  };
  
  // Process standing orders
  const processStandingOrders = async (): Promise<boolean> => {
    try {
      // Call the supabase function to process standing orders
      const { data, error } = await supabase.functions.invoke('process-standing-orders', {
        body: { trigger: "manual" }
      });
      
      if (error) throw error;
      
      // Refresh orders and standing orders to get latest data
      await Promise.all([fetchOrders(), fetchStandingOrders()]);
      
      return true;
    } catch (error) {
      console.error('Error processing standing orders:', error);
      return false;
    }
  };
  
  const contextValue = {
    orders,
    completedOrders,
    products,
    customers,
    users,
    pickers,
    missingItems,
    returns,
    complaints,
    standingOrders,
    batchUsages,
    
    addOrder,
    updateOrder,
    deleteOrder,
    completeOrder,
    
    addProduct,
    updateProduct,
    deleteProduct,
    
    addCustomer,
    updateCustomer,
    deleteCustomer,
    
    addPicker,
    updatePicker,
    deletePicker,
    
    addMissingItem,
    removeMissingItem,
    
    recordBatchUsage,
    
    processStandingOrders
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
