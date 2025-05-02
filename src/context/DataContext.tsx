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
  fetchProducts: () => Promise<void>; // Ensure return type is Promise<void>
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
    adaptedCustomers.forEach((customer, index) => {
      console.log(`Customer ${index + 1}: ${customer.name}`);
      console.log(`  - accountNumber: ${customer.accountNumber || "EMPTY"}`);
      console.log(`  - onHold: ${customer.onHold}`);
      console.log(`  - holdReason: ${customer.holdReason || "EMPTY"}`);
      console.log(`  - needsDetailedBoxLabels: ${customer.needsDetailedBoxLabels}`);
    });
  }, [adaptedCustomers]);
  
  // Convert orders to camelCase for React components
  const adaptedOrders = supabaseData.orders.map(order => adaptOrderToCamelCase(order));
  const adaptedCompletedOrders = supabaseData.completedOrders.map(order => adaptOrderToCamelCase(order));
  
  // Convert products to camelCase
  const adaptedProducts = supabaseData.products.map(product => adaptProductToCamelCase(product));
  console.log("DataContext: All adapted products:", adaptedProducts);
  
  // Convert batch usages to camelCase
  const adaptedBatchUsages = supabaseData.batchUsages.map(batchUsage => adaptBatchUsageToCamelCase(batchUsage));
  
  // Convert missing items to camelCase
  const adaptedMissingItems = supabaseData.missingItems.map(item => adaptMissingItemToCamelCase(item));
  
  // Wrap the updateCustomer function to convert camelCase back to snake_case
  const updateCustomer = async (camelCaseCustomer: Customer): Promise<boolean> => {
    console.log("DataContext updateCustomer called with:", camelCaseCustomer);
    console.log("DataContext updateCustomer - accountNumber:", camelCaseCustomer.accountNumber || "EMPTY");
    console.log("DataContext updateCustomer - onHold:", camelCaseCustomer.onHold);
    console.log("DataContext updateCustomer - holdReason:", camelCaseCustomer.holdReason || "EMPTY");
    
    // Make sure we have a valid customer with all properties
    const completeCustomer: Customer = {
      ...camelCaseCustomer,
      accountNumber: camelCaseCustomer.accountNumber || "",
      onHold: camelCaseCustomer.onHold === true,
      holdReason: camelCaseCustomer.onHold ? (camelCaseCustomer.holdReason || "") : "",
      needsDetailedBoxLabels: camelCaseCustomer.needsDetailedBoxLabels === true
    };
    
    const snakeCaseCustomer = adaptCustomerToSnakeCase(completeCustomer);
    console.log("Converted to snake_case:", snakeCaseCustomer);
    console.log("DataContext updateCustomer - snake_case account_number:", snakeCaseCustomer.account_number || "EMPTY");
    console.log("DataContext updateCustomer - snake_case on_hold:", snakeCaseCustomer.on_hold);
    console.log("DataContext updateCustomer - snake_case hold_reason:", snakeCaseCustomer.hold_reason || "EMPTY");
    
    const result = await supabaseData.updateCustomer(snakeCaseCustomer);
    
    return result;
  };
  
  // Wrap the addCustomer function to ensure proper data handling
  const addCustomer = async (camelCaseCustomer: Customer): Promise<Customer | null> => {
    console.log("DataContext addCustomer called with:", camelCaseCustomer);
    console.log("DataContext addCustomer - accountNumber:", camelCaseCustomer.accountNumber || "EMPTY");
    console.log("DataContext addCustomer - onHold:", camelCaseCustomer.onHold);
    
    // Make sure we have a valid customer with all properties
    const completeCustomer: Customer = {
      ...camelCaseCustomer,
      accountNumber: camelCaseCustomer.accountNumber || "",
      onHold: camelCaseCustomer.onHold === true,
      holdReason: camelCaseCustomer.onHold ? (camelCaseCustomer.holdReason || "") : "",
      needsDetailedBoxLabels: camelCaseCustomer.needsDetailedBoxLabels === true
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
    console.log("DataContext addProduct called with:", camelCaseProduct);
    
    if (Array.isArray(camelCaseProduct)) {
      const snakeCaseProducts = camelCaseProduct.map(adaptProductToSnakeCase);
      console.log("Converted to snake_case for batch add:", snakeCaseProducts);
      const result = await supabaseData.addProduct(snakeCaseProducts);
      if (result) {
        const adaptedResult = Array.isArray(result) 
          ? result.map(adaptProductToCamelCase) 
          : adaptProductToCamelCase(result);
        console.log("Result after batch add:", adaptedResult);
        return adaptedResult;
      }
      return null;
    } else {
      const snakeCaseProduct = adaptProductToSnakeCase(camelCaseProduct);
      console.log("Converted to snake_case for single add:", snakeCaseProduct);
      const result = await supabaseData.addProduct(snakeCaseProduct);
      if (result) {
        const adaptedResult = adaptProductToCamelCase(result);
        console.log("Result after single add:", adaptedResult);
        return adaptedResult;
      }
      return null;
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
  
  // Create a dedicated fetchProducts function to expose to components
  const fetchProducts = async (): Promise<void> => {
    console.log("DataContext: fetchProducts called");
    try {
      await supabaseData.fetchProducts();
      console.log("DataContext: Products fetched successfully:", supabaseData.products);
    } catch (error) {
      console.error("DataContext: Error fetching products:", error);
      throw error;
    }
  };

  const value: DataContextType = {
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
    addMissingItem,
    fetchProducts,
    isLoading: supabaseData.isLoading,
    returns: supabaseData.returns,
    complaints: supabaseData.complaints,
    standingOrders: supabaseData.standingOrders,
    users: supabaseData.users,
    pickers: supabaseData.pickers,
    deleteCustomer: supabaseData.deleteCustomer,
    deleteProduct: supabaseData.deleteProduct,
    deleteOrder: supabaseData.deleteOrder,
    completeOrder: supabaseData.completeOrder,
    addStandingOrder: supabaseData.addStandingOrder,
    updateStandingOrder: supabaseData.updateStandingOrder,
    processStandingOrders: supabaseData.processStandingOrders,
    addReturn: supabaseData.addReturn,
    updateReturn: supabaseData.updateReturn,
    addComplaint: supabaseData.addComplaint,
    updateComplaint: supabaseData.updateComplaint,
    removeMissingItem: supabaseData.removeMissingItem,
    addUser: supabaseData.addUser,
    updateUser: supabaseData.updateUser,
    deleteUser: supabaseData.deleteUser,
    addPicker: supabaseData.addPicker,
    updatePicker: supabaseData.updatePicker,
    deletePicker: supabaseData.deletePicker,
    getBatchUsages: supabaseData.getBatchUsages,
    getBatchUsageByBatchNumber: supabaseData.getBatchUsageByBatchNumber,
    recordBatchUsage: supabaseData.recordBatchUsage,
    recordAllBatchUsagesForOrder: supabaseData.recordAllBatchUsagesForOrder,
    refreshData: supabaseData.refreshData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataProvider;
