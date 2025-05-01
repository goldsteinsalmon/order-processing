
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Private' | 'Trade';
  account_number?: string;
  on_hold?: boolean;
  hold_reason?: string;
  needs_detailed_box_labels?: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  stock_level: number;
  weight?: number;
  requires_weight_input?: boolean;
  unit?: string;
  required?: boolean;
}

export interface Order {
  id: string;
  customer_id: string;
  customer?: Customer;
  customer_order_number?: string;
  order_date: string;
  required_date: string;
  delivery_method: 'Delivery' | 'Collection';
  notes?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Missing Items' | 'Modified' | 'Partially Picked';
  items?: OrderItem[];
  created?: string;
  updated?: string;
  picker?: string;
  picked_by?: string;
  picked_at?: string;
  is_picked?: boolean;
  total_blown_pouches?: number;
  is_modified?: boolean;
  batch_number?: string;
  batch_numbers?: string[];
  has_changes?: boolean;
  from_standing_order?: string;
  picking_in_progress?: boolean;
  picking_progress?: {
    batchNumbers?: Record<string, string>;
  };
  box_distributions?: Box[];
  completed_boxes?: number[];
  missing_items?: MissingItem[];
  invoiced?: boolean;
  invoice_number?: string;
  invoice_date?: string;
  changes?: OrderChange[];
  savedBoxes?: number[];
  batchSummaries?: BatchSummary[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
  original_quantity?: number;
  unavailable_quantity?: number;
  is_unavailable?: boolean;
  blown_pouches?: number;
  batch_number?: string;
  checked?: boolean;
  missing_quantity?: number;
  picked_quantity?: number;
  picked_weight?: number;
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
  order_id: string;
  box_number: number;
  batch_number?: string;
  completed?: boolean;
  printed?: boolean;
  items: BoxItem[];
}

export interface BoxItem {
  id: string;
  box_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  weight?: number;
  batch_number?: string;
}

export interface StandingOrder {
  id: string;
  customer_id: string;
  customer?: Customer;
  customer_order_number?: string;
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
  next_processing_date?: string;
  last_processed_date?: string;
  created?: string;
  updated?: string;
}

export interface StandingOrderItem {
  id: string;
  product_id: string;
  standing_order_id?: string;
  product?: Product;
  quantity: number;
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
  batch_number: string;
  product_id: string;
  product_name: string;
  total_weight: number;
  used_weight: number;
  orders_count: number;
  first_used: string;
  last_used: string;
  usedBy?: string[]; // Added usedBy property
}

export interface BatchSummary {
  batchNumber: string;
  totalWeight: number;
}

export interface MissingItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  date: string;
  status?: 'Pending' | 'Processed';
  product?: Product;
  order?: {
    id: string;
    customer: Customer;
  };
}

export interface Return {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_type: 'Private' | 'Trade';
  contact_email?: string;
  contact_phone?: string;
  date_returned: string;
  order_number?: string;
  invoice_number?: string;
  product_id: string;
  product_sku: string;
  product?: Product;
  quantity: number;
  reason?: string;
  returns_required: 'Yes' | 'No';
  return_status: 'Pending' | 'Processing' | 'Completed' | 'No Return Required';
  resolution_status: 'Open' | 'In Progress' | 'Resolved';
  resolution_notes?: string;
  created: string;
  updated?: string;
}

export interface Complaint {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_type: 'Private' | 'Trade';
  contact_email?: string;
  contact_phone?: string;
  date_submitted: string;
  order_number?: string;
  invoice_number?: string;
  product_id?: string;
  product_sku?: string;
  product?: Product;
  complaint_type: string;
  complaint_details: string;
  returns_required: 'Yes' | 'No';
  return_status: 'Pending' | 'Processing' | 'Completed' | 'No Return Required';
  resolution_status: 'Open' | 'In Progress' | 'Resolved';
  resolution_notes?: string;
  created: string;
  updated?: string;
}
