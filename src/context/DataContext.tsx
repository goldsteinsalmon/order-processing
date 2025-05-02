import React, { createContext, useContext, useEffect } from "react";
import { SupabaseDataProvider, useSupabaseData } from "./SupabaseDataContext";
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
  Box,
  BoxItem
} from "../types";
import { 
  adaptOrderToCamelCase, 
  adaptOrderToSnakeCase, 
  adaptCustomerToCamelCase,
  adaptCustomerToSnakeCase,
  adaptProductToCamelCase,
  adaptProductToSnakeCase,
  adaptBatchUsageToCamelCase,
  adaptBatchUsageToSnakeCase,
  adaptMissingItemToCamelCase,
  adaptMissingItemToSnakeCase
} from "@/utils/typeAdapters";

// Interface for DataContext
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
  deleteCustomer: (customerId: string) => Promise<boolean>;
  addProduct: (product: Product | Product[]) => Promise<Product | Product[] | null>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
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
  
  // Convert customers to camelCase for React components
  const adaptedCustomers = supabaseData.customers.map(customer => {
    return adaptCustomerToCamelCase(customer);
  });
  
  // Debug to check all customer data
  useEffect(() => {
    console.log("DataContext: All adapted customers:", adaptedCustomers);
  }, [adaptedCustomers]);
  
  // Convert orders to camelCase for React components
  const adaptedOrders = supabaseData.orders.map(order => adaptOrderToCamelCase(order));
  const adaptedCompletedOrders = supabaseData.completedOrders.map(order => adaptOrderToCamelCase(order));
  
  // Convert products to camelCase
  const adaptedProducts = supabaseData.products.map(product => adaptProductToCamelCase(product));
  
  // Convert batch usages to camelCase
  const adaptedBatchUsages = supabaseData.batchUsages.map(batchUsage => adaptBatchUsageToCamelCase(batchUsage));
  
  // Convert missing items to camelCase
  const adaptedMissingItems = supabaseData.missingItems.map(item => adaptMissingItemToCamelCase(item));
  
  // Wrap the updateCustomer function to convert camelCase back to snake_case
  const updateCustomer = async (camelCaseCustomer: Customer): Promise<boolean> => {
    console.log("DataContext updateCustomer called with:", camelCaseCustomer);
    console.log("DataContext updateCustomer - accountNumber:", camelCaseCustomer.accountNumber || "EMPTY");
    console.log("DataContext updateCustomer - onHold:", camelCaseCustomer.onHold);
    
    // Make sure we have a valid customer with all properties
    const completeCustomer = {
      ...camelCaseCustomer,
      accountNumber: camelCaseCustomer.accountNumber || "",
      needsDetailedBoxLabels: camelCaseCustomer.needsDetailedBoxLabels || false
    };
    
    const snakeCaseCustomer = adaptCustomerToSnakeCase(completeCustomer);
    console.log("Converted to snake_case:", snakeCaseCustomer);
    console.log("DataContext updateCustomer - snake_case account_number:", snakeCaseCustomer.account_number || "EMPTY");
    
    const result = await supabaseData.updateCustomer(snakeCaseCustomer);
    
    if (result) {
      // Force refresh the customers list to ensure UI is updated
      const index = customers.findIndex(c => c.id === camelCaseCustomer.id);
      if (index !== -1) {
        const updatedCustomers = [...customers];
        updatedCustomers[index] = completeCustomer;
      }
    }
    
    return result;
  };
  
  // Wrap the addCustomer function to ensure proper data handling
  const addCustomer = async (camelCaseCustomer: Customer): Promise<Customer | null> => {
    console.log("DataContext addCustomer called with:", camelCaseCustomer);
    console.log("DataContext addCustomer - accountNumber:", camelCaseCustomer.accountNumber || "EMPTY");
    console.log("DataContext addCustomer - onHold:", camelCaseCustomer.onHold);
    
    // Make sure we have a valid customer with all properties
    const completeCustomer = {
      ...camelCaseCustomer,
      accountNumber: camelCaseCustomer.accountNumber || "",
      needsDetailedBoxLabels: camelCaseCustomer.needsDetailedBoxLabels || false
    };
    
    const snakeCaseCustomer = adaptCustomerToSnakeCase(completeCustomer);
    console.log("Converted to snake_case for add:", snakeCaseCustomer);
    const result = await supabaseData.addCustomer(snakeCaseCustomer);
    if (result) {
      const adaptedResult = adaptCustomerToCamelCase(result);
      console.log("Result after adapting back to camelCase:", adaptedResult);
      return adaptedResult;
    }
    return null;
  };
  
  // Wrap the updateProduct function to convert camelCase back to snake_case
  const updateProduct = async (camelCaseProduct: Product): Promise<boolean> => {
    const snakeCaseProduct = adaptProductToSnakeCase(camelCaseProduct);
    return await supabaseData.updateProduct(snakeCaseProduct);
  };
  
  // Wrap the addProduct function to convert camelCase back to snake_case
  const addProduct = async (camelCaseProduct: Product | Product[]): Promise<Product | Product[] | null> => {
    if (Array.isArray(camelCaseProduct)) {
      const snakeCaseProducts = camelCaseProduct.map(adaptProductToSnakeCase);
      const result = await supabaseData.addProduct(snakeCaseProducts);
      return result ? (Array.isArray(result) ? result.map(adaptProductToCamelCase) : adaptProductToCamelCase(result)) : null;
    } else {
      const snakeCaseProduct = adaptProductToSnakeCase(camelCaseProduct);
      const result = await supabaseData.addProduct(snakeCaseProduct);
      return result ? adaptProductToCamelCase(result) : null;
    }
  };
  
  // Wrap the updateOrder function to convert camelCase back to snake_case
  const updateOrder = async (camelCaseOrder: Order): Promise<boolean> => {
    const snakeCaseOrder = adaptOrderToSnakeCase(camelCaseOrder);
    return await supabaseData.updateOrder(snakeCaseOrder);
  };
  
  // Wrap the addOrder function to convert camelCase back to snake_case
  const addOrder = async (camelCaseOrder: Order): Promise<Order | null> => {
    const snakeCaseOrder = adaptOrderToSnakeCase(camelCaseOrder);
    const result = await supabaseData.addOrder(snakeCaseOrder);
    return result ? adaptOrderToCamelCase(result) : null;
  };

  // Wrap the missing item functions to ensure proper conversion
  const addMissingItem = async (camelCaseMissingItem: MissingItem): Promise<MissingItem | null> => {
    const snakeCaseMissingItem = adaptMissingItemToSnakeCase(camelCaseMissingItem);
    const result = await supabaseData.addMissingItem(snakeCaseMissingItem);
    return result ? adaptMissingItemToCamelCase(result) : null;
  };
  
  const value: DataContextType = {
    ...supabaseData,
    customers: adaptedCustomers,
    products: adaptedProducts,
    orders: adaptedOrders,
    completedOrders: adaptedCompletedOrders,
    batchUsages: adaptedBatchUsages,
    missingItems: adaptedMissingItems,
    updateCustomer,
    addCustomer,
    updateProduct,
    addProduct,
    updateOrder,
    addOrder,
    addMissingItem
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataProvider;
