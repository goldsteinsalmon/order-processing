
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any; data: any }>;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log("[SupabaseAuthContext] Provider initializing");
  
  useEffect(() => {
    // This function will be called once on mount to set up auth
    const setupAuth = async () => {
      try {
        setIsLoading(true);
        console.log("[SupabaseAuthContext] Setting up auth, current URL:", window.location.href);
        
        // First, check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[SupabaseAuthContext] Session error:", sessionError);
          return;
        }
        
        if (sessionData?.session) {
          console.log("[SupabaseAuthContext] Found existing session:", sessionData.session.user.email);
          setSession(sessionData.session);
          setUser(sessionData.session.user);
        } else {
          console.log("[SupabaseAuthContext] No existing session found");
        }
      } catch (error) {
        console.error("[SupabaseAuthContext] Setup error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`[SupabaseAuthContext] Auth state change event: ${event}`, currentSession?.user?.email);
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        if (event === 'SIGNED_IN' && window.location.pathname === '/login') {
          console.log("[SupabaseAuthContext] User signed in, redirecting from login");
          navigate('/orders');
        }
      } else {
        setSession(null);
        setUser(null);
        
        if (event === 'SIGNED_OUT') {
          console.log("[SupabaseAuthContext] User signed out, redirecting to login");
          navigate('/login');
        }
      }
    });
    
    // Run setup
    setupAuth();
    
    // Clean up listener on unmount
    return () => {
      console.log("[SupabaseAuthContext] Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  const signIn = async (email: string, password: string) => {
    console.log("[SupabaseAuthContext] Attempting sign in:", email);
    
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        console.error("[SupabaseAuthContext] Sign in error:", result.error.message);
      } else if (result.data?.session) {
        console.log("[SupabaseAuthContext] Sign in successful, session acquired");
        setSession(result.data.session);
        setUser(result.data.session.user);
      }
      
      return result;
    } catch (error) {
      console.error("[SupabaseAuthContext] Unexpected sign in error:", error);
      return { error, data: null };
    }
  };
  
  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("[SupabaseAuthContext] Signing out");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[SupabaseAuthContext] Sign out error:", error.message);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully.",
        });
        // Auth state change will handle redirect
      }
    } catch (error) {
      console.error("[SupabaseAuthContext] Unexpected sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    user,
    session,
    isLoading,
    signOut,
    signIn
  };
  
  console.log("[SupabaseAuthContext] Providing context:", { 
    isAuthenticated: !!session,
    isLoading,
    userEmail: user?.email || 'none'
  });
  
  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export default SupabaseAuthProvider;
