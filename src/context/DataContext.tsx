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
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const completeOrder = (order: Order) => {
    setOrders(orders.filter(o => o.id !== order.id));
    setCompletedOrders([...completedOrders, { ...order, status: "Completed" }]);
  };

  const addStandingOrder = (standingOrder: StandingOrder) => {
    setStandingOrders([...standingOrders, standingOrder]);
  };

  const updateStandingOrder = (updatedStandingOrder: StandingOrder) => {
    setStandingOrders(standingOrders.map(so => 
      so.id === updatedStandingOrder.id ? updatedStandingOrder : so
    ));
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
