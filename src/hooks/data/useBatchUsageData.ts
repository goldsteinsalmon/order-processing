
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BatchUsage, Product, Order } from "@/types";

export const useBatchUsageData = (toast: any, products: Product[]) => {
  const [batchUsages, setBatchUsages] = useState<BatchUsage[]>([]);
  const [processedBatchOrderItems, setProcessedBatchOrderItems] = useState<Set<string>>(new Set());

  // Create consolidated batch summary for an order
  const createConsolidatedBatchSummary = (order: Order) => {
    const batchSummary: Record<string, { 
      product_id: string, 
      product_name: string, 
      quantity: number, 
      total_weight: number,
      batch_number: string
    }[]> = {};
    
    // Process each item with a batch number
    order.items?.forEach(item => {
      if (!item.batch_number || !item.product) return;
      
      const key = `${item.batch_number}_${item.product_id}`;
      
      // Skip if already processed
      if (processedBatchOrderItems.has(key)) return;
      
      // Calculate weight based on manual weight or quantity * standard weight
      const weight = item.manual_weight || 
        (item.product.weight && item.picked_quantity 
          ? item.picked_quantity * item.product.weight 
          : 0);
      
      if (!batchSummary[item.batch_number]) {
        batchSummary[item.batch_number] = [];
      }
      
      batchSummary[item.batch_number].push({
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.picked_quantity || 0,
        total_weight: weight,
        batch_number: item.batch_number
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
      product_id: string, 
      product_name: string, 
      quantity: number, 
      total_weight: number,
      batch_number: string
    }[]>,
    orderId: string
  ) => {
    for (const batch_number in batchSummary) {
      for (const item of batchSummary[batch_number]) {
        await recordBatchUsage(
          batch_number,
          item.product_id,
          item.quantity,
          orderId,
          item.total_weight
        );
      }
    }
  };

  // Record a single batch usage
  const recordBatchUsage = async (
    batch_number: string,
    product_id: string,
    quantity: number,
    orderId: string,
    manualWeight?: number
  ) => {
    try {
      // Find product details
      const product = products.find(p => p.id === product_id);
      if (!product) {
        console.error(`Product with ID ${product_id} not found`);
        return;
      }
      
      // Calculate weight if not provided manually
      const weight = manualWeight || (product.weight ? quantity * product.weight : 0);
      
      // Check if batch usage already exists for this batch number and product
      const { data: existingBatchUsages, error: findError } = await supabase
        .from('batch_usages')
        .select('*')
        .eq('batch_number', batch_number)
        .eq('product_id', product_id);
      
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
              used_weight: newUsedWeight,
              orders_count: newOrdersCount,
              last_used: new Date().toISOString(),
              usedBy: [...(bu.usedBy || []), orderId]
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
            batch_number: batch_number,
            product_id: product_id,
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
          batch_number: batch_number,
          product_id: product_id,
          product_name: product.name,
          total_weight: weight,
          used_weight: weight,
          orders_count: 1,
          first_used: new Date().toISOString(),
          last_used: new Date().toISOString(),
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
  const getBatchUsageByBatchNumber = (batch_number: string) => {
    return batchUsages.find(bu => bu.batch_number === batch_number);
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
