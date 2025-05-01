
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";
import { format, addDays, addWeeks, addMonths } from "https://esm.sh/date-fns@2.29.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client with the service role key for admin privileges
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Process standing orders function triggered");
    
    // Get all active standing orders due for processing
    const today = new Date();
    const formattedToday = format(today, "yyyy-MM-dd");
    
    console.log(`Looking for standing orders due by ${formattedToday}`);
    
    const { data: standingOrders, error: standingOrdersError } = await adminClient
      .from('standing_orders')
      .select(`
        *,
        customer:customers(*),
        items:standing_order_items(
          *,
          product:products(*)
        )
      `)
      .eq('active', true)
      .lte('next_delivery_date', formattedToday)
      .is('last_processed_date', null)
      .order('next_delivery_date');
    
    if (standingOrdersError) {
      throw standingOrdersError;
    }
    
    console.log(`Found ${standingOrders?.length || 0} standing orders to process`);
    
    // Process each standing order
    const results = [];
    if (standingOrders && standingOrders.length > 0) {
      for (const standingOrder of standingOrders) {
        console.log(`Processing standing order: ${standingOrder.id}`);
        
        try {
          // Create a new order from the standing order
          const orderItems = standingOrder.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }));
          
          const { data: orderData, error: orderError } = await adminClient
            .from('orders')
            .insert({
              customer_id: standingOrder.customer_id,
              customer_order_number: standingOrder.customer_order_number,
              order_date: new Date().toISOString(),
              required_date: standingOrder.next_delivery_date,
              delivery_method: standingOrder.delivery_method,
              notes: standingOrder.notes,
              status: "Pending",
              from_standing_order: standingOrder.id,
              created: new Date().toISOString()
            })
            .select()
            .single();
          
          if (orderError) {
            throw orderError;
          }
          
          // Add order items
          const orderItemsWithOrderId = orderItems.map(item => ({
            ...item,
            order_id: orderData.id,
            original_quantity: item.quantity
          }));
          
          const { error: itemsError } = await adminClient
            .from('order_items')
            .insert(orderItemsWithOrderId);
          
          if (itemsError) {
            throw itemsError;
          }
          
          // Calculate next delivery date
          let nextDeliveryDate = null;
          
          switch (standingOrder.frequency) {
            case "Weekly":
              nextDeliveryDate = addDays(new Date(standingOrder.next_delivery_date), 7);
              break;
            case "Bi-Weekly":
              nextDeliveryDate = addWeeks(new Date(standingOrder.next_delivery_date), 2);
              break;
            case "Monthly":
              nextDeliveryDate = addMonths(new Date(standingOrder.next_delivery_date), 1);
              break;
            default:
              throw new Error(`Unknown frequency: ${standingOrder.frequency}`);
          }
          
          // Update the standing order
          const { error: updateError } = await adminClient
            .from('standing_orders')
            .update({
              next_delivery_date: nextDeliveryDate.toISOString(),
              last_processed_date: today.toISOString()
            })
            .eq('id', standingOrder.id);
          
          if (updateError) {
            throw updateError;
          }
          
          // Add to processed dates
          const { error: processedDateError } = await adminClient
            .from('processed_dates')
            .insert({
              standing_order_id: standingOrder.id,
              processed_date: today.toISOString()
            });
          
          if (processedDateError) {
            throw processedDateError;
          }
          
          results.push({
            standing_order_id: standingOrder.id,
            new_order_id: orderData.id,
            status: "success",
            next_delivery_date: nextDeliveryDate
          });
          
          console.log(`Successfully processed standing order ${standingOrder.id}`);
          console.log(`Created order ${orderData.id}`);
          console.log(`Next delivery date: ${nextDeliveryDate}`);
          
        } catch (err) {
          console.error(`Error processing standing order ${standingOrder.id}:`, err);
          results.push({
            standing_order_id: standingOrder.id,
            status: "error",
            error: err.message
          });
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} standing orders`,
        results
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in process-standing-orders function:", error);
    
    return new Response(
      JSON.stringify({
        message: "Error processing standing orders",
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
});
