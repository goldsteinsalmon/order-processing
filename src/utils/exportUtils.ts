
import Papa from "papaparse";
import { Order, OrderItem } from "@/types";
import { format } from "date-fns";

interface ExportOrderRow {
  accountNumber: string;
  customerName: string;
  customerOrderNumber: string;
  productSku: string;
  productName: string;
  quantity: string;
  weight: string;
}

export const exportOrdersToCsv = (orders: Order[], filename = "orders-export.csv"): void => {
  // Transform orders into flat rows for CSV export
  const rows: ExportOrderRow[] = [];
  
  orders.forEach(order => {
    // For each order, create a row for each product
    order.items.forEach(item => {
      const productWeight = getItemWeight(item);
      
      // For the quantity column: show quantity only if there's no manual weight
      // For the weight column: show weight only if there is weight data
      const quantityValue = productWeight > 0 && item.manualWeight ? "" : item.quantity.toString();
      const weightValue = productWeight > 0 ? `${(productWeight / 1000).toFixed(2)} kg` : "";
      
      rows.push({
        accountNumber: order.customer.accountNumber || "",
        customerName: order.customer.name,
        customerOrderNumber: order.customerOrderNumber || "",
        productSku: item.product.sku,
        productName: item.product.name,
        quantity: quantityValue,
        weight: weightValue,
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

export const generateCsvFilename = (): string => {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm");
  return `orders-export_${date}.csv`;
};
