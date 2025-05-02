
export interface SupabaseCustomer {
  id: string;
  account_number?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: "Private" | "Trade";
  on_hold?: boolean;
  hold_reason?: string;
  created?: string;
  needs_detailed_box_labels?: boolean;
}

export interface SupabaseProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  stock_level: number;
  weight?: number;
  created?: string;
  requires_weight_input?: boolean;
  unit?: string;
  required?: boolean;
}

export interface SupabaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: SupabaseProduct;
  quantity: number;
  unavailable_quantity?: number;
  is_unavailable?: boolean;
  blown_pouches?: number;
  batch_number?: string;
  checked?: boolean;
  missing_quantity?: number;
  picked_quantity?: number;
  picked_weight?: number;
  original_quantity?: number;
  box_number?: number;
  manual_weight?: number;
}

export interface SupabaseOrder {
  id: string;
  order_number?: number;
  customer_id: string;
  customer?: SupabaseCustomer;
  customer_order_number?: string;
  order_date: string;
  required_date?: string;
  delivery_method: "Delivery" | "Collection";
  notes?: string;
  status: "Pending" | "Picking" | "Completed" | "Cancelled" | "Missing Items" | "Modified" | "Partially Picked";
  picker?: string;
  is_picked?: boolean;
  total_blown_pouches?: number;
  is_modified?: boolean;
  created: string;
  updated?: string;
  batch_number?: string;
  has_changes?: boolean;
  from_standing_order?: string;
  picked_by?: string;
  picked_at?: string;
  picking_in_progress?: boolean;
  invoiced?: boolean;
  invoice_number?: string;
  invoice_date?: string;
  items?: SupabaseOrderItem[];
}
