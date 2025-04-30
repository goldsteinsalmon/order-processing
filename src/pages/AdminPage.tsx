
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const AdminPage: React.FC = () => {
  const { users, pickers, updateUser, addUser, updatePicker, addPicker, deleteUser, deletePicker } = useData();
  const { toast } = useToast();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restorePassword, setRestorePassword] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  
  // User management state
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
    active: true
  });
  
  // Picker management state
  const [showPickerDialog, setShowPickerDialog] = useState(false);
  const [pickerName, setPickerName] = useState("");
  const [selectedPickerId, setSelectedPickerId] = useState<string | null>(null);
  
  // Delete confirmation dialog states
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showDeletePickerDialog, setShowDeletePickerDialog] = useState(false);

  const handleBackup = () => {
    // Create a backup of all the data
    const backupData = {
      timestamp: new Date().toISOString(),
      data: {
        users,
        pickers,
        // Add other data here
      }
    };

    // Convert to JSON string
    const backupJson = JSON.stringify(backupData, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([backupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-management-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup created",
      description: "Your data has been backed up successfully.",
    });
  };

  const handleRestoreSubmit = () => {
    if (restorePassword !== "Badhair1!") {
      toast({
        title: "Error",
        description: "Invalid superuser password.",
        variant: "destructive",
      });
      return;
    }

    if (!restoreFile) {
      toast({
        title: "Error",
        description: "Please select a backup file.",
        variant: "destructive",
      });
      return;
    }

    // In a real application, we would parse the file and restore the data
    // For this demo, we'll just show a success message
    toast({
      title: "Restore successful",
      description: "Your data has been restored successfully.",
    });

    setShowRestoreDialog(false);
    setRestorePassword("");
    setRestoreFile(null);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setRestoreFile(e.dataTransfer.files[0]);
    }
  };
  
  // User management
  const openUserDialog = (userId?: string) => {
    if (userId) {
      // Edit existing user
      const user = users.find(u => u.id === userId);
      if (user) {
        setUserFormData({
          name: user.name,
          email: user.email,
          password: "", // Don't show existing password
          role: user.role,
          active: user.active
        });
        setSelectedUserId(userId);
        setIsEditMode(true);
      }
    } else {
      // Create new user
      setUserFormData({
        name: "",
        email: "",
        password: "",
        role: "User",
        active: true
      });
      setSelectedUserId(null);
      setIsEditMode(false);
    }
    setShowUserDialog(true);
  };
  
  const handleUserFormSubmit = () => {
    if (!userFormData.name || !userFormData.email || (!isEditMode && !userFormData.password)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    if (isEditMode && selectedUserId) {
      // Update existing user
      updateUser({
        id: selectedUserId,
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role as "Admin" | "User" | "Manager",
        active: userFormData.active,
        ...(userFormData.password ? { password: userFormData.password } : {})
      });
      toast({
        title: "User updated",
        description: `${userFormData.name} has been updated successfully.`
      });
    } else {
      // Create new user
      addUser({
        id: uuidv4(),
        name: userFormData.name,
        email: userFormData.email,
        password: userFormData.password,
        role: userFormData.role as "Admin" | "User" | "Manager",
        active: userFormData.active
      });
      toast({
        title: "User created",
        description: `${userFormData.name} has been created successfully.`
      });
    }
    
    setShowUserDialog(false);
  };

  // Picker management
  const openPickerDialog = (pickerId?: string) => {
    if (pickerId) {
      const picker = pickers.find(p => p.id === pickerId);
      if (picker) {
        setPickerName(picker.name);
        setSelectedPickerId(pickerId);
      }
    } else {
      setPickerName("");
      setSelectedPickerId(null);
    }
    setShowPickerDialog(true);
  };
  
  const handlePickerFormSubmit = () => {
    if (!pickerName) {
      toast({
        title: "Error",
        description: "Please enter a picker name.",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedPickerId) {
      // Update existing picker
      const existingPicker = pickers.find(p => p.id === selectedPickerId);
      if (existingPicker) {
        updatePicker({
          ...existingPicker,
          name: pickerName
        });
      }
      toast({
        title: "Picker updated",
        description: `${pickerName} has been updated successfully.`
      });
    } else {
      // Create new picker
      addPicker({
        id: uuidv4(),
        name: pickerName,
        active: true
      });
      toast({
        title: "Picker added",
        description: `${pickerName} has been added successfully.`
      });
    }
    
    setShowPickerDialog(false);
    setPickerName("");
  };
  
  const confirmDeleteUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowDeleteUserDialog(true);
  };
  
  const confirmDeletePicker = (pickerId: string) => {
    setSelectedPickerId(pickerId);
    setShowDeletePickerDialog(true);
  };
  
  const handleDeleteUser = () => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      deleteUser(selectedUserId);
      toast({
        title: "User deleted",
        description: user ? `${user.name} has been deleted.` : "User has been deleted."
      });
    }
    setShowDeleteUserDialog(false);
  };
  
  const handleDeletePicker = () => {
    if (selectedPickerId) {
      const picker = pickers.find(p => p.id === selectedPickerId);
      deletePicker(selectedPickerId);
      toast({
        title: "Picker deleted",
        description: picker ? `${picker.name} has been deleted.` : "Picker has been deleted."
      });
    }
    setShowDeletePickerDialog(false);
  };
  
  // Template download functions
  const downloadCustomerTemplate = () => {
    const templateData = [
      {
        accountNumber: "ACC123",
        name: "Example Customer",
        type: "Private", // Private or Trade
        email: "customer@example.com",
        phone: "01234567890"
      }
    ];
    
    const jsonString = JSON.stringify(templateData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customer-import-template.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: "Customer import template has been downloaded."
    });
  };
  
  const downloadProductTemplate = () => {
    const templateData = [
      {
        name: "Example Product",
        sku: "PROD123",
        stockLevel: 100,
        description: "Product description"
      }
    ];
    
    const jsonString = JSON.stringify(templateData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-import-template.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: "Product import template has been downloaded."
    });
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Admin</h2>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="pickers">Picker Management</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="backup">Data Backup</TabsTrigger>
          <TabsTrigger value="restore">Data Restore</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              <Button onClick={() => openUserDialog()}>Add New User</Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">{user.role}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {user.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                updateUser({
                                  ...user,
                                  active: !user.active
                                });
                                toast({
                                  title: "User updated",
                                  description: `${user.name} has been ${user.active ? "deactivated" : "activated"}.`
                                });
                              }}
                            >
                              {user.active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openUserDialog(user.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => confirmDeleteUser(user.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pickers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Picker Management</CardTitle>
                <CardDescription>
                  Manage the list of pickers
                </CardDescription>
              </div>
              <Button onClick={() => openPickerDialog()}>Add New Picker</Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickers.map((picker) => (
                        <tr key={picker.id} className="border-b">
                          <td className="px-4 py-3">{picker.name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              picker.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {picker.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                updatePicker({
                                  ...picker,
                                  active: !picker.active
                                });
                                toast({
                                  title: "Picker updated",
                                  description: `${picker.name} has been ${picker.active ? "deactivated" : "activated"}.`
                                });
                              }}
                            >
                              {picker.active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPickerDialog(picker.id)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDeletePicker(picker.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Import customer and product data from CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Customer Import</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={downloadCustomerTemplate}>Download Template</Button>
                  <Button>Import Customers</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Product Import</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={downloadProductTemplate}>Download Template</Button>
                  <Button>Import Products</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Backup</CardTitle>
              <CardDescription>
                Download a backup of your system data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Create a backup of all your data that can be downloaded to your local machine.</p>
              <Button onClick={handleBackup}>Download Backup</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Restore</CardTitle>
              <CardDescription>
                Restore your system data from a backup file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-500">Warning: Restoring data will overwrite your current data. Make sure to back up your data first.</p>
              <Button variant="destructive" onClick={() => setShowRestoreDialog(true)}>Restore from Backup</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* User Form Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={userFormData.name}
                onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                placeholder="Enter user name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{isEditMode ? "New Password (leave blank to keep current)" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                placeholder={isEditMode ? "Enter new password" : "Enter password"}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={userFormData.role} 
                onValueChange={(value) => setUserFormData({...userFormData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="active"
                type="checkbox"
                checked={userFormData.active}
                onChange={(e) => setUserFormData({...userFormData, active: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 focus:ring-indigo-500"
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancel</Button>
            <Button onClick={handleUserFormSubmit}>{isEditMode ? "Update" : "Add"} User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Picker Form Dialog */}
      <Dialog open={showPickerDialog} onOpenChange={setShowPickerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPickerId ? "Edit Picker" : "Add Picker"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickerName">Name</Label>
              <Input
                id="pickerName"
                value={pickerName}
                onChange={(e) => setPickerName(e.target.value)}
                placeholder="Enter picker name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPickerDialog(false)}>Cancel</Button>
            <Button onClick={handlePickerFormSubmit}>{selectedPickerId ? "Update" : "Add"} Picker</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Superuser Password</Label>
              <Input
                id="password"
                type="password"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder="Enter superuser password"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Backup File</Label>
              <div 
                className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json";
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files && target.files.length > 0) {
                      setRestoreFile(target.files[0]);
                    }
                  };
                  input.click();
                }}
              >
                {restoreFile ? (
                  <p>{restoreFile.name}</p>
                ) : (
                  <p>Drag and drop a backup file here, or click to select</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRestoreSubmit}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Picker Confirmation */}
      <AlertDialog open={showDeletePickerDialog} onOpenChange={setShowDeletePickerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the picker from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePicker}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AdminPage;
