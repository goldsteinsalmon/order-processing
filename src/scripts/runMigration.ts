import { supabase } from "@/integrations/supabase/client";
import fs from 'fs';
import path from 'path';

export async function runOrderNumberMigration() {
  try {
    console.log("Running order number migration...");
    
    // Read migration SQL from file (keeping this for reference)
    const migrationSQL = fs.readFileSync(path.resolve(__dirname, '../../supabase/migration.sql'), 'utf8');
    
    // Execute the migration by directly setting the sequence
    const { data, error } = await supabase.from('orders')
      .select('id')
      .limit(1)
      .then(async () => {
        // After successful connection test, run the actual migration
        return await supabase.rpc('set_order_number_sequence', { 
          start_value: 1000
        });
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
