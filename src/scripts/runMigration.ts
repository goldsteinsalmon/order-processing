
import { supabase } from "@/integrations/supabase/client";

export async function runOrderNumberMigration() {
  try {
    console.log("Running order number migration...");
    
    // Execute the migration using a raw SQL query since the TypeScript types 
    // for rpc are restricting the function calls
    const { data, error } = await supabase
      .rpc('set_order_number_sequence' as any, {
        start_value: 1000
      });
    
    if (error) {
      console.error("Error running migration:", error);
      return false;
    }
    
    console.log("Migration completed successfully:", data);
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}
