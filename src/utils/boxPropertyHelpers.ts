
import { Box, BoxItem } from "@/types";
import { OrderBase } from "@/types/orderBaseTypes";

/**
 * Safely get the box distributions from an order, handling both camelCase and snake_case properties
 */
export const getBoxDistributions = (order: OrderBase): Box[] | undefined => {
  return order.boxDistributions || order.box_distributions;
};

/**
 * Safely get the completed boxes from an order, handling both camelCase and snake_case properties
 */
export const getCompletedBoxes = (order: OrderBase): number[] | undefined => {
  return order.completedBoxes || order.completed_boxes;
};

/**
 * Safely get the saved boxes from an order, handling both camelCase and snake_case properties
 */
export const getSavedBoxes = (order: OrderBase): number[] | undefined => {
  return order.savedBoxes || order.saved_boxes;
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
 * Check if a box is completed
 */
export const isBoxCompleted = (order: OrderBase, boxNumber: number): boolean => {
  const completedBoxes = getCompletedBoxes(order);
  return completedBoxes ? completedBoxes.includes(boxNumber) : false;
};

/**
 * Check if a box is saved
 */
export const isBoxSaved = (order: OrderBase, boxNumber: number): boolean => {
  const savedBoxes = getSavedBoxes(order);
  return savedBoxes ? savedBoxes.includes(boxNumber) : false;
};

/**
 * Get total number of boxes for an order
 */
export const getTotalBoxCount = (order: OrderBase): number => {
  const boxDistributions = getBoxDistributions(order);
  return boxDistributions ? boxDistributions.length : 0;
};

/**
 * Get completed box count for an order
 */
export const getCompletedBoxCount = (order: OrderBase): number => {
  const completedBoxes = getCompletedBoxes(order);
  return completedBoxes ? completedBoxes.length : 0;
};
