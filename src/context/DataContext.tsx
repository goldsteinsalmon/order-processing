import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
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
import { 
  customers as initialCustomers,
  products as initialProducts,
  orders as initialOrders,
  completedOrders as initialCompletedOrders,
  standingOrders as initialStandingOrders,
  returns as initialReturns,
  complaints as initialComplaints,
  missingItems as initialMissingItems,
  users as initialUsers,
  pickers as initialPickers,
  batchUsages as initialBatchUsages
} from "../data/mockData";
import { format, addDays, addWeeks, addMonths, parseISO, isAfter } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { dbService } from "@/services/IndexedDBService";
import { wsService, SyncMessageType } from "@/services/WebSocketService";
import { useSyncContext } from "@/context/SyncContext";

// Define entity types for sync operations
export type EntityType = 
  | 'customers' 
  | 'products' 
  | 'orders' 
  | 'completedOrders' 
  | 'standingOrders' 
  | 'returns' 
  | 'complaints' 
  | 'missingItems' 
  | 'users'
  | 'pickers'
  | 'batchUsages';
  
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
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  addProduct: (product: Product | Product[]) => void; // Updated to accept array
  updateProduct: (product: Product) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  deleteOrder: (orderId: string) => void;
  completeOrder: (order: Order) => void;
  addStandingOrder: (standingOrder: StandingOrder) => void;
  updateStandingOrder: (standingOrder: StandingOrder) => void;
  processStandingOrders: () => void;
  addReturn: (returnItem: Return) => void;
  updateReturn: (returnItem: Return) => void;
  addComplaint: (complaint: Complaint) => void;
  updateComplaint: (complaint: Complaint) => void;
  addMissingItem: (missingItem: MissingItem) => void;
  removeMissingItem: (missingItemId: string) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  addPicker: (picker: Picker) => void;
  updatePicker: (picker: Picker) => void;
  deletePicker: (pickerId: string) => void;
  getBatchUsages: () => BatchUsage[];
  getBatchUsageByBatchNumber: (batchNumber: string) => BatchUsage | undefined;
  recordBatchUsage: (batchNumber: string, productId: string, quantity: number, orderId: string, manualWeight?: number) => void;
  recordAllBatchUsagesForOrder: (order: Order) => void;
}

// New interface to represent a consolidated batch summary
interface ConsolidatedBatchSummary {
  batchNumber: string;
  products: {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalWeight: number;
  }[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with empty arrays, we'll load from DB
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

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // This will be undefined when DataContext is used outside SyncProvider
  // (due to component tree hierarchy), but we'll handle that gracefully

  // Create a tracking structure for processed batches to prevent double counting
  const [processedBatchOrderItems, setProcessedBatchOrderItems] = useState<Set<string>>(new Set());

  // Load data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Try to load data from IndexedDB
        const loadedCustomers = await dbService.getAll<Customer>('customers');
        const loadedProducts = await dbService.getAll<Product>('products');
        const loadedOrders = await dbService.getAll<Order>('orders');
        const loadedCompletedOrders = await dbService.getAll<Order>('completedOrders');
        const loadedStandingOrders = await dbService.getAll<StandingOrder>('standingOrders');
        const loadedReturns = await dbService.getAll<Return>('returns');
        const loadedComplaints = await dbService.getAll<Complaint>('complaints');
        const loadedMissingItems = await dbService.getAll<MissingItem>('missingItems');
        const loadedUsers = await dbService.getAll<User>('users');
        const loadedPickers = await dbService.getAll<Picker>('pickers');
        const loadedBatchUsages = await dbService.getAll<BatchUsage>('batchUsages');

        // If no data in IndexedDB yet, use mock data and save it
        if (loadedCustomers.length === 0) {
          await dbService.saveAll('customers', initialCustomers);
          setCustomers(initialCustomers);
        } else {
          setCustomers(loadedCustomers);
        }

        if (loadedProducts.length === 0) {
          await dbService.saveAll('products', initialProducts);
          setProducts(initialProducts);
        } else {
          setProducts(loadedProducts);
        }

        if (loadedOrders.length === 0) {
          await dbService.saveAll('orders', initialOrders);
          setOrders(initialOrders);
        } else {
          setOrders(loadedOrders);
        }

        if (loadedCompletedOrders.length === 0) {
          await dbService.saveAll('completedOrders', initialCompletedOrders);
          setCompletedOrders(initialCompletedOrders);
        } else {
          setCompletedOrders(loadedCompletedOrders);
        }

        if (loadedStandingOrders.length === 0) {
          await dbService.saveAll('standingOrders', initialStandingOrders);
          setStandingOrders(initialStandingOrders);
        } else {
          setStandingOrders(loadedStandingOrders);
        }

        if (loadedReturns.length === 0) {
          await dbService.saveAll('returns', initialReturns);
          setReturns(initialReturns);
        } else {
          setReturns(loadedReturns);
        }

        if (loadedComplaints.length === 0) {
          await dbService.saveAll('complaints', initialComplaints);
          setComplaints(initialComplaints);
        } else {
          setComplaints(loadedComplaints);
        }

        if (loadedMissingItems.length === 0) {
          await dbService.saveAll('missingItems', initialMissingItems);
          setMissingItems(initialMissingItems);
        } else {
          setMissingItems(loadedMissingItems);
        }

        if (loadedUsers.length === 0) {
          await dbService.saveAll('users', initialUsers);
          setUsers(initialUsers);
        } else {
          setUsers(loadedUsers);
        }

        if (loadedPickers.length === 0) {
          await dbService.saveAll('pickers', initialPickers);
          setPickers(initialPickers);
        } else {
          setPickers(loadedPickers);
        }

        if (loadedBatchUsages.length === 0) {
          await dbService.saveAll('batchUsages', initialBatchUsages);
          setBatchUsages(initialBatchUsages);
        } else {
          setBatchUsages(loadedBatchUsages);
        }

      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
        
        // Fallback to mock data
        setCustomers(initialCustomers);
        setProducts(initialProducts);
        setOrders(initialOrders);
        setCompletedOrders(initialCompletedOrders);
        setStandingOrders(initialStandingOrders);
        setReturns(initialReturns);
        setComplaints(initialComplaints);
        setMissingItems(initialMissingItems);
        setUsers(initialUsers);
        setPickers(initialPickers);
        setBatchUsages(initialBatchUsages);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Set up WebSocket listeners for data changes
  useEffect(() => {
    if (!syncContext?.syncEnabled) return;
    
    const handleDataReceived = async (message: any) => {
      if (!message.entity || !message.type) return;
      
      try {
        switch (message.type) {
          case SyncMessageType.SYNC_DATA:
          case SyncMessageType.UPDATE:
            if (message.data) {
              // Handle data update based on entity type
              switch (message.entity) {
                case 'customers':
                  handleExternalUpdate('customers', message.data, setCustomers);
                  break;
                case 'products':
                  handleExternalUpdate('products', message.data, setProducts);
                  break;
                case 'orders':
                  handleExternalUpdate('orders', message.data, setOrders);
                  break;
                case 'completedOrders':
                  handleExternalUpdate('completedOrders', message.data, setCompletedOrders);
                  break;
                case 'standingOrders':
                  handleExternalUpdate('standingOrders', message.data, setStandingOrders);
                  break;
                case 'returns':
                  handleExternalUpdate('returns', message.data, setReturns);
                  break;
                case 'complaints':
                  handleExternalUpdate('complaints', message.data, setComplaints);
                  break;
                case 'missingItems':
                  handleExternalUpdate('missingItems', message.data, setMissingItems);
                  break;
                case 'users':
                  handleExternalUpdate('users', message.data, setUsers);
                  break;
                case 'pickers':
                  handleExternalUpdate('pickers', message.data, setPickers);
                  break;
                case 'batchUsages':
                  handleExternalUpdate('batchUsages', message.data, setBatchUsages);
                  break;
              }
            }
            break;
            
          case SyncMessageType.DELETE:
            if (message.id) {
              // Handle deletion based on entity type
              switch (message.entity) {
                case 'customers':
                  handleExternalDelete('customers', message.id, setCustomers);
                  break;
                case 'products':
                  handleExternalDelete('products', message.id, setProducts);
                  break;
                case 'orders':
                  handleExternalDelete('orders', message.id, setOrders);
                  break;
                case 'completedOrders':
                  handleExternalDelete('completedOrders', message.id, setCompletedOrders);
                  break;
                case 'standingOrders':
                  handleExternalDelete('standingOrders', message.id, setStandingOrders);
                  break;
                case 'returns':
                  handleExternalDelete('returns', message.id, setReturns);
                  break;
                case 'complaints':
                  handleExternalDelete('complaints', message.id, setComplaints);
                  break;
                case 'missingItems':
                  handleExternalDelete('missingItems', message.id, setMissingItems);
                  break;
                case 'users':
                  handleExternalDelete('users', message.id, setUsers);
                  break;
                case 'pickers':
                  handleExternalDelete('pickers', message.id, setPickers);
                  break;
                case 'batchUsages':
                  handleExternalDelete('batchUsages', message.id, setBatchUsages);
                  break;
              }
            }
            break;
            
          case SyncMessageType.SYNC_REQUEST:
            // Send all our data when requested
            await sendAllData();
            break;
        }
      } catch (error) {
        console.error('Error handling sync message:', error);
      }
    };
    
    wsService.on('dataReceived', handleDataReceived);
    
    return () => {
      wsService.off('dataReceived', handleDataReceived);
    };
  }, [syncContext?.syncEnabled, customers, products, orders, completedOrders, 
      standingOrders, returns, complaints, missingItems, users, pickers, batchUsages]);

  // Handle external update (from another client)
  const handleExternalUpdate = async <T extends { id: string }>(
    entity: string, 
    data: T, 
    setState: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    // Update IndexedDB
    await dbService.save(entity, data);
    
    // Update state
    setState(current => {
      const index = current.findIndex(item => item.id === data.id);
      if (index >= 0) {
        // Replace existing item
        const newArray = [...current];
        newArray[index] = data;
        return newArray;
      } else {
        // Add new item
        return [...current, data];
      }
    });
  };

  // Handle external delete (from another client)
  const handleExternalDelete = async (
    entity: string, 
    id: string, 
    setState: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    // Delete from IndexedDB
    await dbService.delete(entity, id);
    
    // Update state
    setState(current => current.filter(item => item.id !== id));
  };

  // Send all data to other clients
  const sendAllData = async () => {
    if (!syncContext?.syncEnabled) return;
    
    // Send each data collection
    for (const customer of customers) {
      sendEntityUpdate('customers', customer);
    }
    
    for (const product of products) {
      sendEntityUpdate('products', product);
    }
    
    for (const order of orders) {
      sendEntityUpdate('orders', order);
    }
    
    for (const order of completedOrders) {
      sendEntityUpdate('completedOrders', order);
    }
    
    for (const standingOrder of standingOrders) {
      sendEntityUpdate('standingOrders', standingOrder);
    }
    
    for (const returnItem of returns) {
      sendEntityUpdate('returns', returnItem);
    }
    
    for (const complaint of complaints) {
      sendEntityUpdate('complaints', complaint);
    }
    
    for (const missingItem of missingItems) {
      sendEntityUpdate('missingItems', missingItem);
    }
    
    for (const user of users) {
      sendEntityUpdate('users', user);
    }
    
    for (const picker of pickers) {
      sendEntityUpdate('pickers', picker);
    }
    
    for (const batchUsage of batchUsages) {
      sendEntityUpdate('batchUsages', batchUsage);
    }
  };

  // Send entity update to other clients
  const sendEntityUpdate = (entity: string, data: any) => {
    if (!syncContext?.syncEnabled) return;
    
    wsService.sendMessage({
      type: SyncMessageType.UPDATE,
      clientId: dbService.getClientId(),
      timestamp: new Date().toISOString(),
      entity,
      data
    });
  };

  // Send entity delete to other clients
  const sendEntityDelete = (entity: string, id: string) => {
    if (!syncContext?.syncEnabled) return;
    
    wsService.sendMessage({
      type: SyncMessageType.DELETE,
      clientId: dbService.getClientId(),
      timestamp: new Date().toISOString(),
      entity,
      id
    });
  };

  // **** CRUD OPERATIONS ****
  // Wrap all data mutations with persistence and sync

  const addCustomer = async (customer: Customer) => {
    const savedCustomer = await dbService.save('customers', customer);
    setCustomers(prev => [...prev, savedCustomer]);
    sendEntityUpdate('customers', savedCustomer);
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    await dbService.save('customers', updatedCustomer);
    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    sendEntityUpdate('customers', updatedCustomer);
  };

  const addProduct = async (productData: Product | Product[]) => {
    if (Array.isArray(productData)) {
      // Add multiple products at once
      const savedProducts = await dbService.saveAll('products', productData);
      setProducts(prevProducts => [...prevProducts, ...savedProducts]);
      
      // Send sync updates for each product
      for (const product of savedProducts) {
        sendEntityUpdate('products', product);
      }
      
      console.log(`Added ${productData.length} products to the system`);
    } else {
      // Add a single product
      const savedProduct = await dbService.save('products', productData);
      setProducts(prevProducts => [...prevProducts, savedProduct]);
      sendEntityUpdate('products', savedProduct);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    await dbService.save('products', updatedProduct);
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    sendEntityUpdate('products', updatedProduct);
  };

  const addOrder = async (order: Order) => {
    const savedOrder = await dbService.save('orders', order);
    setOrders([...orders, savedOrder]);
    sendEntityUpdate('orders', savedOrder);
  };

  const updateOrder = async (updatedOrder: Order) => {
    const isCompletedOrder = completedOrders.some(o => o.id === updatedOrder.id);
    
    if (isCompletedOrder) {
      await dbService.save('completedOrders', updatedOrder);
      setCompletedOrders(completedOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      sendEntityUpdate('completedOrders', updatedOrder);
    } else {
      await dbService.save('orders', updatedOrder);
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      sendEntityUpdate('orders', updatedOrder);
    }
  };

  const deleteOrder = async (orderId: string) => {
    await dbService.delete('orders', orderId);
    setOrders(orders.filter(order => order.id !== orderId));
    sendEntityDelete('orders', orderId);
  };

  const completeOrder = async (order: Order) => {
    // When completing an order, add support for multiple batch numbers
    let updatedOrder: Order = { 
      ...order, 
      status: "Completed",
      updated: new Date().toISOString() // Always set the updated timestamp when completing an order
    };
    
    // If there's already a batchNumber, convert it to batchNumbers array
    if (order.batchNumber && !order.batchNumbers) {
      updatedOrder = {
        ...updatedOrder,
        batchNumbers: [order.batchNumber]
      };
    }
    
    // If pickedBy is set but picker name isn't, set it
    if (order.pickedBy && !order.picker) {
      const picker = pickers.find(p => p.id === order.pickedBy);
      if (picker) {
        updatedOrder = {
          ...updatedOrder,
          picker: picker.name
        };
      }
    }
    
    // Make sure the processedBatchOrderItems set is cleared before recording batch usages
    setProcessedBatchOrderItems(new Set());
    
    // Create a consolidated batch summary first
    const batchSummary = createConsolidatedBatchSummary(updatedOrder);
    
    console.log("Consolidated batch summary:", batchSummary);
    
    // Record batch usages based on the consolidated summary
    recordBatchUsagesFromSummary(batchSummary, updatedOrder.id);

    // Delete from orders DB
    await dbService.delete('orders', order.id);
    
    // Save to completedOrders DB
    await dbService.save('completedOrders', updatedOrder);
    
    // Update state
    setOrders(orders.filter(o => o.id !== order.id));
    setCompletedOrders([...completedOrders, updatedOrder]);
    
    // Send sync events
    sendEntityDelete('orders', order.id);
    sendEntityUpdate('completedOrders', updatedOrder);
  };

  // Updated function to create a consolidated batch summary from an order
  const createConsolidatedBatchSummary = (order: Order): ConsolidatedBatchSummary[] => {
    console.log("Creating consolidated batch summary for order:", order.id);
    
    // Initialize a map to store the batch summaries
    // Key: batchNumber, Value: Map of productId to product summary
    const batchProductMap = new Map<
      string, 
      Map<string, { productName: string; totalQuantity: number; totalWeight: number }>
    >();
    
    // Handle different data sources depending on order structure
    
    // Case 1: Order has boxes or boxDistributions - use these as the primary source
    if ((order.boxes && order.boxes.length > 0) || 
        (order.boxDistributions && order.boxDistributions.length > 0)) {
      
      const boxes = order.boxDistributions || order.boxes || [];
      console.log(`Processing ${boxes.length} boxes for order ${order.id}`);
      
      boxes.forEach((box, boxIndex) => {
        if (!box.items || box.items.length === 0) return;
        
        // Get the batch number for this box, or fallback to order batch
        const boxBatchNumber = box.batchNumber || 
          order.batchNumber || 
          (order.batchNumbers && order.batchNumbers.length > 0 ? order.batchNumbers[0] : undefined);
        
        if (!boxBatchNumber) {
          console.warn(`No batch number found for box ${boxIndex} in order ${order.id}`);
          return;
        }

        console.log(`Processing box #${box.boxNumber} with batch ${boxBatchNumber} - contains ${box.items.length} items`);
        
        // Process each item in the box
        box.items.forEach((item, itemIndex) => {
          // Skip invalid items
          if (!item.productId) return;
          
          // Get product info
          const product = products.find(p => p.id === item.productId);
          if (!product) {
            console.warn(`Product not found for ID ${item.productId} in box ${box.boxNumber}`);
            return;
          }
          
          // Use item batch number if available, otherwise box batch number
          const batchNumber = item.batchNumber || boxBatchNumber;
          
          // CRITICAL FIX: For box items, use the weight property directly as the manual weight
          // This is a key difference from regular order items
          let weight = 0;
          
          // Check if weight is directly provided in the box item (this is the manually entered weight)
          if (item.weight !== undefined) {
            weight = item.weight;
            console.log(`Box ${box.boxNumber}, item ${itemIndex} (${product.name}): Using manual weight: ${weight}g`);
          } 
          // If no explicit weight provided, fall back to product standard weight
          else if (product.weight) {
            weight = product.weight * item.quantity;
            console.log(`Box ${box.boxNumber}, item ${itemIndex} (${product.name}): Using standard weight: ${weight}g`);
          }
          
          // Store in our batch summary map
          addToBatchSummary(batchNumber, product.id, product.name, item.quantity, weight);
        });
      });
    } 
    // Case 2: Fall back to order.items if no boxes are defined
    else if (order.items && order.items.length > 0) {
      console.log(`Processing ${order.items.length} items directly from order ${order.id}`);
      
      // Default batch number for the order
      const defaultBatchNumber = 
        order.batchNumber || 
        (order.batchNumbers && order.batchNumbers.length > 0 ? order.batchNumbers[0] : undefined);
      
      if (!defaultBatchNumber) {
        console.warn(`No batch number found for order ${order.id}`);
        return [];
      }
      
      // Process each item
      order.items.forEach((item, itemIndex) => {
        // Skip invalid items
        if (!item.productId) return;
        
        // Get product info
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          console.warn(`Product not found for ID ${item.productId}`);
          return;
        }
        
        // Use item batch number if available, otherwise order batch number
        const batchNumber = item.batchNumber || defaultBatchNumber;
        
        // Calculate weight - IMPORTANT: prioritize manual weight inputs
        let weight = 0;
        
        // Check for manually entered weight first (highest priority)
        if (item.manualWeight !== undefined && item.manualWeight > 0) {
          weight = item.manualWeight;
          console.log(`Item ${itemIndex} (${product.name}): Using manual weight: ${weight}g`);
        }
        // Then check for picked weight
        else if (item.pickedWeight !== undefined && item.pickedWeight > 0) {
          weight = item.pickedWeight;
          console.log(`Item ${itemIndex} (${product.name}): Using picked weight: ${weight}g`);
        }
        // Otherwise use the product's standard weight * quantity
        else if (product.weight) {
          weight = product.weight * item.quantity;
          console.log(`Item ${itemIndex} (${product.name}): Using standard weight: ${weight}g`);
        }
        
        // Store in our batch summary map
        addToBatchSummary(batchNumber, product.id, product.name, item.quantity, weight);
      });
    }
    
    // Helper function to add an item to the batch summary
    function addToBatchSummary(
      batchNumber: string,
      productId: string,
      productName: string,
      quantity: number,
      weight: number
    ) {
      console.log(`Adding to batch ${batchNumber}: ${productName}, quantity: ${quantity}, weight: ${weight}g`);
      
      if (!batchProductMap.has(batchNumber)) {
        batchProductMap.set(batchNumber, new Map());
      }
      
      const productMap = batchProductMap.get(batchNumber)!;
      
      if (productMap.has(productId)) {
        const existing = productMap.get(productId)!;
        existing.totalQuantity += quantity;
        existing.totalWeight += weight;
        console.log(`Updated totals for ${productName} in batch ${batchNumber}: quantity=${existing.totalQuantity}, weight=${existing.totalWeight}g`);
      } else {
        productMap.set(productId, {
          productName: productName,
          totalQuantity: quantity,
          totalWeight: weight
        });
      }
    }
    
    // Convert the nested maps to the expected format
    const result: ConsolidatedBatchSummary[] = [];
    
    batchProductMap.forEach((productMap, batchNumber) => {
      const products = Array.from(productMap.entries()).map(([productId, summary]) => ({
        productId,
        productName: summary.productName,
        totalQuantity: summary.totalQuantity,
        totalWeight: summary.totalWeight
      }));
      
      result.push({
        batchNumber,
        products
      });
      
      console.log(`Final batch ${batchNumber} summary:`, products.map(p => 
        `${p.productName}: ${p.totalQuantity} units, ${p.totalWeight}g`).join(', '));
    });
    
    return result;
  };
  
  // New function to record batch usages from a consolidated summary
  const recordBatchUsagesFromSummary = (batchSummaries: ConsolidatedBatchSummary[], orderId: string) => {
    console.log(`Recording batch usages from summary for order ${orderId}`);
    
    // Reset processed items tracking
    setProcessedBatchOrderItems(new Set());
    
    // Record each batch-product combination
    batchSummaries.forEach(batch => {
      batch.products.forEach(product => {
        // Generate a unique tracking ID
        const uniqueId = `${batch.batchNumber}-${orderId}-${product.productId}`;
        
        // Skip if already processed (shouldn't happen, but being safe)
        if (Array.from(processedBatchOrderItems).some(id => id === uniqueId)) {
          console.log(`Skipping duplicate batch usage: ${uniqueId}`);
          return;
        }
        
        // Create a new batch usage entry
        const newBatchUsage: BatchUsage = {
          id: uuidv4(),
          batchNumber: batch.batchNumber,
          productId: product.productId,
          productName: product.productName,
          totalWeight: product.totalWeight,
          usedWeight: product.totalWeight,
          ordersCount: 1,
          firstUsed: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usedBy: [`order-${orderId}`]
        };
        
        // Add to batch usages
        setBatchUsages(prev => [...prev, newBatchUsage]);
        
        // Mark as processed
        setProcessedBatchOrderItems(prev => {
          const newSet = new Set(prev);
          newSet.add(uniqueId);
          return newSet;
        });
        
        console.log(`Recorded batch usage for ${product.productName} in batch ${batch.batchNumber}: ${product.totalWeight}g`);
      });
    });
  };
  
  // We're keeping the old recordAllBatchUsagesForOrder function for compatibility, 
  // but it won't be used anymore
  const recordAllBatchUsagesForOrder = (order: Order) => {
    console.log("WARNING: recordAllBatchUsagesForOrder is deprecated. Using consolidated batch summary instead.");
    const batchSummary = createConsolidatedBatchSummary(order);
    recordBatchUsagesFromSummary(batchSummary, order.id);
  };

  // Updated recordBatchUsage function to correctly handle manual weight inputs
  const recordBatchUsage = (
    batchNumber: string, 
    productId: string, 
    quantity: number, 
    orderId: string,
    manualWeight?: number
  ) => {
    if (!batchNumber || !productId) return;
    
    const currentDate = new Date().toISOString();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      console.error(`Cannot record batch usage: Product not found for product ID ${productId}`);
      return;
    }
    
    // Calculate weight in grams - ensure we're getting the correct weight
    let totalWeight = 0;
    
    // Prioritize manual weight input for products that require it
    if (manualWeight !== undefined && manualWeight > 0) {
      totalWeight = manualWeight;
    } else if (product.weight) {
      totalWeight = product.weight * quantity;
    } else {
      console.warn(`No weight available for product ${product.name}. Using quantity as fallback for batch tracking.`);
      totalWeight = quantity; // Fallback to using quantity as a measure
    }
    
    // Generate a unique key for batch-product-order combination
    const uniqueKey = `${batchNumber}-${orderId}-${productId}`;
    
    // Check if we've already processed this exact combination
    const alreadyProcessed = Array.from(processedBatchOrderItems).some(id => id === uniqueKey);
    if (alreadyProcessed) {
      console.log(`Skipping duplicate batch usage: ${uniqueKey}`);
      return; // Skip if already processed
    }
    
    // Check if this batch exists
    const existingBatchIndex = batchUsages.findIndex(bu => 
      bu.batchNumber === batchNumber && bu.productId === productId);
    
    if (existingBatchIndex !== -1) {
      // Get the existing batch usage
      const existingBatchUsage = batchUsages[existingBatchIndex];
      
      // Check if this order has already used this batch
      const orderKey = `order-${orderId}`;
      const orderAlreadyUsedBatch = existingBatchUsage.usedBy && 
                                    existingBatchUsage.usedBy.includes(orderKey);
                                    
      // Create a new batch usage entry for this product-batch combination
      const newBatchUsage: BatchUsage = {
        id: uuidv4(),
        batchNumber,
        productId,
        productName: product.name,
        totalWeight: totalWeight,
        usedWeight: totalWeight,
        ordersCount: orderAlreadyUsedBatch ? existingBatchUsage.ordersCount : existingBatchUsage.ordersCount + 1,
        firstUsed: existingBatchUsage.firstUsed,
        lastUsed: currentDate,
        usedBy: orderAlreadyUsedBatch ? 
          existingBatchUsage.usedBy : 
          [...(existingBatchUsage.usedBy || []), orderKey]
      };
      
      // Add this as a separate entry - will be consolidated in the UI
      setBatchUsages(prevBatchUsages => [...prevBatchUsages, newBatchUsage]);
      
      // Mark this combination as processed
      setProcessedBatchOrderItems(prev => {
        const newSet = new Set(prev);
        newSet.add(uniqueKey);
        return newSet;
      });
      
    } else {
      // Create new batch usage record
      const newBatchUsage: BatchUsage = {
        id: uuidv4(),
        batchNumber,
        productId,
        productName: product.name,
        totalWeight: totalWeight,
        usedWeight: totalWeight,
        ordersCount: 1,
        firstUsed: currentDate,
        lastUsed: currentDate,
        usedBy: [`order-${orderId}`]
      };
      
      setBatchUsages(prevBatchUsages => [...prevBatchUsages, newBatchUsage]);
      
      // Mark this combination as processed
      setProcessedBatchOrderItems(prev => {
        const newSet = new Set(prev);
        newSet.add(uniqueKey);
        return newSet;
      });
    }
  };

  const addStandingOrder = async (standingOrder: StandingOrder) => {
    const savedStandingOrder = await dbService.save('standingOrders', standingOrder);
    setStandingOrders([...standingOrders, savedStandingOrder]);
    sendEntityUpdate('standingOrders', savedStandingOrder);
  };

  const updateStandingOrder = async (updatedStandingOrder: StandingOrder) => {
    await dbService.save('standingOrders', updatedStandingOrder);
    setStandingOrders(standingOrders.map(so => 
      so.id === updatedStandingOrder.id ? updatedStandingOrder : so
    ));
    sendEntityUpdate('standingOrders', updatedStandingOrder);
  };
  
  const processStandingOrders = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Midnight
    
    const updatedStandingOrders: StandingOrder[] = [];
    const newOrders: Order[] = [];
    
    standingOrders.forEach(standingOrder => {
      if (!standingOrder.active) {
        updatedStandingOrders.push(standingOrder);
        return;
      }
      
      // Check if this standing order needs to be processed today
      const nextProcessingDate = standingOrder.nextProcessingDate ? 
        new Date(standingOrder.nextProcessingDate) : new Date();
      nextProcessingDate.setHours(0, 0, 0, 0); // Midnight
      
      const isProcessingDay = nextProcessingDate.getTime() === today.getTime();
      
      if (isProcessingDay) {
        // Create a new order from the standing order
        const newOrder: Order = {
          id: uuidv4(),
          customerId: standingOrder.customerId,
          customer: standingOrder.customer,
          customerOrderNumber: standingOrder.customerOrderNumber,
          orderDate: new Date().toISOString(), // Use current date as order date
          requiredDate: standingOrder.schedule.nextDeliveryDate, // Use scheduled delivery date
          deliveryMethod: standingOrder.schedule.deliveryMethod,
          items: standingOrder.items,
          notes: standingOrder.notes ? 
            `${standingOrder.notes} (Generated from Standing Order #${standingOrder.id.substring(0, 8)})` : 
            `Generated from Standing Order #${standingOrder.id.substring(0, 8)}`,
          status: "Pending",
          created: new Date().toISOString(),
          fromStandingOrder: standingOrder.id
        };
        
        newOrders.push(newOrder);
        
        // Calculate next delivery date
        let nextDeliveryDate = new Date(standingOrder.schedule.nextDeliveryDate || new Date());
        
        if (standingOrder.schedule.frequency === "Weekly") {
          nextDeliveryDate = addDays(nextDeliveryDate, 7);
        } else if (standingOrder.schedule.frequency === "Bi-Weekly") {
          nextDeliveryDate = addDays(nextDeliveryDate, 14);
        } else if (standingOrder.schedule.frequency === "Monthly") {
          nextDeliveryDate = addMonths(nextDeliveryDate, 1);
        }
        
        // Check if nextDeliveryDate is in the skipped dates
        if (standingOrder.schedule.skippedDates && 
            standingOrder.schedule.skippedDates.some(date => 
              format(parseISO(date), "yyyy-MM-dd") === format(nextDeliveryDate, "yyyy-MM-dd"))) {
          
          // Skip to the next delivery after skipped date
          if (standingOrder.schedule.frequency === "Weekly") {
            nextDeliveryDate = addDays(nextDeliveryDate, 7);
          } else if (standingOrder.schedule.frequency === "Bi-Weekly") {
            nextDeliveryDate = addDays(nextDeliveryDate, 14);
          } else if (standingOrder.schedule.frequency === "Monthly") {
            nextDeliveryDate = addMonths(nextDeliveryDate, 1);
          }
        }
        
        // Calculate the next processing date (midnight of the working day before delivery)
        const nextWorkingDayBefore = new Date(nextDeliveryDate);
        nextWorkingDayBefore.setDate(nextWorkingDayBefore.getDate() - 1);
        
        // If it falls on weekend, adjust to Friday
        const dayOfWeek = nextWorkingDayBefore.getDay();
        if (dayOfWeek === 0) { // Sunday
          nextWorkingDayBefore.setDate(nextWorkingDayBefore.getDate() - 2);
        } else if (dayOfWeek === 6) { // Saturday
          nextWorkingDayBefore.setDate(nextWorkingDayBefore.getDate() - 1);
        }
        
        nextWorkingDayBefore.setHours(0, 0, 0, 0); // Set to midnight
        
        // Update the standing order with new dates
        const updatedStandingOrder: StandingOrder = {
          ...standingOrder,
          schedule: {
            ...standingOrder.schedule,
            nextDeliveryDate: nextDeliveryDate.toISOString()
          },
          nextProcessingDate: nextWorkingDayBefore.toISOString(),
          lastProcessedDate: new Date().toISOString()
        };
        
        updatedStandingOrders.push(updatedStandingOrder);
      } else {
        // No processing needed today, keep as is
        updatedStandingOrders.push(standingOrder);
      }
    });
    
    // Update standing orders
    for (const standingOrder of updatedStandingOrders) {
      await dbService.save('standingOrders', standingOrder);
      sendEntityUpdate('standingOrders', standingOrder);
    }
    setStandingOrders(updatedStandingOrders);
    
    // Add new orders
    if (newOrders.length > 0) {
      for (const order of newOrders) {
        await dbService.save('orders', order);
        sendEntityUpdate('orders', order);
      }
      setOrders([...orders, ...newOrders]);
      
      // Could add notifications or other processing logic here
      console.log(`Processed ${newOrders.length} standing orders`);
    }
  };

  const addReturn = async (returnItem: Return) => {
    const savedReturn = await dbService.save('returns', returnItem);
    setReturns([...returns, savedReturn]);
    sendEntityUpdate('returns', savedReturn);
  };

  const updateReturn = async (updatedReturn: Return) => {
    await dbService.save('returns', updatedReturn);
    setReturns(returns.map(r => r.id === updatedReturn.id ? updatedReturn : r));
    sendEntityUpdate('returns', updatedReturn);
  };

  const addComplaint = async (complaint: Complaint) => {
    const savedComplaint = await dbService.save('complaints', complaint);
    setComplaints([...complaints, savedComplaint]);
    sendEntityUpdate('complaints', savedComplaint);
  };

  const updateComplaint = async (updatedComplaint: Complaint) => {
    await dbService.save('complaints', updatedComplaint);
    setComplaints(complaints.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));
    sendEntityUpdate('complaints', updatedComplaint);
  };

  const addMissingItem = async (missingItem: MissingItem) => {
    // Check if the missing item already exists to prevent duplicates
    const existingItem = missingItems.find(
      item => 
        item.orderId === missingItem.orderId && 
        item.productId === missingItem.productId &&
        new Date(item.date).toDateString() === new Date(missingItem.date).toDateString()
    );
    
    if (!existingItem) {
      // Find the full order based on orderId to make sure we have all required data
      const orderForMissingItem = orders.find(o => o.id === missingItem.orderId);
      
      // If we can't find the order, still add the missing item as provided
      if (!orderForMissingItem) {
        const savedItem = await dbService.save('missingItems', missingItem);
        setMissingItems(prev => [...prev, savedItem]);
        sendEntityUpdate('missingItems', savedItem);
        return;
      }
      
      // Create a new missing item with complete order info but avoid circular references
      const completeItem = {
        ...missingItem,
        order: {
          id: orderForMissingItem.id,
          customer: orderForMissingItem.customer,
        }
      };
      
      const savedItem = await dbService.save('missingItems', completeItem);
      setMissingItems(prev => [...prev, savedItem]);
      sendEntityUpdate('missingItems', savedItem);
    }
  };

  const removeMissingItem = async (missingItemId: string) => {
    await dbService.delete('missingItems', missingItemId);
    setMissingItems(prev => prev.filter(item => item.id !== missingItemId));
    sendEntityDelete('missingItems', missingItemId);
  };

  const addUser = async (user: User) => {
    const savedUser = await dbService.save('users', user);
    setUsers([...users, savedUser]);
    sendEntityUpdate('users', savedUser);
  };

  const updateUser = async (updatedUser: User) => {
    await dbService.save('users', updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    sendEntityUpdate('users', updatedUser);
  };

  const deleteUser = async (userId: string) => {
    await dbService.delete('users', userId);
    setUsers(users.filter(user => user.id !== userId));
    sendEntityDelete('users', userId);
  };

  const addPicker = async (picker: Picker) => {
    const savedPicker = await dbService.save('pickers', picker);
    setPickers([...pickers, savedPicker]);
    sendEntityUpdate('pickers', savedPicker);
  };

  const updatePicker = async (updatedPicker: Picker) => {
    await dbService.save('pickers', updatedPicker);
    setPickers(pickers.map(p => p.id === updatedPicker.id ? updatedPicker : p));
    sendEntityUpdate('pickers', updatedPicker);
  };

  const deletePicker = async (pickerId: string) => {
    await dbService.delete('pickers', pickerId);
    setPickers(pickers.filter(picker => picker.id !== pickerId));
    sendEntityDelete('pickers', pickerId);
  };

  const getBatchUsages = () => {
    return batchUsages;
  };

  const getBatchUsageByBatchNumber = (batchNumber: string) => {
    return batchUsages.find(bu => bu.batchNumber === batchNumber);
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
    recordAllBatchUsagesForOrder
  };
  
  // Show loading state when initializing data from DB
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg">Loading data...</p>
        </div>
      </div>
    );
  }
  
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataProvider;
