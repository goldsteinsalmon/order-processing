
import { Order, StandingOrder } from "@/types";

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
