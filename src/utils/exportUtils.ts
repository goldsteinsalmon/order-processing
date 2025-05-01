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
      // We now ONLY care about manual weights - ignore standard product weights completely
      const hasManualWeight = item.manualWeight && item.manualWeight > 0;
      
      // For the quantity column: show quantity only if there's no manual weight
      // For the weight column: show weight only if there is manual weight data
      const quantityValue = hasManualWeight ? "" : item.quantity.toString();
      const weightValue = hasManualWeight ? `${(item.manualWeight! / 1000).toFixed(2)} kg` : "";
      
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

// This helper function is no longer needed as we're only concerned with manual weights
// and we access them directly in the main function
// Keeping the function for reference but it's not used
const getItemWeight = (item: OrderItem): number => {
  if (item.manualWeight && item.manualWeight > 0) {
    return item.manualWeight;
  }
  
  return 0;
};

export const generateCsvFilename = (): string => {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm");
  return `orders-export_${date}.csv`;
};
