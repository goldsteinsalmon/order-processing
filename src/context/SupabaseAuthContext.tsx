
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
  
  useEffect(() => {
    console.log("[SupabaseAuthContext] Initializing auth provider");
    
    // First check for an existing session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[SupabaseAuthContext] Session error:", sessionError.message);
          setIsLoading(false);
          return;
        }
        
        if (sessionData?.session) {
          console.log("[SupabaseAuthContext] Found existing session:", sessionData.session.user.email);
          setSession(sessionData.session);
          setUser(sessionData.session.user);
        } else {
          console.log("[SupabaseAuthContext] No session found");
          setSession(null);
          setUser(null);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("[SupabaseAuthContext] Error initializing auth:", error);
        setIsLoading(false);
      }
    };
    
    // Initialize auth state
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`[SupabaseAuthContext] Auth event: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === 'SIGNED_IN') {
          console.log("[SupabaseAuthContext] User signed in:", currentSession?.user?.email);
          
          // If on login page, redirect to orders
          if (window.location.pathname === '/login') {
            navigate('/orders', { replace: true });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("[SupabaseAuthContext] User signed out");
        setSession(null);
        setUser(null);
        navigate('/login', { replace: true });
      }
    });
    
    // Clean up listener on unmount
    return () => {
      console.log("[SupabaseAuthContext] Cleaning up auth provider");
      subscription.unsubscribe();
    };
  }, [navigate]);
  
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
        // Auth listener will handle redirect
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
    signOut
  };
  
  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export default SupabaseAuthProvider;
