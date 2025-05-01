
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.1';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Define types needed for the function
interface StandingOrder {
  id: string;
  customer_id: string;
  customer_order_number?: string;
  items: StandingOrderItem[];
  schedule: {
    frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    deliveryMethod: 'Delivery' | 'Collection';
    nextDeliveryDate: string;
  };
  notes?: string;
  active: boolean;
  next_processing_date: string;
  last_processed_date?: string;
}

interface StandingOrderItem {
  id: string;
  product_id: string;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Private' | 'Trade';
  account_number?: string;
  on_hold?: boolean;
  hold_reason?: string;
  needs_detailed_box_labels?: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  stock_level: number;
  weight?: number;
  requires_weight_input?: boolean;
  unit?: string;
  required?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Process standing orders function started');
    
    // Create Supabase client with service role key for full database access
    const supabaseUrl = 'https://qrchywnyoqcwwfkxzsja.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Processing standing orders for date: ${today.toISOString()}`);

    // Fetch active standing orders that need processing
    // (Their next processing date is today or before today)
    const { data: standingOrders, error: standingOrdersError } = await supabase
      .from('standing_orders')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('active', true)
      .lte('next_processing_date', today.toISOString());

    if (standingOrdersError) {
      throw new Error(`Error fetching standing orders: ${standingOrdersError.message}`);
    }

    console.log(`Found ${standingOrders ? standingOrders.length : 0} standing orders to process`);

    if (!standingOrders || standingOrders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No standing orders to process',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each standing order
    let processedCount = 0;
    const results = [];

    for (const standingOrder of standingOrders) {
      try {
        // Fetch standing order items with product details
        const { data: standingOrderItems, error: itemsError } = await supabase
          .from('standing_order_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('standing_order_id', standingOrder.id);

        if (itemsError) {
          throw new Error(`Error fetching items for standing order ${standingOrder.id}: ${itemsError.message}`);
        }

        if (!standingOrderItems || standingOrderItems.length === 0) {
          console.log(`Standing order ${standingOrder.id} has no items, skipping`);
          continue;
        }

        // Calculate delivery date based on standing order schedule
        const deliveryDate = new Date(standingOrder.schedule.nextDeliveryDate);
        
        // Calculate required date (1 day before delivery date)
        const requiredDate = new Date(deliveryDate);
        requiredDate.setDate(requiredDate.getDate() - 1);

        // Create new order
        const newOrder = {
          customer_id: standingOrder.customer_id,
          customer_order_number: standingOrder.customer_order_number,
          order_date: new Date().toISOString(),
          required_date: requiredDate.toISOString(),
          delivery_method: standingOrder.schedule.deliveryMethod,
          notes: standingOrder.notes,
          status: 'Pending',
          from_standing_order: standingOrder.id,
          created: new Date().toISOString()
        };

        // Insert the new order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([newOrder])
          .select();

        if (orderError) {
          throw new Error(`Error creating order from standing order ${standingOrder.id}: ${orderError.message}`);
        }

        if (!orderData || orderData.length === 0) {
          throw new Error(`Failed to create order from standing order ${standingOrder.id}`);
        }

        const newOrderId = orderData[0].id;

        // Prepare order items
        const orderItemsToInsert = standingOrderItems.map(item => ({
          order_id: newOrderId,
          product_id: item.product_id,
          quantity: item.quantity,
          original_quantity: item.quantity
        }));

        // Insert order items
        const { error: itemsInsertError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsInsertError) {
          throw new Error(`Error inserting items for order ${newOrderId}: ${itemsInsertError.message}`);
        }

        // Calculate the next delivery date based on frequency
        let nextDeliveryDate = new Date(standingOrder.schedule.nextDeliveryDate);
        
        if (standingOrder.schedule.frequency === 'Weekly') {
          nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
        } else if (standingOrder.schedule.frequency === 'Bi-Weekly') {
          nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 14);
        } else if (standingOrder.schedule.frequency === 'Monthly') {
          nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
        }

        // Calculate next processing date (2 days before next delivery date)
        const nextProcessingDate = new Date(nextDeliveryDate);
        nextProcessingDate.setDate(nextProcessingDate.getDate() - 2);

        // Update the standing order with new dates
        const { error: updateError } = await supabase
          .from('standing_orders')
          .update({
            last_processed_date: today.toISOString(),
            next_delivery_date: nextDeliveryDate.toISOString(),
            next_processing_date: nextProcessingDate.toISOString()
          })
          .eq('id', standingOrder.id);

        if (updateError) {
          throw new Error(`Error updating standing order ${standingOrder.id}: ${updateError.message}`);
        }

        processedCount++;
        results.push({
          standingOrderId: standingOrder.id,
          orderId: newOrderId,
          success: true
        });
        
        console.log(`Successfully processed standing order ${standingOrder.id}, created order ${newOrderId}`);
      } catch (error) {
        console.error(`Error processing standing order ${standingOrder.id}:`, error.message);
        results.push({
          standingOrderId: standingOrder.id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`Completed processing. Successfully processed ${processedCount} of ${standingOrders.length} standing orders`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully processed ${processedCount} of ${standingOrders.length} standing orders`,
        processed: processedCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-standing-orders function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
