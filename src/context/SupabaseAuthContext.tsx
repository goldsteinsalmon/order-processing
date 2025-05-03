
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
      console.log("[SupabaseAuthContext] Auth event: SIGNED_IN, redirecting to orders");
      toast({
        title: "Signed in",
        description: "You have been signed in successfully.",
      });
      navigate('/orders');
    } else if (event === 'SIGNED_OUT') {
      console.log("[SupabaseAuthContext] Auth event: SIGNED_OUT, redirecting to login");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/login');
    }
  };

  useEffect(() => {
    let authListener: { data: { subscription: { unsubscribe: () => void } } };
    
    const initAuth = async () => {
      setIsLoading(true);
      console.log("[SupabaseAuthContext] Setting up auth state listener");
      
      try {
        // First set up the auth listener before checking session
        authListener = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log("[SupabaseAuthContext] Auth state change event:", event);
          
          // Always update state
          setSession(newSession);
          setUser(newSession?.user || null);
          
          // Handle events for navigation once app is initialized
          if (!isLoading && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
            console.log(`[SupabaseAuthContext] Auth event ${event} detected while app is running`);
            // Use a small timeout to ensure state is updated first
            setTimeout(() => {
              redirectAfterAuth(event);
            }, 100);
          }
        });
        
        // Then check for existing session
        console.log("[SupabaseAuthContext] Checking for existing session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[SupabaseAuthContext] Error getting session:", error);
          throw error;
        }
        
        console.log("[SupabaseAuthContext] Initial session check:", 
          data.session?.user?.id ? "User authenticated" : "No active session");
        
        setSession(data.session);
        setUser(data.session?.user || null);

      } catch (error) {
        console.error("[SupabaseAuthContext] Error during auth initialization:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to initialize authentication. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        console.log("[SupabaseAuthContext] Initial auth setup complete");
        setIsLoading(false);
      }
    };
    
    // Initialize auth
    initAuth();
    
    // Cleanup
    return () => {
      console.log("[SupabaseAuthContext] Cleaning up auth subscription");
      if (authListener) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log("[SupabaseAuthContext] Starting sign in process with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[SupabaseAuthContext] Error signing in:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log("[SupabaseAuthContext] Sign in API call successful, user ID:", data.user?.id);
      
      // Manually update the context state for immediate feedback
      setSession(data.session);
      setUser(data.user);
      
      return { success: true };
    } catch (error: any) {
      console.error('[SupabaseAuthContext] Unexpected error during sign in:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name: string, role: string = 'User') => {
    try {
      console.log("[SupabaseAuthContext] Starting sign up process with email:", email);
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
        console.error('[SupabaseAuthContext] Error signing up:', error.message);
        return { success: false, error: error.message };
      }

      // After sign up, create a new user in our users table
      const { error: userError } = await supabase
        .from('users')
        .insert([
          { email, name, role, active: true }
        ]);

      if (userError) {
        console.error('[SupabaseAuthContext] Error creating user record:', userError.message);
        return { success: false, error: userError.message };
      }

      console.log("[SupabaseAuthContext] Sign up successful, user ID:", data.user?.id);
      return { success: true };
    } catch (error: any) {
      console.error('[SupabaseAuthContext] Unexpected error during sign up:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("[SupabaseAuthContext] Starting sign out process...");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[SupabaseAuthContext] Error during signOut:", error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log("[SupabaseAuthContext] Sign out API call successful");
        // Manually clear user and session state for immediate feedback
        setUser(null);
        setSession(null);
        // Auth state listener will handle the redirect
      }
    } catch (error) {
      console.error("[SupabaseAuthContext] Exception during signOut:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
