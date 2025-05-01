
import { Order, OrderItem } from "@/types";

// Helper function to get the weight of an item, considering all weight sources
// and prioritizing manual weight if available
export const getItemWeight = (item: OrderItem): number => {
  if (item.manualWeight && item.manualWeight > 0) {
    return item.manualWeight;
  }
  
  if (item.pickedWeight && item.pickedWeight > 0) {
    return item.pickedWeight;
  }
  
  return 0;
};
