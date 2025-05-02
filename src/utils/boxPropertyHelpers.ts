
import { OrderBase } from "@/types/orderBaseTypes";
import { Box } from "@/types";

/**
 * Safely get box distributions from an order, handling both camelCase and snake_case properties
 */
export const getBoxDistributions = (order: OrderBase): Box[] | undefined => {
  return order.boxDistributions || order.box_distributions;
};

/**
 * Safely get completed boxes from an order, handling both camelCase and snake_case properties
 */
export const getCompletedBoxes = (order: OrderBase): number[] | undefined => {
  return order.completedBoxes || order.completed_boxes;
};

/**
 * Safely get saved boxes from an order, handling both camelCase and snake_case properties
 */
export const getSavedBoxes = (order: OrderBase): number[] | undefined => {
  return order.savedBoxes || order.saved_boxes || [];
};

/**
 * Calculate the total number of boxes in an order
 */
export const getTotalBoxCount = (order: OrderBase): number => {
  const boxes = getBoxDistributions(order);
  return boxes?.length || 0;
};

/**
 * Get the next box number that needs to be processed
 */
export const getNextBoxToProcess = (order: OrderBase): number | null => {
  const boxes = getBoxDistributions(order);
  const completedBoxes = getCompletedBoxes(order) || [];
  
  if (!boxes || boxes.length === 0) return null;
  
  // Find the first box that hasn't been completed
  const nextBox = boxes.find(box => !completedBoxes.includes(box.boxNumber));
  return nextBox ? nextBox.boxNumber : null;
};

/**
 * Safely get batch number from a box, handling both camelCase and snake_case properties
 */
export const getBoxBatchNumber = (box: any): string | undefined => {
  return box.batchNumber || box.batch_number;
};

/**
 * Safely get batch number from a box item, handling both camelCase and snake_case properties
 */
export const getBoxItemBatchNumber = (item: any): string | undefined => {
  return item.batchNumber || item.batch_number;
};
