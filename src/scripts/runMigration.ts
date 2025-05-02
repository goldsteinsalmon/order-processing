
import { supabase } from "@/integrations/supabase/client";
import fs from 'fs';
import path from 'path';

export async function runOrderNumberMigration() {
  try {
    console.log("Running order number migration...");
    
    // Read migration SQL from file
    const migrationSQL = fs.readFileSync(path.resolve(__dirname, '../../supabase/migration.sql'), 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
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
