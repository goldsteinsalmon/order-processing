
// Add this code to properly handle the returns, complaints, and missing items in the refreshData function

// In the refreshData function, update the sections for returns, complaints, and missing items

// For Returns
if (!customerError && !productError) {
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .select('*, product:products(*)');
  
  if (returnError) {
    console.error("Error fetching returns:", returnError);
  } else {
    // Convert data from snake_case to camelCase
    const formattedReturns = returnData.map(item => adaptReturnToCamelCase(item));
    setReturns(formattedReturns);
  }
}

// For Complaints
if (!customerError && !productError) {
  const { data: complaintData, error: complaintError } = await supabase
    .from('complaints')
    .select('*, product:products(*)');
  
  if (complaintError) {
    console.error("Error fetching complaints:", complaintError);
  } else {
    // Convert data from snake_case to camelCase
    const formattedComplaints = complaintData.map(item => adaptComplaintToCamelCase(item));
    setComplaints(formattedComplaints);
  }
}

// For Missing Items
if (!customerError && !productError) {
  const { data: missingItemData, error: missingItemError } = await supabase
    .from('missing_items')
    .select(`
      *,
      product:products(*),
      order:orders(
        id,
        customer:customers(*)
      )
    `);
  
  if (missingItemError) {
    console.error("Error fetching missing items:", missingItemError);
  } else {
    // Convert data from snake_case to camelCase
    const formattedMissingItems = missingItemData.map(item => adaptMissingItemToCamelCase(item));
    setMissingItems(formattedMissingItems);
  }
}

// For batch usages
if (!customerError && !productError) {
  const { data: batchUsageData, error: batchUsageError } = await supabase
    .from('batch_usages')
    .select('*, batch_usage_orders(*)');
  
  if (batchUsageError) {
    console.error("Error fetching batch usages:", batchUsageError);
  } else {
    // Convert data from snake_case to camelCase
    const formattedBatchUsages = batchUsageData.map(item => adaptBatchUsageToCamelCase({
      ...item,
      usedBy: item.batch_usage_orders?.map((order: any) => order.order_identifier) || []
    }));
    setBatchUsages(formattedBatchUsages);
  }
}
