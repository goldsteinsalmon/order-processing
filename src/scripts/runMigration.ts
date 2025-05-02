
import { supabase } from "@/integrations/supabase/client";

export async function runOrderNumberMigration() {
  try {
    console.log("Running order number migration...");
    
    // Run a direct SQL query to set the sequence value since the RPC call is having issues
    const { data, error } = await supabase.from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error checking current sequence:", error);
      return false;
    }
    
    console.log("Current highest order number:", data?.order_number || 0);
    
    // Set the sequence to start at 1000 (or higher if there are existing orders)
    const startValue = Math.max(1000, data?.order_number || 0);
    
    // Execute the SQL statement to set the sequence
    const { error: seqError } = await supabase.rpc('set_order_number_sequence', {
      start_value: startValue
    });
    
    if (seqError) {
      console.error("Error setting sequence:", seqError);
      return false;
    }
    
    console.log(`Migration completed successfully. Next order will start with number: ${startValue + 1}`);
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}
