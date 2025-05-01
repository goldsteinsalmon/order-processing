
import { Order, OrderItem, Box, BoxItem } from "@/types";

/**
 * Helper methods to safely access properties that might be in snake_case or camelCase
 * This is a temporary solution until we can update the entire codebase to use consistent naming
 */

// Order related helpers
export const getOrderDate = (order: Order): string => order.orderDate || order.order_date;
export const getRequiredDate = (order: Order): string => order.requiredDate || order.required_date;
export const getDeliveryMethod = (order: Order): string => order.deliveryMethod || order.delivery_method;
export const getCustomerOrderNumber = (order: Order): string | undefined => 
  order.customerOrderNumber || order.customer_order_number;
export const getBatchNumber = (order: Order): string | undefined => 
  order.batchNumber || order.batch_number;
export const getBatchNumbers = (order: Order): string[] | undefined => 
  order.batchNumbers || order.batch_numbers;
export const getHasChanges = (order: Order): boolean | undefined => 
  order.hasChanges || order.has_changes;
export const getIsPicked = (order: Order): boolean | undefined => 
  order.isPicked || order.is_picked;
export const getTotalBlownPouches = (order: Order): number | undefined => 
  order.totalBlownPouches || order.total_blown_pouches;
export const getPickedBy = (order: Order): string | undefined => 
  order.pickedBy || order.picked_by;
export const getPickedAt = (order: Order): string | undefined => 
  order.pickedAt || order.picked_at;
export const getIsModified = (order: Order): boolean | undefined => 
  order.isModified || order.is_modified;
export const getFromStandingOrder = (order: Order): string | undefined => 
  order.fromStandingOrder || order.from_standing_order;
export const getPickingInProgress = (order: Order): boolean | undefined => 
  order.pickingInProgress || order.picking_in_progress;
export const getPickingProgress = (order: Order): any => 
  order.pickingProgress || order.picking_progress;
export const getBoxDistributions = (order: Order): Box[] | undefined => 
  order.boxDistributions || order.box_distributions;
export const getCompletedBoxes = (order: Order): number[] | undefined => 
  order.completedBoxes || order.completed_boxes;
export const getMissingItems = (order: Order): any[] | undefined => 
  order.missingItems || order.missing_items;
export const getInvoiced = (order: Order): boolean | undefined => 
  order.invoiced;
export const getInvoiceNumber = (order: Order): string | undefined => 
  order.invoiceNumber || order.invoice_number;
export const getInvoiceDate = (order: Order): string | undefined => 
  order.invoiceDate || order.invoice_date;

// Order item related helpers
export const getProductId = (item: OrderItem): string => 
  item.productId || item.product_id;
export const getOrderId = (item: OrderItem): string => 
  item.orderId || item.order_id;
export const getUnavailableQuantity = (item: OrderItem): number | undefined => 
  item.unavailableQuantity || item.unavailable_quantity;
export const getIsUnavailable = (item: OrderItem): boolean | undefined => 
  item.isUnavailable || item.is_unavailable;
export const getBlownPouches = (item: OrderItem): number | undefined => 
  item.blownPouches || item.blown_pouches;
export const getBatchNumberItem = (item: OrderItem): string | undefined => 
  item.batchNumber || item.batch_number;
export const getMissingQuantity = (item: OrderItem): number | undefined => 
  item.missingQuantity || item.missing_quantity;
export const getPickedQuantity = (item: OrderItem): number | undefined => 
  item.pickedQuantity || item.picked_quantity;
export const getPickedWeight = (item: OrderItem): number | undefined => 
  item.pickedWeight || item.picked_weight;
export const getOriginalQuantity = (item: OrderItem): number | undefined => 
  item.originalQuantity || item.original_quantity;
export const getBoxNumber = (item: OrderItem): number | undefined => 
  item.boxNumber || item.box_number;
export const getManualWeight = (item: OrderItem): number | undefined => 
  item.manualWeight || item.manual_weight;

// Box related helpers
export const getBoxNumber = (box: Box): number => 
  box.boxNumber || box.box_number;
export const getBoxOrderId = (box: Box): string => 
  box.orderId || box.order_id;
