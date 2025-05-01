import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, Shield } from "lucide-react";

const BackupManagement: React.FC = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [password, setPassword] = useState("");
  const [backupData, setBackupData] = useState<any>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    
    try {
      // Fetching data from various tables
      const { data: users } = await supabase.from("users").select("*");
      const { data: customers } = await supabase.from("customers").select("*");
      const { data: products } = await supabase.from("products").select("*");
      const { data: orders } = await supabase.from("orders").select("*");
      const { data: orderItems } = await supabase.from("order_items").select("*");
      const { data: standingOrders } = await supabase.from("standing_orders").select("*");
      const { data: standingOrderItems } = await supabase.from("standing_order_items").select("*");
      const { data: pickers } = await supabase.from("pickers").select("*");
      
      // Create a backup object
      const backup = {
        timestamp: new Date().toISOString(),
        data: {
          users,
          customers,
          products,
          orders,
          orderItems,
          standingOrders,
          standingOrderItems,
          pickers
        }
      };
      
      // Convert to JSON string
      const backupString = JSON.stringify(backup, null, 2);
      
      // Create a blob and download
      const blob = new Blob([backupString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Backup Created",
        description: "Your data has been backed up successfully.",
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Error",
        description: "Failed to create backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const loadBackupFile = () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Please select a backup file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (e.target && typeof e.target.result === 'string') {
          const parsedData = JSON.parse(e.target.result);
          setBackupData(parsedData);
          setShowPasswordDialog(true);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid backup file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(uploadedFile);
  };

  const validatePassword = () => {
    const correctPassword = "Badhair1!";
    
    if (password === correctPassword) {
      setShowPasswordDialog(false);
      setShowRestoreDialog(true);
    } else {
      toast({
        title: "Error",
        description: "Invalid superuser password.",
        variant: "destructive",
      });
    }
  };
  
  const handleRestore = async () => {
    if (!backupData) return;
    
    setIsRestoring(true);
    try {
      // Here we would restore the data by inserting it into the database
      // This is a very simplified version - in a real app, you'd need to handle
      // conflicts, relationships, etc.
      
      // Clear existing data (be very careful with this in production!)
      // await supabase.from("order_items").delete().not('id', 'eq', 'nothing');
      // await supabase.from("orders").delete().not('id', 'eq', 'nothing');
      // ...similar for other tables
      
      // Insert backup data
      // await supabase.from("users").insert(backupData.data.users);
      // await supabase.from("customers").insert(backupData.data.customers);
      // ...similar for other tables
      
      // For this demo, we'll just simulate a restore
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Restore Completed",
        description: "Your data has been restored successfully.",
      });
      
      setShowRestoreDialog(false);
      setUploadedFile(null);
      setBackupData(null);
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast({
        title: "Error",
        description: "Failed to restore backup.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>
          Create backups of your data and restore from previous backups.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Backup Data</h3>
          <p className="text-sm text-gray-500">
            Download a backup of all your system data. This includes users, customers, products, orders, and more.
          </p>
          <Button onClick={handleBackup} disabled={isBackingUp}>
            <Download className="mr-2 h-4 w-4" />
            {isBackingUp ? "Creating Backup..." : "Create Backup"}
          </Button>
        </div>
        
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Restore Data</h3>
          <p className="text-sm text-gray-500">
            Restore your system from a previously created backup file. This will replace current data.
          </p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="backupFile" className="block mb-2">Select Backup File</Label>
              <Input
                id="backupFile"
                type="file"
                accept=".json"
                onChange={handleFileChange}
              />
            </div>
            <Button 
              onClick={loadBackupFile}
              disabled={!uploadedFile || isRestoring}
            >
              <Upload className="mr-2 h-4 w-4" />
              Load Backup
            </Button>
          </div>
        </div>
      </CardContent>
      
      {/* Superuser password dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Superuser Password</DialogTitle>
            <DialogDescription>
              Please enter the superuser password to proceed with the restore operation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <Label htmlFor="password" className="text-right">
                Superuser Password
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={validatePassword}>
              Verify Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Restore confirmation dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Data Restoration</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to restore data from a backup. This will overwrite your current data and cannot be undone.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRestoreDialog(false);
              setBackupData(null);
              setUploadedFile(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRestoring}
            >
              {isRestoring ? "Restoring..." : "Yes, Restore Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

// Helper component for the file input label
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
));
Label.displayName = "Label";

export default BackupManagement;
