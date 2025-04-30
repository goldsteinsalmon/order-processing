
import React, { useState, useRef } from "react";
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
import { parse } from 'papaparse';

const AdminPage: React.FC = () => {
  const { users, pickers, updateUser, addUser, updatePicker, addPicker, deleteUser, deletePicker, addCustomer, addProduct } = useData();
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
    username: "", // Changed from email to username
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
  
  // Import file references
  const customerFileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  
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
          username: user.email, // Use email field as username for existing users
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
        username: "",
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
    if (!userFormData.name || !userFormData.username || (!isEditMode && !userFormData.password)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    // Only allow Admin or User roles
    const role = userFormData.role === "Admin" ? "Admin" : "User";
    
    if (isEditMode && selectedUserId) {
      // Update existing user
      updateUser({
        id: selectedUserId,
        name: userFormData.name,
        email: userFormData.username, // Store username in the email field
        role: role as "Admin" | "User",
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
        email: userFormData.username, // Store username in the email field
        password: userFormData.password,
        role: role as "Admin" | "User",
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
  
  // Template download functions - Updated to use CSV with corrected fields
  const downloadCustomerTemplate = () => {
    // CSV header and example row
    const csvContent = [
      "accountNumber,name,email,phone,address,type",
      "ACC123,Example Customer,customer@example.com,01234567890,123 Example Street,Trade"
    ].join("\n");
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customer-import-template.csv";
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
    // CSV header and example row (added 'weight' field)
    const csvContent = [
      "name,sku,stockLevel,weight,description",
      "Example Product,PROD123,100,500,Product description"
    ].join("\n");
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: "Product import template has been downloaded."
    });
  };
  
  // Import functions
  const handleCustomerImport = () => {
    if (customerFileInputRef.current) {
      customerFileInputRef.current.click();
    }
  };
  
  const handleProductImport = () => {
    if (productFileInputRef.current) {
      productFileInputRef.current.click();
    }
  };
  
  // Fixed file input handlers to correctly parse and add imported data
  const handleCustomerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please select a CSV file.",
        variant: "destructive"
      });
      return;
    }
    
    // Read the file and parse the CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      
      parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && Array.isArray(results.data)) {
            // Process the imported customers
            const importedCustomers = results.data.map(row => ({
              id: uuidv4(),
              accountNumber: (row as any).accountNumber || `ACC-${Math.floor(Math.random() * 10000)}`,
              name: (row as any).name || "Unknown Customer",
              email: (row as any).email || "",
              phone: (row as any).phone || "",
              address: (row as any).address || "",
              type: (row as any).type || "Trade", // Default to Trade
              onHold: false,
              created: new Date().toISOString(),
            }));
            
            // Add each customer to the data context
            importedCustomers.forEach(customer => {
              addCustomer(customer);
            });
            
            toast({
              title: "Customers imported",
              description: `Successfully imported ${importedCustomers.length} customers.`
            });
          }
        },
        error: (error) => {
          toast({
            title: "Import error",
            description: `Error parsing CSV file: ${error.message}`,
            variant: "destructive"
          });
        }
      });
    };
    
    reader.readAsText(file);
    
    // Clear the file input
    if (customerFileInputRef.current) {
      customerFileInputRef.current.value = '';
    }
  };
  
  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please select a CSV file.",
        variant: "destructive"
      });
      return;
    }
    
    // Read the file and parse the CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      
      parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && Array.isArray(results.data) && results.data.length > 0) {
            // Process the imported products - FIXED: Map all rows and add each product
            const importedProducts = results.data.map(row => ({
              id: uuidv4(),
              name: (row as any).name || "Unknown Product",
              sku: (row as any).sku || `SKU-${Math.floor(Math.random() * 10000)}`,
              stockLevel: parseInt((row as any).stockLevel, 10) || 0,
              weight: parseInt((row as any).weight, 10) || 0,
              description: (row as any).description || "",
              created: new Date().toISOString(),
            }));
            
            // Add each product to the data context
            importedProducts.forEach(product => {
              addProduct(product);
            });
            
            toast({
              title: "Products imported",
              description: `Successfully imported ${importedProducts.length} products.`
            });
          } else {
            toast({
              title: "Import error",
              description: "No valid products found in the CSV file.",
              variant: "destructive"
            });
          }
        },
        error: (error) => {
          toast({
            title: "Import error",
            description: `Error parsing CSV file: ${error.message}`,
            variant: "destructive"
          });
        }
      });
    };
    
    reader.readAsText(file);
    
    // Clear the file input
    if (productFileInputRef.current) {
      productFileInputRef.current.value = '';
    }
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
                        <th className="px-4 py-3 text-left font-medium">Username</th>
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
        
        {/* Updated Import Data tab for CSV files */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Import customer and product data from CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hidden file inputs */}
              <input
                type="file"
                ref={customerFileInputRef}
                onChange={handleCustomerFileChange}
                accept=".csv"
                className="hidden"
              />
              <input
                type="file"
                ref={productFileInputRef}
                onChange={handleProductFileChange}
                accept=".csv"
                className="hidden"
              />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customer Import</h3>
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-gray-500">
                    Use our CSV template to format your customer data correctly, then upload the file to import.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" onClick={downloadCustomerTemplate}>
                      Download CSV Template
                    </Button>
                    <Button onClick={handleCustomerImport}>
                      Import Customers (CSV)
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Product Import</h3>
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-gray-500">
                    Use our CSV template to format your product data correctly, then upload the file to import.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" onClick={downloadProductTemplate}>
                      Download CSV Template
                    </Button>
                    <Button onClick={handleProductImport}>
                      Import Products (CSV)
                    </Button>
                  </div>
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={userFormData.username}
                onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                placeholder="Enter username"
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
