
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

const Navbar: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  
  // Determine if user is a regular user (not admin or manager)
  const isRegularUser = currentUser && currentUser.role === "User";

  return (
    <div className="px-4 py-2 bg-zinc-100 border-b">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <NavLink to="/orders" className="font-medium text-lg">
              Order Management
            </NavLink>
            <nav className="hidden md:flex gap-4">
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
              
              {/* Add picking list for regular users */}
              <NavLink
                to="/picking-list"
                className={({ isActive }) =>
                  isActive ? "font-medium text-primary" : "text-gray-600 hover:text-primary"
                }
              >
                Picking List
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
                  {isAdmin() && (
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
            {currentUser && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm bg-white rounded-full px-3 py-1 border">
                  <User size={16} />
                  <span>{currentUser.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout}
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
