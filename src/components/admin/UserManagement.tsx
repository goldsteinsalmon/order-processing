import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { Loader, RefreshCw, UserPlus } from "lucide-react";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    password: "",
    role: "User" as "Admin" | "User" | "Manager",
    active: true,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("name");

      if (error) throw error;

      const typedUsers = data ? data.map(user => ({
        ...user,
        role: user.role as "Admin" | "User" | "Manager"
      })) : [];
      
      setUsers(typedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      // Validate form
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast({
          title: "Missing fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.from("users").insert([
        {
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          active: newUser.active,
        },
      ]).select();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add user.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        // Add the new user to the users state with proper typing
        const newUserWithTypedRole = {
          ...data[0],
          role: data[0].role as "Admin" | "User" | "Manager"
        };
        
        setUsers([...users, newUserWithTypedRole]);
        
        // Reset form
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "User" as "Admin" | "User" | "Manager",
          active: true,
        });
        
        // Close dialog
        setIsDialogOpen(false);
        
        // Show success toast
        toast({
          title: "Success",
          description: "User added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser({ ...user });
    setIsDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          active: editingUser.active,
          ...(editingUser.password ? { password: editingUser.password } : {}),
        })
        .eq("id", editingUser.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update user.",
          variant: "destructive",
        });
        return;
      }

      // Update user in state
      setUsers(users.map((user) => (user.id === editingUser.id ? editingUser : user)));
      
      // Close dialog
      setIsDialogOpen(false);
      setEditingUser(null);
      
      // Show success toast
      toast({
        title: "Success",
        description: "User updated successfully.",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ active: !user.active })
        .eq("id", user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update user status.",
          variant: "destructive",
        });
        return;
      }

      // Update user in state
      setUsers(
        users.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
      );
      
      // Show success toast
      toast({
        title: "Success",
        description: `User ${user.active ? "deactivated" : "activated"} successfully.`,
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete user.",
          variant: "destructive",
        });
        return;
      }

      // Remove user from state
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      // Reset selected user and close dialog
      setUserToDelete(null);
      setDeleteDialogOpen(false);
      
      // Show success toast
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingUser) {
      handleUpdateUser();
    } else {
      handleAddUser();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Add, edit, and manage users.</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={refreshing}>
            {refreshing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingUser(null);
                setNewUser({
                  name: "",
                  email: "",
                  password: "",
                  role: "User" as "Admin" | "User" | "Manager",
                  active: true,
                });
              }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit User" : "Add New User"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update user details below"
                    : "Fill in the details to create a new user."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit}>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editingUser ? editingUser.name : newUser.name}
                      onChange={(e) =>
                        editingUser
                          ? setEditingUser({ ...editingUser, name: e.target.value })
                          : setNewUser({ ...newUser, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingUser ? editingUser.email : newUser.email}
                      onChange={(e) =>
                        editingUser
                          ? setEditingUser({ ...editingUser, email: e.target.value })
                          : setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {editingUser ? "New Password (leave blank to keep current)" : "Password"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={editingUser ? editingUser.password || "" : newUser.password || ""}
                      onChange={(e) =>
                        editingUser
                          ? setEditingUser({ ...editingUser, password: e.target.value })
                          : setNewUser({ ...newUser, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={editingUser ? editingUser.role : newUser.role}
                      onValueChange={(value: "Admin" | "Manager" | "User") =>
                        editingUser
                          ? setEditingUser({ ...editingUser, role: value })
                          : setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
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
                      type="checkbox"
                      id="active"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={editingUser ? editingUser.active : newUser.active}
                      onChange={(e) =>
                        editingUser
                          ? setEditingUser({ ...editingUser, active: e.target.checked })
                          : setNewUser({ ...newUser, active: e.target.checked })
                      }
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit">
                    {editingUser ? "Update User" : "Add User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Name</th>
                  <th className="py-2 text-left font-medium">Email</th>
                  <th className="py-2 text-left font-medium">Role</th>
                  <th className="py-2 text-left font-medium">Status</th>
                  <th className="py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2">{user.email}</td>
                    <td className="py-2">{user.role}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={user.active ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </Button>
                        <AlertDialog open={deleteDialogOpen && userToDelete?.id === user.id} onOpenChange={(open) => {
                          if (!open) setUserToDelete(null);
                          setDeleteDialogOpen(open);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setUserToDelete(user)}
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDeleteUser}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No users found. Add your first user to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
