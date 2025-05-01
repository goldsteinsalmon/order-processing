
import React, { createContext, useContext } from "react";
import { useSupabaseData } from "./SupabaseDataContext";
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
  BatchUsage
} from "../types";
import { adaptOrderToCamelCase, adaptOrderToSnakeCase } from "@/utils/typeAdapters";

// Interface for DataContext
interface DataContextType {
  customers: Customer[];
  products: Product[];
  orders: any[]; // Using any for orders to allow camelCase properties
  completedOrders: any[]; // Using any for orders to allow camelCase properties
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
  addOrder: (order: any) => Promise<any | null>; // Using any for orders
  updateOrder: (order: any) => Promise<boolean>; // Using any for orders
  deleteOrder: (orderId: string) => Promise<boolean>;
  completeOrder: (order: any) => Promise<boolean>; // Using any for orders
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
  recordAllBatchUsagesForOrder: (order: any) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Custom hook for using the data context
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

// Provider component
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabaseData = useSupabaseData();
  
  // Convert orders to camelCase for React components
  const adaptedOrders = supabaseData.orders.map(order => adaptOrderToCamelCase(order));
  const adaptedCompletedOrders = supabaseData.completedOrders.map(order => adaptOrderToCamelCase(order));
  
  // Wrap the updateOrder function to convert camelCase back to snake_case
  const updateOrder = async (camelCaseOrder: any): Promise<boolean> => {
    const snakeCaseOrder = adaptOrderToSnakeCase(camelCaseOrder);
    return await supabaseData.updateOrder(snakeCaseOrder);
  };
  
  // Wrap the addOrder function to convert camelCase back to snake_case
  const addOrder = async (camelCaseOrder: any): Promise<any | null> => {
    const snakeCaseOrder = adaptOrderToSnakeCase(camelCaseOrder);
    const result = await supabaseData.addOrder(snakeCaseOrder);
    return result ? adaptOrderToCamelCase(result) : null;
  };
  
  // Wrap the completeOrder function to convert camelCase back to snake_case
  const completeOrder = async (camelCaseOrder: any): Promise<boolean> => {
    const snakeCaseOrder = adaptOrderToSnakeCase(camelCaseOrder);
    return await supabaseData.completeOrder(snakeCaseOrder);
  };
  
  // Wrap the recordAllBatchUsagesForOrder function to convert camelCase back to snake_case
  const recordAllBatchUsagesForOrder = (camelCaseOrder: any): void => {
    const snakeCaseOrder = adaptOrderToSnakeCase(camelCaseOrder);
    supabaseData.recordAllBatchUsagesForOrder(snakeCaseOrder);
  };
  
  // Return the context value
  const value: DataContextType = {
    ...supabaseData,
    orders: adaptedOrders,
    completedOrders: adaptedCompletedOrders,
    updateOrder,
    addOrder,
    completeOrder,
    recordAllBatchUsagesForOrder
  };
  
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataProvider;
