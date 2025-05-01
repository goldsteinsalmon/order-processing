
import { Order, OrderItem, Box, BoxItem, BatchSummary, Customer } from "@/types";

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
    boxDistributions: order.box_distributions?.map(adaptBoxToCamelCase),
    completedBoxes: order.completed_boxes,
    missingItems: order.missing_items,
    invoiceDate: order.invoice_date,
    invoiceNumber: order.invoice_number,
    batchNumber: order.batch_number,
    batchNumbers: order.batch_numbers,
    pickingProgress: order.picking_progress,
    savedBoxes: order.savedBoxes,
    items: order.items?.map(adaptOrderItemToCamelCase),
    // Adapt batchSummaries if they exist
    batchSummaries: order.batch_summaries?.map(bs => ({
      batchNumber: bs.batch_number,
      totalWeight: bs.total_weight
    }))
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
    manualWeight: item.manual_weight,
    product: item.product ? adaptProductToCamelCase(item.product) : undefined
  };
}

/**
 * Adapts Product to use camelCase property names
 */
export function adaptProductToCamelCase(product: any): any {
  if (!product) return null;
  
  return {
    ...product,
    stockLevel: product.stock_level,
    requiresWeightInput: product.requires_weight_input
  };
}

/**
 * Adapts Customer to use camelCase property names
 */
export function adaptCustomerToCamelCase(customer: Customer): any {
  if (!customer) return null;
  
  return {
    ...customer,
    accountNumber: customer.account_number,
    onHold: customer.on_hold,
    holdReason: customer.hold_reason,
    needsDetailedBoxLabels: customer.needs_detailed_box_labels
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
    box_distributions: order.boxDistributions?.map(adaptBoxToSnakeCase) || order.box_distributions,
    completed_boxes: order.completedBoxes || order.completed_boxes,
    missing_items: order.missingItems?.map(adaptMissingItemToSnakeCase) || order.missing_items,
    invoice_date: order.invoiceDate || order.invoice_date,
    invoice_number: order.invoiceNumber || order.invoice_number,
    batch_number: order.batchNumber || order.batch_number,
    batch_numbers: order.batchNumbers || order.batch_numbers,
    picking_progress: order.pickingProgress || order.picking_progress,
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
    manual_weight: item.manualWeight || item.manual_weight,
    product: item.product ? adaptProductToSnakeCase(item.product) : undefined
  };
}

/**
 * Adapts Product to use snake_case property names
 */
export function adaptProductToSnakeCase(product: any): any {
  if (!product) return null;
  
  return {
    ...product,
    stock_level: product.stockLevel || product.stock_level,
    requires_weight_input: product.requiresWeightInput || product.requires_weight_input
  };
}

/**
 * Adapts Customer to use snake_case property names
 */
export function adaptCustomerToSnakeCase(customer: any): Customer {
  if (!customer) return null;
  
  return {
    ...customer,
    account_number: customer.accountNumber || customer.account_number,
    on_hold: customer.onHold || customer.on_hold,
    hold_reason: customer.holdReason || customer.hold_reason,
    needs_detailed_box_labels: customer.needsDetailedBoxLabels || customer.needs_detailed_box_labels
  };
}

/**
 * Helper functions for box adapters
 */
export function adaptBoxToCamelCase(box: Box): any {
  if (!box) return null;
  
  return {
    ...box,
    orderId: box.order_id,
    boxNumber: box.box_number,
    batchNumber: box.batch_number,
    items: box.items?.map(adaptBoxItemToCamelCase)
  };
}

export function adaptBoxToSnakeCase(box: any): Box {
  if (!box) return null;
  
  // Generate an id if one doesn't exist (for new boxes)
  const boxId = box.id || crypto.randomUUID();
  
  return {
    id: boxId,
    order_id: box.orderId || box.order_id || '',
    box_number: box.boxNumber || box.box_number,
    batch_number: box.batchNumber || box.batch_number,
    completed: box.completed,
    printed: box.printed,
    items: box.items?.map(adaptBoxItemToSnakeCase) || []
  };
}

export function adaptBoxItemToCamelCase(item: BoxItem): any {
  if (!item) return null;
  
  return {
    ...item,
    boxId: item.box_id,
    productId: item.product_id,
    productName: item.product_name,
    batchNumber: item.batch_number
  };
}

export function adaptBoxItemToSnakeCase(item: any): BoxItem {
  if (!item) return null;
  
  // Generate an id if one doesn't exist (for new box items)
  const itemId = item.id || crypto.randomUUID();
  
  return {
    id: itemId,
    box_id: item.boxId || item.box_id || '',
    product_id: item.productId || item.product_id,
    product_name: item.productName || item.product_name,
    quantity: item.quantity,
    weight: item.weight || 0,
    batch_number: item.batchNumber || item.batch_number
  };
}

export function adaptMissingItemToSnakeCase(item: any): any {
  if (!item) return null;
  
  return {
    ...item,
    order_id: item.orderId || item.order_id,
    product_id: item.productId || item.product_id
  };
}

export function adaptMissingItemToCamelCase(item: any): any {
  if (!item) return null;
  
  return {
    ...item,
    orderId: item.order_id,
    productId: item.product_id
  };
}

export function adaptBatchSummaryToCamelCase(summary: any): BatchSummary {
  if (!summary) return null;
  
  return {
    batchNumber: summary.batch_number,
    totalWeight: summary.total_weight
  };
}

export function adaptBatchSummaryToSnakeCase(summary: BatchSummary): any {
  if (!summary) return null;
  
  return {
    batch_number: summary.batchNumber,
    total_weight: summary.totalWeight
  };
}
