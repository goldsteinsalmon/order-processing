
// If this file doesn't exist, we'll create it
// If it does, we'll add this function to it

export function getOrderNumber(order: any): number | string {
  return order.orderNumber || 
         order.order_number || 
         (typeof order.id === 'string' ? `#${order.id.substring(0, 8)}` : order.id);
}

export function getOrderDate(order: any): string | null {
  return order.orderDate || order.order_date || null;
}

export function getDeliveryMethod(order: any): string {
  return order.deliveryMethod || order.delivery_method || "N/A";
}

export function getCustomerOrderNumber(order: any): string | null {
  return order.customerOrderNumber || order.customer_order_number || null;
}

export function getHasChanges(order: any): boolean {
  return order.hasChanges || order.has_changes || false;
}

export function getMissingItems(order: any): any[] | null {
  return order.missingItems || order.missing_items || null;
}

export function getCompletedBoxes(order: any): any[] | null {
  return order.completedBoxes || order.completed_boxes || null;
}

export function getBoxDistributions(order: any): any[] | null {
  return order.boxDistributions || order.box_distributions || null;
}

export function getPickingInProgress(order: any): boolean {
  return order.pickingInProgress || order.picking_in_progress || false;
}

export function getPickedBy(order: any): string | null {
  return order.pickedBy || order.picked_by || null;
}

export function getPickedAt(order: any): string | null {
  return order.pickedAt || order.picked_at || null;
}
