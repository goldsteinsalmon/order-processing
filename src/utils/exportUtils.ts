
import Papa from "papaparse";
import { Order, OrderItem } from "@/types";
import { format } from "date-fns";
import * as XLSX from "xlsx";

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
      // Check if the item has either manualWeight or pickedWeight
      const hasWeight = (item.manualWeight && item.manualWeight > 0) || 
                        (item.pickedWeight && item.pickedWeight > 0);
      
      // Determine which weight to use - prioritize manualWeight if available
      let weightValue = "";
      if (hasWeight) {
        // Prioritize manualWeight, fall back to pickedWeight
        const weight = item.manualWeight && item.manualWeight > 0 
          ? item.manualWeight 
          : item.pickedWeight;
        
        // Format weight to kg with 3 decimal places
        weightValue = `${(weight! / 1000).toFixed(3)} kg`;
      }
      
      // For the quantity column: show quantity only if there's no weight
      const quantityValue = hasWeight ? "" : item.quantity.toString();
      
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

// Helper function to get the weight of an item, considering all weight sources
// and prioritizing manual weight if available
const getItemWeight = (item: OrderItem): number => {
  if (item.manualWeight && item.manualWeight > 0) {
    return item.manualWeight;
  }
  
  if (item.pickedWeight && item.pickedWeight > 0) {
    return item.pickedWeight;
  }
  
  return 0;
};

export const generateCsvFilename = (): string => {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm");
  return `orders-export_${date}.csv`;
};

// New function to export orders to Excel
export const exportOrdersToExcel = (orders: Order[], filename = "orders-export.xlsx"): void => {
  // Group rows by order for better readability
  const workbook = XLSX.utils.book_new();
  
  // Create a worksheet for all orders (flat format similar to CSV)
  const rows: ExportOrderRow[] = [];
  
  orders.forEach(order => {
    order.items.forEach(item => {
      // Check if the item has either manualWeight or pickedWeight
      const hasWeight = (item.manualWeight && item.manualWeight > 0) || 
                       (item.pickedWeight && item.pickedWeight > 0);
      
      // Determine which weight to use - prioritize manualWeight if available
      let weightValue = "";
      if (hasWeight) {
        // Prioritize manualWeight, fall back to pickedWeight
        const weight = item.manualWeight && item.manualWeight > 0 
          ? item.manualWeight 
          : item.pickedWeight;
        
        // Format weight to kg with 3 decimal places (for display)
        weightValue = `${(weight! / 1000).toFixed(3)}`;
      }
      
      // For the quantity column: show quantity only if there's no weight
      const quantityValue = hasWeight ? "" : item.quantity.toString();
      
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
  
  // Add the flat data worksheet
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, ws, "All Orders");
  
  // Create a second worksheet with orders grouped by customer
  const ordersByCustomer: Record<string, any[]> = {};
  
  orders.forEach(order => {
    const customerKey = `${order.customer.name} (${order.id.substring(0, 8)})`;
    
    if (!ordersByCustomer[customerKey]) {
      ordersByCustomer[customerKey] = [];
    }
    
    order.items.forEach(item => {
      const hasWeight = (item.manualWeight && item.manualWeight > 0) || 
                        (item.pickedWeight && item.pickedWeight > 0);
      
      const weight = item.manualWeight && item.manualWeight > 0 
        ? item.manualWeight 
        : item.pickedWeight;
        
      const weightValue = hasWeight ? (weight! / 1000).toFixed(3) : "";
      const quantityValue = hasWeight ? "" : item.quantity;
      
      ordersByCustomer[customerKey].push({
        'Order ID': order.id.substring(0, 8),
        'Customer Order #': order.customerOrderNumber || "",
        'SKU': item.product.sku,
        'Product': item.product.name,
        'Quantity': quantityValue,
        'Weight (kg)': weightValue,
      });
    });
  });
  
  // Add each customer as a separate worksheet
  Object.entries(ordersByCustomer).forEach(([customer, items]) => {
    const customerWs = XLSX.utils.json_to_sheet(items);
    XLSX.utils.book_append_sheet(workbook, customerWs, customer.substring(0, 31)); // Excel worksheet name limit
  });
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, filename);
};

export const generateExcelFilename = (): string => {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm");
  return `orders-export_${date}.xlsx`;
};
