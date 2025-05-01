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
  customer_order_number?: string;
  order_date: string;
  required_date: string;
  delivery_method: 'Delivery' | 'Collection';
  notes?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  items?: OrderItem[];
  created?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
  original_quantity?: number;
}

export interface StandingOrder {
  id: string;
  customer_id: string;
  customer_order_number?: string;
  items: StandingOrderItem[];
  schedule: {
    frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    deliveryMethod: 'Delivery' | 'Collection';
    nextDeliveryDate: string;
  };
  notes?: string;
  active: boolean;
  next_processing_date: string;
  last_processed_date?: string;
}

export interface StandingOrderItem {
  id: string;
  product_id: string;
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
