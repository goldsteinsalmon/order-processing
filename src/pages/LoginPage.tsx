
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for existing session on component mount
  useEffect(() => {
    console.log("[LoginPage] Component mounted, checking for session");
    
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[LoginPage] Error checking session:", error.message);
          return;
        }
        
        if (data?.session) {
          console.log("[LoginPage] Existing session found, redirecting to /orders");
          navigate("/orders", { replace: true });
        } else {
          console.log("[LoginPage] No active session found, staying on login page");
        }
      } catch (err) {
        console.error("[LoginPage] Unexpected error checking session:", err);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setLoginError("");
    
    // Validate inputs
    if (!email || !password) {
      setLoginError("Please enter both email and password");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("[LoginPage] Attempting login with email:", email);
      
      // Perform authentication
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      // Handle authentication error
      if (error) {
        console.error("[LoginPage] Login error:", error.message);
        setLoginError(error.message || "Invalid email or password");
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Handle successful authentication
      if (data.session) {
        console.log("[LoginPage] Login successful, user:", data.user?.email);
        toast({
          title: "Success",
          description: "Login successful!",
        });
        
        // Auth listener will handle the redirect
        // But we'll navigate directly too as a fallback
        navigate("/orders", { replace: true });
      } else {
        console.error("[LoginPage] No session returned after login");
        setLoginError("Login failed. Please try again.");
      }
    } catch (error: any) {
      console.error("[LoginPage] Unexpected error during login:", error);
      setLoginError("An unexpected error occurred");
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Order Management System</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              {/* Show any login errors */}
              {loginError && (
                <div className="text-sm font-medium text-red-500">
                  {loginError}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
              
              {isLoading && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  Verifying your credentials...
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
