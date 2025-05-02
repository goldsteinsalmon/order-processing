import { OrderBase } from "@/types/orderBaseTypes";

/**
 * Safely get the picker who picked an order, handling both camelCase and snake_case properties
 */
export const getPickedBy = (order: OrderBase): string | undefined => {
  return order.pickedBy || order.picked_by;
};

/**
 * Safely get the time when an order was picked, handling both camelCase and snake_case properties
 */
export const getPickedAt = (order: OrderBase): string | undefined => {
  return order.pickedAt || order.picked_at;
};

/**
 * Safely get whether an order is picked, handling both camelCase and snake_case properties
 */
export const getIsPicked = (order: OrderBase): boolean => {
  return order.isPicked || order.is_picked || false;
};

/**
 * Safely get whether order picking is in progress, handling both camelCase and snake_case properties
 */
export const getPickingInProgress = (order: OrderBase): boolean => {
  return order.pickingInProgress || order.picking_in_progress || false;
};

/**
 * Safely get the picking progress object from an order, handling both camelCase and snake_case properties
 */
export const getPickingProgress = (order: OrderBase): any => {
  return order.pickingProgress || order.picking_progress;
};

/**
 * Safely get the picker assigned to an order, handling both camelCase and snake_case properties
 */
export const getPicker = (order: OrderBase): string | undefined => {
  return order.picker;
};
