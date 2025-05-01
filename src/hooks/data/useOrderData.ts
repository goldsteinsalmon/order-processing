
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";

export const useOrderData = (toast: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  // Add order
  const addOrder = async (order: Order): Promise<Order | null> => {
    try {
      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: order.customerId,
          customer_order_number: order.customerOrderNumber,
          order_date: order.orderDate,
          required_date: order.requiredDate,
          delivery_method: order.deliveryMethod,
          notes: order.notes,
          status: order.status,
          created: new Date().toISOString()
        })
        .select();
      
      if (orderError) throw orderError;
      
      const newOrderId = orderData[0].id;
      
      // Insert order items
      const orderItemsToInsert = order.items.map(item => ({
        order_id: newOrderId,
        product_id: item.productId,
        quantity: item.quantity,
        original_quantity: item.quantity
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);
      
      if (itemsError) throw itemsError;
      
      // Fetch the newly created order with joined customer and items
      const { data: newOrderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', newOrderId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Fetch the order items with joined product
      const { data: newItemsData, error: newItemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('order_id', newOrderId);
      
      if (newItemsError) throw newItemsError;
      
      const newOrder = {
        ...newOrderData,
        items: newItemsData.map((item: any) => ({
          ...item,
          id: item.id,
          productId: item.product_id,
          product: item.product
        }))
      };
      
      setOrders([...orders, newOrder]);
      return newOrder;
    } catch (error) {
      console.error('Error adding order:', error);
      toast({
        title: "Error",
        description: "Failed to add order.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update order
  const updateOrder = async (updatedOrder: Order): Promise<boolean> => {
    try {
      // Check if the order is in orders list or completedOrders
      const isCompletedOrder = completedOrders.some(o => o.id === updatedOrder.id);
      
      // Update the order details
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_id: updatedOrder.customerId,
          customer_order_number: updatedOrder.customerOrderNumber,
          order_date: updatedOrder.orderDate,
          required_date: updatedOrder.requiredDate,
          delivery_method: updatedOrder.deliveryMethod,
          notes: updatedOrder.notes,
          status: updatedOrder.status,
          picker: updatedOrder.picker,
          is_picked: updatedOrder.isPicked,
          total_blown_pouches: updatedOrder.totalBlownPouches,
          is_modified: updatedOrder.isModified,
          updated: new Date().toISOString(),
          batch_number: updatedOrder.batchNumber,
          has_changes: updatedOrder.hasChanges,
          picked_by: updatedOrder.pickedBy,
          picked_at: updatedOrder.pickedAt,
          picking_in_progress: updatedOrder.pickingInProgress,
          invoiced: updatedOrder.invoiced,
          invoice_number: updatedOrder.invoiceNumber,
          invoice_date: updatedOrder.invoiceDate
        })
        .eq('id', updatedOrder.id);
      
      if (orderError) throw orderError;
      
      // Handle item updates if they exist
      if (updatedOrder.items && updatedOrder.items.length > 0) {
        // Get existing items for this order
        const { data: existingItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', updatedOrder.id);
        
        if (itemsError) throw itemsError;
        
        // Create map of existing items by id
        const existingItemMap = new Map();
        existingItems.forEach((item: any) => {
          existingItemMap.set(item.id, item);
        });
        
        // Process each updated item
        for (const item of updatedOrder.items) {
          if (item.id && existingItemMap.has(item.id)) {
            // Update existing item
            const { error: updateItemError } = await supabase
              .from('order_items')
              .update({
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
              })
              .eq('id', item.id);
            
            if (updateItemError) throw updateItemError;
            
            // Remove from map to track what's been processed
            existingItemMap.delete(item.id);
          } else {
            // Insert new item
            const { error: insertItemError } = await supabase
              .from('order_items')
              .insert({
                order_id: updatedOrder.id,
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
              });
            
            if (insertItemError) throw insertItemError;
          }
        }
        
        // Delete any items that were removed
        if (existingItemMap.size > 0) {
          const itemsToDelete = Array.from(existingItemMap.keys());
          const { error: deleteItemsError } = await supabase
            .from('order_items')
            .delete()
            .in('id', itemsToDelete);
          
          if (deleteItemsError) throw deleteItemsError;
        }
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
        
        if (changesError) throw changesError;
      }
      
      // Update state based on whether it's a completed order or not
      if (isCompletedOrder) {
        setCompletedOrders(completedOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      } else {
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      // Delete order items first due to foreign key constraints
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;
      
      // Delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (orderError) throw orderError;
      
      setOrders(orders.filter(order => order.id !== orderId));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Complete order (move to completed orders)
  const completeOrder = async (order: Order): Promise<boolean> => {
    try {
      // Update order status to completed
      const updatedOrder = {
        ...order,
        status: "Completed",
        isPicked: true,
        pickedAt: order.pickedAt || new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: updatedOrder.status,
          is_picked: updatedOrder.isPicked,
          picked_at: updatedOrder.pickedAt,
          updated: updatedOrder.updated
        })
        .eq('id', order.id);
      
      if (error) throw error;
      
      // Remove from orders and add to completed orders
      setOrders(orders.filter(o => o.id !== order.id));
      setCompletedOrders([updatedOrder, ...completedOrders]);
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

  return {
    orders,
    completedOrders,
    setOrders,
    setCompletedOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    completeOrder
  };
};
