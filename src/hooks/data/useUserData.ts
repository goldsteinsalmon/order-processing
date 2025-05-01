
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export const useUserData = (toast: any) => {
  const [users, setUsers] = useState<User[]>([]);

  // Add user
  const addUser = async (user: User): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          active: user.active
        })
        .select();
      
      if (error) throw error;
      
      setUsers([...users, data[0]]);
      return data[0];
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update user
  const updateUser = async (user: User): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          active: user.active
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setUsers(users.map(u => u.id === user.id ? user : u));
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete user
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    users,
    setUsers,
    addUser,
    updateUser,
    deleteUser
  };
};
