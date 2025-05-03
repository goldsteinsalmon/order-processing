import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BatchUsage, Product, Order, OrderItem } from "@/types";
import { adaptBatchUsageToCamelCase } from "@/utils/typeAdapters";
import { useToast } from "@/hooks/use-toast";

export const useBatchUsageData = (products: Product[]) => {
  const [batchUsages, setBatchUsages] = useState<BatchUsage[]>([]);
  const [processedBatchOrderItems, setProcessedBatchOrderItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchBatchUsages = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_usages')
        .select(`
          *,
          batch_usage_orders(*)
        `);
        
      if (error) {
        throw error;
      }

      // Convert snake_case to camelCase
      const formattedBatchUsages: BatchUsage[] = data.map(item => adaptBatchUsageToCamelCase({
        ...item,
        usedBy: item.batch_usage_orders?.map((order: any) => order.order_identifier) || []
      }));
      
      setBatchUsages(formattedBatchUsages);
    } catch (error) {
      console.error("Error fetching batch usages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch batch usage data.",
        variant: "destructive",
      });
    }
  };

  const getBatchUsages = () => {
    return batchUsages;
  };

  const getBatchUsageByBatchNumber = (batchNumber: string) => {
    return batchUsages.find(batch => batch.batchNumber === batchNumber);
  };

  // Update or create a batch usage record
  const updateBatchUsage = async (batchUsage: BatchUsage, orderId: string): Promise<BatchUsage | null> => {
    try {
      // Convert camelCase to snake_case for database
      const dbBatchUsage = {
        id: batchUsage.id,
        batch_number: batchUsage.batchNumber,
        product_id: batchUsage.productId,
        product_name: batchUsage.productName,
        total_weight: batchUsage.totalWeight,
        used_weight: batchUsage.usedWeight,
        orders_count: batchUsage.ordersCount,
        first_used: batchUsage.firstUsed,
        last_used: batchUsage.lastUsed
      };
      
      // Upsert batch usage record
      const { data, error } = await supabase
        .from('batch_usages')
        .upsert(dbBatchUsage)
        .select();
      
      if (error) {
        throw error;
      }

      // Add order reference
      if (orderId) {
        const { error: orderError } = await supabase
          .from('batch_usage_orders')
          .insert({
            batch_usage_id: batchUsage.id,
            order_identifier: orderId
          });
          
        if (orderError) {
          throw orderError;
        }
      }

      // Convert the returned data back to camelCase
      const updatedBatchUsage = adaptBatchUsageToCamelCase({
        ...data[0],
        usedBy: [...(batchUsage.usedBy || []), orderId]
      });
      
      // Update the state with the new/updated record
      setBatchUsages(prevBatchUsages => {
        const index = prevBatchUsages.findIndex(batch => batch.id === batchUsage.id);
        if (index >= 0) {
          const newBatchUsages = [...prevBatchUsages];
          newBatchUsages[index] = updatedBatchUsage;
          return newBatchUsages;
        } else {
          return [...prevBatchUsages, updatedBatchUsage];
        }
      });
      
      return updatedBatchUsage;
    } catch (error) {
      console.error("Error updating batch usage:", error);
      toast({
        title: "Error",
        description: "Failed to update batch usage data.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Record batch usage for a specific product and order
  const recordBatchUsage = (
    batchNumber: string,
    productId: string,
    quantity: number,
    orderId: string,
    manualWeight?: number
  ) => {
    // Check if this specific item has already been processed
    const itemKey = `${orderId}-${productId}-${batchNumber}`;
    if (processedBatchOrderItems.has(itemKey)) {
      return;
    }

    // Find the product
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error(`Product not found: ${productId}`);
      return;
    }

    try {
      // Calculate weight based on product weight or manual weight
      let weight = manualWeight;
      if (!weight && product.weight) {
        weight = product.weight * quantity;
      }
      
      if (!weight) {
        // If no weight provided or calculated, don't record usage
        return;
      }

      // Look for existing batch usage record
      let existingBatchUsage = getBatchUsageByBatchNumber(batchNumber);
      let now = new Date().toISOString();
      
      if (existingBatchUsage) {
        // Update existing batch usage
        const updatedBatchUsage: BatchUsage = {
          ...existingBatchUsage,
          usedWeight: existingBatchUsage.usedWeight + weight,
          ordersCount: existingBatchUsage.usedBy?.includes(orderId) 
            ? existingBatchUsage.ordersCount 
            : existingBatchUsage.ordersCount + 1,
          lastUsed: now,
          usedBy: existingBatchUsage.usedBy?.includes(orderId)
            ? existingBatchUsage.usedBy
            : [...(existingBatchUsage.usedBy || []), orderId]
        };
        
        updateBatchUsage(updatedBatchUsage, orderId);
      } else {
        // Create new batch usage record
        const newBatchUsage: BatchUsage = {
          id: crypto.randomUUID(),
          batchNumber: batchNumber,
          productId: productId,
          productName: product.name,
          totalWeight: weight * 2, // Estimate total as twice the used weight
          usedWeight: weight,
          ordersCount: 1,
          firstUsed: now,
          lastUsed: now,
          usedBy: [orderId]
        };
        
        updateBatchUsage(newBatchUsage, orderId);
      }
      
      // Mark this item as processed
      setProcessedBatchOrderItems(prev => new Set(prev).add(itemKey));
    } catch (error) {
      console.error("Error recording batch usage:", error);
      toast({
        title: "Error",
        description: "Failed to record batch usage.",
        variant: "destructive",
      });
    }
  };

  // Record batch usages for all items in an order (final processing)
  const recordAllBatchUsagesForOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      return;
    }
    
    order.items.forEach(item => {
      if (item.batchNumber && item.pickedQuantity && item.pickedQuantity > 0) {
        recordBatchUsage(
          item.batchNumber,
          item.productId,
          item.pickedQuantity,
          order.id,
          item.pickedWeight || item.manualWeight
        );
      }
    });
  };
  
  return {
    batchUsages,
    setBatchUsages,
    processedBatchOrderItems,
    setProcessedBatchOrderItems,
    fetchBatchUsages,
    getBatchUsages,
    getBatchUsageByBatchNumber,
    recordBatchUsage,
    recordAllBatchUsagesForOrder
  };
};
