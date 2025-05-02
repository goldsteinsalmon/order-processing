import { Customer, Order, Product, Return, BatchUsage, OrderItem, Box, BoxItem, MissingItem, Complaint } from "@/types";

// Convert Customer from snake_case (database) to camelCase (UI)
export const adaptCustomerToCamelCase = (customer: any): Customer => {
  if (!customer) return null as any;
  
  const result = {
    id: customer.id,
    name: customer.name,
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    type: customer.type,
    accountNumber: customer.account_number || "",
    onHold: customer.on_hold === true, // Ensure boolean conversion
    holdReason: customer.hold_reason || "",
    needsDetailedBoxLabels: customer.needs_detailed_box_labels === true // Ensure boolean conversion
  };

  console.log("adaptCustomerToCamelCase - Input:", customer);
  console.log("adaptCustomerToCamelCase - Output:", result);
  console.log("adaptCustomerToCamelCase - Account number:", result.accountNumber || "EMPTY");
  console.log("adaptCustomerToCamelCase - On hold status:", result.onHold);
  
  return result;
};

// Convert Customer from camelCase (UI) to snake_case (database)
export const adaptCustomerToSnakeCase = (customer: Customer): any => {
  if (!customer) return null as any;
  
  const result = {
    id: customer.id,
    name: customer.name,
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    type: customer.type,
    account_number: customer.accountNumber || "",
    on_hold: customer.onHold === true, // Ensure boolean conversion
    hold_reason: customer.holdReason || "",
    needs_detailed_box_labels: customer.needsDetailedBoxLabels === true // Ensure boolean conversion
  };
  
  console.log("adaptCustomerToSnakeCase - Input:", customer);
  console.log("adaptCustomerToSnakeCase - Output:", result);
  console.log("adaptCustomerToSnakeCase - Account number:", result.account_number || "EMPTY");
  console.log("adaptCustomerToSnakeCase - On hold status:", result.on_hold);
  
  return result;
};

// Convert OrderItem from snake_case (database) to camelCase (UI)
export const adaptOrderItemToCamelCase = (item: any): OrderItem => {
  if (!item) return null as any;
  
  return {
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    product: item.product,
    quantity: item.quantity,
    unavailableQuantity: item.unavailable_quantity,
    isUnavailable: item.is_unavailable,
    blownPouches: item.blown_pouches,
    batchNumber: item.batch_number,
    checked: item.checked,
    missingQuantity: item.missing_quantity,
    pickedQuantity: item.picked_quantity,
    pickedWeight: item.picked_weight,
    originalQuantity: item.original_quantity,
    boxNumber: item.box_number,
    manualWeight: item.manual_weight
  };
};

// Convert OrderItem from camelCase (UI) to snake_case (database)
export const adaptOrderItemToSnakeCase = (item: OrderItem): any => {
  if (!item) return null as any;
  
  return {
    id: item.id,
    order_id: item.orderId,
    product_id: item.productId,
    quantity: item.quantity,
    unavailable_quantity: item.unavailableQuantity,
    is_unavailable: item.isUnavailable,
    blown_pouches: item.blownPouches,
    batch_number: item.batchNumber,
    checked: item.checked,
    missing_quantity: item.missingQuantity,
    picked_quantity: item.pickedQuantity,
    picked_weight: item.pickedWeight,
    original_quantity: item.originalQuantity,
    box_number: item.boxNumber,
    manual_weight: item.manualWeight
  };
};

// Convert Box from snake_case (database) to camelCase (UI)
export const adaptBoxToCamelCase = (box: any): Box => {
  if (!box) return null as any;
  
  return {
    id: box.id,
    orderId: box.order_id,
    boxNumber: box.box_number,
    batchNumber: box.batch_number,
    completed: box.completed,
    printed: box.printed,
    items: Array.isArray(box.items) ? box.items.map(adaptBoxItemToCamelCase) : []
  };
};

// Convert BoxItem from snake_case (database) to camelCase (UI)
export const adaptBoxItemToCamelCase = (item: any): BoxItem => {
  if (!item) return null as any;
  
  return {
    id: item.id,
    boxId: item.box_id,
    productId: item.product_id,
    productName: item.product_name,
    quantity: item.quantity,
    weight: item.weight,
    batchNumber: item.batch_number
  };
};

// Convert MissingItem from snake_case (database) to camelCase (UI)
export const adaptMissingItemToCamelCase = (item: any): MissingItem => {
  if (!item) return null as any;
  
  return {
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    quantity: item.quantity,
    date: item.date,
    status: item.status,
    product: item.product, // Pass through as-is; product should be handled separately if needed
    order: item.order // Pass through as-is; order should be handled separately if needed
  };
};

// Convert MissingItem from camelCase (UI) to snake_case (database)
export const adaptMissingItemToSnakeCase = (item: MissingItem): any => {
  if (!item) return null as any;
  
  return {
    id: item.id,
    order_id: item.orderId,
    product_id: item.productId,
    quantity: item.quantity,
    date: item.date,
    status: item.status
  };
};

// Convert Order from snake_case (database) to camelCase (UI)
export const adaptOrderToCamelCase = (order: any): Order => {
  if (!order) return null as any;
  
  const result: Order = {
    id: order.id,
    customerId: order.customer_id,
    customer: order.customer ? adaptCustomerToCamelCase(order.customer) : undefined,
    customerOrderNumber: order.customer_order_number,
    orderDate: order.order_date,
    requiredDate: order.required_date,
    deliveryMethod: order.delivery_method,
    notes: order.notes,
    status: order.status,
    created: order.created,
    updated: order.updated,
    picker: order.picker,
    pickedBy: order.picked_by,
    pickedAt: order.picked_at,
    isPicked: order.is_picked,
    totalBlownPouches: order.total_blown_pouches,
    isModified: order.is_modified,
    batchNumber: order.batch_number,
    batchNumbers: order.batch_numbers,
    hasChanges: order.has_changes,
    fromStandingOrder: order.from_standing_order,
    pickingInProgress: order.picking_in_progress,
    pickingProgress: order.picking_progress,
    boxDistributions: Array.isArray(order.box_distributions) ? 
      order.box_distributions.map(adaptBoxToCamelCase) : undefined,
    completedBoxes: order.completed_boxes,
    missingItems: Array.isArray(order.missing_items) ? 
      order.missing_items.map(adaptMissingItemToCamelCase) : undefined,
    invoiced: order.invoiced,
    invoiceNumber: order.invoice_number,
    invoiceDate: order.invoice_date,
    changes: order.changes,
    savedBoxes: order.savedBoxes,
    batchSummaries: order.batchSummaries,
    items: Array.isArray(order.items) ? 
      order.items.map(adaptOrderItemToCamelCase) : []
  };
  
  return result;
};

// Convert Order from camelCase (UI) to snake_case (database)
export const adaptOrderToSnakeCase = (order: Order): any => {
  if (!order) return null as any;
  
  // Create a base order object with the primary fields converted to snake_case
  const result: any = {
    id: order.id,
    customer_id: order.customerId,
    customer_order_number: order.customerOrderNumber,
    order_date: order.orderDate,
    required_date: order.requiredDate,
    delivery_method: order.deliveryMethod,
    notes: order.notes,
    status: order.status,
    created: order.created,
    updated: order.updated,
    picker: order.picker,
    picked_by: order.pickedBy,
    picked_at: order.pickedAt,
    is_picked: order.isPicked,
    total_blown_pouches: order.totalBlownPouches,
    is_modified: order.isModified,
    batch_number: order.batchNumber,
    batch_numbers: order.batchNumbers,
    has_changes: order.hasChanges,
    from_standing_order: order.fromStandingOrder,
    picking_in_progress: order.pickingInProgress,
    picking_progress: order.pickingProgress,
    invoiced: order.invoiced,
    invoice_number: order.invoiceNumber,
    invoice_date: order.invoiceDate
  };

  // If items exist, convert them to snake_case as well
  if (order.items && order.items.length > 0) {
    result.items = order.items.map(adaptOrderItemToSnakeCase);
  }
  
  return result;
};

// Convert Product from snake_case (database) to camelCase (UI)
export const adaptProductToCamelCase = (product: any): Product => {
  if (!product) return null as any;
  
  const result = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description || "",
    stock_level: product.stock_level || 0,
    weight: product.weight,
    requiresWeightInput: product.requires_weight_input === true,
    unit: product.unit || "",
    required: product.required === true
  };
  
  console.log("adaptProductToCamelCase - Input:", product);
  console.log("adaptProductToCamelCase - Output:", result);
  
  return result;
};

// Convert Product from camelCase (UI) to snake_case (database)
export const adaptProductToSnakeCase = (product: Product): any => {
  if (!product) return null as any;
  
  const result = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description || "",
    stock_level: product.stock_level || 0,
    weight: product.weight,
    requires_weight_input: product.requiresWeightInput === true, // Fixed: ensure proper snake_case name and boolean conversion
    unit: product.unit || "",
    required: product.required === true
  };
  
  console.log("adaptProductToSnakeCase - Input:", product);
  console.log("adaptProductToSnakeCase - Output:", result);
  
  return result;
};

// Convert BatchUsage from snake_case (database) to camelCase (UI)
export const adaptBatchUsageToCamelCase = (batchUsage: any): BatchUsage => {
  if (!batchUsage) return null as any;
  
  return {
    id: batchUsage.id,
    batchNumber: batchUsage.batch_number,
    productId: batchUsage.product_id,
    productName: batchUsage.product_name,
    totalWeight: batchUsage.total_weight,
    usedWeight: batchUsage.used_weight,
    ordersCount: batchUsage.orders_count,
    firstUsed: batchUsage.first_used,
    lastUsed: batchUsage.last_used,
    usedBy: batchUsage.usedBy
  };
};

// Convert BatchUsage from camelCase (UI) to snake_case (database)
export const adaptBatchUsageToSnakeCase = (batchUsage: BatchUsage): any => {
  if (!batchUsage) return null as any;
  
  return {
    id: batchUsage.id,
    batch_number: batchUsage.batchNumber,
    product_id: batchUsage.productId,
    product_name: batchUsage.productName,
    total_weight: batchUsage.totalWeight,
    used_weight: batchUsage.usedWeight,
    orders_count: batchUsage.ordersCount,
    first_used: batchUsage.firstUsed,
    last_used: batchUsage.lastUsed,
    usedBy: batchUsage.usedBy
  };
};

// Add Return from snake_case (database) to camelCase (UI)
export const adaptReturnToCamelCase = (returnData: any): Return => {
  if (!returnData) return null as any;
  
  return {
    id: returnData.id,
    customerId: returnData.customer_id,
    customerName: returnData.customer_name,
    customerType: returnData.customer_type,
    contactEmail: returnData.contact_email,
    contactPhone: returnData.contact_phone,
    dateReturned: returnData.date_returned,
    orderNumber: returnData.order_number,
    invoiceNumber: returnData.invoice_number,
    productId: returnData.product_id,
    productSku: returnData.product_sku,
    product: returnData.product,
    quantity: returnData.quantity,
    reason: returnData.reason,
    returnsRequired: returnData.returns_required,
    returnStatus: returnData.return_status,
    resolutionStatus: returnData.resolution_status,
    resolutionNotes: returnData.resolution_notes,
    created: returnData.created,
    updated: returnData.updated
  };
};

// Add Complaint from snake_case (database) to camelCase (UI)
export const adaptComplaintToCamelCase = (complaint: any): Complaint => {
  if (!complaint) return null as any;
  
  return {
    id: complaint.id,
    customerId: complaint.customer_id,
    customerName: complaint.customer_name,
    customerType: complaint.customer_type,
    contactEmail: complaint.contact_email,
    contactPhone: complaint.contact_phone,
    dateSubmitted: complaint.date_submitted,
    orderNumber: complaint.order_number,
    invoiceNumber: complaint.invoice_number,
    productId: complaint.product_id,
    productSku: complaint.product_sku,
    product: complaint.product,
    complaintType: complaint.complaint_type,
    complaintDetails: complaint.complaint_details,
    returnsRequired: complaint.returns_required,
    returnStatus: complaint.return_status,
    resolutionStatus: complaint.resolution_status,
    resolutionNotes: complaint.resolution_notes,
    created: complaint.created,
    updated: complaint.updated
  };
};
