
import { OrderItem } from "@/types/order-types";

/**
 * Convert OrderItem from snake_case (database) to camelCase (UI)
 */
export const adaptOrderItemToCamelCase = (item: any): OrderItem => {
  if (!item) return null as any;
  
  return {
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    product: item.product,
    quantity: item.quantity,
    unavailableQuantity: item.unavailable_quantity,
    isUnavailable: item.is_unavailable,
    blownPouches: item.blown_pouches,
    batchNumber: item.batch_number,
    checked: item.checked,
    missingQuantity: item.missing_quantity,
    pickedQuantity: item.picked_quantity,
    pickedWeight: item.picked_weight,
    originalQuantity: item.original_quantity,
    boxNumber: item.box_number,
    manualWeight: item.manual_weight
  };
};

/**
 * Convert OrderItem from camelCase (UI) to snake_case (database)
 */
export const adaptOrderItemToSnakeCase = (item: OrderItem): any => {
  if (!item) return null as any;
  
  return {
    id: item.id,
    order_id: item.orderId,
    product_id: item.productId,
    quantity: item.quantity,
    unavailable_quantity: item.unavailableQuantity,
    is_unavailable: item.isUnavailable,
    blown_pouches: item.blownPouches,
    batch_number: item.batchNumber,
    checked: item.checked,
    missing_quantity: item.missingQuantity,
    picked_quantity: item.pickedQuantity,
    picked_weight: item.pickedWeight,
    original_quantity: item.originalQuantity,
    box_number: item.boxNumber,
    manual_weight: item.manualWeight
  };
};
