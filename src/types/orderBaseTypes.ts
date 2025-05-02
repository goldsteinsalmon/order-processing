
import { Customer } from "@/types";

/**
 * Base interface for order-related types with shared properties
 */
export interface OrderBase {
  id: string;
  customerId: string;
  customer?: Customer;
  customerOrderNumber?: string;
  orderDate: string;
  requiredDate: string;
  deliveryMethod: 'Delivery' | 'Collection';
  notes?: string;
  status: 'Pending' | 'Picking' | 'Processing' | 'Completed' | 'Cancelled' | 'Missing Items' | 'Modified' | 'Partially Picked';
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
  changes?: any[];
  
  // Batch information
  batchNumber?: string;
  batchNumbers?: string[];
  batchSummaries?: any[];
  
  // Picking progress
  pickingInProgress?: boolean;
  pickingProgress?: {
    batchNumbers?: Record<string, string>;
  };
  
  // Box information
  boxDistributions?: any[];
  completedBoxes?: number[];
  savedBoxes?: number[];
  
  // Missing items
  missingItems?: any[];
  
  // Invoice information
  invoiced?: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  
  // Standing order reference
  fromStandingOrder?: string;
  
  // Legacy properties for backward compatibility
  customer_id?: string;
  customer_order_number?: string;
  order_date?: string;
  required_date?: string;
  delivery_method?: 'Delivery' | 'Collection';
  is_picked?: boolean;
  picked_by?: string;
  picked_at?: string;
  total_blown_pouches?: number;
  is_modified?: boolean;
  batch_number?: string;
  batch_numbers?: string[];
  has_changes?: boolean;
  from_standing_order?: string;
  picking_in_progress?: boolean;
  picking_progress?: any;
  box_distributions?: any[];
  completed_boxes?: number[];
  saved_boxes?: number[]; 
  missing_items?: any[];
  invoice_number?: string;
  invoice_date?: string;
  batch_summaries?: any[];
}
