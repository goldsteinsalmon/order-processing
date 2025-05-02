
import { Customer } from "@/types";

/**
 * Safely get the account number from a customer, handling both camelCase and snake_case properties
 */
export const getAccountNumber = (customer: Customer): string | undefined => {
  return customer.accountNumber || customer.account_number;
};

/**
 * Safely get whether a customer needs detailed box labels, handling both camelCase and snake_case properties
 */
export const getNeedsDetailedBoxLabels = (customer: Customer): boolean => {
  return customer.needsDetailedBoxLabels || customer.needs_detailed_box_labels || false;
};

/**
 * Safely get whether a customer is on hold, handling both camelCase and snake_case properties
 */
export const getOnHold = (customer: Customer): boolean => {
  return customer.onHold || customer.on_hold || false;
};

/**
 * Safely get the hold reason for a customer, handling both camelCase and snake_case properties
 */
export const getHoldReason = (customer: Customer): string | undefined => {
  return customer.holdReason || customer.hold_reason;
};
