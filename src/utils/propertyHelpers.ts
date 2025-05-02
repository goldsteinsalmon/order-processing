import { StandingOrder } from "@/types";
import { OrderBase } from "@/types/orderBaseTypes";

// Re-export helpers from the new specialized files
export * from './boxPropertyHelpers';
export * from './pickerPropertyHelpers';
export * from './customerPropertyHelpers';

/**
 * Safely get the order date from an order, handling both camelCase and snake_case properties
 */
export const getOrderDate = (order: OrderBase): string | undefined => {
  return order.orderDate || order.order_date;
};

/**
 * Safely get the customer order number from an order, handling both camelCase and snake_case properties
 */
export const getCustomerOrderNumber = (order: OrderBase): string | undefined => {
  return order.customerOrderNumber || order.customer_order_number;
};

/**
 * Safely get the delivery method from an order, handling both camelCase and snake_case properties
 */
export const getDeliveryMethod = (order: OrderBase): string => {
  return order.deliveryMethod || order.delivery_method || 'Unknown';
};

/**
 * Safely get the customer ID from an order, handling both camelCase and snake_case properties
 */
export const getCustomerId = (order: OrderBase): string | undefined => {
  return order.customerId || order.customer_id;
};

/**
 * Safely get the batch numbers from an order, handling both camelCase and snake_case properties
 */
export const getBatchNumbers = (order: OrderBase): string[] | undefined => {
  return order.batchNumbers || order.batch_numbers;
};

/**
 * Safely get the total blown pouches from an order, handling both camelCase and snake_case properties
 */
export const getTotalBlownPouches = (order: OrderBase): number => {
  return order.totalBlownPouches || order.total_blown_pouches || 0;
};

/**
 * Safely get whether an order has changes, handling both camelCase and snake_case properties
 */
export const getHasChanges = (order: OrderBase): boolean => {
  return order.hasChanges || order.has_changes || false;
};

/**
 * Safely get whether an order is invoiced, handling both camelCase and snake_case properties
 */
export const getInvoiced = (order: OrderBase): boolean => {
  return order.invoiced || false;
};

/**
 * Safely get the invoice date from an order, handling both camelCase and snake_case properties
 */
export const getInvoiceDate = (order: OrderBase): string | undefined => {
  return order.invoiceDate || order.invoice_date;
};

/**
 * Safely get the missing items from an order, handling both camelCase and snake_case properties
 */
export const getMissingItems = (order: OrderBase): any[] | undefined => {
  return order.missingItems || order.missing_items;
};

/**
 * Safely get a property from a StandingOrder schedule, providing a default value
 */
export const getStandingOrderScheduleProperty = <T>(
  standingOrder: StandingOrder | null | undefined, 
  property: keyof StandingOrder['schedule'], 
  defaultValue: T
): T => {
  if (!standingOrder || !standingOrder.schedule) {
    return defaultValue;
  }
  
  return (standingOrder.schedule[property] as unknown as T) || defaultValue;
};

/**
 * Safely get the batch number from an order, handling both camelCase and snake_case properties
 */
export const getBatchNumber = (order: OrderBase): string | undefined => {
  return order.batchNumber || order.batch_number;
};

/**
 * Safely get the batch summaries from an order, handling both camelCase and snake_case properties
 */
export const getBatchSummaries = (order: OrderBase): any[] | undefined => {
  return order.batchSummaries || order.batch_summaries;
};

/**
 * Safely get whether an order is modified, handling both camelCase and snake_case properties
 */
export const getIsModified = (order: OrderBase): boolean => {
  return order.isModified || order.is_modified || false;
};

/**
 * Safely get the from standing order reference, handling both camelCase and snake_case properties
 */
export const getFromStandingOrder = (order: OrderBase): string | undefined => {
  return order.fromStandingOrder || order.from_standing_order;
};

/**
 * Safely get order changes, handling both camelCase and snake_case properties
 */
export const getOrderChanges = (order: OrderBase): any[] | undefined => {
  return order.changes || [];
};
