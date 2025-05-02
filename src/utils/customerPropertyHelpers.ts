
import { Customer } from "@/types";

/**
 * Safely get the account number from a customer, handling both camelCase and snake_case properties
 */
export const getAccountNumber = (customer: Customer): string => {
  return customer.accountNumber || "";
};

/**
 * Safely get whether a customer needs detailed box labels, handling both camelCase and snake_case properties
 */
export const getNeedsDetailedBoxLabels = (customer: Customer): boolean => {
  return customer.needsDetailedBoxLabels === true;
};

/**
 * Safely get whether a customer is on hold, handling both camelCase and snake_case properties
 */
export const getOnHold = (customer: Customer): boolean => {
  return customer.onHold === true;
};

/**
 * Safely get the hold reason for a customer, handling both camelCase and snake_case properties
 */
export const getHoldReason = (customer: Customer): string => {
  // Only return the hold reason if the customer is on hold
  return getOnHold(customer) ? (customer.holdReason || "") : "";
};

/**
 * Check customer properties and log any issues for debugging
 */
export const debugCustomerProperties = (customer: Customer): void => {
  console.log("Customer debug:", {
    id: customer.id,
    name: customer.name,
    accountNumber: getAccountNumber(customer),
    onHold: getOnHold(customer),
    holdReason: getHoldReason(customer),
    needsDetailedBoxLabels: getNeedsDetailedBoxLabels(customer)
  });
};
