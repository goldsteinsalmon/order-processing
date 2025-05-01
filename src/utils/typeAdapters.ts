
import { Order, OrderItem } from "@/types";

/**
 * Adapts snake_case property names to camelCase for components
 */
export function adaptOrderToCamelCase(order: Order): any {
  if (!order) return null;
  
  return {
    ...order,
    orderDate: order.order_date,
    deliveryMethod: order.delivery_method,
    requiredDate: order.required_date,
    customerOrderNumber: order.customer_order_number,
    pickedBy: order.picked_by,
    pickedAt: order.picked_at,
    isPicked: order.is_picked,
    totalBlownPouches: order.total_blown_pouches,
    isModified: order.is_modified,
    hasChanges: order.has_changes,
    fromStandingOrder: order.from_standing_order,
    pickingInProgress: order.picking_in_progress,
    boxDistributions: order.box_distributions,
    completedBoxes: order.completed_boxes,
    missingItems: order.missing_items,
    invoiceDate: order.invoice_date,
    invoiceNumber: order.invoice_number,
    batchNumber: order.batch_number,
    batchNumbers: order.batch_numbers,
    items: order.items?.map(adaptOrderItemToCamelCase)
  };
}

export function adaptOrderItemToCamelCase(item: OrderItem): any {
  if (!item) return null;
  
  return {
    ...item,
    orderId: item.order_id,
    productId: item.product_id,
    originalQuantity: item.original_quantity,
    unavailableQuantity: item.unavailable_quantity,
    isUnavailable: item.is_unavailable,
    blownPouches: item.blown_pouches,
    batchNumber: item.batch_number,
    missingQuantity: item.missing_quantity,
    pickedQuantity: item.picked_quantity,
    pickedWeight: item.picked_weight,
    boxNumber: item.box_number,
    manualWeight: item.manual_weight
  };
}

/**
 * Adapts camelCase property names to snake_case for database
 */
export function adaptOrderToSnakeCase(order: any): Order {
  if (!order) return null;
  
  return {
    ...order,
    order_date: order.orderDate || order.order_date,
    delivery_method: order.deliveryMethod || order.delivery_method,
    required_date: order.requiredDate || order.required_date,
    customer_order_number: order.customerOrderNumber || order.customer_order_number,
    picked_by: order.pickedBy || order.picked_by,
    picked_at: order.pickedAt || order.picked_at,
    is_picked: order.isPicked || order.is_picked,
    total_blown_pouches: order.totalBlownPouches || order.total_blown_pouches,
    is_modified: order.isModified || order.is_modified,
    has_changes: order.hasChanges || order.has_changes,
    from_standing_order: order.fromStandingOrder || order.from_standing_order,
    picking_in_progress: order.pickingInProgress || order.picking_in_progress,
    box_distributions: order.boxDistributions || order.box_distributions,
    completed_boxes: order.completedBoxes || order.completed_boxes,
    missing_items: order.missingItems || order.missing_items,
    invoice_date: order.invoiceDate || order.invoice_date,
    invoice_number: order.invoiceNumber || order.invoice_number,
    batch_number: order.batchNumber || order.batch_number,
    batch_numbers: order.batchNumbers || order.batch_numbers,
    items: order.items?.map(adaptOrderItemToSnakeCase)
  };
}

export function adaptOrderItemToSnakeCase(item: any): OrderItem {
  if (!item) return null;
  
  return {
    ...item,
    order_id: item.orderId || item.order_id,
    product_id: item.productId || item.product_id,
    original_quantity: item.originalQuantity || item.original_quantity,
    unavailable_quantity: item.unavailableQuantity || item.unavailable_quantity,
    is_unavailable: item.isUnavailable || item.is_unavailable,
    blown_pouches: item.blownPouches || item.blown_pouches,
    batch_number: item.batchNumber || item.batch_number,
    missing_quantity: item.missingQuantity || item.missing_quantity,
    picked_quantity: item.pickedQuantity || item.picked_quantity,
    picked_weight: item.pickedWeight || item.picked_weight,
    box_number: item.boxNumber || item.box_number,
    manual_weight: item.manualWeight || item.manual_weight
  };
}
