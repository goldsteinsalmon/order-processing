
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
    
    // Execute direct SQL query to set the sequence value instead of using the RPC function
    const { error: seqError } = await supabase.rpc(
      'execute_sql', 
      { 
        query: `SELECT setval('public.order_number_seq', ${startValue}, true)` 
      }
    );
    
    if (seqError) {
      // Fallback to raw query if the execute_sql function doesn't exist
      console.log("Trying direct SQL query...");
      const { error: rawError } = await supabase.from('_raw_queries')
        .select()
        .execute(`SELECT setval('public.order_number_seq', ${startValue}, true)`);
        
      if (rawError) {
        console.error("Error setting sequence with raw query:", rawError);
        return false;
      }
    }
    
    console.log(`Migration completed successfully. Next order will start with number: ${startValue + 1}`);
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}
