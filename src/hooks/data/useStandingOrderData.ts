
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StandingOrder, Order } from "@/types";
import { format, addDays, addWeeks, addMonths, parseISO } from "date-fns";

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
      
      const newStandingOrder = {
        ...newSOData,
        items: newItemsData.map((item: any) => ({
          ...item,
          id: item.id,
          productId: item.product_id,
          product: item.product
        })),
        schedule: {
          frequency: newSOData.frequency,
          dayOfWeek: newSOData.day_of_week,
          dayOfMonth: newSOData.day_of_month,
          deliveryMethod: newSOData.delivery_method,
          nextDeliveryDate: newSOData.next_delivery_date
        }
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

  // Process standing orders (create orders from standing orders)
  const processStandingOrders = async (): Promise<void> => {
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Find active standing orders that need processing
      const standingOrdersToProcess = standingOrders.filter(so => 
        so.active && 
        so.schedule.nextDeliveryDate && 
        format(parseISO(so.schedule.nextDeliveryDate), 'yyyy-MM-dd') <= todayStr &&
        !so.lastProcessedDate
      );
      
      // Process each standing order
      for (const standingOrder of standingOrdersToProcess) {
        // Create a new order from the standing order
        const newOrder: Order = {
          id: "", // Will be generated by Supabase
          customerId: standingOrder.customerId,
          customer: standingOrder.customer,
          customerOrderNumber: standingOrder.customerOrderNumber,
          orderDate: new Date().toISOString(),
          requiredDate: standingOrder.schedule.nextDeliveryDate,
          deliveryMethod: standingOrder.schedule.deliveryMethod,
          items: standingOrder.items.map(item => ({
            id: "", // Will be generated by Supabase
            productId: item.productId,
            product: item.product,
            quantity: item.quantity
          })),
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
            case "Monthly":
              nextDeliveryDate = addMonths(parseISO(standingOrder.schedule.nextDeliveryDate as string), 1);
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
