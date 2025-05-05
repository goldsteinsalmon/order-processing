import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
} from "@/types";
import { dbService } from "@/services/IndexedDBService";
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
  batchUsages as initialBatchUsages,
} from "@/data/mockData";

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setCustomers(await dbService.getAll("customers"));
        setProducts(await dbService.getAll("products"));
        setOrders(await dbService.getAll("orders"));
        setCompletedOrders(await dbService.getAll("completedOrders"));
        setStandingOrders(await dbService.getAll("standingOrders"));
        setReturns(await dbService.getAll("returns"));
        setComplaints(await dbService.getAll("complaints"));
        setMissingItems(await dbService.getAll("missingItems"));
        setUsers(await dbService.getAll("users"));
        setPickers(await dbService.getAll("pickers"));
        setBatchUsages(await dbService.getAll("batchUsages"));
      } catch (e) {
        console.error("Failed to load IndexedDB data, using mock fallback:", e);
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
      }
    };

    loadData();
  }, []);

  const value: DataContextType = {
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
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

