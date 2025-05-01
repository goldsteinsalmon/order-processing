
// Update the groupedItems useMemo to use consistent property names
const groupedItems = React.useMemo(() => {
  if (!groupByBox) return { noBox: items };
  
  return items.reduce((acc, item) => {
    const boxNumber = item.box_number || item.boxNumber || 0;
    if (!acc[boxNumber]) {
      acc[boxNumber] = [];
    }
    acc[boxNumber].push(item);
    return acc;
  }, {} as Record<number, ExtendedOrderItem[]>);
}, [items, groupByBox]);

// Update the isBoxComplete function to use consistent property names
const isBoxComplete = (boxItems: ExtendedOrderItem[]): boolean => {
  // First check if all items are checked
  if (!boxItems.length || !boxItems.every(item => item.checked)) {
    return false;
  }
  
  // Then check if all items have batch numbers
  if (!boxItems.every(item => item.batchNumber?.trim() || item.batch_number?.trim())) {
    return false;
  }
  
  // Finally check if all items that require weight have weights entered
  const weightInputComplete = boxItems
    .filter(item => item.product.requires_weight_input)
    .every(item => (item.picked_weight || item.pickedWeight) && 
           (item.picked_weight > 0 || item.pickedWeight > 0));
      
  // If any item requires weight but hasn't been entered, box is not complete
  if (!weightInputComplete) {
    return false;
  }
  
  return true;
};

// Update the hasQuantityChanged helper function
const hasQuantityChanged = (item: ExtendedOrderItem) => {
  return (item.original_quantity !== undefined || item.originalQuantity !== undefined) && 
         (item.original_quantity !== item.quantity && item.originalQuantity !== item.quantity);
};

// Update requiresWeightInput checks throughout the component
// For example:
// When checking if an item requires weight input
const requiresWeightInput = item.product.requires_weight_input || item.product.requiresWeightInput;

// When validating box completion, check for missing weights
const missingWeights = boxItems
  .filter(item => item.product.requires_weight_input || item.product.requiresWeightInput)
  .filter(item => (!item.picked_weight && !item.pickedWeight) || 
         (item.picked_weight <= 0 && item.pickedWeight <= 0));
