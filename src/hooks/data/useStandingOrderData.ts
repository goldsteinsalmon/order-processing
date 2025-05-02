
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StandingOrder, Order, StandingOrderItem } from "@/types";
import { format, addDays, addWeeks, parseISO } from "date-fns";

export const useStandingOrderData = (toast: any, addOrder: (order: Order) => Promise<Order | null>) => {
  const [standingOrders, setStandingOrders] = useState<StandingOrder[]>([]);

  // Add standing order
  const addStandingOrder = async (standingOrder: StandingOrder): Promise<StandingOrder | null> => {
    try {
      // Insert standing order
      const { data: soData, error: soError } = await supabase
        .from('standing_orders')
        .insert({
          customer_id: standingOrder.customerId,
          customer_order_number: standingOrder.customerOrderNumber,
          frequency: standingOrder.schedule.frequency,
          day_of_week: standingOrder.schedule.dayOfWeek,
          day_of_month: standingOrder.schedule.dayOfMonth,
          delivery_method: standingOrder.schedule.deliveryMethod,
          next_delivery_date: standingOrder.schedule.nextDeliveryDate,
          notes: standingOrder.notes,
          active: standingOrder.active,
          created: new Date().toISOString()
        })
        .select();
      
      if (soError) throw soError;
      
      const newStandingOrderId = soData[0].id;
      
      // Insert standing order items
      const soItemsToInsert = standingOrder.items.map(item => ({
        standing_order_id: newStandingOrderId,
        product_id: item.productId,
        quantity: item.quantity
      }));
      
      const { error: itemsError } = await supabase
        .from('standing_order_items')
        .insert(soItemsToInsert);
      
      if (itemsError) throw itemsError;
      
      // Fetch the newly created standing order with joined customer
      const { data: newSOData, error: fetchError } = await supabase
        .from('standing_orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', newStandingOrderId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Fetch the standing order items with joined product
      const { data: newItemsData, error: newItemsError } = await supabase
        .from('standing_order_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('standing_order_id', newStandingOrderId);
      
      if (newItemsError) throw newItemsError;
      
      // Map to our expected StandingOrder type
      const newStandingOrder: StandingOrder = {
        id: newSOData.id,
        customerId: newSOData.customer_id,
        customer: {
          id: newSOData.customer.id,
          name: newSOData.customer.name,
          email: newSOData.customer.email,
          phone: newSOData.customer.phone,
          address: newSOData.customer.address,
          type: newSOData.customer.type as "Private" | "Trade",
          accountNumber: newSOData.customer.account_number,
          onHold: newSOData.customer.on_hold,
          holdReason: newSOData.customer.hold_reason,
          needsDetailedBoxLabels: newSOData.customer.needs_detailed_box_labels
        },
        customerOrderNumber: newSOData.customer_order_number,
        schedule: {
          frequency: newSOData.frequency as "Weekly" | "Bi-Weekly" | "Monthly",
          dayOfWeek: newSOData.day_of_week,
          dayOfMonth: newSOData.day_of_month,
          deliveryMethod: newSOData.delivery_method as "Delivery" | "Collection",
          nextDeliveryDate: newSOData.next_delivery_date,
          modifiedDeliveries: [] // Initialize with empty array
        },
        items: mapStandingOrderItemsToClient(newItemsData),
        notes: newSOData.notes,
        active: newSOData.active || true,
        nextProcessingDate: newSOData.next_processing_date,
        lastProcessedDate: newSOData.last_processed_date
      };
      
      setStandingOrders([...standingOrders, newStandingOrder]);
      return newStandingOrder;
    } catch (error) {
      console.error('Error adding standing order:', error);
      toast({
        title: "Error",
        description: "Failed to add standing order.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update standing order
  const updateStandingOrder = async (standingOrder: StandingOrder): Promise<boolean> => {
    try {
      // Update standing order
      const { error: soError } = await supabase
        .from('standing_orders')
        .update({
          customer_id: standingOrder.customerId,
          customer_order_number: standingOrder.customerOrderNumber,
          frequency: standingOrder.schedule.frequency,
          day_of_week: standingOrder.schedule.dayOfWeek,
          day_of_month: standingOrder.schedule.dayOfMonth,
          delivery_method: standingOrder.schedule.deliveryMethod,
          next_delivery_date: standingOrder.schedule.nextDeliveryDate,
          notes: standingOrder.notes,
          active: standingOrder.active,
          updated: new Date().toISOString()
        })
        .eq('id', standingOrder.id);
      
      if (soError) throw soError;
      
      // Handle item updates
      // First delete existing items
      const { error: deleteItemsError } = await supabase
        .from('standing_order_items')
        .delete()
        .eq('standing_order_id', standingOrder.id);
      
      if (deleteItemsError) throw deleteItemsError;
      
      // Then insert updated items
      const soItemsToInsert = standingOrder.items.map(item => ({
        standing_order_id: standingOrder.id,
        product_id: item.productId,
        quantity: item.quantity
      }));
      
      const { error: insertItemsError } = await supabase
        .from('standing_order_items')
        .insert(soItemsToInsert);
      
      if (insertItemsError) throw insertItemsError;
      
      // Update local state
      setStandingOrders(standingOrders.map(so => 
        so.id === standingOrder.id ? standingOrder : so
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating standing order:', error);
      toast({
        title: "Error",
        description: "Failed to update standing order.",
        variant: "destructive",
      });
      return false;
    }
  };

  const mapStandingOrderItemsToClient = (items: any[]): StandingOrderItem[] => {
    return items.map(item => ({
      id: item.id,
      productId: item.product_id,
      standingOrderId: item.standing_order_id,
      product: {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        description: item.product.description,
        stock_level: item.product.stock_level,
        weight: item.product.weight,
        requiresWeightInput: item.product.requires_weight_input,
        unit: item.product.unit,
        required: item.product.required
      },
      quantity: item.quantity
    }));
  };

  // Process standing orders (create orders from standing orders)
  const processStandingOrders = async (): Promise<void> => {
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Find active standing orders that need processing
      const standingOrdersToProcess = standingOrders.filter(so => 
        so.active && 
        so.schedule?.nextDeliveryDate && 
        format(parseISO(so.schedule.nextDeliveryDate), 'yyyy-MM-dd') <= todayStr &&
        !so.lastProcessedDate
      );
      
      // Process each standing order
      for (const standingOrder of standingOrdersToProcess) {
        if (!standingOrder.schedule) {
          console.error('Standing order missing schedule:', standingOrder.id);
          continue;
        }

        const newOrderId = crypto.randomUUID();
        const orderDate = new Date().toISOString();
        const deliveryDate = standingOrder.schedule.nextDeliveryDate;

        const standingOrderItems = standingOrder.items;

        const orderItems = standingOrderItems.map(item => ({
          id: crypto.randomUUID(),
          orderId: newOrderId,
          productId: item.productId,
          product: item.product,
          quantity: item.quantity
        }));
        
        // Create a new order from the standing order
        const newOrder: Order = {
          id: newOrderId,
          customerId: standingOrder.customerId,
          customer: standingOrder.customer,
          customerOrderNumber: standingOrder.customerOrderNumber,
          orderDate: orderDate,
          requiredDate: deliveryDate,
          deliveryMethod: standingOrder.schedule.deliveryMethod,
          items: orderItems,
          notes: standingOrder.notes,
          status: "Pending",
          created: new Date().toISOString(),
          fromStandingOrder: standingOrder.id
        };
        
        // Add the order
        const createdOrder = await addOrder(newOrder);
        
        if (createdOrder) {
          // Update the standing order with the new next delivery date
          let nextDeliveryDate = null;
          
          switch (standingOrder.schedule.frequency) {
            case "Weekly":
              nextDeliveryDate = addDays(parseISO(standingOrder.schedule.nextDeliveryDate as string), 7);
              break;
            case "Bi-Weekly":
              nextDeliveryDate = addWeeks(parseISO(standingOrder.schedule.nextDeliveryDate as string), 2);
              break;
            case "Monthly": // This is now treated as Every 4 Weeks
              nextDeliveryDate = addWeeks(parseISO(standingOrder.schedule.nextDeliveryDate as string), 4);
              break;
          }
          
          // Update the standing order
          const { error: updateError } = await supabase
            .from('standing_orders')
            .update({
              next_delivery_date: nextDeliveryDate?.toISOString(),
              last_processed_date: today.toISOString()
            })
            .eq('id', standingOrder.id);
          
          if (updateError) {
            console.error('Error updating standing order after processing:', updateError);
          } else {
            // Update local standing order state
            setStandingOrders(standingOrders.map(so => {
              if (so.id === standingOrder.id) {
                return {
                  ...so,
                  schedule: {
                    ...so.schedule,
                    nextDeliveryDate: nextDeliveryDate?.toISOString()
                  },
                  lastProcessedDate: today.toISOString()
                };
              }
              return so;
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error processing standing orders:', error);
      toast({
        title: "Error",
        description: "Failed to process standing orders.",
        variant: "destructive",
      });
    }
  };

  return {
    standingOrders,
    setStandingOrders,
    addStandingOrder,
    updateStandingOrder,
    processStandingOrders
  };
};
