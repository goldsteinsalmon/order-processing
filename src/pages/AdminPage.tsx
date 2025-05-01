
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ShieldAlert, Database, Upload, Download } from "lucide-react";
import { generateCsvFilename } from "@/utils/exportUtils";
import { supabase } from "@/integrations/supabase/client";

const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const { users, fetchUsers, updateUser, addUser } = useUserData(useToast());
  const { pickers, setPickers, addPicker, updatePicker, deletePicker } = usePickerData(useToast());
  const [isLoading, setIsLoading] = useState(false);
  const [newPickerName, setNewPickerName] = useState("");
  const { user: currentUser } = useSupabaseAuth();
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("User");
  const [restorePassword, setRestorePassword] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      
      // Fetch pickers if available
      try {
        const { data, error } = await supabase.from('pickers').select('*');
        
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast({
        title: "Error",
        description: "All fields are required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            name: newUserName,
            role: newUserRole
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Now create the user in our users table
        const newUser = {
          id: authData.user.id,
          name: newUserName,
          email: newUserEmail,
          password: "", // We don't store the password in our table
          role: newUserRole as "Admin" | "User" | "Manager",
          active: true
        };
        
        const userCreated = await addUser(newUser);
        
        if (userCreated) {
          toast({
            title: "Success",
            description: `${newUserRole} user created successfully.`,
          });
          
          // Reset form
          setNewUserName("");
          setNewUserEmail("");
          setNewUserPassword("");
          setNewUserRole("User");
          
          // Refresh users list
          await fetchUsers();
        }
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
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
    
    // Fixed: Adding the id as undefined to allow it to be generated
    const picker = {
      name: newPickerName,
      active: true,
      id: undefined // This will be generated by the database
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
  
  const handleDownloadBackup = async () => {
    try {
      toast({
        title: "Backup Started",
        description: "Preparing database backup for download...",
      });
      
      // Fetch data from all tables
      const { data: customersData } = await supabase.from('customers').select('*');
      const { data: productsData } = await supabase.from('products').select('*');
      const { data: ordersData } = await supabase.from('orders').select('*');
      const { data: orderItemsData } = await supabase.from('order_items').select('*');
      const { data: standingOrdersData } = await supabase.from('standing_orders').select('*');
      const { data: standingOrderItemsData } = await supabase.from('standing_order_items').select('*');
      const { data: pickersData } = await supabase.from('pickers').select('*');
      const { data: usersData } = await supabase.from('users').select('*');
      
      // Create backup object
      const backupData = {
        timestamp: new Date().toISOString(),
        customers: customersData || [],
        products: productsData || [],
        orders: ordersData || [],
        orderItems: orderItemsData || [],
        standingOrders: standingOrdersData || [],
        standingOrderItems: standingOrderItemsData || [],
        pickers: pickersData || [],
        users: usersData || []
      };
      
      // Convert to JSON string
      const jsonData = JSON.stringify(backupData, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `database_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Backup Completed",
        description: "Database backup has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Backup Failed",
        description: "Failed to create database backup.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreBackup = async () => {
    if (restorePassword !== 'Badhair1!') {
      toast({
        title: "Error",
        description: "Incorrect superuser password.",
        variant: "destructive",
      });
      return;
    }
    
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Please upload a backup file first.",
        variant: "destructive",
      });
      return;
    }
    
    const confirmed = window.confirm(
      "WARNING: This will overwrite your current database. This action cannot be undone. Are you sure you want to proceed?"
    );
    
    if (!confirmed) return;
    
    try {
      toast({
        title: "Restore Started",
        description: "Restoring database from backup...",
      });
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          
          // Perform restore operations - this is a basic implementation
          // In a real app, you'd want to handle this with more sophisticated error handling and transaction support
          
          // Clear existing data
          await supabase.from('order_items').delete().neq('id', 'placeholder');
          await supabase.from('orders').delete().neq('id', 'placeholder');
          await supabase.from('standing_order_items').delete().neq('id', 'placeholder');
          await supabase.from('standing_orders').delete().neq('id', 'placeholder');
          await supabase.from('pickers').delete().neq('id', 'placeholder');
          
          // Restore data
          if (backupData.products?.length) await supabase.from('products').upsert(backupData.products);
          if (backupData.customers?.length) await supabase.from('customers').upsert(backupData.customers);
          if (backupData.pickers?.length) await supabase.from('pickers').upsert(backupData.pickers);
          if (backupData.standingOrders?.length) await supabase.from('standing_orders').upsert(backupData.standingOrders);
          if (backupData.standingOrderItems?.length) await supabase.from('standing_order_items').upsert(backupData.standingOrderItems);
          if (backupData.orders?.length) await supabase.from('orders').upsert(backupData.orders);
          if (backupData.orderItems?.length) await supabase.from('order_items').upsert(backupData.orderItems);
          
          // Do not restore users table - this is a security risk
          // Instead, log a message that users need to be recreated manually
          
          toast({
            title: "Restore Completed",
            description: "Database has been restored successfully.",
          });
          
          // Reset form
          setRestorePassword("");
          setUploadedFile(null);
          
          // Refresh data
          await fetchUsers();
          const { data } = await supabase.from('pickers').select('*');
          if (data) setPickers(data);
        } catch (error) {
          console.error("Error parsing backup file:", error);
          toast({
            title: "Restore Failed",
            description: "Failed to parse backup file.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsText(uploadedFile);
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast({
        title: "Restore Failed",
        description: "Failed to restore database from backup.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
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
          <TabsTrigger value="restore">Database Restore</TabsTrigger>
          <TabsTrigger value="stats">System Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add new user form */}
              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-lg mb-4">Create New User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newUserName">Name</Label>
                      <Input 
                        id="newUserName" 
                        value={newUserName} 
                        onChange={(e) => setNewUserName(e.target.value)} 
                        placeholder="Enter name" 
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newUserEmail">Email</Label>
                      <Input 
                        id="newUserEmail" 
                        type="email" 
                        value={newUserEmail} 
                        onChange={(e) => setNewUserEmail(e.target.value)} 
                        placeholder="Enter email address" 
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newUserPassword">Password</Label>
                      <Input 
                        id="newUserPassword" 
                        type="password" 
                        value={newUserPassword} 
                        onChange={(e) => setNewUserPassword(e.target.value)} 
                        placeholder="Enter password" 
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newUserRole">Role</Label>
                      <select 
                        id="newUserRole" 
                        value={newUserRole} 
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="mt-2">
                    {isLoading ? 'Creating...' : 'Create User'}
                  </Button>
                </form>
              </div>
              
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
                  Create a downloadable backup of your database. This will export all your data into a JSON file that can be used for restoration if needed.
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <Button onClick={handleDownloadBackup} className="w-full flex items-center gap-2">
                  <Download size={18} />
                  Download Database Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-500" />
                Database Restore (Superuser Only)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                  <h4 className="font-bold text-lg mb-2">⚠️ WARNING</h4>
                  <p>
                    Restoring from a backup will overwrite your current database. This action cannot be undone.
                    Please ensure that you have a recent backup before proceeding.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="backupFile">Backup File</Label>
                    <Input 
                      id="backupFile" 
                      type="file" 
                      accept=".json" 
                      onChange={handleFileChange}
                    />
                    {uploadedFile && (
                      <p className="text-sm text-gray-500 mt-1">
                        Selected file: {uploadedFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="superuserPassword">Superuser Password</Label>
                    <Input 
                      id="superuserPassword" 
                      type="password" 
                      value={restorePassword} 
                      onChange={(e) => setRestorePassword(e.target.value)} 
                      placeholder="Enter superuser password"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleRestoreBackup} 
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                  disabled={!uploadedFile || !restorePassword}
                >
                  <Upload size={18} />
                  Restore Database from Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Users:</span>
                  <span className="font-medium">{users.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Users:</span>
                  <span className="font-medium">{users.filter(u => u.active).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pickers:</span>
                  <span className="font-medium">{pickers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Pickers:</span>
                  <span className="font-medium">{pickers.filter(p => p.active).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Database Backup:</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span>System Version:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
