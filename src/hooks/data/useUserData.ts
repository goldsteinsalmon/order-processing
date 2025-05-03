import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useUserData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

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
      
      const newUser: User = {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        password: data[0].password,
        role: data[0].role as "Admin" | "User" | "Manager",
        active: data[0].active
      };
      
      setUsers([...users, newUser]);
      return newUser;
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

  // Create specific users
  const createPredefinedUsers = async (): Promise<boolean> => {
    try {
      // Create admin user
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: 'nick@goldsteinsalmon.co.uk',
        password: 'Bigfish1!',
        options: {
          data: {
            name: 'Nick',
            role: 'Admin'
          }
        }
      });
      
      if (adminError) throw adminError;
      
      // Create regular user
      const { data: userDate, error: userError } = await supabase.auth.signUp({
        email: 'factory@goldsteinsalmon.co.uk',
        password: 'password',
        options: {
          data: {
            name: 'Factory User',
            role: 'User'
          }
        }
      });
      
      if (userError) throw userError;
      
      // Add these users to our users table as well
      await supabase.from('users').insert([
        {
          id: adminData.user?.id,
          name: 'Nick',
          email: 'nick@goldsteinsalmon.co.uk',
          role: 'Admin',
          active: true
        }
      ]);
      
      await supabase.from('users').insert([
        {
          id: userDate.user?.id,
          name: 'Factory User',
          email: 'factory@goldsteinsalmon.co.uk',
          role: 'User',
          active: true
        }
      ]);
      
      // Update the local state
      await fetchUsers();
      
      return true;
    } catch (error) {
      console.error('Error creating predefined users:', error);
      toast({
        title: "Error",
        description: "Failed to create predefined users.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Fetch all users
  const fetchUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      
      setUsers(data as User[]);
      return data as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    users,
    setUsers,
    addUser,
    updateUser,
    deleteUser,
    createPredefinedUsers,
    fetchUsers
  };
};
