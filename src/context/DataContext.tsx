
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Customer, Order, Product, StandingOrder, MissingItem, OrderItem, Picker } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useCustomerData } from "@/hooks/data/useCustomerData";
import { useProductData } from "@/hooks/data/useProductData";
import { useStandingOrderData } from "@/hooks/data/useStandingOrderData";
import { useReturnsComplaintsData } from "@/hooks/data/useReturnsComplaintsData";
import { usePickerData } from "@/hooks/data/usePickerData";

interface DataContextType {
  customers: Customer[];
  orders: Order[];
  products: Product[];
  standingOrders: StandingOrder[];
  missingItems: MissingItem[];
  pickers: Picker[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setStandingOrders: React.Dispatch<React.SetStateAction<StandingOrder[]>>;
  setMissingItems: React.Dispatch<React.SetStateAction<MissingItem[]>>;
  setPickers: React.Dispatch<React.SetStateAction<Picker[]>>;
  addCustomer: (customer: Customer) => Promise<Customer | null>;
  addProduct: (product: Product) => Promise<Product | null>;
  addOrder: (order: Order) => Promise<Order | null>;
  addStandingOrder: (standingOrder: StandingOrder) => Promise<StandingOrder | null>;
  addMissingItem: (missingItem: MissingItem) => Promise<MissingItem | null>;
  updateCustomer: (customer: Customer) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  updateOrder: (order: Order) => Promise<boolean>;
  updateStandingOrder: (standingOrder: StandingOrder) => Promise<boolean>;
  updateMissingItem: (missingItem: MissingItem) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  deleteMissingItem: (id: string) => Promise<boolean>;
  completeOrder: (order: Order) => Promise<boolean>;
  recordBatchUsage: (batchNumber: string, productId: string, quantity: number, orderId: string, weight?: number) => Promise<boolean>;
  recordAllBatchUsagesForOrder: (order: Order) => Promise<void>;
  refreshData: () => Promise<void>;
  refreshOrderData: (orderId: string) => Promise<void>;
  isLoading: boolean;
  returnsComplaints: any[];
  setReturnsComplaints: React.Dispatch<React.SetStateAction<any[]>>;
  addReturnsComplaints: (returnsComplaints: any) => Promise<any | null>;
  updateReturnsComplaints: (returnsComplaints: any) => Promise<boolean>;
  deleteReturnsComplaints: (id: string) => Promise<boolean>;
}

export const DataContext = createContext<DataContextType>({
  customers: [],
  orders: [],
  products: [],
  standingOrders: [],
  missingItems: [],
  pickers: [],
  setCustomers: () => {},
  setOrders: () => {},
  setProducts: () => {},
  setStandingOrders: () => {},
  setMissingItems: () => {},
  setPickers: () => {},
  addCustomer: async () => null,
  addProduct: async () => null,
  addOrder: async () => null,
  addStandingOrder: async () => null,
  addMissingItem: async () => null,
  updateCustomer: async () => false,
  updateProduct: async () => false,
  updateOrder: async () => false,
  updateStandingOrder: async () => false,
  updateMissingItem: async () => false,
  deleteCustomer: async () => false,
  deleteProduct: async () => false,
  deleteOrder: async () => false,
  deleteMissingItem: async () => false,
  completeOrder: async () => false,
  recordBatchUsage: async () => false,
  recordAllBatchUsagesForOrder: async () => {},
  refreshData: async () => {},
  refreshOrderData: async () => {},
  isLoading: false,
  returnsComplaints: [],
  setReturnsComplaints: () => {},
  addReturnsComplaints: async () => null,
  updateReturnsComplaints: async () => false,
  deleteReturnsComplaints: async () => false,
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [standingOrders, setStandingOrders] = useState<StandingOrder[]>([]);
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returnsComplaints, setReturnsComplaints] = useState<any[]>([]);
  const { toast } = useToast();

  const {
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomerData(toast);

  const {
    addProduct,
    updateProduct,
    deleteProduct,
  } = useProductData(toast);

  const {
    addReturnsComplaints,
    updateReturnsComplaints,
    deleteReturnsComplaints,
  } = useReturnsComplaintsData(toast);

  const { addPickerData } = usePickerData(toast);

  // Fetch pickers
  const fetchPickers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pickers')
        .select('*');

      if (error) {
        console.error('Error fetching pickers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch pickers.",
          variant: "destructive",
        });
      }

      if (data) {
        setPickers(data as Picker[]);
      }
    } catch (error) {
      console.error('Error fetching pickers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pickers.",
        variant: "destructive",
      });
    }
  }, [setPickers, toast]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch customers.",
          variant: "destructive",
        });
      }

      if (data) {
        setCustomers(data as Customer[]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers.",
        variant: "destructive",
      });
    }
  }, [setCustomers, toast]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Failed to fetch products.",
          variant: "destructive",
        });
      }

      if (data) {
        setProducts(data as Product[]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products.",
        variant: "destructive",
      });
    }
  }, [setProducts, toast]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(
            *,
            product:products(*)
          ),
          missing_items:missing_items(
            *,
            product:products(*)
          )
        `)
        .order('created', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders.",
          variant: "destructive",
        });
      }

      if (data) {
        // Adapt the order items to camelCase
        const adaptedOrders = data.map(order => {
          return {
            ...order,
            customer: order.customer,
            items: order.items.map(item => ({
              ...item,
              productId: item.product_id,
              orderId: item.order_id,
              product: item.product,
            })),
            missingItems: order.missing_items.map(item => ({
              ...item,
              productId: item.product_id,
              orderId: item.order_id,
              product: item.product,
            })),
            customerId: order.customer_id,
            orderDate: order.order_date,
            requiredDate: order.required_date,
            deliveryMethod: order.delivery_method,
            customerOrderNumber: order.customer_order_number,
            pickingInProgress: order.picking_in_progress,
            isPicked: order.is_picked,
            pickedBy: order.picked_by,
            pickedAt: order.picked_at,
            completedBoxes: order.completed_boxes || 0,
            savedBoxes: order.saved_boxes || 0,
          };
        });
        setOrders(adaptedOrders as Order[]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders.",
        variant: "destructive",
      });
    }
  }, [setOrders, toast]);

  // Fetch standing orders
  const fetchStandingOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('standing_orders')
        .select(`
          *,
          customer:customers(*),
          items:standing_order_items(
            *,
            product:products(*)
          )
        `)
        .order('created', { ascending: false });

      if (error) {
        console.error('Error fetching standing orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch standing orders.",
          variant: "destructive",
        });
      }

      if (data) {
        // Adapt the standing order items to camelCase
        const adaptedStandingOrders = data.map(standingOrder => {
          return {
            ...standingOrder,
            customerId: standingOrder.customer_id,
            customerOrderNumber: standingOrder.customer_order_number,
            schedule: {
              frequency: standingOrder.frequency,
              dayOfWeek: standingOrder.day_of_week,
              dayOfMonth: standingOrder.day_of_month,
              deliveryMethod: standingOrder.delivery_method,
              nextDeliveryDate: standingOrder.next_delivery_date,
              modifiedDeliveries: standingOrder.modified_deliveries
            },
            items: standingOrder.items.map(item => ({
              ...item,
              productId: item.product_id,
              standingOrderId: item.standing_order_id,
              product: item.product,
            })),
            nextProcessingDate: standingOrder.next_processing_date,
            lastProcessedDate: standingOrder.last_processed_date
          };
        });
        setStandingOrders(adaptedStandingOrders as StandingOrder[]);
      }
    } catch (error) {
      console.error('Error fetching standing orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch standing orders.",
        variant: "destructive",
      });
    }
  }, [setStandingOrders, toast]);

  // Fetch missing items
  const fetchMissingItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('missing_items')
        .select(`
          *,
          product:products(*)
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching missing items:', error);
        toast({
          title: "Error",
          description: "Failed to fetch missing items.",
          variant: "destructive",
        });
      }

      if (data) {
        setMissingItems(data as MissingItem[]);
      }
    } catch (error) {
      console.error('Error fetching missing items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch missing items.",
        variant: "destructive",
      });
    }
  }, [setMissingItems, toast]);

  // Fetch returns and complaints
  const fetchReturnsComplaints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('returns_complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching returns and complaints:', error);
        toast({
          title: "Error",
          description: "Failed to fetch returns and complaints.",
          variant: "destructive",
        });
      }

      if (data) {
        setReturnsComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching returns and complaints:', error);
      toast({
        title: "Error",
        description: "Failed to fetch returns and complaints.",
        variant: "destructive",
      });
    }
  }, [setReturnsComplaints, toast]);

  // Create the addOrder function before using it
  // Function to add an order
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
          created: new Date().toISOString(),
          from_standing_order: order.fromStandingOrder,
          picking_in_progress: false,
          is_picked: false
        })
        .select();

      if (orderError) throw orderError;

      const newOrderId = orderData[0].id;

      // Insert order items
      const orderItemsToInsert = order.items.map(item => ({
        order_id: newOrderId,
        product_id: item.productId,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      // If the order has box distributions, save them
      if (order.boxDistributions && order.boxDistributions.length > 0) {
        const boxDistributionsToInsert = order.boxDistributions.map(box => ({
          order_id: newOrderId,
          box_number: box.boxNumber,
          items: box.items,
          completed: box.completed,
          printed: box.printed
        }));

        const { error: boxesError } = await supabase
          .from('box_distributions')
          .insert(boxDistributionsToInsert);

        if (boxesError) throw boxesError;
      }

      // Fetch the newly created order with joined customer
      const { data: newOrderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', newOrderId)
        .single();

      if (fetchError) throw fetchError;

      // Adapt the order items to camelCase
      const adaptedOrder = {
        ...newOrderData,
        customerId: newOrderData.customer_id,
        customerOrderNumber: newOrderData.customer_order_number,
        orderDate: newOrderData.order_date,
        requiredDate: newOrderData.required_date,
        deliveryMethod: newOrderData.delivery_method,
        items: newOrderData.items.map(item => ({
          ...item,
          productId: item.product_id,
          orderId: item.order_id,
          product: item.product,
        })),
        fromStandingOrder: newOrderData.from_standing_order,
        pickingInProgress: newOrderData.picking_in_progress,
        isPicked: newOrderData.is_picked,
        pickedBy: newOrderData.picked_by,
        pickedAt: newOrderData.picked_at,
        completedBoxes: newOrderData.completed_boxes || 0,
        savedBoxes: newOrderData.saved_boxes || 0,
      };

      setOrders([...orders, adaptedOrder as Order]);
      return adaptedOrder as Order;
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

  const {
    addStandingOrder,
    updateStandingOrder,
    processStandingOrders
  } = useStandingOrderData(toast, addOrder);

  // Refresh data function
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCustomers(),
        fetchProducts(),
        fetchOrders(),
        fetchStandingOrders(),
        fetchMissingItems(),
        fetchPickers(),
        fetchReturnsComplaints()
      ]);
      processStandingOrders();
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    fetchCustomers,
    fetchProducts,
    fetchOrders,
    fetchStandingOrders,
    fetchMissingItems,
    fetchPickers,
    fetchReturnsComplaints,
    processStandingOrders,
    toast
  ]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Function to update an order
  const updateOrder = async (order: Order): Promise<boolean> => {
    try {
      // Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_id: order.customerId,
          customer_order_number: order.customerOrderNumber,
          order_date: order.orderDate,
          required_date: order.requiredDate,
          delivery_method: order.deliveryMethod,
          notes: order.notes,
          status: order.status,
          updated: new Date().toISOString(),
          picking_in_progress: order.pickingInProgress,
          is_picked: order.isPicked,
          picked_by: order.pickedBy,
          picked_at: order.pickedAt,
          completed_boxes: order.completedBoxes,
          saved_boxes: order.savedBoxes
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Handle item updates
      // First delete existing items
      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id);

      if (deleteItemsError) throw deleteItemsError;

      // Then insert updated items
      const orderItemsToInsert = order.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        batch_number: item.batchNumber,
        checked: item.checked,
        picked_quantity: item.pickedQuantity,
        picked_weight: item.pickedWeight,
        box_number: item.boxNumber,
        original_quantity: item.originalQuantity
      }));

      const { error: insertItemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (insertItemsError) throw insertItemsError;

      // Update missing items
      // First delete existing missing items
      const { error: deleteMissingItemsError } = await supabase
        .from('missing_items')
        .delete()
        .eq('order_id', order.id);

      if (deleteMissingItemsError) throw deleteMissingItemsError;

      // Then insert updated missing items
      if (order.missingItems && order.missingItems.length > 0) {
        const missingItemsToInsert = order.missingItems.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          date: item.date,
          status: item.status
        }));

        const { error: insertMissingItemsError } = await supabase
          .from('missing_items')
          .insert(missingItemsToInsert);

        if (insertMissingItemsError) throw insertMissingItemsError;
      }

      // Update local state
      setOrders(orders.map(o =>
        o.id === order.id ? order : o
      ));

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

  // Function to delete an order
  const deleteOrder = async (id: string): Promise<boolean> => {
    try {
      // Delete order items first
      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);

      if (deleteItemsError) throw deleteItemsError;

      // Delete missing items
       const { error: deleteMissingItemsError } = await supabase
        .from('missing_items')
        .delete()
        .eq('order_id', id);

      if (deleteMissingItemsError) throw deleteMissingItemsError;

      // Delete order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (orderError) throw orderError;

      // Update local state
      setOrders(orders.filter(order => order.id !== id));

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

  // Function to add a missing item
  const addMissingItem = async (missingItem: MissingItem): Promise<MissingItem | null> => {
    try {
      // Insert missing item
      const { data: missingItemData, error: missingItemError } = await supabase
        .from('missing_items')
        .insert({
          order_id: missingItem.orderId,
          product_id: missingItem.productId,
          quantity: missingItem.quantity,
          date: missingItem.date,
          status: missingItem.status
        })
        .select();

      if (missingItemError) throw missingItemError;

      setMissingItems([...missingItems, missingItem]);
      return missingItem;
    } catch (error) {
      console.error('Error adding missing item:', error);
      toast({
        title: "Error",
        description: "Failed to add missing item.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Function to update a missing item
  const updateMissingItem = async (missingItem: MissingItem): Promise<boolean> => {
    try {
      // Update missing item
      const { error: missingItemError } = await supabase
        .from('missing_items')
        .update({
          order_id: missingItem.orderId,
          product_id: missingItem.productId,
          quantity: missingItem.quantity,
          date: missingItem.date,
          status: missingItem.status
        })
        .eq('id', missingItem.id);

      if (missingItemError) throw missingItemError;

      // Update local state
      setMissingItems(missingItems.map(mi =>
        mi.id === missingItem.id ? missingItem : mi
      ));

      return true;
    } catch (error) {
      console.error('Error updating missing item:', error);
      toast({
        title: "Error",
        description: "Failed to update missing item.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to delete a missing item
  const deleteMissingItem = async (id: string): Promise<boolean> => {
    try {
      const { error: missingItemError } = await supabase
        .from('missing_items')
        .delete()
        .eq('id', id);

      if (missingItemError) throw missingItemError;

      // Update local state
      setMissingItems(missingItems.filter(missingItem => missingItem.id !== id));

      return true;
    } catch (error) {
      console.error('Error deleting missing item:', error);
      toast({
        title: "Error",
        description: "Failed to delete missing item.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to mark an order as complete
  const completeOrder = async (order: Order): Promise<boolean> => {
    try {
      // Update order status to completed
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: "Completed",
          picking_in_progress: false,
          is_picked: true,
          picked_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Update local state
      setOrders(orders.map(o =>
        o.id === order.id ? { ...o, status: "Completed", pickingInProgress: false, isPicked: true } : o
      ));

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

  // Function to record batch usage
  const recordBatchUsage = async (batchNumber: string, productId: string, quantity: number, orderId: string, weight: number = 0): Promise<boolean> => {
    try {
      // Check if the batch number already exists for the product
      const { data: existingBatch, error: existingBatchError } = await supabase
        .from('batches')
        .select('*')
        .eq('batch_number', batchNumber)
        .eq('product_id', productId)
        .single();

      if (existingBatchError && existingBatchError.code !== 'PGRST116') {
        throw existingBatchError;
      }

      if (existingBatch) {
        // Update the existing batch
        const { error: updateError } = await supabase
          .from('batches')
          .update({
            quantity_used: existingBatch.quantity_used + quantity,
            last_used: new Date().toISOString(),
            last_order_id: orderId,
            total_weight_picked: existingBatch.total_weight_picked + weight
          })
          .eq('id', existingBatch.id);

        if (updateError) {
          console.error('Error updating batch:', updateError);
          throw updateError;
        }
      } else {
        // Insert a new batch
        const { error: insertError } = await supabase
          .from('batches')
          .insert({
            batch_number: batchNumber,
            product_id: productId,
            quantity_used: quantity,
            first_used: new Date().toISOString(),
            last_used: new Date().toISOString(),
            last_order_id: orderId,
            total_weight_picked: weight
          });

        if (insertError) {
          console.error('Error inserting batch:', insertError);
          throw insertError;
        }
      }

      return true;
    } catch (error) {
      console.error('Error recording batch usage:', error);
      toast({
        title: "Error",
        description: "Failed to record batch usage.",
        variant: "destructive",
      });
      return false;
    }
  };

  const recordAllBatchUsagesForOrder = async (order: Order): Promise<void> => {
    if (!order || !order.items) {
      console.warn("No order or order items provided, skipping batch usage recording");
      return;
    }

    for (const item of order.items) {
      if (item.batchNumber && item.checked) {
        try {
          await recordBatchUsage(
            item.batchNumber,
            item.productId,
            item.quantity,
            order.id,
            item.pickedWeight
          );
          console.log(`Successfully recorded batch usage for ${item.productId} with batch ${item.batchNumber}`);
        } catch (batchError) {
          console.error(`Failed to record batch usage for ${item.productId}:`, batchError);
          // Continue with other items, don't fail the whole process
        }
      }
    }
  };

  // Helper function to fetch a single order by ID
  const fetchOrderById = async (orderId: string) => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(
            *,
            product:products(*)
          ),
          missing_items:missing_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error("Order not found");

      // Transform the order data to the expected format
      return {
        id: orderData.id,
        customerId: orderData.customer_id,
        customer: orderData.customer,
        customerOrderNumber: orderData.customer_order_number,
        orderDate: orderData.order_date,
        requiredDate: orderData.required_date,
        deliveryMethod: orderData.delivery_method,
        notes: orderData.notes,
        status: orderData.status,
        created: orderData.created,
        fromStandingOrder: orderData.from_standing_order,
        pickingInProgress: orderData.picking_in_progress,
        isPicked: orderData.is_picked,
        pickedBy: orderData.picked_by,
        pickedAt: orderData.picked_at,
        completedBoxes: orderData.completed_boxes || 0,
        savedBoxes: orderData.saved_boxes || 0,
        items: orderData.items.map(item => ({
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          product: item.product,
          quantity: item.quantity,
          batchNumber: item.batch_number,
          checked: item.checked,
          pickedQuantity: item.picked_quantity,
          pickedWeight: item.picked_weight,
          boxNumber: item.box_number,
          originalQuantity: item.original_quantity
        })),
        missingItems: orderData.missing_items.map(item => ({
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          product: item.product,
          quantity: item.quantity,
          date: item.date,
          status: item.status
        }))
      } as Order;
    } catch (error) {
      console.error("Error fetching order by ID:", error);
      throw error;
    }
  };

  // Add to the context value object
  const contextValue = {
    customers,
    orders,
    products,
    standingOrders,
    missingItems,
    pickers,
    setCustomers,
    setOrders,
    setProducts,
    setStandingOrders,
    setMissingItems,
    setPickers,
    addCustomer,
    addProduct,
    addOrder,
    addStandingOrder,
    addMissingItem,
    updateCustomer,
    updateProduct,
    updateOrder,
    updateStandingOrder,
    updateMissingItem,
    deleteCustomer,
    deleteProduct,
    deleteOrder,
    deleteMissingItem,
    completeOrder,
    recordBatchUsage,
    recordAllBatchUsagesForOrder,
    refreshData,
    refreshOrderData: async (orderId: string) => {
      console.log("Explicitly refreshing order data for:", orderId);
      try {
        // Try to find the order in current state first
        const existingOrder = orders.find(o => o.id === orderId);

        if (!existingOrder) {
          console.log("Order not found in context, cannot refresh");
          return;
        }

        // Re-fetch the order with its related data
        const refreshedOrder = await fetchOrderById(orderId);

        if (refreshedOrder) {
          console.log("Successfully refreshed order data");
          // Update the orders state by replacing the existing order
          setOrders(prevOrders =>
            prevOrders.map(o => o.id === orderId ? refreshedOrder : o)
          );
        }
      } catch (error) {
        console.error("Error refreshing order data:", error);
        throw error;
      }
    },
    isLoading,
    returnsComplaints,
    setReturnsComplaints,
    addReturnsComplaints,
    updateReturnsComplaints,
    deleteReturnsComplaints,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

// Create a hook for easy context usage
export const useData = () => useContext(DataContext);

// Export as default for compatibility with existing import in App.tsx
export default DataProvider;
