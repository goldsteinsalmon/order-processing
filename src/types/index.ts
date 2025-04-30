
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: "Private" | "Trade";
  onHold?: boolean;
  holdReason?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stockLevel: number;
  unit: string; // e.g., "kg", "unit", etc.
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unavailableQuantity?: number;
  isUnavailable?: boolean;
  blownPouches?: number;
  batchNumber?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customer: Customer;
  customerOrderNumber?: string;
  orderDate: string;
  deliveryMethod: "Delivery" | "Collection";
  items: OrderItem[];
  notes?: string;
  status: "Pending" | "Picking" | "Completed" | "Cancelled";
  picker?: string;
  isPicked?: boolean;
  batchNumber?: string;
  totalBlownPouches?: number;
  isModified?: boolean;
  modifiedFields?: string[];
  created: string;
  updated?: string;
}

export interface StandingOrder {
  id: string;
  customerId: string;
  customer: Customer;
  customerOrderNumber?: string;
  schedule: {
    frequency: "Weekly" | "Bi-Weekly" | "Monthly";
    dayOfWeek?: number; // 0-6, Sunday to Saturday
    dayOfMonth?: number; // 1-31
    deliveryMethod: "Delivery" | "Collection";
    skippedDates?: string[]; // ISO date strings for skipped deliveries
    modifiedDeliveries?: {
      date: string;
      modifications: {
        items?: OrderItem[];
        notes?: string;
      };
    }[];
  };
  items: OrderItem[];
  notes?: string;
  active: boolean;
  created: string;
  updated?: string;
}

export interface Return {
  id: string;
  customerType: "Private" | "Trade";
  customerName: string;
  contactEmail?: string;
  contactPhone?: string;
  dateReturned: string;
  orderNumber?: string;
  invoiceNumber?: string;
  productSku: string;
  product: Product;
  quantity?: number;
  reason?: string;
  returnsRequired: "Yes" | "No";
  returnStatus: "Pending" | "Processing" | "Completed" | "No Return Required";
  resolutionStatus: "Open" | "In Progress" | "Resolved";
  resolutionNotes?: string;
  created: string;
  updated?: string;
}

export interface Complaint {
  id: string;
  customerType: "Private" | "Trade";
  customerName: string;
  contactEmail?: string;
  contactPhone?: string;
  dateSubmitted: string;
  orderNumber?: string;
  invoiceNumber?: string;
  productSku?: string;
  product?: Product;
  complaintType: string; // e.g., "Foreign Object Found", "Quality Issue", etc.
  complaintDetails: string;
  returnsRequired: "Yes" | "No";
  returnStatus: string;
  resolutionStatus: "Open" | "In Progress" | "Resolved";
  resolutionNotes?: string;
  created: string;
  updated?: string;
}

export interface MissingItem {
  id: string;
  orderId: string;
  order: Order;
  productId: string;
  product: Product;
  quantity: number;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "User" | "Picker";
  active: boolean;
}

export interface Picker {
  id: string;
  name: string;
  active: boolean;
}
