
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || "";

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, userData } = await req.json();
    
    // Check that the required parameters are present
    if (!action || !userData) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result;

    // Perform the requested action
    switch (action) {
      case "create": {
        // Create a new user with the admin API
        const { email, password, name, role } = userData;
        
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role },
        });

        if (createError) {
          throw createError;
        }

        result = { user: authUser };
        break;
      }

      case "update": {
        // Update an existing user with the admin API
        const { id, email, password, name, role } = userData;
        
        const updateData = {
          email,
          user_metadata: { name, role },
        };

        // Only include password if it's provided (not empty)
        if (password) {
          updateData['password'] = password;
        }

        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          id,
          updateData
        );

        if (updateError) {
          throw updateError;
        }

        result = { user: updatedUser };
        break;
      }

      case "delete": {
        // Delete a user with the admin API
        const { id } = userData;
        
        const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

        if (deleteError) {
          throw deleteError;
        }

        result = { success: true };
        break;
      }

      case "toggle-active": {
        // Disable or enable a user account
        const { id, active } = userData;
        
        // If active is true, we want to enable the account
        // If active is false, we want to disable the account
        const { data: updatedUser, error: toggleError } = await supabase.auth.admin.updateUserById(
          id,
          { ban_duration: active ? "none" : "87600h" } // If not active, ban for 10 years (effectively disabling)
        );

        if (toggleError) {
          throw toggleError;
        }

        result = { user: updatedUser };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    // Return the result
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Return any errors
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
