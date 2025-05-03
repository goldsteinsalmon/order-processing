
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const { signIn, session, user } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get redirect path from location state or default to "/orders"
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/orders";

  useEffect(() => {
    // Clear any lingering loading state when component mounts
    setIsLoading(false);

    // Explicit check for session and user to handle redirection
    if (session && user) {
      console.log("[LoginPage] User already logged in, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [session, user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("[LoginPage] Attempting to sign in with email:", email);
      
      const { success, error } = await signIn(email, password);
      
      if (!success) {
        console.error("[LoginPage] Authentication failed:", error);
        toast({
          title: "Login Failed",
          description: error || "Invalid email or password",
          variant: "destructive",
        });
        // Always reset loading state on failure
        setIsLoading(false);
      } else {
        console.log("[LoginPage] Authentication successful");
        toast({
          title: "Success",
          description: "Authentication successful",
        });
        
        // Let auth context handle the redirection after successful login
        // Add a safety timeout to reset loading state if navigation doesn't happen
        setTimeout(() => {
          if (document.location.pathname === '/login') {
            console.log("[LoginPage] Safety timeout triggered, forcing navigation");
            setIsLoading(false);
            navigate(from, { replace: true });
          }
        }, 3000);
      }
    } catch (error) {
      console.error("[LoginPage] Exception during authentication:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      // Always reset loading state on exceptions
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
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Log In"}
              </Button>
              
              {isLoading && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  Please wait while we log you in...
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
