
import { Order, StandingOrder, Box, BoxItem } from "@/types";

/**
 * Safely get the order date from an order, handling both camelCase and snake_case properties
 */
export const getOrderDate = (order: Order): string | undefined => {
  return order.orderDate || order.order_date;
};

/**
 * Safely get the customer order number from an order, handling both camelCase and snake_case properties
 */
export const getCustomerOrderNumber = (order: Order): string | undefined => {
  return order.customerOrderNumber || order.customer_order_number;
};

/**
 * Safely get the delivery method from an order, handling both camelCase and snake_case properties
 */
export const getDeliveryMethod = (order: Order): string => {
  return order.deliveryMethod || order.delivery_method || 'Unknown';
};

/**
 * Safely get the customer ID from an order, handling both camelCase and snake_case properties
 */
export const getCustomerId = (order: Order): string | undefined => {
  return order.customerId || order.customer_id;
};

/**
 * Safely get the batch numbers from an order, handling both camelCase and snake_case properties
 */
export const getBatchNumbers = (order: Order): string[] | undefined => {
  return order.batchNumbers || order.batch_numbers;
};

/**
 * Safely get the box distributions from an order, handling both camelCase and snake_case properties
 */
export const getBoxDistributions = (order: Order): Box[] | undefined => {
  return order.boxDistributions || order.box_distributions;
};

/**
 * Safely get the batch number from a box, handling both camelCase and snake_case properties
 */
export const getBoxBatchNumber = (box: Box): string | undefined => {
  return box.batchNumber || box.batch_number;
};

/**
 * Safely get the batch number from a box item, handling both camelCase and snake_case properties
 */
export const getBoxItemBatchNumber = (boxItem: BoxItem): string | undefined => {
  return boxItem.batchNumber || boxItem.batch_number;
};

/**
 * Safely get the picker who picked an order, handling both camelCase and snake_case properties
 */
export const getPickedBy = (order: Order): string | undefined => {
  return order.pickedBy || order.picked_by;
};

/**
 * Safely get the time when an order was picked, handling both camelCase and snake_case properties
 */
export const getPickedAt = (order: Order): string | undefined => {
  return order.pickedAt || order.picked_at;
};

/**
 * Safely get the total blown pouches from an order, handling both camelCase and snake_case properties
 */
export const getTotalBlownPouches = (order: Order): number => {
  return order.totalBlownPouches || order.total_blown_pouches || 0;
};

/**
 * Safely get whether an order has changes, handling both camelCase and snake_case properties
 */
export const getHasChanges = (order: Order): boolean => {
  return order.hasChanges || order.has_changes || false;
};

/**
 * Safely get whether an order is invoiced, handling both camelCase and snake_case properties
 */
export const getInvoiced = (order: Order): boolean => {
  return order.invoiced || false;
};

/**
 * Safely get the invoice date from an order, handling both camelCase and snake_case properties
 */
export const getInvoiceDate = (order: Order): string | undefined => {
  return order.invoiceDate || order.invoice_date;
};

/**
 * Safely get the missing items from an order, handling both camelCase and snake_case properties
 */
export const getMissingItems = (order: Order): any[] | undefined => {
  return order.missingItems || order.missing_items;
};

/**
 * Safely get the completed boxes from an order, handling both camelCase and snake_case properties
 */
export const getCompletedBoxes = (order: Order): number[] | undefined => {
  return order.completedBoxes || order.completed_boxes;
};

/**
 * Safely get whether order picking is in progress, handling both camelCase and snake_case properties
 */
export const getPickingInProgress = (order: Order): boolean => {
  return order.pickingInProgress || order.picking_in_progress || false;
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
