
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUserData } from "@/hooks/data/useUserData";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { ReloadIcon, Trash, UserPlus } from "lucide-react";

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const { users, fetchUsers, addUser, updateUser, deleteUser, createPredefinedUsers } = useUserData(toast);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the new user form
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    password: "",
    role: "User",
    active: true
  });
  
  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await fetchUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, [fetchUsers]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };
  
  // Handle role selection change
  const handleRoleChange = (value: string) => {
    setNewUser({ ...newUser, role: value as "Admin" | "User" | "Manager" });
  };
  
  // Handle active status change
  const handleActiveChange = (checked: boolean) => {
    setNewUser({ ...newUser, active: checked });
  };
  
  // Handle user submission
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const userToAdd = {
      id: "",
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role as "Admin" | "User" | "Manager",
      active: newUser.active || true
    };
    
    const success = await addUser(userToAdd);
    
    if (success) {
      setIsAddDialogOpen(false);
      toast({
        title: "User Added",
        description: `User ${newUser.name} has been added successfully.`
      });
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "User",
        active: true
      });
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      const success = await deleteUser(user.id);
      
      if (success) {
        toast({
          title: "User Deleted",
          description: `User ${user.name} has been deleted.`
        });
      }
    }
  };
  
  // Handle toggle user active status
  const handleToggleActive = async (user: User) => {
    const updatedUser = { ...user, active: !user.active };
    const success = await updateUser(updatedUser);
    
    if (success) {
      toast({
        title: "User Updated",
        description: `${user.name} is now ${updatedUser.active ? "active" : "inactive"}.`
      });
    }
  };
  
  // Handle creating predefined users
  const handleCreatePredefinedUsers = async () => {
    const success = await createPredefinedUsers();
    
    if (success) {
      toast({
        title: "Default Users Created",
        description: "The predefined users have been created successfully."
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>User Management</span>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCreatePredefinedUsers}
              title="Create default admin and user accounts"
            >
              Create Default Users
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account for the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newUser.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={newUser.password}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select 
                      value={newUser.role}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active" className="text-right">
                      Active
                    </Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        id="active"
                        checked={newUser.active}
                        onCheckedChange={handleActiveChange}
                      />
                      <Label htmlFor="active">
                        {newUser.active ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>
                    Add User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
        <CardDescription>
          Manage user accounts and permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            Loading users...
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No users found. Add a new user to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "Admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : user.role === "Manager" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`mr-2 h-2.5 w-2.5 rounded-full ${user.active ? "bg-green-500" : "bg-gray-400"}`}></div>
                          <span>{user.active ? "Active" : "Inactive"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
