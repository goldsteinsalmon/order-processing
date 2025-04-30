export interface Customer {
  id: string;
  accountNumber?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: "Private" | "Trade";
  onHold?: boolean;
  holdReason?: string;
  created?: string;
  needsDetailedBoxLabels?: boolean; // Flag to indicate if customer needs detailed box labels
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  stockLevel: number;
  weight?: number; // Weight in grams
  created?: string; // Added created property
  requiresWeightInput?: boolean; // Added flag to indicate if weight input is required during picking
  unit?: string; // Added unit property for weight measurements (e.g., 'g', 'kg')
}

export interface BoxItem {
  productId: string;
  productName: string;
  quantity: number;
  weight: number;
}

export interface Box {
  boxNumber: number;
  items: BoxItem[];
  completed: boolean;
  printed: boolean;
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
  checked?: boolean;
  missingQuantity?: number;
  pickedQuantity?: number;
  pickedWeight?: number; // Added picked weight field for weight-based products
  originalQuantity?: number; // Added to track original quantity for modified orders
  boxNumber?: number; // Added to track which box this item belongs to
}

export interface PickingProgress {
  picker: string;
  batchNumbers: { [key: string]: string };
  pickedItems: { [key: string]: boolean };
  unavailableItems: { [key: string]: boolean };
  unavailableQuantities: { [key: string]: number | null };
  blownPouches: { [key: string]: number | null };
}

export interface OrderChange {
  productId: string;
  productName: string;
  originalQuantity: number;
  newQuantity: number;
  date: string;
}

export interface MissingItem {
  id: string;
  orderId: string;
  order: {
    id: string;
    customer: Customer;
  } | Order;
  productId: string;
  product: Product;
  quantity: number;
  date: string;
  status?: "Pending" | "Processed";
}

export interface Order {
  id: string;
  customerId: string;
  customer: Customer;
  customerOrderNumber?: string;
  orderDate: string;
  requiredDate?: string;
  deliveryMethod: "Delivery" | "Collection";
  items: OrderItem[];
  notes?: string;
  status: "Pending" | "Picking" | "Completed" | "Cancelled" | "Missing Items" | "Modified" | "Partially Picked";
  picker?: string;
  isPicked?: boolean;
  totalBlownPouches?: number;
  isModified?: boolean;
  modifiedFields?: string[];
  pickingProgress?: PickingProgress | null;
  created: string;
  updated?: string;
  batchNumber?: string;
  batchNumbers?: string[];
  hasChanges?: boolean;
  changes?: OrderChange[];
  fromStandingOrder?: string;
  pickedBy?: string;
  pickedAt?: string;
  missingItems?: {id: string, quantity: number}[];
  pickingInProgress?: boolean;
  boxDistributions?: Box[]; // Added for box distribution information
  completedBoxes?: number[]; // Added to track which box labels have been printed
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
    nextDeliveryDate?: string; // ISO date string for next delivery
    skippedDates?: string[]; // ISO date strings for skipped deliveries
    processedDates?: string[]; // ISO date strings for manually processed deliveries
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
  nextProcessingDate?: string;
  lastProcessedDate?: string;
}

export interface Return {
  id: string;
  customerId?: string;
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
  customerId?: string;
  contactEmail?: string;
  contactPhone?: string;
  dateSubmitted: string;
  orderNumber?: string;
  invoiceNumber?: string;
  productSku?: string;
  product?: Product;
  complaintType: string;
  complaintDetails: string;
  returnsRequired: "Yes" | "No";
  returnStatus: "Pending" | "Processing" | "Completed" | "No Return Required";
  resolutionStatus: "Open" | "In Progress" | "Resolved";
  resolutionNotes?: string;
  created: string;
  updated?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "User" | "Picker";
  active: boolean;
  password?: string; // Added optional password field
}

export interface Picker {
  id: string;
  name: string;
  active: boolean;
}

// Updated interface for batch tracking with product removed from display
export interface BatchUsage {
  id: string;
  batchNumber: string;
  productId: string; // Keep for backend reference but don't display
  productName: string; // Keep for backend reference but don't display
  totalWeight: number; // Total weight assigned to this batch (grams)
  usedWeight: number;  // Weight used from this batch (grams)
  ordersCount: number; // Number of orders using this batch
  firstUsed: string;   // First date the batch was used
  lastUsed: string;    // Last date the batch was used
}
