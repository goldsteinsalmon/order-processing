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
  recordAllBatchUsagesForOrder: (order: Order) => void; // New function to record all batch usages for an order
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
    
    // Clear the processed batch items set before recording for this order
    setProcessedBatchOrderItems(new Set());
    
    // Record all batch usages for this order
    recordAllBatchUsagesForOrder(updatedOrder);
    
    setOrders(orders.filter(o => o.id !== order.id));
    setCompletedOrders([...completedOrders, updatedOrder]);
  };
  
  // Improved function to collect and process all batch usages for an order
  const recordAllBatchUsagesForOrder = (order: Order) => {
    // Create a map to track which products are using which batches
    // Key is batchNumber-productId, value is {productId, quantity, weight}
    const batchProductMap = new Map<string, {
      productId: string;
      quantity: number;
      weight?: number;
    }>();
    
    // Clear the processed items set for this new order processing
    setProcessedBatchOrderItems(new Set());
    
    // Track processed items to prevent duplicates
    const processedItems = new Set<string>();
    
    // Process order-level batch information first
    if (order.batchNumber) {
      processOrderItems(order.items, order.batchNumber);
    }
    
    // Process order.batchNumbers array if it exists
    if (order.batchNumbers && Array.isArray(order.batchNumbers) && order.batchNumbers.length > 0) {
      const defaultBatch = order.batchNumbers[0];
      processOrderItems(order.items, defaultBatch);
    }
    
    // Process item-level batch numbers
    order.items.forEach(item => {
      if (item.batchNumber) {
        const itemKey = `item-${item.id}-${item.batchNumber}`;
        if (!processedItems.has(itemKey)) {
          addToBatchProductMap(item.batchNumber, item.productId, item.quantity, item.pickedWeight);
          processedItems.add(itemKey);
        }
      }
    });
    
    // Process boxes exclusively - don't double count with order.items
    if (order.boxDistributions && order.boxDistributions.length > 0) {
      processBoxes(order.boxDistributions);
    } else if (order.boxes && order.boxes.length > 0) {
      processBoxes(order.boxes);
    }
    
    // Helper function to process order items
    function processOrderItems(items: OrderItem[], defaultBatch: string) {
      items.forEach(item => {
        if (!item.batchNumber) {
          const itemKey = `item-${item.id}-${defaultBatch}`;
          if (!processedItems.has(itemKey)) {
            // Find the product to get its weight
            const product = products.find(p => p.id === item.productId);
            const itemWeight = item.pickedWeight || (product?.weight ? product.weight * item.quantity : undefined);
            addToBatchProductMap(defaultBatch, item.productId, item.quantity, itemWeight);
            processedItems.add(itemKey);
          }
        }
      });
    }
    
    // Helper function to process boxes
    function processBoxes(boxes: Box[]) {
      boxes.forEach(box => {
        // Determine which batch number to use for this box
        const boxBatch = box.batchNumber || order.batchNumber || 
          (order.batchNumbers && order.batchNumbers.length > 0 ? order.batchNumbers[0] : undefined);
        
        if (boxBatch) {
          box.items.forEach(item => {
            const itemBatch = item.batchNumber || boxBatch;
            const boxItemKey = `box-${box.boxNumber}-item-${item.productId}-${itemBatch}`;
            
            if (!processedItems.has(boxItemKey)) {
              addToBatchProductMap(itemBatch, item.productId, item.quantity, item.weight);
              processedItems.add(boxItemKey);
            }
          });
        }
      });
    }
    
    // Now record each batch usage from our map
    for (const [batchProductKey, {productId, quantity, weight}] of batchProductMap.entries()) {
      const [batchNumber] = batchProductKey.split('-');
      
      // Generate a unique tracking ID for this specific batch usage
      const uniqueId = `${batchNumber}-${order.id}-${productId}`;
      if (!processedBatchOrderItems.has(uniqueId)) {
        recordBatchUsage(
          batchNumber,
          productId,
          quantity,
          order.id,
          weight
        );
        
        // Mark this combination as processed
        setProcessedBatchOrderItems(prev => {
          const newSet = new Set(prev);
          newSet.add(uniqueId);
          return newSet;
        });
      }
    }
    
    // Helper function to add items to the batch-product map
    function addToBatchProductMap(
      batchNumber: string,
      productId: string,
      quantity: number,
      weight?: number
    ) {
      if (!batchNumber) return;
      
      const key = `${batchNumber}-${productId}`;
      
      // Find the product to get its weight if not provided
      if (weight === undefined) {
        const product = products.find(p => p.id === productId);
        if (product?.weight) {
          weight = product.weight * quantity;
        }
      }
      
      if (batchProductMap.has(key)) {
        // Update existing entry
        const existing = batchProductMap.get(key)!;
        existing.quantity += quantity;
        if (weight !== undefined) {
          existing.weight = (existing.weight || 0) + weight;
        }
      } else {
        // Create new entry
        batchProductMap.set(key, {
          productId,
          quantity,
          weight
        });
      }
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

  // Updated recordBatchUsage function to correctly calculate weights and avoid double counting
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
    
    if (manualWeight !== undefined && manualWeight > 0) {
      // Use the manually entered weight for products that require weight input
      totalWeight = manualWeight;
    } else if (product.weight) {
      // Use calculated weight based on quantity and product's weight
      totalWeight = product.weight * quantity;
    } else {
      console.warn(`No weight available for product ${product.name}. Using quantity as fallback for batch tracking.`);
      totalWeight = quantity; // Fallback to using quantity as a measure
    }
    
    // Generate a unique key for batch-product-order combination
    const uniqueKey = `${batchNumber}-${productId}-${orderId}`;
    
    // Check if we've already processed this exact combination
    const alreadyProcessed = processedBatchOrderItems.has(uniqueKey);
    if (alreadyProcessed) {
      console.log(`Skipping duplicate batch usage: ${uniqueKey}`);
      return; // Skip if already processed
    }
    
    // Check if this batch exists
    const existingBatchIndex = batchUsages.findIndex(bu => bu.batchNumber === batchNumber);
    
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
