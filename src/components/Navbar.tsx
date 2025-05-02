
import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

const Navbar: React.FC = () => {
  const { user, signOut } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Get user role from Supabase metadata
  const userRole = user?.user_metadata?.role || "User";
  const isAdminUser = userRole === "Admin";
  
  // Determine if user is a regular user (not admin or manager)
  const isRegularUser = userRole === "User";

  // Handle logout with Supabase
  const handleLogout = async () => {
    try {
      console.log("Logout initiated");
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="px-4 py-2 bg-zinc-100 border-b">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <nav className="flex gap-4">
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                }
              >
                Orders
              </NavLink>
              <NavLink
                to="/completed-orders"
                className={({ isActive }) =>
                  isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                }
              >
                Completed Orders
              </NavLink>
              
              {/* Show these links only for admin and manager roles */}
              {!isRegularUser && (
                <>
                  <NavLink
                    to="/standing-orders"
                    className={({ isActive }) =>
                      isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                    }
                  >
                    Standing Orders
                  </NavLink>
                  <NavLink
                    to="/customers"
                    className={({ isActive }) =>
                      isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                    }
                  >
                    Customers
                  </NavLink>
                  <NavLink
                    to="/products"
                    className={({ isActive }) =>
                      isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                    }
                  >
                    Products
                  </NavLink>
                  <NavLink
                    to="/returns"
                    className={({ isActive }) =>
                      isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                    }
                  >
                    Returns
                  </NavLink>
                  <NavLink
                    to="/batch-tracking"
                    className={({ isActive }) =>
                      isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                    }
                  >
                    Batch Tracking
                  </NavLink>
                  {isAdminUser && (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                      }
                    >
                      Admin
                    </NavLink>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm bg-white rounded-full px-3 py-1 border">
                  <User size={16} />
                  <span>{user.user_metadata?.name || user.email}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {user.user_metadata?.role || "User"}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut size={18} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
