
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, isLoading: authLoading } = useSupabaseAuth();

  // Check if already logged in
  useEffect(() => {
    console.log("[LoginPage] Component mounted, user status:", { 
      hasUser: !!user, 
      isAuthLoading: authLoading 
    });
    
    if (user && !authLoading) {
      console.log("[LoginPage] User already logged in, redirecting");
      navigate("/orders", { replace: true });
    }
  }, [user, authLoading, navigate]);

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
      
      const { data, error } = await signIn(email, password);
      
      // Handle authentication error
      if (error) {
        console.error("[LoginPage] Login error:", error.message);
        setLoginError(error.message || "Invalid email or password");
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
        return;
      }
      
      // Handle successful authentication
      if (data?.session) {
        console.log("[LoginPage] Login successful, session acquired");
        toast({
          title: "Success",
          description: "Login successful!",
        });
        
        // Navigation will be handled by the auth context
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

  // If auth is still loading, show a loading indicator
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading authentication...</p>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (user) {
    return null;
  }

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
