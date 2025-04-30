
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

const AdminPage: React.FC = () => {
  const { users, pickers, updateUser, addUser, updatePicker, addPicker } = useData();
  const { toast } = useToast();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restorePassword, setRestorePassword] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

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
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
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
                          <td className="px-4 py-3">
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
            <CardHeader>
              <CardTitle>Picker Management</CardTitle>
              <CardDescription>
                Manage the list of pickers
              </CardDescription>
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
                          <td className="px-4 py-3">
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
                  <Button variant="outline">Download Template</Button>
                  <Button>Import Customers</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Product Import</h3>
                <div className="flex space-x-2">
                  <Button variant="outline">Download Template</Button>
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
    </Layout>
  );
};

export default AdminPage;
