
/**
 * Types related to orders and order items
 */

import { Customer, Product, OrderBase } from "./index";

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
