
import Papa from "papaparse";
import { Order, OrderItem } from "@/types";
import { format, parseISO } from "date-fns";

interface ExportOrderRow {
  accountNumber: string;
  customerName: string;
  customerOrderNumber: string;
  productSku: string;
  productName: string;
  quantity: number | string;
  weight: string;
}

export const exportOrdersToCsv = (orders: Order[], filename = "orders-export.csv"): void => {
  // Transform orders into flat rows for CSV export
  const rows: ExportOrderRow[] = [];
  
  orders.forEach(order => {
    // For each order, create a row for each product
    order.items.forEach(item => {
      const productWeight = getItemWeight(item);
      
      // Determine if we should show quantity or not
      const quantity = productWeight > 0 && item.manualWeight ? "" : item.quantity;
      
      rows.push({
        accountNumber: order.customer.accountNumber || "",
        customerName: order.customer.name,
        customerOrderNumber: order.customerOrderNumber || "",
        productSku: item.product.sku,
        productName: item.product.name,
        quantity: quantity,
        weight: productWeight > 0 ? `${(productWeight / 1000).toFixed(2)} kg` : "",
      });
    });
  });
  
  // Use Papa to convert to CSV
  const csv = Papa.unparse(rows, {
    header: true,
    delimiter: ",",
    newline: "\r\n"
  });
  
  // Create and trigger download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper to calculate item weight considering all possible sources
const getItemWeight = (item: OrderItem): number => {
  if (item.manualWeight && item.manualWeight > 0) {
    return item.manualWeight;
  }
  
  if (item.pickedWeight && item.pickedWeight > 0) {
    return item.pickedWeight;
  }
  
  // If product has a standard weight, calculate total based on quantity
  if (item.product.weight) {
    return item.product.weight * item.quantity;
  }
  
  return 0;
};

// Helper to get batch numbers as a formatted string
const getBatchNumbersString = (order: Order): string => {
  if (order.batchNumbers && order.batchNumbers.length > 0) {
    return order.batchNumbers.join(", ");
  }
  
  if (order.batchNumber) {
    return order.batchNumber;
  }
  
  // Check boxes for batch numbers
  if (order.boxDistributions) {
    const batchSet = new Set<string>();
    order.boxDistributions.forEach(box => {
      if (box.batchNumber) {
        batchSet.add(box.batchNumber);
      }
      
      box.items.forEach(item => {
        if (item.batchNumber) {
          batchSet.add(item.batchNumber);
        }
      });
    });
    
    if (batchSet.size > 0) {
      return Array.from(batchSet).join(", ");
    }
  }
  
  return "";
};

export const generateCsvFilename = (): string => {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm");
  return `orders-export_${date}.csv`;
};
