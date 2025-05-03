export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  notes?: string;
  created?: string;
  updated?: string;
  onHold?: boolean;
  holdReason?: string;
  needsDetailedBoxLabels?: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  stock_level: number;
  weight: number;
  requiresWeightInput: boolean;
  unit: string;
  required: boolean;
  created?: string;
  updated?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  batchNumber?: string;
  checked?: boolean;
  pickedQuantity?: number;
  pickedWeight?: number;
  boxNumber?: number;
  originalQuantity?: number;
}

export interface MissingItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  date: string;
  status: "Pending" | "Resolved";
}

export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  customerOrderNumber?: string;
  orderNumber?: number;
  orderDate: string;
  requiredDate: string;
  deliveryMethod: "Delivery" | "Collection";
  items: OrderItem[];
  missingItems?: MissingItem[];
  notes?: string;
  status: "Pending" | "Processing" | "Completed" | "Missing Items" | "Cancelled";
  created?: string;
  fromStandingOrder?: string;
  pickingInProgress?: boolean;
  isPicked?: boolean;
  pickedBy?: string;
  pickedAt?: string;
  boxDistributions?: Box[];
  completedBoxes?: number;
  savedBoxes?: number;
}

export interface StandingOrderItem {
  id: string;
  standingOrderId: string;
  productId: string;
  product?: Product;
  quantity: number;
}

export interface StandingOrder {
  id: string;
  customerId: string;
  customer?: Customer;
  customerOrderNumber?: string;
  schedule: {
    frequency: "Weekly" | "Bi-Weekly" | "Monthly";
    dayOfWeek?: string;
    dayOfMonth?: number;
    deliveryMethod: "Delivery" | "Collection";
    nextDeliveryDate?: string;
    modifiedDeliveries?: ModifiedDelivery[];
  };
  items: StandingOrderItem[];
  notes?: string;
  status?: string;
  created?: string;
  updated?: string;
  nextProcessingDate?: string;
  lastProcessedDate?: string;
}

export interface ModifiedDelivery {
  date: string;
  action: "skip" | "reschedule";
}

export interface Picker {
  id: string;
  name: string;
  active: boolean;
}

export interface Box {
  id: string;
  orderId: string;
  boxNumber: number;
  items: BoxItem[];
  completed: boolean;
  printed: boolean;
}

export interface BoxItem {
  productId: string;
  quantity: number;
}
