
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BatchUsage, Product, Order } from "@/types";

export const useBatchUsageData = (toast: any, products: Product[]) => {
  const [batchUsages, setBatchUsages] = useState<BatchUsage[]>([]);
  const [processedBatchOrderItems, setProcessedBatchOrderItems] = useState<Set<string>>(new Set());

  // Create consolidated batch summary for an order
  const createConsolidatedBatchSummary = (order: Order) => {
    const batchSummary: Record<string, { 
      productId: string, 
      productName: string, 
      quantity: number, 
      totalWeight: number,
      batchNumber: string
    }[]> = {};
    
    // Process each item with a batch number
    order.items?.forEach(item => {
      if (!item.batchNumber || !item.product) return;
      
      const key = `${item.batchNumber}_${item.productId}`;
      
      // Skip if already processed
      if (processedBatchOrderItems.has(key)) return;
      
      // Calculate weight based on manual weight or quantity * standard weight
      const weight = item.manualWeight || 
        (item.product.weight && item.pickedQuantity 
          ? item.pickedQuantity * item.product.weight 
          : 0);
      
      if (!batchSummary[item.batchNumber]) {
        batchSummary[item.batchNumber] = [];
      }
      
      batchSummary[item.batchNumber].push({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.pickedQuantity || 0,
        totalWeight: weight,
        batchNumber: item.batchNumber
      });
      
      // Mark as processed
      const updatedProcessed = new Set(processedBatchOrderItems);
      updatedProcessed.add(key);
      setProcessedBatchOrderItems(updatedProcessed);
    });
    
    return batchSummary;
  };
  
  // Record batch usages from summary
  const recordBatchUsagesFromSummary = async (
    batchSummary: Record<string, { 
      productId: string, 
      productName: string, 
      quantity: number, 
      totalWeight: number,
      batchNumber: string
    }[]>,
    orderId: string
  ) => {
    for (const batchNumber in batchSummary) {
      for (const item of batchSummary[batchNumber]) {
        await recordBatchUsage(
          batchNumber,
          item.productId,
          item.quantity,
          orderId,
          item.totalWeight
        );
      }
    }
  };

  // Record a single batch usage
  const recordBatchUsage = async (
    batchNumber: string,
    productId: string,
    quantity: number,
    orderId: string,
    manualWeight?: number
  ) => {
    try {
      // Find product details
      const product = products.find(p => p.id === productId);
      if (!product) {
        console.error(`Product with ID ${productId} not found`);
        return;
      }
      
      // Calculate weight if not provided manually
      const weight = manualWeight || (product.weight ? quantity * product.weight : 0);
      
      // Check if batch usage already exists for this batch number and product
      const { data: existingBatchUsages, error: findError } = await supabase
        .from('batch_usages')
        .select('*')
        .eq('batch_number', batchNumber)
        .eq('product_id', productId);
      
      if (findError) {
        console.error('Error checking for existing batch usage:', findError);
        return;
      }
      
      if (existingBatchUsages && existingBatchUsages.length > 0) {
        // Update existing batch usage
        const existingBatchUsage = existingBatchUsages[0];
        const newUsedWeight = existingBatchUsage.used_weight + weight;
        const newOrdersCount = existingBatchUsage.orders_count + 1;
        
        const { error: updateError } = await supabase
          .from('batch_usages')
          .update({
            used_weight: newUsedWeight,
            orders_count: newOrdersCount,
            last_used: new Date().toISOString()
          })
          .eq('id', existingBatchUsage.id);
        
        if (updateError) {
          console.error('Error updating batch usage:', updateError);
          return;
        }
        
        // Add order reference
        const { error: orderRefError } = await supabase
          .from('batch_usage_orders')
          .insert({
            batch_usage_id: existingBatchUsage.id,
            order_identifier: orderId
          });
        
        if (orderRefError) {
          console.error('Error adding batch usage order reference:', orderRefError);
        }
        
        // Update local state
        const updatedBatchUsages = batchUsages.map(bu => {
          if (bu.id === existingBatchUsage.id) {
            return {
              ...bu,
              usedWeight: newUsedWeight,
              ordersCount: newOrdersCount,
              lastUsed: new Date().toISOString(),
              usedBy: [...bu.usedBy, orderId]
            };
          }
          return bu;
        });
        
        setBatchUsages(updatedBatchUsages);
      } else {
        // Create new batch usage
        const { data: newBatchUsage, error: createError } = await supabase
          .from('batch_usages')
          .insert({
            batch_number: batchNumber,
            product_id: productId,
            product_name: product.name,
            total_weight: weight,
            used_weight: weight,
            orders_count: 1,
            first_used: new Date().toISOString(),
            last_used: new Date().toISOString()
          })
          .select();
        
        if (createError || !newBatchUsage) {
          console.error('Error creating batch usage:', createError);
          return;
        }
        
        // Add order reference
        const { error: orderRefError } = await supabase
          .from('batch_usage_orders')
          .insert({
            batch_usage_id: newBatchUsage[0].id,
            order_identifier: orderId
          });
        
        if (orderRefError) {
          console.error('Error adding batch usage order reference:', orderRefError);
        }
        
        // Update local state
        setBatchUsages([...batchUsages, {
          id: newBatchUsage[0].id,
          batchNumber,
          productId,
          productName: product.name,
          totalWeight: weight,
          usedWeight: weight,
          ordersCount: 1,
          firstUsed: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usedBy: [orderId]
        }]);
      }
    } catch (error) {
      console.error('Error recording batch usage:', error);
    }
  };
  
  // Record all batch usages for an order
  const recordAllBatchUsagesForOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    
    // Reset processed items tracking
    setProcessedBatchOrderItems(new Set());
    
    // Create batch summary
    const batchSummary = createConsolidatedBatchSummary(order);
    
    // Record batch usages
    recordBatchUsagesFromSummary(batchSummary, order.id);
  };
  
  // Get all batch usages
  const getBatchUsages = () => {
    return batchUsages;
  };
  
  // Get batch usage by batch number
  const getBatchUsageByBatchNumber = (batchNumber: string) => {
    return batchUsages.find(bu => bu.batchNumber === batchNumber);
  };

  return {
    batchUsages,
    setBatchUsages,
    processedBatchOrderItems,
    setProcessedBatchOrderItems,
    getBatchUsages,
    getBatchUsageByBatchNumber,
    recordBatchUsage,
    recordAllBatchUsagesForOrder
  };
};
