
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export const userService = {
  // Fetch users from both auth and local table
  fetchUsers: async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("name");

      if (error) throw error;

      return data as User[];
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Add user to both auth and local table
  addUser: async (user: Partial<User>) => {
    try {
      // Call edge function to create the user in auth
      const response = await fetch(
        "https://qrchywnyoqcwwfkxzsja.supabase.co/functions/v1/manage-users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            action: "create",
            userData: {
              email: user.email,
              password: user.password,
              name: user.name,
              role: user.role,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user in auth");
      }

      const authResult = await response.json();
      
      // Now create the user in our local table too
      const { data, error } = await supabase.from("users").insert([
        {
          id: authResult.user.user.id, // Use the ID from auth
          name: user.name,
          email: user.email,
          role: user.role,
          active: true,
          // Don't store the password in our users table
        },
      ]).select();

      if (error) throw error;
      
      return data[0] as User;
    } catch (error) {
      console.error("Error adding user:", error);
      throw error;
    }
  },

  // Update user in both auth and local table
  updateUser: async (user: User) => {
    try {
      // Call edge function to update the user in auth
      const response = await fetch(
        "https://qrchywnyoqcwwfkxzsja.supabase.co/functions/v1/manage-users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            action: "update",
            userData: {
              id: user.id,
              email: user.email,
              password: user.password, // Will be ignored if empty
              name: user.name,
              role: user.role,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user in auth");
      }

      // Now update the user in our local table too
      const { error } = await supabase
        .from("users")
        .update({
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          // Don't update password in our users table
        })
        .eq("id", user.id);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Delete user from both auth and local table
  deleteUser: async (userId: string) => {
    try {
      // Call edge function to delete the user in auth
      const response = await fetch(
        "https://qrchywnyoqcwwfkxzsja.supabase.co/functions/v1/manage-users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            action: "delete",
            userData: { id: userId },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user in auth");
      }

      // Now delete the user from our local table too
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Toggle active state of user in both auth and local table
  toggleUserActive: async (user: User) => {
    try {
      // Call edge function to toggle the active state in auth
      const response = await fetch(
        "https://qrchywnyoqcwwfkxzsja.supabase.co/functions/v1/manage-users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            action: "toggle-active",
            userData: { id: user.id, active: !user.active },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user active state in auth");
      }

      // Now update the active state in our local table too
      const { error } = await supabase
        .from("users")
        .update({ active: !user.active })
        .eq("id", user.id);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw error;
    }
  },
};
