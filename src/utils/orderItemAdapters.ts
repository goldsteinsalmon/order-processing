
import { OrderItem } from "@/types/order-types";

/**
 * Convert OrderItem from snake_case (database) to camelCase (UI)
 */
export const adaptOrderItemToCamelCase = (item: any): OrderItem => {
  if (!item) return null as any;
  
  // Only include originalQuantity if it's different from current quantity
  const hasActualQuantityChange = 
    item.original_quantity !== undefined && 
    item.original_quantity !== null &&
    item.original_quantity !== item.quantity;
  
  return {
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    product: item.product,
    quantity: item.quantity,
    unavailableQuantity: item.unavailable_quantity,
    isUnavailable: item.is_unavailable,
    blownPouches: item.blown_pouches,
    // Always ensure batchNumber and checked are correctly mapped
    batchNumber: item.batch_number || "",
    checked: !!item.checked,
    missingQuantity: item.missing_quantity,
    pickedQuantity: item.picked_quantity,
    pickedWeight: item.picked_weight,
    // Only include originalQuantity if there was an actual change
    originalQuantity: hasActualQuantityChange ? item.original_quantity : undefined,
    boxNumber: item.box_number,
    manualWeight: item.manual_weight
  };
};

/**
 * Convert OrderItem from camelCase (UI) to snake_case (database)
 */
export const adaptOrderItemToSnakeCase = (item: OrderItem): any => {
  if (!item) return null as any;
  
  // Only include original_quantity if explicitly set and different
  const hasActualQuantityChange = 
    item.originalQuantity !== undefined &&
    item.originalQuantity !== null &&
    item.originalQuantity !== item.quantity;
  
  const result = {
    id: item.id,
    order_id: item.orderId,
    product_id: item.productId,
    quantity: item.quantity,
    unavailable_quantity: item.unavailableQuantity,
    is_unavailable: item.isUnavailable,
    blown_pouches: item.blownPouches,
    batch_number: item.batchNumber || "",
    checked: !!item.checked, // Ensure this is always a boolean
    missing_quantity: item.missingQuantity,
    picked_quantity: item.pickedQuantity,
    picked_weight: item.pickedWeight,
    box_number: item.boxNumber,
    manual_weight: item.manualWeight
  };
  
  // Only add original_quantity if there was an actual change
  if (hasActualQuantityChange) {
    result['original_quantity'] = item.originalQuantity;
  }
  
  return result;
};
