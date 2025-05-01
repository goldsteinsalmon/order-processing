import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Switch } from "@/components/ui/switch";
import { Customer } from "@/types";

const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addCustomer } = useData();
  const { toast } = useToast();
  
  // Get any duplicate customer data from location state
  const duplicateCustomer = location.state?.duplicateFrom as Customer | undefined;
  const isDuplicating = location.state?.isDuplicating as boolean | undefined;
  
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [needsDetailedBoxLabels, setNeedsDetailedBoxLabels] = useState(false);

  // Populate form with duplicate data if available
  useEffect(() => {
    if (duplicateCustomer && isDuplicating) {
      setName(duplicateCustomer.name + " (Copy)");
      // For account number, we'll suggest a modified version to avoid duplicate account numbers
      setAccountNumber(duplicateCustomer.accountNumber + "-COPY");
      setEmail(duplicateCustomer.email || "");
      setPhone(duplicateCustomer.phone || "");
      setNeedsDetailedBoxLabels(duplicateCustomer.needsDetailedBoxLabels || false);
    }
  }, [duplicateCustomer, isDuplicating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !accountNumber) {
      toast({
        title: "Error",
        description: "Account number and name are required.",
        variant: "destructive"
      });
      return;
    }
    
    const newCustomer = {
      id: uuidv4(),
      accountNumber: accountNumber, // Use camelCase
      name,
      email,
      phone,
      address: "", // Add empty address to satisfy the type requirement
      type: "Trade" as "Trade", // Always set to Trade
      onHold: false,
      needsDetailedBoxLabels: needsDetailedBoxLabels
    };
    
    addCustomer(newCustomer);
    
    toast({
      title: "Success",
      description: isDuplicating ? "Customer duplicated successfully." : "Customer created successfully."
    });
    
    navigate("/customers");
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isDuplicating ? "Duplicate Customer" : "New Customer"}
        </h2>
        <Button variant="outline" onClick={() => navigate("/customers")}>
          Back to Customers
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>
              {isDuplicating ? "Duplicate Customer Information" : "Customer Information"}
              {isDuplicating && (
                <p className="mt-2 text-sm text-muted-foreground">
                  You're creating a copy of an existing customer. Please adjust the details as needed.
                </p>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="required">Account Number *</Label>
                <Input 
                  id="accountNumber" 
                  value={accountNumber} 
                  onChange={(e) => setAccountNumber(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="required">Name *</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
            </div>
            
            {/* Box Labels Option */}
            <div className="flex items-center space-x-2 pt-4">
              <Switch 
                id="needsDetailedBoxLabels" 
                checked={needsDetailedBoxLabels}
                onCheckedChange={setNeedsDetailedBoxLabels}
              />
              <Label htmlFor="needsDetailedBoxLabels">Requires Detailed Box Labels</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => navigate("/customers")}>
              Cancel
            </Button>
            <Button type="submit">
              {isDuplicating ? "Create Duplicate" : "Create Customer"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </Layout>
  );
};

export default CreateCustomerPage;
