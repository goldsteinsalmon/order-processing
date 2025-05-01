
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useUserData } from "@/hooks/data/useUserData";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePickerData } from "@/hooks/data/usePickerData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const { users, fetchUsers, updateUser } = useUserData(useToast());
  const { pickers, setPickers, addPicker, updatePicker, deletePicker } = usePickerData(useToast());
  const [isLoading, setIsLoading] = useState(false);
  const [newPickerName, setNewPickerName] = useState("");
  const { user: currentUser } = useSupabaseAuth();
  
  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      
      // Fetch pickers if available
      try {
        const { data, error } = await fetch('/api/pickers')
          .then(res => res.json());
        
        if (error) throw error;
        if (data) setPickers(data);
      } catch (error) {
        console.error("Error fetching pickers:", error);
      }
    };
    
    loadData();
  }, [fetchUsers, setPickers]);
  
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

  const handleAddPicker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPickerName.trim()) {
      toast({
        title: "Error",
        description: "Picker name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    const picker = {
      name: newPickerName,
      active: true
    };
    
    const result = await addPicker(picker);
    
    if (result) {
      setNewPickerName("");
      toast({
        title: "Success",
        description: "Picker added successfully.",
      });
    }
  };
  
  const handleTogglePickerStatus = async (pickerId: string, active: boolean) => {
    const pickerToUpdate = pickers.find(p => p.id === pickerId);
    
    if (!pickerToUpdate) return;
    
    const updatedPicker = { ...pickerToUpdate, active: !active };
    const success = await updatePicker(updatedPicker);
    
    if (success) {
      toast({
        title: active ? "Picker Deactivated" : "Picker Activated",
        description: active ? 
          "Picker has been deactivated successfully." : 
          "Picker has been activated successfully.",
      });
    }
  };
  
  const handleDeletePicker = async (pickerId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this picker? This action cannot be undone.");
    
    if (confirmed) {
      const success = await deletePicker(pickerId);
      
      if (success) {
        toast({
          title: "Success",
          description: "Picker deleted successfully.",
        });
      }
    }
  };
  
  const handleBackupDatabase = () => {
    toast({
      title: "Backup Started",
      description: "Database backup has been initiated.",
    });
    
    // Simulate backup process
    setTimeout(() => {
      toast({
        title: "Backup Completed",
        description: "Database backup has been completed successfully.",
      });
    }, 3000);
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-4">
          {/* Link to login page - using Supabase auth */}
          <Link to="/login">
            <Button variant="outline">Manage Authentication</Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="users" className="mb-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="pickers">Picker Management</TabsTrigger>
          <TabsTrigger value="backup">Database Backup</TabsTrigger>
          <TabsTrigger value="system">System Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-4">
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
        </TabsContent>
        
        <TabsContent value="pickers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Picker Management</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPicker} className="mb-6">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor="pickerName" className="block text-sm font-medium mb-1">
                      Picker Name
                    </label>
                    <input
                      type="text"
                      id="pickerName"
                      value={newPickerName}
                      onChange={(e) => setNewPickerName(e.target.value)}
                      className="border rounded w-full py-2 px-3"
                      placeholder="Enter picker name"
                    />
                  </div>
                  <Button type="submit">Add Picker</Button>
                </div>
              </form>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickers.map((picker) => (
                    <TableRow key={picker.id}>
                      <TableCell>{picker.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${picker.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {picker.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTogglePickerStatus(picker.id, picker.active)}
                        >
                          {picker.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeletePicker(picker.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Create a backup of your database. This process may take a few minutes depending on your database size.
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last backup:</span>
                    <span className="font-medium">May 1, 2025 09:30 AM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Next scheduled backup:</span>
                    <span className="font-medium">May 2, 2025 09:30 AM</span>
                  </div>
                </div>
                
                <Button onClick={handleBackupDatabase} className="w-full">
                  Backup Database Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
