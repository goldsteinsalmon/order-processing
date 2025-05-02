export * from './order-types';
export * from './orderBaseTypes';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Private' | 'Trade';
  accountNumber?: string;
  onHold?: boolean;
  holdReason?: string;
  needsDetailedBoxLabels?: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  stock_level: number;
  weight?: number;
  requiresWeightInput?: boolean;
  unit?: string;
  required?: boolean;
  barcode?: string;
  active?: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  customerOrderNumber?: string;
  orderDate: string;
  requiredDate: string;
  deliveryMethod: 'Delivery' | 'Collection';
  notes?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Missing Items' | 'Modified' | 'Partially Picked';
  items?: OrderItem[];
  created?: string;
  updated?: string;
  picker?: string;
  pickedBy?: string;
  pickedAt?: string;
  isPicked?: boolean;
  totalBlownPouches?: number;
  isModified?: boolean;
  batchNumber?: string;
  batchNumbers?: string[];
  hasChanges?: boolean;
  fromStandingOrder?: string;
  pickingInProgress?: boolean;
  pickingProgress?: {
    batchNumbers?: Record<string, string>;
  };
  boxDistributions?: Box[];
  completedBoxes?: number[];
  missingItems?: MissingItem[];
  invoiced?: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  changes?: OrderChange[];
  savedBoxes?: number[];
  batchSummaries?: BatchSummary[];
  
  // Legacy properties for backward compatibility during transition
  // These should be removed once all code is updated
  customer_id?: string;
  customer_order_number?: string;
  order_date?: string;
  required_date?: string;
  delivery_method?: 'Delivery' | 'Collection';
  is_picked?: boolean;
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
  missing_items?: any[];
  invoice_number?: string;
  invoice_date?: string;
  picked_by?: string;
  picked_at?: string;
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
  
  // Legacy properties for backward compatibility during transition
  order_id?: string;
  product_id?: string;
  unavailable_quantity?: number;
  is_unavailable?: boolean;
  blown_pouches?: number;
  batch_number?: string;
  missing_quantity?: number;
  picked_quantity?: number;
  picked_weight?: number;
  original_quantity?: number;
  box_number?: number;
  manual_weight?: number;
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
  
  // Legacy properties for backward compatibility during transition
  order_id?: string;
  box_number?: number;
  batch_number?: string;
}

export interface BoxItem {
  id: string;
  boxId: string;
  productId: string;
  productName: string;
  quantity: number;
  weight?: number;
  batchNumber?: string;
  
  // Legacy properties for backward compatibility during transition
  box_id?: string;
  product_id?: string;
  product_name?: string;
  batch_number?: string;
}

export interface StandingOrder {
  id: string;
  customerId: string;
  customer?: Customer;
  customerOrderNumber?: string;
  items: StandingOrderItem[];
  schedule: {
    frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    deliveryMethod: 'Delivery' | 'Collection';
    nextDeliveryDate: string;
    processedDates?: string[];
    skippedDates?: string[];
    modifiedDeliveries?: { 
      date: string; 
      modifications?: { 
        items?: boolean; 
        notes?: boolean; 
      }
    }[];
  };
  notes?: string;
  active: boolean;
  nextProcessingDate?: string;
  lastProcessedDate?: string;
  created?: string;
  updated?: string;
  
  // Legacy properties
  customer_id?: string;
  customer_order_number?: string;
  next_processing_date?: string;
  last_processed_date?: string;
}

export interface StandingOrderItem {
  id: string;
  productId: string;
  standingOrderId?: string;
  product?: Product;
  quantity: number;
  
  // Legacy properties
  product_id?: string;
  standing_order_id?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'User' | 'Manager';
  active: boolean;
}

export interface Picker {
  id: string;
  name: string;
  active: boolean;
}

export interface BatchUsage {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  totalWeight: number;
  usedWeight: number;
  ordersCount: number;
  firstUsed: string;
  lastUsed: string;
  usedBy?: string[];
  
  // Legacy properties
  batch_number?: string;
  product_id?: string;
  product_name?: string;
  total_weight?: number;
  used_weight?: number;
  orders_count?: number;
  first_used?: string;
  last_used?: string;
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
  
  // Legacy properties
  order_id?: string;
  product_id?: string;
}

export interface Return {
  id: string;
  customerId?: string;
  customerName: string;
  customerType: 'Private' | 'Trade';
  contactEmail?: string;
  contactPhone?: string;
  dateReturned: string;
  orderNumber?: string;
  invoiceNumber?: string;
  productId: string;
  productSku: string;
  product?: Product;
  quantity: number;
  reason?: string;
  returnsRequired: 'Yes' | 'No';
  returnStatus: 'Pending' | 'Processing' | 'Completed' | 'No Return Required';
  resolutionStatus: 'Open' | 'In Progress' | 'Resolved';
  resolutionNotes?: string;
  created: string;
  updated?: string;
  
  // Legacy properties
  customer_id?: string;
  customer_name?: string;
  customer_type?: 'Private' | 'Trade';
  contact_email?: string;
  contact_phone?: string;
  date_returned?: string;
  order_number?: string;
  invoice_number?: string;
  product_id?: string;
  product_sku?: string;
  returns_required?: 'Yes' | 'No';
  return_status?: 'Pending' | 'Processing' | 'Completed' | 'No Return Required';
  resolution_status?: 'Open' | 'In Progress' | 'Resolved';
  resolution_notes?: string;
}

export interface Complaint {
  id: string;
  customerId?: string;
  customerName: string;
  customerType: 'Private' | 'Trade';
  contactEmail?: string;
  contactPhone?: string;
  dateSubmitted: string;
  orderNumber?: string;
  invoiceNumber?: string;
  productId?: string;
  productSku?: string;
  product?: Product;
  complaintType: string;
  complaintDetails: string;
  returnsRequired: 'Yes' | 'No';
  returnStatus: 'Pending' | 'Processing' | 'Completed' | 'No Return Required';
  resolutionStatus: 'Open' | 'In Progress' | 'Resolved';
  resolutionNotes?: string;
  created: string;
  updated?: string;
  
  // Legacy properties
  customer_id?: string;
  customer_name?: string;
  customer_type?: 'Private' | 'Trade';
  contact_email?: string;
  contact_phone?: string;
  date_submitted?: string;
  order_number?: string;
  invoice_number?: string;
  product_id?: string;
  product_sku?: string;
  complaint_type?: string;
  complaint_details?: string;
  returns_required?: 'Yes' | 'No';
  return_status?: 'Pending' | 'Processing' | 'Completed' | 'No Return Required';
  resolution_status?: 'Open' | 'In Progress' | 'Resolved';
  resolution_notes?: string;
}
