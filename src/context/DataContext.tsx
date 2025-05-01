import React, { createContext, useContext, useState, ReactNode } from "react";
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
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [completedOrders, setCompletedOrders] = useState<Order[]>(initialCompletedOrders);
  const [standingOrders, setStandingOrders] = useState<StandingOrder[]>(initialStandingOrders);
  const [returns, setReturns] = useState<Return[]>(initialReturns);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [missingItems, setMissingItems] = useState<MissingItem[]>(initialMissingItems);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [pickers, setPickers] = useState<Picker[]>(initialPickers);
  const [batchUsages, setBatchUsages] = useState<BatchUsage[]>(initialBatchUsages);

  // Create a tracking structure for processed batches to prevent double counting
  const [processedBatchOrderItems, setProcessedBatchOrderItems] = useState<Set<string>>(new Set());

  const addCustomer = (customer: Customer) => {
    setCustomers(prevCustomers => [...prevCustomers, customer]);
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const addProduct = (productData: Product | Product[]) => {
    // Handle both single product and array of products
    if (Array.isArray(productData)) {
      // Add multiple products at once
      setProducts(prevProducts => [...prevProducts, ...productData]);
      console.log(`Added ${productData.length} products to the system`);
    } else {
      // Add a single product
      setProducts(prevProducts => [...prevProducts, productData]);
    }
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const addOrder = (order: Order) => {
    setOrders([...orders, order]);
  };

  const updateOrder = (updatedOrder: Order) => {
    // Check if the order is in orders list or completedOrders
    const isCompletedOrder = completedOrders.some(o => o.id === updatedOrder.id);
    
    if (isCompletedOrder) {
      // If it's a completed order being modified, remove it from completedOrders and add to orders
      setCompletedOrders(completedOrders.filter(o => o.id !== updatedOrder.id));
      setOrders([...orders, updatedOrder]);
    } else {
      // Normal update in orders list
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    }
  };

  const deleteOrder = (orderId: string) => {
    setOrders(orders.filter(order => order.id !== orderId));
  };

  const completeOrder = (order: Order) => {
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
    
    setOrders(orders.filter(o => o.id !== order.id));
    setCompletedOrders([...completedOrders, updatedOrder]);
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
      console.log(`Processing ${boxes.length} boxes`);
      
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
        
        // Process each item in the box
        box.items.forEach(item => {
          // Skip invalid items
          if (!item.productId) return;
          
          // Get product info
          const product = products.find(p => p.id === item.productId);
          if (!product) return;
          
          // Use item batch number if available, otherwise box batch number
          const batchNumber = item.batchNumber || boxBatchNumber;
          
          // Calculate weight - IMPORTANT: prioritize manual weight inputs
          let weight = 0;
          
          // Check if manual weight was entered (this is the primary source)
          if (item.weight !== undefined && item.weight > 0) {
            weight = item.weight;
          } 
          // If no manual weight, use the product's standard weight * quantity
          else if (product.weight) {
            weight = product.weight * item.quantity;
          }
          
          // Store in our batch summary map
          addToBatchSummary(batchNumber, product.id, product.name, item.quantity, weight);
        });
      });
    } 
    // Case 2: Fall back to order.items if no boxes are defined
    else if (order.items && order.items.length > 0) {
      console.log(`Processing ${order.items.length} items directly from order`);
      
      // Default batch number for the order
      const defaultBatchNumber = 
        order.batchNumber || 
        (order.batchNumbers && order.batchNumbers.length > 0 ? order.batchNumbers[0] : undefined);
      
      if (!defaultBatchNumber) {
        console.warn(`No batch number found for order ${order.id}`);
        return [];
      }
      
      // Process each item
      order.items.forEach(item => {
        // Skip invalid items
        if (!item.productId) return;
        
        // Get product info
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
        
        // Use item batch number if available, otherwise order batch number
        const batchNumber = item.batchNumber || defaultBatchNumber;
        
        // Calculate weight - IMPORTANT: prioritize manual weight inputs
        let weight = 0;
        
        // Check for manually entered picked weight first
        if (item.pickedWeight !== undefined && item.pickedWeight > 0) {
          weight = item.pickedWeight;
        } 
        // If no picked weight but product requires weight input, use manualWeight if available
        else if (product.requiresWeightInput && item.manualWeight !== undefined && item.manualWeight > 0) {
          weight = item.manualWeight;
        }
        // Otherwise use the product's standard weight * quantity
        else if (product.weight) {
          weight = product.weight * item.quantity;
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
      if (!batchProductMap.has(batchNumber)) {
        batchProductMap.set(batchNumber, new Map());
      }
      
      const productMap = batchProductMap.get(batchNumber)!;
      
      if (productMap.has(productId)) {
        const existing = productMap.get(productId)!;
        existing.totalQuantity += quantity;
        existing.totalWeight += weight;
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

  const addStandingOrder = (standingOrder: StandingOrder) => {
    setStandingOrders([...standingOrders, standingOrder]);
  };

  const updateStandingOrder = (updatedStandingOrder: StandingOrder) => {
    setStandingOrders(standingOrders.map(so => 
      so.id === updatedStandingOrder.id ? updatedStandingOrder : so
    ));
  };
  
  const processStandingOrders = () => {
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
    setStandingOrders(updatedStandingOrders);
    
    // Add new orders
    if (newOrders.length > 0) {
      setOrders([...orders, ...newOrders]);
      
      // Could add notifications or other processing logic here
      console.log(`Processed ${newOrders.length} standing orders`);
    }
  };

  const addReturn = (returnItem: Return) => {
    setReturns([...returns, returnItem]);
  };

  const updateReturn = (updatedReturn: Return) => {
    setReturns(returns.map(r => r.id === updatedReturn.id ? updatedReturn : r));
  };

  const addComplaint = (complaint: Complaint) => {
    setComplaints([...complaints, complaint]);
  };

  const updateComplaint = (updatedComplaint: Complaint) => {
    setComplaints(complaints.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));
  };

  const addMissingItem = (missingItem: MissingItem) => {
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
        setMissingItems(prev => [...prev, missingItem]);
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
      
      setMissingItems(prev => [...prev, completeItem]);
    }
  };

  const removeMissingItem = (missingItemId: string) => {
    setMissingItems(prev => prev.filter(item => item.id !== missingItemId));
  };

  const addUser = (user: User) => {
    setUsers([...users, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const addPicker = (picker: Picker) => {
    setPickers([...pickers, picker]);
  };

  const updatePicker = (updatedPicker: Picker) => {
    setPickers(pickers.map(p => p.id === updatedPicker.id ? updatedPicker : p));
  };

  const deletePicker = (pickerId: string) => {
    setPickers(pickers.filter(picker => picker.id !== pickerId));
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
  
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataProvider;
