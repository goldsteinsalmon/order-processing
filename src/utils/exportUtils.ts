
import { Order, OrderItem } from "@/types";

// Helper function to get the weight of an item, considering all weight sources
// and prioritizing manual weight if available
export const getItemWeight = (item: OrderItem): number => {
  if (item.manual_weight && item.manual_weight > 0) {
    return item.manual_weight;
  }
  
  if (item.picked_weight && item.picked_weight > 0) {
    return item.picked_weight;
  }
  
  return 0;
};

// Generate a filename with the current date for exports
export const generateCsvFilename = (): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `export-${date}-${time}`;
};

// We're keeping these functions for backward compatibility
export const exportOrdersToCsv = (orders: Order[], filename: string): void => {
  console.log(`Exporting ${orders.length} orders to file: ${filename}`);
  // This is now a placeholder as we're using PDF exports
};
