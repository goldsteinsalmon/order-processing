
/**
 * Types related to orders and order items
 */

import { Customer, Product } from "./index";

export interface OrderBase {
  id: string;
  customerId: string;
  customer?: Customer;
  customerOrderNumber?: string;
  orderDate: string;
  requiredDate: string;
  deliveryMethod: 'Delivery' | 'Collection';
  notes?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Missing Items' | 'Modified' | 'Partially Picked';
  created?: string;
  updated?: string;
  
  // Picker information
  picker?: string;
  pickedBy?: string;
  pickedAt?: string;
  isPicked?: boolean;
  
  // Order modifications
  totalBlownPouches?: number;
  isModified?: boolean;
  hasChanges?: boolean;
  changes?: OrderChange[];
  
  // Batch information
  batchNumber?: string;
  batchNumbers?: string[];
  batchSummaries?: BatchSummary[];
  
  // Picking progress
  pickingInProgress?: boolean;
  pickingProgress?: {
    batchNumbers?: Record<string, string>;
  };
  
  // Box information
  boxDistributions?: Box[];
  completedBoxes?: number[];
  savedBoxes?: number[];
  
  // Missing items
  missingItems?: MissingItem[];
  
  // Invoice information
  invoiced?: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  
  // Standing order reference
  fromStandingOrder?: string;
  
  // Items in the order
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  product?: Product;
  originalQuantity?: number;
  unavailableQuantity?: number;
  isUnavailable?: boolean;
  blownPouches?: number;
  batchNumber?: string;
  checked?: boolean;
  missingQuantity?: number;
  pickedQuantity?: number;
  pickedWeight?: number;
  boxNumber?: number;
  manualWeight?: number;
}

export interface OrderChange {
  productId: string;
  productName: string;
  originalQuantity: number;
  newQuantity: number;
  date?: string;
}

export interface Box {
  id: string;
  orderId: string;
  boxNumber: number;
  batchNumber?: string;
  completed?: boolean;
  printed?: boolean;
  items: BoxItem[];
}

export interface BoxItem {
  id: string;
  boxId: string;
  productId: string;
  productName: string;
  quantity: number;
  weight?: number;
  batchNumber?: string;
}

export interface BatchSummary {
  batchNumber: string;
  totalWeight: number;
}

export interface MissingItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  date: string;
  status?: 'Pending' | 'Processed';
  product?: Product;
  order?: {
    id: string;
    customer: Customer;
  };
}
