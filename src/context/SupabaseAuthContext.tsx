
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state change:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Handle session changes
        if (event === 'SIGNED_IN') {
          toast({
            title: "Signed in",
            description: "You have been signed in successfully.",
          });
          navigate('/orders');
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
          navigate('/login');
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Current session:", currentSession);
      console.log("User metadata:", currentSession?.user?.user_metadata);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name: string, role: string = 'User') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          },
        },
      });

      if (error) {
        console.error('Error signing up:', error.message);
        return { success: false, error: error.message };
      }

      // After sign up, create a new user in our users table
      const { error: userError } = await supabase
        .from('users')
        .insert([
          { email, name, role, active: true }
        ]);

      if (userError) {
        console.error('Error creating user record:', userError.message);
        return { success: false, error: userError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};

export default SupabaseAuthProvider;
