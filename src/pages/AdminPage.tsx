
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useUserData } from "@/hooks/data/useUserData";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const { users, fetchUsers, updateUser } = useUserData(useToast());
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser } = useSupabaseAuth();
  
  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers();
    };
    
    loadUsers();
  }, [fetchUsers]);
  
  const handleToggleUserStatus = async (userId: string, active: boolean) => {
    setIsLoading(true);
    
    try {
      const userToUpdate = users.find(u => u.id === userId);
      
      if (!userToUpdate) {
        throw new Error("User not found");
      }
      
      // Update the user's active status
      const updatedUser = { ...userToUpdate, active: !active };
      const success = await updateUser(updatedUser);
      
      if (success) {
        toast({
          title: active ? "User Deactivated" : "User Activated",
          description: active ? 
            "User has been deactivated successfully." : 
            "User has been activated successfully.",
        });
        
        // Refresh users list
        await fetchUsers();
      } else {
        throw new Error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-4">
          {/* Link to login page - updated to use Supabase auth */}
          <Link to="/login">
            <Button variant="outline">Manage Authentication</Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p>Total users: {users.length}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Active Users</h3>
              
              {users && users.length > 0 ? (
                <ul className="space-y-2">
                  {users.map((user) => (
                    <li key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs ml-2 bg-gray-100 px-2 py-0.5 rounded">{user.role}</span>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      
                      <Button 
                        onClick={() => handleToggleUserStatus(user.id, user.active)}
                        variant={user.active ? "default" : "outline"}
                        disabled={isLoading || (currentUser?.user_metadata?.email === user.email)}
                        size="sm"
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* System Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Orders:</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span>Standing Orders:</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span>Total Products:</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* System Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="outline">
              Export Database
            </Button>
            <Button className="w-full" variant="outline">
              System Maintenance
            </Button>
            <Button className="w-full" variant="outline">
              Clear Temporary Files
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
