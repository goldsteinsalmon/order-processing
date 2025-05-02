import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem } from "@/types";
import { adaptOrderToCamelCase, adaptOrderToSnakeCase } from "@/utils/typeAdapters";
import { adaptOrderItemToSnakeCase } from "@/utils/orderItemAdapters";

export const useOrderData = (toast: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  // Helper function to log and format database errors
  const handleDatabaseError = (error: any, operation: string): string => {
    const errorMessage = error?.message || error?.toString() || "Unknown database error";
    console.error(`Database error during ${operation}:`, error);
    console.error(`Error details:`, JSON.stringify(error, null, 2));
    setLastError(`${operation} error: ${errorMessage}`);
    return errorMessage;
  };

  // Add order
  const addOrder = async (order: Order): Promise<Order | null> => {
    try {
      console.log("Adding order with data:", order);
      
      // Convert to snake_case for database
      const orderForDb = adaptOrderToSnakeCase(order);
      
      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: orderForDb.customer_id,
          customer_order_number: orderForDb.customer_order_number,
          order_date: orderForDb.order_date,
          required_date: orderForDb.required_date,
          delivery_method: orderForDb.delivery_method,
          notes: orderForDb.notes,
          status: orderForDb.status,
          created: new Date().toISOString()
          // order_number will be assigned automatically by the database trigger
        })
        .select();
      
      if (orderError) {
        console.error("Error inserting order:", orderError);
        throw orderError;
      }
      
      if (!orderData || orderData.length === 0) {
        throw new Error("No order data returned after insert");
      }
      
      const newOrderId = orderData[0].id;
      console.log("New order created with ID:", newOrderId);
      
      // Insert order items
      if (order.items && order.items.length > 0) {
        // Make sure items have the correct format
        const orderItemsToInsert = order.items.map(item => ({
          order_id: newOrderId,
          product_id: item.productId || item.product_id,
          quantity: item.quantity,
          original_quantity: item.quantity
        }));
        
        console.log("Inserting order items:", orderItemsToInsert);
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);
        
        if (itemsError) {
          console.error("Error inserting order items:", itemsError);
          throw itemsError;
        }
      }
      
      // Handle box distributions if they exist
      if (order.boxDistributions && order.boxDistributions.length > 0) {
        console.log("Processing box distributions:", order.boxDistributions);
        
        for (const box of order.boxDistributions) {
          // Insert box
          const { data: boxData, error: boxError } = await supabase
            .from('boxes')
            .insert({
              order_id: newOrderId,
              box_number: box.boxNumber,
              completed: box.completed || false,
              printed: box.printed || false
            })
            .select();
          
          if (boxError) {
            console.error("Error inserting box:", boxError);
            throw boxError;
          }
          
          const newBoxId = boxData[0].id;
          
          // Insert box items if they exist
          if (box.items && box.items.length > 0) {
            const boxItemsToInsert = box.items.map(item => ({
              box_id: newBoxId,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              weight: item.weight || 0
            }));
            
            const { error: boxItemsError } = await supabase
              .from('box_items')
              .insert(boxItemsToInsert);
            
            if (boxItemsError) {
              console.error("Error inserting box items:", boxItemsError);
              throw boxItemsError;
            }
          }
        }
      }
      
      // Fetch the newly created order with joined customer and items
      const { data: newOrderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', newOrderId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching new order:", fetchError);
        throw fetchError;
      }
      
      // Fetch the order items with joined product
      const { data: newItemsData, error: newItemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('order_id', newOrderId);
      
      if (newItemsError) {
        console.error("Error fetching order items:", newItemsError);
        throw newItemsError;
      }
      
      // Convert database data to our Order type using adapter
      const rawOrder = {
        ...newOrderData,
        items: newItemsData || []
      };
      
      const newOrder = adaptOrderToCamelCase(rawOrder);
      
      setOrders([...orders, newOrder]);
      return newOrder;
    } catch (error: any) {
      console.error('Error adding order:', error);
      toast({
        title: "Error",
        description: `Failed to add order: ${error?.message || error?.toString() || "Unknown error"}`,
        variant: "destructive",
      });
      return null;
    }
  };

  // Update order
  const updateOrder = async (updatedOrder: Order): Promise<boolean> => {
    try {
      console.log("Starting order update with ID:", updatedOrder.id);
      setLastError(null);
      
      // Check if the order is in orders list or completedOrders
      const isCompletedOrder = completedOrders.some(o => o.id === updatedOrder.id);
      
      console.log("Updating order:", updatedOrder.id);
      console.log("Order items count:", updatedOrder.items?.length);
      
      // Safeguard against undefined values
      if (!updatedOrder.id) {
        throw new Error("Cannot update order: missing order ID");
      }
      
      // Convert to snake_case for database
      const orderForDb = adaptOrderToSnakeCase(updatedOrder);
      
      // Update the order details
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_id: orderForDb.customer_id,
          customer_order_number: orderForDb.customer_order_number,
          order_date: orderForDb.order_date,
          required_date: orderForDb.required_date,
          delivery_method: orderForDb.delivery_method,
          notes: orderForDb.notes,
          status: orderForDb.status,
          picker: orderForDb.picker,
          is_picked: orderForDb.is_picked,
          total_blown_pouches: orderForDb.total_blown_pouches,
          is_modified: orderForDb.is_modified,
          updated: new Date().toISOString(),
          batch_number: orderForDb.batch_number,
          has_changes: orderForDb.has_changes,
          picked_by: orderForDb.picked_by,
          picked_at: orderForDb.picked_at,
          picking_in_progress: orderForDb.picking_in_progress,
          invoiced: orderForDb.invoiced,
          invoice_number: orderForDb.invoice_number,
          invoice_date: orderForDb.invoice_date
        })
        .eq('id', updatedOrder.id);
      
      if (orderError) {
        const errorMsg = handleDatabaseError(orderError, "Update order details");
        throw new Error(errorMsg);
      }
      
      console.log("Order details successfully updated");
      
      // Handle item updates if they exist
      if (updatedOrder.items && updatedOrder.items.length > 0) {
        console.log(`Processing ${updatedOrder.items.length} items for update`);
        
        // Get existing items for this order
        const { data: existingItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', updatedOrder.id);
        
        if (itemsError) {
          const errorMsg = handleDatabaseError(itemsError, "Fetch existing items");
          throw new Error(errorMsg);
        }
        
        console.log(`Found ${existingItems?.length || 0} existing items in database`);
        
        // Create map of existing items by id
        const existingItemMap = new Map();
        existingItems?.forEach((item: any) => {
          existingItemMap.set(item.id, item);
        });
        
        // Process each updated item
        for (const item of updatedOrder.items) {
          if (!item.id) {
            console.error("Item missing ID:", item);
            continue;
          }
          
          // Log batch number to debug disappearing values
          console.log(`Processing item ${item.id} with batch number: ${item.batchNumber || 'none'} and checked: ${item.checked}`);
          
          if (existingItemMap.has(item.id)) {
            // Convert item to snake_case
            const itemForDb = adaptOrderItemToSnakeCase(item);
            console.log(`Updating item ${item.id}:`, {
              checked: itemForDb.checked,
              batch_number: itemForDb.batch_number
            });
            
            // Update existing item
            const { error: updateItemError } = await supabase
              .from('order_items')
              .update({
                quantity: itemForDb.quantity,
                unavailable_quantity: itemForDb.unavailable_quantity,
                is_unavailable: itemForDb.is_unavailable,
                blown_pouches: itemForDb.blown_pouches,
                batch_number: itemForDb.batch_number || "", // Ensure null batch numbers are saved as empty strings
                checked: itemForDb.checked !== undefined ? itemForDb.checked : false, // Default to false if undefined
                missing_quantity: itemForDb.missing_quantity,
                picked_quantity: itemForDb.picked_quantity,
                picked_weight: itemForDb.picked_weight,
                original_quantity: itemForDb.original_quantity,
                box_number: itemForDb.box_number,
                manual_weight: itemForDb.manual_weight
              })
              .eq('id', item.id);
            
            if (updateItemError) {
              const errorMsg = handleDatabaseError(updateItemError, `Update item ${item.id}`);
              console.error(`Error updating item ${item.id}:`, errorMsg);
              // Continue with other items instead of throwing to ensure partial updates are saved
            } else {
              console.log(`Successfully updated item ${item.id}`);
            }
            
            // Remove from map to track what's been processed
            existingItemMap.delete(item.id);
          } else {
            // Insert new item
            console.log(`Inserting new item for product ${item.productId}`);
            const { error: insertItemError } = await supabase
              .from('order_items')
              .insert({
                order_id: updatedOrder.id,
                product_id: item.productId,
                quantity: item.quantity,
                unavailable_quantity: item.unavailableQuantity,
                is_unavailable: item.isUnavailable,
                blown_pouches: item.blownPouches,
                batch_number: item.batchNumber || "",
                checked: !!item.checked,
                missing_quantity: item.missingQuantity,
                picked_quantity: item.pickedQuantity,
                picked_weight: item.pickedWeight,
                original_quantity: item.originalQuantity,
                box_number: item.boxNumber,
                manual_weight: item.manualWeight
              });
            
            if (insertItemError) {
              const errorMsg = handleDatabaseError(insertItemError, "Insert new item");
              console.error("Error inserting new item:", errorMsg);
              // Continue with other items
            }
          }
        }
        
        // Delete any items that were removed
        if (existingItemMap.size > 0) {
          const itemsToDelete = Array.from(existingItemMap.keys());
          console.log(`Deleting ${itemsToDelete.length} removed items`);
          const { error: deleteItemsError } = await supabase
            .from('order_items')
            .delete()
            .in('id', itemsToDelete);
          
          if (deleteItemsError) {
            const errorMsg = handleDatabaseError(deleteItemsError, "Delete removed items");
            console.error("Error deleting removed items:", errorMsg);
            // Continue anyway
          }
        }
        
        console.log("All item updates completed successfully");
      }
      
      // Handle order changes if they exist
      if (updatedOrder.changes && updatedOrder.changes.length > 0) {
        const changesToInsert = updatedOrder.changes.map(change => ({
          order_id: updatedOrder.id,
          product_id: change.productId,
          product_name: change.productName,
          original_quantity: change.originalQuantity,
          new_quantity: change.newQuantity,
          date: change.date || new Date().toISOString()
        }));
        
        const { error: changesError } = await supabase
          .from('order_changes')
          .insert(changesToInsert);
        
        if (changesError) {
          console.error("Error adding order changes:", changesError);
          throw changesError;
        }
      }
      
      // Update both completedBoxes and savedBoxes arrays if they exist
      if (updatedOrder.completedBoxes || updatedOrder.savedBoxes) {
        console.log("Updating completedBoxes and savedBoxes");
        
        // Store these in a separate update to handle potential type mismatches
        const boxData: any = {};
        
        if (updatedOrder.completedBoxes) {
          boxData.completed_boxes = updatedOrder.completedBoxes;
        }
        
        if (updatedOrder.savedBoxes) {
          boxData.saved_boxes = updatedOrder.savedBoxes;
        }
        
        const { error: boxDataError } = await supabase
          .from('orders')
          .update(boxData)
          .eq('id', updatedOrder.id);
        
        if (boxDataError) {
          console.error("Error updating box tracking data:", boxDataError);
          // Don't throw here, as this is not critical
        }
      }
      
      console.log("Order update complete, refreshing local state");
      
      // We need to refetch the updated order to ensure our state stays in sync
      const { data: refreshedData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', updatedOrder.id)
        .single();
      
      if (fetchError) {
        console.error("Error fetching updated order:", fetchError);
        // Continue anyway, we'll use the provided data
      } else if (refreshedData) {
        // Fetch the order items with joined product
        const { data: refreshedItemsData, error: refreshedItemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('order_id', updatedOrder.id);
        
        if (refreshedItemsError) {
          console.error("Error fetching updated items:", refreshedItemsError);
        } else {
          // Convert database data to our Order type using adapter
          const rawOrder = {
            ...refreshedData,
            items: refreshedItemsData || []
          };
          
          const refreshedOrder = adaptOrderToCamelCase(rawOrder);
          
          // Update state based on whether it's a completed order or not
          if (isCompletedOrder) {
            setCompletedOrders(completedOrders.map(o => o.id === refreshedOrder.id ? refreshedOrder : o));
          } else {
            setOrders(orders.map(o => o.id === refreshedOrder.id ? refreshedOrder : o));
          }
          
          console.log("Local state updated with refreshed data");
        }
      }
      
      return true;
    } catch (error: any) {
      const errorMessage = handleDatabaseError(error, "Update order");
      toast({
        title: "Error",
        description: "Failed to update order: " + errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      console.log("Deleting order with ID:", orderId);
      
      // First, check if order exists
      const { data: orderData, error: orderCheckError } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .single();
        
      if (orderCheckError) {
        console.error("Error checking order existence:", orderCheckError);
        throw orderCheckError;
      }
      
      console.log("Found order to delete:", orderData);
      
      // Delete order items first due to foreign key constraints
      const { data: deletedItems, error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)
        .select();
      
      if (itemsError) {
        console.error("Error deleting order items:", itemsError);
        throw itemsError;
      }
      
      console.log(`Deleted ${deletedItems?.length || 0} order items`);
      
      // Get box IDs associated with this order
      const { data: boxIds, error: boxQueryError } = await supabase
        .from('boxes')
        .select('id')
        .eq('order_id', orderId);
        
      if (boxQueryError) {
        console.error("Error querying box IDs:", boxQueryError);
        // Continue anyway as this might not exist
      } else {
        // If boxes exist, delete their items
        if (boxIds && boxIds.length > 0) {
          const boxIdArray = boxIds.map(box => box.id);
          
          const { data: deletedBoxItems, error: boxItemsError } = await supabase
            .from('box_items')
            .delete()
            .in('box_id', boxIdArray)
            .select();
          
          if (boxItemsError) {
            console.error("Error deleting box items:", boxItemsError);
            // Continue anyway
          } else {
            console.log(`Deleted ${deletedBoxItems?.length || 0} box items`);
          }
        }
      }
      
      // Delete the boxes
      const { data: deletedBoxes, error: boxesError } = await supabase
        .from('boxes')
        .delete()
        .eq('order_id', orderId)
        .select();
        
      if (boxesError) {
        console.error("Error deleting boxes:", boxesError);
        // Continue anyway as this might not exist
      } else {
        console.log(`Deleted ${deletedBoxes?.length || 0} boxes`);
      }
      
      // Delete any order changes
      const { data: deletedChanges, error: changesError } = await supabase
        .from('order_changes')
        .delete()
        .eq('order_id', orderId)
        .select();
        
      if (changesError) {
        console.error("Error deleting order changes:", changesError);
        // Continue anyway as this might not exist
      } else {
        console.log(`Deleted ${deletedChanges?.length || 0} order changes`);
      }
      
      // Delete any missing items
      const { data: deletedMissing, error: missingError } = await supabase
        .from('missing_items')
        .delete()
        .eq('order_id', orderId)
        .select();
        
      if (missingError) {
        console.error("Error deleting missing items:", missingError);
        // Continue anyway as this might not exist
      } else {
        console.log(`Deleted ${deletedMissing?.length || 0} missing items`);
      }
      
      // Delete any picking progress
      const { data: deletedProgress, error: progressError } = await supabase
        .from('picking_progress')
        .delete()
        .eq('order_id', orderId)
        .select();
        
      if (progressError) {
        console.error("Error deleting picking progress:", progressError);
        // Continue anyway as this might not exist
      } else {
        console.log(`Deleted ${deletedProgress?.length || 0} picking progress records`);
      }
      
      // Finally, delete the order itself
      const { data: deletedOrder, error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .select();
      
      if (orderError) {
        console.error("Error deleting order:", orderError);
        throw orderError;
      }
      
      console.log("Successfully deleted order:", deletedOrder);
      
      // Update the local state
      setOrders(orders.filter(order => order.id !== orderId));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Complete order (move to completed orders)
  const completeOrder = async (order: Order): Promise<boolean> => {
    try {
      console.log("CompleteOrder: Starting process for order:", order.id);
      
      // Update order status to completed
      const updatedOrder: Order = {
        ...order,
        status: "Completed",
        isPicked: true,
        is_picked: true, // Add this for database compatibility
        pickedAt: order.pickedAt || new Date().toISOString(),
        picked_at: order.pickedAt || new Date().toISOString(), // Add this for database compatibility
        updated: new Date().toISOString()
      };
      
      console.log("CompleteOrder: Updating order with data:", {
        status: updatedOrder.status,
        isPicked: updatedOrder.isPicked,
        is_picked: updatedOrder.is_picked,
        pickedAt: updatedOrder.pickedAt,
        picked_at: updatedOrder.picked_at
      });
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: updatedOrder.status,
          is_picked: updatedOrder.is_picked,
          picked_at: updatedOrder.picked_at,
          updated: updatedOrder.updated,
          picker: updatedOrder.picker,
          picked_by: updatedOrder.pickedBy || updatedOrder.picked_by
        })
        .eq('id', order.id);
      
      if (error) {
        console.error("CompleteOrder: Error updating order in database:", error);
        throw error;
      }
      
      console.log("CompleteOrder: Database update successful");
      
      // Remove from orders and add to completed orders
      setOrders(orders.filter(o => o.id !== order.id));
      setCompletedOrders([updatedOrder, ...completedOrders]);
      
      console.log("CompleteOrder: Updated local state, orders count:", orders.length - 1, 
        "completedOrders count:", completedOrders.length + 1);
      
      return true;
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: "Failed to complete order.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get last error
  const getLastError = () => lastError;
  const clearLastError = () => setLastError(null);

  return {
    orders,
    completedOrders,
    setOrders,
    setCompletedOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    completeOrder,
    getLastError,
    clearLastError
  };
};
