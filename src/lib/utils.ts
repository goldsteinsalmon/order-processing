
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Customer adapter functions
export const adaptCustomerToCamelCase = (customer: any) => {
  if (!customer) return null;
  
  return {
    ...customer,
    accountNumber: customer.account_number || "",
    onHold: customer.on_hold || false,
    holdReason: customer.hold_reason || undefined,
    needsDetailedBoxLabels: customer.needs_detailed_box_labels || false,
  };
};

export const adaptCustomerToSnakeCase = (customer: any) => {
  if (!customer) return null;
  
  const result: any = {
    ...customer,
    account_number: customer.accountNumber || "",
    on_hold: customer.onHold || false,
    hold_reason: customer.holdReason || undefined,
    needs_detailed_box_labels: customer.needsDetailedBoxLabels || false,
  };
  
  // Remove camelCase properties to prevent duplicates
  delete result.accountNumber;
  delete result.onHold;
  delete result.holdReason;
  delete result.needsDetailedBoxLabels;
  
  return result;
};
