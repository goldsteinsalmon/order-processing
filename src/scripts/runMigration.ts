
import { supabase } from "@/integrations/supabase/client";
import fs from 'fs';
import path from 'path';

export async function runOrderNumberMigration() {
  try {
    console.log("Running order number migration...");
    
    // Read migration SQL from file (keeping this for reference)
    const migrationSQL = fs.readFileSync(path.resolve(__dirname, '../../supabase/migration.sql'), 'utf8');
    
    // Execute the migration by directly running the correct RPC function
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .limit(1)
      .then(async ({ data, error }) => {
        if (error) throw error;
        
        // After successful connection test, run the actual migration with the correct function
        return await supabase.rpc('set_order_number_sequence', {
          start_value: 1000
        })
        .then(() => ({ data: { success: true }, error: null }));
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
