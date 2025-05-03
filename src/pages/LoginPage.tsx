
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
  const { signIn, session } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get redirect path from location state or default to "/orders"
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/orders";

  useEffect(() => {
    // Redirect if already logged in
    if (session) {
      console.log("User already logged in, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

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
    
    setIsLoading(true);
    
    try {
      console.log("Attempting to sign in with email:", email);
      const { success, error } = await signIn(email, password);
      
      if (success) {
        // Success message
        toast({
          title: "Success",
          description: "You have been signed in successfully.",
        });
        
        // Don't navigate here - let the auth context handle it
        // The session will update which will trigger the useEffect above
        console.log("Sign in successful, waiting for session update");
        
        // Reset loading state on success too
        setIsLoading(false);
      } else {
        console.error("Authentication failed:", error);
        toast({
          title: "Error",
          description: error || "Invalid email or password",
          variant: "destructive",
        });
        setIsLoading(false); // Reset loading state on error
      }
    } catch (error) {
      console.error("Exception during authentication:", error);
      toast({
        title: "Error",
        description: "An error occurred during authentication",
        variant: "destructive",
      });
      setIsLoading(false); // Reset loading state on exception
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
