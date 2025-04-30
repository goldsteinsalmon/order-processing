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
  Picker 
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
  pickers as initialPickers
} from "../data/mockData";
import { format, addDays, addWeeks, addMonths, parseISO } from "date-fns";
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
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  completeOrder: (order: Order) => void;
  addStandingOrder: (standingOrder: StandingOrder) => void;
  updateStandingOrder: (standingOrder: StandingOrder) => void;
  processStandingOrders: () => void;
  addReturn: (returnItem: Return) => void;
  updateReturn: (returnItem: Return) => void;
  addComplaint: (complaint: Complaint) => void;
  updateComplaint: (complaint: Complaint) => void;
  addMissingItem: (missingItem: MissingItem) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  addPicker: (picker: Picker) => void;
  updatePicker: (picker: Picker) => void;
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

  const addCustomer = (customer: Customer) => {
    setCustomers([...customers, customer]);
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const addProduct = (product: Product) => {
    setProducts([...products, product]);
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

  const completeOrder = (order: Order) => {
    // When completing an order, add support for multiple batch numbers
    let updatedOrder: Order = { ...order, status: "Completed" };
    
    // If there's already a batchNumber, convert it to batchNumbers array
    if (order.batchNumber && !order.batchNumbers) {
      updatedOrder = {
        ...updatedOrder,
        batchNumbers: [order.batchNumber]
      };
    }
    
    setOrders(orders.filter(o => o.id !== order.id));
    setCompletedOrders([...completedOrders, updatedOrder]);
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
          orderDate: standingOrder.schedule.nextDeliveryDate || new Date().toISOString(),
          requiredDate: standingOrder.schedule.nextDeliveryDate || new Date().toISOString(),
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

  const addUser = (user: User) => {
    setUsers([...users, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const addPicker = (picker: Picker) => {
    setPickers([...pickers, picker]);
  };

  const updatePicker = (updatedPicker: Picker) => {
    setPickers(pickers.map(p => p.id === updatedPicker.id ? updatedPicker : p));
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
    addCustomer,
    updateCustomer,
    addProduct,
    updateProduct,
    addOrder,
    updateOrder,
    completeOrder,
    addStandingOrder,
    updateStandingOrder,
    processStandingOrders,
    addReturn,
    updateReturn,
    addComplaint,
    updateComplaint,
    addMissingItem,
    addUser,
    updateUser,
    addPicker,
    updatePicker,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
