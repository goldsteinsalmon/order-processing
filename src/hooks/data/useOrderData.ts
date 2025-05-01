
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem } from "@/types";
import { adaptOrderToCamelCase, adaptOrderToSnakeCase } from "@/utils/typeAdapters";

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
          customer_id: order.customer_id,
          customer_order_number: order.customer_order_number,
          order_date: order.order_date,
          required_date: order.required_date,
          delivery_method: order.delivery_method,
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
        product_id: item.product_id,
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
      
      // Convert to our expected Order type
      const newOrder: Order = {
        id: newOrderData.id,
        customer_id: newOrderData.customer_id,
        customer: {
          id: newOrderData.customer.id,
          name: newOrderData.customer.name,
          email: newOrderData.customer.email,
          phone: newOrderData.customer.phone,
          address: newOrderData.customer.address,
          type: newOrderData.customer.type as "Private" | "Trade",
          accountNumber: newOrderData.customer.account_number,
          onHold: newOrderData.customer.on_hold,
          holdReason: newOrderData.customer.hold_reason,
          needsDetailedBoxLabels: newOrderData.customer.needs_detailed_box_labels
        },
        customer_order_number: newOrderData.customer_order_number,
        order_date: newOrderData.order_date,
        required_date: newOrderData.required_date,
        delivery_method: newOrderData.delivery_method as "Delivery" | "Collection",
        notes: newOrderData.notes,
        status: newOrderData.status as "Pending" | "Processing" | "Completed" | "Cancelled" | "Missing Items" | "Modified" | "Partially Picked",
        picker: newOrderData.picker,
        is_picked: newOrderData.is_picked || false,
        total_blown_pouches: newOrderData.total_blown_pouches || 0,
        is_modified: newOrderData.is_modified || false,
        created: newOrderData.created,
        updated: newOrderData.updated,
        batch_number: newOrderData.batch_number,
        has_changes: newOrderData.has_changes || false,
        from_standing_order: newOrderData.from_standing_order,
        picked_by: newOrderData.picked_by,
        picked_at: newOrderData.picked_at,
        picking_in_progress: newOrderData.picking_in_progress || false,
        invoiced: newOrderData.invoiced || false,
        invoice_number: newOrderData.invoice_number,
        invoice_date: newOrderData.invoice_date,
        items: newItemsData.map((item: any): OrderItem => ({
          id: item.id,
          product_id: item.product_id,
          order_id: item.order_id,
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            description: item.product.description,
            stock_level: item.product.stock_level,
            weight: item.product.weight,
            requires_weight_input: item.product.requires_weight_input || false,
            unit: item.product.unit,
            required: item.product.required || false
          },
          quantity: item.quantity,
          unavailable_quantity: item.unavailable_quantity,
          is_unavailable: item.is_unavailable,
          blown_pouches: item.blown_pouches,
          batch_number: item.batch_number,
          checked: item.checked,
          missing_quantity: item.missing_quantity,
          picked_quantity: item.picked_quantity,
          picked_weight: item.picked_weight,
          original_quantity: item.original_quantity,
          box_number: item.box_number,
          manual_weight: item.manual_weight
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
          customer_id: updatedOrder.customer_id,
          customer_order_number: updatedOrder.customer_order_number,
          order_date: updatedOrder.order_date,
          required_date: updatedOrder.required_date,
          delivery_method: updatedOrder.delivery_method,
          notes: updatedOrder.notes,
          status: updatedOrder.status,
          picker: updatedOrder.picker,
          is_picked: updatedOrder.is_picked,
          total_blown_pouches: updatedOrder.total_blown_pouches,
          is_modified: updatedOrder.is_modified,
          updated: new Date().toISOString(),
          batch_number: updatedOrder.batch_number,
          has_changes: updatedOrder.has_changes,
          picked_by: updatedOrder.picked_by,
          picked_at: updatedOrder.picked_at,
          picking_in_progress: updatedOrder.picking_in_progress,
          invoiced: updatedOrder.invoiced,
          invoice_number: updatedOrder.invoice_number,
          invoice_date: updatedOrder.invoice_date
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
                unavailable_quantity: item.unavailable_quantity,
                is_unavailable: item.is_unavailable,
                blown_pouches: item.blown_pouches,
                batch_number: item.batch_number,
                checked: item.checked,
                missing_quantity: item.missing_quantity,
                picked_quantity: item.picked_quantity,
                picked_weight: item.picked_weight,
                original_quantity: item.original_quantity,
                box_number: item.box_number,
                manual_weight: item.manual_weight
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
                product_id: item.product_id,
                quantity: item.quantity,
                unavailable_quantity: item.unavailable_quantity,
                is_unavailable: item.is_unavailable,
                blown_pouches: item.blown_pouches,
                batch_number: item.batch_number,
                checked: item.checked,
                missing_quantity: item.missing_quantity,
                picked_quantity: item.picked_quantity,
                picked_weight: item.picked_weight,
                original_quantity: item.original_quantity,
                box_number: item.box_number,
                manual_weight: item.manual_weight
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
      const updatedOrder: Order = {
        ...order,
        status: "Completed",
        is_picked: true,
        picked_at: order.picked_at || new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: updatedOrder.status,
          is_picked: updatedOrder.is_picked,
          picked_at: updatedOrder.picked_at,
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
