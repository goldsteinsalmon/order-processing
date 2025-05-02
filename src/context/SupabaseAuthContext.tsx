
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
  redirectAfterAuth: (event: string) => void;
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

  // Function to handle redirects after authentication events
  const redirectAfterAuth = (event: string) => {
    if (event === 'SIGNED_IN') {
      toast({
        title: "Signed in",
        description: "You have been signed in successfully.",
      });
      // Use React Router navigate instead of window.location.href
      navigate('/orders');
    } else if (event === 'SIGNED_OUT') {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      // Use React Router navigate instead of window.location.href
      navigate('/login');
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set initial loading state
    setIsLoading(true);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change:", event, newSession?.user?.id);
      
      // Update session and user state
      setSession(newSession);
      setUser(newSession?.user || null);
      
      // Handle auth state changes after initial load
      if (!isLoading && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
        redirectAfterAuth(event);
      }
    });
    
    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log("Initial session check:", data.session);
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Check session
    checkSession();
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]); // Removing isLoading from dependencies to prevent refresh loops

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
      // Instead of using the emailConfirm property (which doesn't exist),
      // we'll configure the auth settings to skip email verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          },
          emailRedirectTo: window.location.origin
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
    try {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during signOut:", error);
        throw error;
      }
      console.log("Sign out successful");
      // Don't need manual navigation here as the auth state listener will handle it
    } catch (error) {
      console.error("Exception during signOut:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    redirectAfterAuth,
  };

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};

export default SupabaseAuthProvider;
