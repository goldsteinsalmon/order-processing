
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
    let mounted = true;
    
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`[SupabaseAuthContext] Auth event: ${event}`);
      
      if (!mounted) return;
      
      if (currentSession) {
        setUser(currentSession.user);
        setSession(currentSession);
        console.log("[SupabaseAuthContext] Session updated:", currentSession.user.email);
      } else {
        setUser(null);
        setSession(null);
        console.log("[SupabaseAuthContext] Session cleared");
      }
      
      // Handle navigation based on auth events
      if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });
    
    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[SupabaseAuthContext] Error checking session:", error.message);
          throw error;
        }
        
        if (mounted) {
          if (data.session) {
            console.log("[SupabaseAuthContext] Found existing session:", data.session.user.email);
            setUser(data.session.user);
            setSession(data.session);
          } else {
            console.log("[SupabaseAuthContext] No session found");
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[SupabaseAuthContext] Session check error:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkSession();
    
    return () => {
      console.log("[SupabaseAuthContext] Cleaning up auth provider");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  // Simple sign out function
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
        console.log("[SupabaseAuthContext] Sign out successful");
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
