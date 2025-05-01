
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePickerData } from "@/hooks/data/usePickerData";
import { useToast } from "@/hooks/use-toast";
import { Picker } from "@/types";
import { Loader, Trash, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PickerManagement: React.FC = () => {
  const { toast } = useToast();
  const { pickers, setPickers, addPicker, updatePicker, deletePicker } = usePickerData(toast);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the new picker form
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPicker, setNewPicker] = useState<Partial<Picker>>({
    name: "",
    active: true
  });
  
  // Load pickers on component mount
  useEffect(() => {
    const loadPickers = async () => {
      try {
        const { data: fetchedPickers, error } = await supabase
          .from('pickers')
          .select('*');
        
        if (error) throw error;
        
        setPickers(fetchedPickers as Picker[]);
      } catch (error) {
        console.error("Error fetching pickers:", error);
        toast({
          title: "Error",
          description: "Failed to fetch pickers.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPickers();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPicker({ ...newPicker, [name]: value });
  };
  
  // Handle active status change
  const handleActiveChange = (checked: boolean) => {
    setNewPicker({ ...newPicker, active: checked });
  };
  
  // Handle picker submission
  const handleAddPicker = async () => {
    if (!newPicker.name) {
      toast({
        title: "Missing Fields",
        description: "Please enter a name for the picker.",
        variant: "destructive",
      });
      return;
    }
    
    const pickerToAdd = {
      name: newPicker.name,
      active: newPicker.active || true
    };
    
    const addedPicker = await addPicker(pickerToAdd);
    
    if (addedPicker) {
      setIsAddDialogOpen(false);
      toast({
        title: "Picker Added",
        description: `Picker ${newPicker.name} has been added successfully.`
      });
      setNewPicker({
        name: "",
        active: true
      });
    }
  };
  
  // Handle picker deletion
  const handleDeletePicker = async (picker: Picker) => {
    if (confirm(`Are you sure you want to delete ${picker.name}?`)) {
      const success = await deletePicker(picker.id);
      
      if (success) {
        toast({
          title: "Picker Deleted",
          description: `Picker ${picker.name} has been deleted.`
        });
      }
    }
  };
  
  // Handle toggle picker active status
  const handleToggleActive = async (picker: Picker) => {
    const updatedPicker = { ...picker, active: !picker.active };
    const success = await updatePicker(updatedPicker);
    
    if (success) {
      toast({
        title: "Picker Updated",
        description: `${picker.name} is now ${updatedPicker.active ? "active" : "inactive"}.`
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Picker Management</span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Picker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Picker</DialogTitle>
                <DialogDescription>
                  Create a new picker for the system.
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
                    value={newPicker.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="active" className="text-right">
                    Active
                  </Label>
                  <div className="flex items-center space-x-2 col-span-3">
                    <Switch
                      id="active"
                      checked={newPicker.active}
                      onCheckedChange={handleActiveChange}
                    />
                    <Label htmlFor="active">
                      {newPicker.active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPicker}>
                  Add Picker
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage pickers who fulfill orders in the warehouse.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Loading pickers...
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pickers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      No pickers found. Add a new picker to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  pickers.map((picker) => (
                    <TableRow key={picker.id}>
                      <TableCell>{picker.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`mr-2 h-2.5 w-2.5 rounded-full ${picker.active ? "bg-green-500" : "bg-gray-400"}`}></div>
                          <span>{picker.active ? "Active" : "Inactive"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(picker)}
                          >
                            {picker.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeletePicker(picker)}
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

export default PickerManagement;
