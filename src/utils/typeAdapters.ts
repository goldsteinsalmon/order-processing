import { Customer, Order, Product, Return, BatchUsage } from "@/types";

// Convert Customer from snake_case (database) to camelCase (UI)
export const adaptCustomerToCamelCase = (customer: any): Customer => {
  if (!customer) return null as any;
  
  const result = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    type: customer.type,
    accountNumber: customer.account_number || "",
    onHold: customer.on_hold || false,
    holdReason: customer.hold_reason,
    needsDetailedBoxLabels: customer.needs_detailed_box_labels || false
  };

  console.log("adaptCustomerToCamelCase input:", customer);
  console.log("adaptCustomerToCamelCase output:", result);
  return result;
};

// Convert Customer from camelCase (UI) to snake_case (database)
export const adaptCustomerToSnakeCase = (customer: Customer): any => {
  if (!customer) return null as any;
  
  const result = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    type: customer.type,
    account_number: customer.accountNumber || "",
    on_hold: customer.onHold || false,
    hold_reason: customer.holdReason,
    needs_detailed_box_labels: customer.needsDetailedBoxLabels || false
  };
  
  console.log("adaptCustomerToSnakeCase input:", customer);
  console.log("adaptCustomerToSnakeCase output:", result);
  return result;
};

// Convert Order from snake_case (database) to camelCase (UI)
export const adaptOrderToCamelCase = (order: any): Order => {
  return {
    id: order.id,
    customer_id: order.customer_id,
    customer: order.customer ? adaptCustomerToCamelCase(order.customer) : undefined,
    customer_order_number: order.customer_order_number,
    order_date: order.order_date,
    required_date: order.required_date,
    delivery_method: order.delivery_method,
    notes: order.notes,
    status: order.status,
    created: order.created,
    updated: order.updated,
    picker: order.picker,
    picked_by: order.picked_by,
    picked_at: order.picked_at,
    is_picked: order.is_picked,
    total_blown_pouches: order.total_blown_pouches,
    is_modified: order.is_modified,
    batch_number: order.batch_number,
    batch_numbers: order.batch_numbers,
    has_changes: order.has_changes,
    from_standing_order: order.from_standing_order,
    picking_in_progress: order.picking_in_progress,
    picking_progress: order.picking_progress,
    box_distributions: order.box_distributions,
    completed_boxes: order.completed_boxes,
    missing_items: order.missing_items,
    invoiced: order.invoiced,
    invoice_number: order.invoice_number,
    invoice_date: order.invoice_date,
    changes: order.changes,
    savedBoxes: order.savedBoxes,
    batchSummaries: order.batchSummaries,
    items: order.items
  };
};

// Convert Order from camelCase (UI) to snake_case (database)
export const adaptOrderToSnakeCase = (order: Order): any => {
  return {
    id: order.id,
    customer_id: order.customer_id,
    customer_order_number: order.customer_order_number,
    order_date: order.order_date,
    required_date: order.required_date,
    delivery_method: order.delivery_method,
    notes: order.notes,
    status: order.status,
    created: order.created,
    updated: order.updated,
    picker: order.picker,
    picked_by: order.picked_by,
    picked_at: order.picked_at,
    is_picked: order.is_picked,
    total_blown_pouches: order.total_blown_pouches,
    is_modified: order.is_modified,
    batch_number: order.batch_number,
    batch_numbers: order.batch_numbers,
    has_changes: order.has_changes,
    from_standing_order: order.from_standing_order,
    picking_in_progress: order.picking_in_progress,
    picking_progress: order.picking_progress,
    invoiced: order.invoiced,
    invoice_number: order.invoice_number,
    invoice_date: order.invoice_date
  };
};

// Convert Product from snake_case (database) to camelCase (UI)
export const adaptProductToCamelCase = (product: any): Product => {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    stock_level: product.stock_level,
    weight: product.weight,
    requires_weight_input: product.requires_weight_input,
    unit: product.unit,
    required: product.required
  };
};

// Convert Product from camelCase (UI) to snake_case (database)
export const adaptProductToSnakeCase = (product: Product): any => {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    stock_level: product.stock_level,
    weight: product.weight,
    requires_weight_input: product.requires_weight_input,
    unit: product.unit,
    required: product.required
  };
};

// Convert BatchUsage from snake_case (database) to camelCase (UI)
export const adaptBatchUsageToCamelCase = (batchUsage: any): BatchUsage => {
  return {
    id: batchUsage.id,
    batch_number: batchUsage.batch_number,
    product_id: batchUsage.product_id,
    product_name: batchUsage.product_name,
    total_weight: batchUsage.total_weight,
    used_weight: batchUsage.used_weight,
    orders_count: batchUsage.orders_count,
    first_used: batchUsage.first_used,
    last_used: batchUsage.last_used,
    usedBy: batchUsage.usedBy
  };
};

// Convert BatchUsage from camelCase (UI) to snake_case (database)
export const adaptBatchUsageToSnakeCase = (batchUsage: BatchUsage): any => {
  return {
    id: batchUsage.id,
    batch_number: batchUsage.batch_number,
    product_id: batchUsage.product_id,
    product_name: batchUsage.product_name,
    total_weight: batchUsage.total_weight,
    used_weight: batchUsage.used_weight,
    orders_count: batchUsage.orders_count,
    first_used: batchUsage.first_used,
    last_used: batchUsage.last_used,
    usedBy: batchUsage.usedBy
  };
};
