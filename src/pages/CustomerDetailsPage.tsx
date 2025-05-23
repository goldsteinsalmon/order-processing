import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Save, AlertTriangle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const CustomerDetailsPage: React.FC = () => {
  const { customers, updateCustomer, orders, completedOrders } = useData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const customer = customers.find(customer => customer.id === id);
  const [isEditing, setIsEditing] = useState(false);
  // Hold reason dialog state
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    accountNumber: customer?.accountNumber || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    type: customer?.type || "Private" as "Private" | "Trade",
    onHold: customer?.onHold || false,
    holdReason: customer?.holdReason || "",
    needsDetailedBoxLabels: customer?.needsDetailedBoxLabels || false
  });

  // Get all orders for this customer
  const customerOrders = useMemo(() => {
    if (!customer) return [];
    
    // Combine active and completed orders
    const allOrders = [...orders, ...completedOrders]
      .filter(order => order.customerId === customer.id)
      .sort((a, b) => {
        const dateA = a.orderDate ? new Date(a.orderDate).getTime() : new Date(a.created).getTime();
        const dateB = b.orderDate ? new Date(b.orderDate).getTime() : new Date(b.created).getTime();
        return dateB - dateA; // Sort by date descending (newest first)
      });
    
    return allOrders;
  }, [customer, orders, completedOrders]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value as "Private" | "Trade" }));
  };
  
  const handleHoldStatusChange = (value: string) => {
    const isOnHold = value === "on-hold";
    setFormData(prev => ({ ...prev, onHold: isOnHold }));
  };
  
  const handleSave = () => {
    if (!customer) return;
    
    if (!formData.name || !formData.accountNumber) {
      toast({
        title: "Error",
        description: "Account number and name are required.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedCustomer = {
      ...customer,
      name: formData.name,
      accountNumber: formData.accountNumber,
      email: formData.email,
      phone: formData.phone,
      type: formData.type as "Private" | "Trade",
      onHold: formData.onHold,
      holdReason: formData.onHold ? formData.holdReason : undefined,
      needsDetailedBoxLabels: formData.needsDetailedBoxLabels,
      updated: new Date().toISOString()
    };
    
    updateCustomer(updatedCustomer);
    
    toast({
      title: "Success",
      description: "Customer updated successfully."
    });
    
    setIsEditing(false);
  };
  
  const toggleHoldStatus = () => {
    if (!customer) return;
    
    if (customer.onHold) {
      // Remove hold
      const updatedCustomer = {
        ...customer,
        onHold: false,
        holdReason: undefined,
        updated: new Date().toISOString()
      };
      
      updateCustomer(updatedCustomer);
      
      toast({
        title: "Hold removed",
        description: `${customer.name}'s account is now active.`
      });
    } else {
      // Show dialog to get hold reason
      setHoldReason("");
      setShowHoldDialog(true);
    }
  };
  
  const applyHold = () => {
    if (!customer) return;
    
    const updatedCustomer = {
      ...customer,
      onHold: true,
      holdReason: holdReason,
      updated: new Date().toISOString()
    };
    
    updateCustomer(updatedCustomer);
    setShowHoldDialog(false);
    
    toast({
      title: "Account on hold",
      description: `${customer.name}'s account has been placed on hold.`
    });
  };

  if (!customer) {
    return (
      <Layout>
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/customers")} className="mr-4">
            <ArrowLeft className="mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Customer Not Found</h2>
        </div>
        <div className="bg-white p-6 rounded-md shadow-sm">
          <p>The customer you're looking for doesn't exist or may have been removed.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/customers")} className="mr-4">
            <ArrowLeft className="mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">{customer.name}</h2>
          {customer.onHold && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              On Hold
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={customer.onHold ? "outline" : "destructive"}
            onClick={toggleHoldStatus}
          >
            {customer.onHold ? "Remove Hold" : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Place on Hold
              </>
            )}
          </Button>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Customer
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Customer Details</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input 
                      id="accountNumber" 
                      name="accountNumber"
                      value={formData.accountNumber} 
                      onChange={handleInputChange} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={formData.name} 
                      onChange={handleInputChange} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      value={formData.phone} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Customer Type</Label>
                    <RadioGroup 
                      value={formData.type} 
                      onValueChange={handleTypeChange}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Private" id="private" />
                        <Label htmlFor="private">Private</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Trade" id="trade" />
                        <Label htmlFor="trade">Trade</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <RadioGroup 
                      value={formData.onHold ? "on-hold" : "active"} 
                      onValueChange={handleHoldStatusChange}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="active" />
                        <Label htmlFor="active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="on-hold" id="on-hold" />
                        <Label htmlFor="on-hold">On Hold</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* New - Detailed Box Labels setting */}
                  <div className="col-span-1 md:col-span-2 flex items-center justify-between py-2 border-t">
                    <div className="space-y-0.5">
                      <Label htmlFor="detailed-labels">Detailed Box Labels</Label>
                      <p className="text-sm text-muted-foreground">
                        Customer requires detailed box labels with exact product distribution and weights
                      </p>
                    </div>
                    <Switch
                      id="detailed-labels"
                      checked={formData.needsDetailedBoxLabels}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needsDetailedBoxLabels: checked }))}
                    />
                  </div>
                  
                  {formData.onHold && (
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label htmlFor="holdReason">Hold Reason</Label>
                      <Textarea 
                        id="holdReason" 
                        name="holdReason"
                        value={formData.holdReason} 
                        onChange={handleInputChange} 
                        placeholder="Provide a reason for placing this account on hold"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="bg-white p-6 rounded-md shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 border-b pb-2">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="col-span-2 font-medium">{customer.accountNumber || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b pb-2">
                      <span className="text-gray-600">Name:</span>
                      <span className="col-span-2 font-medium">{customer.name}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b pb-2">
                      <span className="text-gray-600">Type:</span>
                      <span className="col-span-2 font-medium">{customer.type}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b pb-2">
                      <span className="text-gray-600">Email:</span>
                      <span className="col-span-2 font-medium">{customer.email}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b pb-2">
                      <span className="text-gray-600">Phone:</span>
                      <span className="col-span-2 font-medium">{customer.phone}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b pb-2">
                      <span className="text-gray-600">Detailed Box Labels:</span>
                      <span className="col-span-2 font-medium flex items-center">
                        {customer.needsDetailedBoxLabels ? (
                          <>
                            <Package className="h-4 w-4 mr-1 text-green-600" />
                            <span className="text-green-600">Enabled</span>
                          </>
                        ) : 'Not Required'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {customer.onHold && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-red-700 mb-2">Account on Hold</h3>
                      {customer.holdReason && (
                        <p className="text-gray-700">{customer.holdReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {customerOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders found for this customer
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Order ID</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Delivery Method</th>
                        <th className="px-4 py-2 text-left">Items</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="px-4 py-2">{order.id.substring(0, 8)}</td>
                          <td className="px-4 py-2">
                            {order.orderDate 
                              ? format(parseISO(order.orderDate), "dd/MM/yyyy") 
                              : format(parseISO(order.created), "dd/MM/yyyy")}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "Completed" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">{order.deliveryMethod}</td>
                          <td className="px-4 py-2">{order.items?.length || 0}</td>
                          <td className="px-4 py-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(
                                order.status === "Completed" 
                                  ? `/view-completed-order/${order.id}` 
                                  : `/order-details/${order.id}`
                              )}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Hold Dialog */}
      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Customer on Hold</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Please provide a reason for placing this customer on hold.</p>
            <Textarea 
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="Enter reason for hold"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={applyHold}>Place on Hold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CustomerDetailsPage;
