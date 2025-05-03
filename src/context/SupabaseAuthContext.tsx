
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
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`[SupabaseAuthContext] Auth event: ${event}`);
      
      if (event === 'SIGNED_IN') {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        console.log("[SupabaseAuthContext] User signed in:", currentSession?.user?.email);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        console.log("[SupabaseAuthContext] User signed out");
        navigate('/login');
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        console.log("[SupabaseAuthContext] Token refreshed");
      }
    });
    
    // Then check for an existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[SupabaseAuthContext] Error checking session:", error.message);
          setIsLoading(false);
          return;
        }
        
        if (data.session) {
          console.log("[SupabaseAuthContext] Found existing session:", data.session.user.email);
          setUser(data.session.user);
          setSession(data.session);
        } else {
          console.log("[SupabaseAuthContext] No session found");
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("[SupabaseAuthContext] Session check error:", error);
        setIsLoading(false);
      }
    };
    
    checkSession();
    
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
