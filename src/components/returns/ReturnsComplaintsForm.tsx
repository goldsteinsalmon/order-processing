import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { Return, Complaint } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// This component handles both Returns and Complaints forms in one place
const ReturnsComplaintsForm: React.FC = () => {
  const { addReturn, addComplaint, products, customers } = useData();
  const { toast } = useToast();
  
  const [formType, setFormType] = useState<"returns" | "complaints">("returns");
  const [customerType, setCustomerType] = useState<"Private" | "Trade">("Private");
  const [customerName, setCustomerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState<number>(1); // Added quantity field
  const [complaintType, setComplaintType] = useState("");
  const [complaintDetails, setComplaintDetails] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnsRequired, setReturnsRequired] = useState<"Yes" | "No">("Yes");
  const [returnStatus, setReturnStatus] = useState<"Pending" | "Processing" | "Completed" | "No Return Required">("Pending");
  const [resolutionStatus, setResolutionStatus] = useState<"Open" | "In Progress" | "Resolved">("Open");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const resetForm = () => {
    setFormType("returns");
    setCustomerType("Private");
    setCustomerName("");
    setContactEmail("");
    setContactPhone("");
    setDate(new Date());
    setOrderNumber("");
    setInvoiceNumber("");
    setProductSku("");
    setProductId("");
    setQuantity(1);
    setComplaintType("");
    setComplaintDetails("");
    setReturnReason("");
    setReturnsRequired("Yes");
    setReturnStatus("Pending");
    setResolutionStatus("Open");
    setResolutionNotes("");
    setSelectedCustomerId("");
  };
  
  // Update the handleSubmit function to include quantity
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formType === "returns") {
      // Create a new return
      const selectedProduct = products.find(p => p.id === productId);
      
      if (!selectedProduct) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a valid product."
        });
        return;
      }
      
      const newReturn: Return = {
        id: uuidv4(),
        customerId: customerType === "Trade" ? selectedCustomerId : undefined,
        customerType,
        customerName,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        dateReturned: date.toISOString(),
        orderNumber: orderNumber || undefined,
        invoiceNumber: invoiceNumber || undefined,
        productSku: selectedProduct.sku,
        product: selectedProduct,
        quantity: quantity, // Include quantity in the return
        reason: returnReason || undefined,
        returnsRequired,
        returnStatus,
        resolutionStatus,
        resolutionNotes: resolutionNotes || undefined,
        created: new Date().toISOString()
      };
      
      addReturn(newReturn);
      toast({
        title: "Return Created",
        description: "The return has been successfully recorded."
      });
    } else {
      
      const selectedProduct = productId ? products.find(p => p.id === productId) : undefined;
      
      const newComplaint: Complaint = {
        id: uuidv4(),
        customerId: customerType === "Trade" ? selectedCustomerId : undefined,
        customerType,
        customerName,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        dateSubmitted: date.toISOString(),
        orderNumber: orderNumber || undefined,
        invoiceNumber: invoiceNumber || undefined,
        productSku: selectedProduct?.sku,
        product: selectedProduct,
        complaintType,
        complaintDetails,
        returnsRequired,
        returnStatus,
        resolutionStatus,
        resolutionNotes: resolutionNotes || undefined,
        created: new Date().toISOString()
      };
      
      addComplaint(newComplaint);
      toast({
        title: "Complaint Created",
        description: "The complaint has been successfully recorded."
      });
    }
    
    // Reset form after submission
    resetForm();
  };
  
  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    
    // Find the selected customer
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      // Auto-fill fields with customer information
      setCustomerName(customer.name);
      setContactEmail(customer.email);
      setContactPhone(customer.phone);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Record a Return or Complaint</h2>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What would you like to record?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formType}
            onValueChange={(value: "returns" | "complaints") => setFormType(value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="returns" id="returns" />
              <Label htmlFor="returns">Product Return</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="complaints" id="complaints" />
              <Label htmlFor="complaints">Customer Complaint</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerType">Customer Type</Label>
              <RadioGroup
                value={customerType}
                onValueChange={(value: "Private" | "Trade") => setCustomerType(value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Private" id="private" />
                  <Label htmlFor="private">Private Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Trade" id="trade" />
                  <Label htmlFor="trade">Trade Account</Label>
                </div>
              </RadioGroup>
            </div>
            
            {customerType === "Trade" ? (
              <div>
                <Label htmlFor="tradeCustomer">Select Trade Customer</Label>
                <Select 
                  value={selectedCustomerId} 
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger id="tradeCustomer">
                    <SelectValue placeholder="Select a trade customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers
                      .filter(customer => customer.type === "Trade")
                      .map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">Email (Optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone (Optional)</Label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="date">
                {formType === "returns" ? "Date Returned" : "Date of Complaint"}
              </Label>
              <Input
                id="date"
                type="date"
                value={format(date, "yyyy-MM-dd")}
                onChange={(e) => setDate(new Date(e.target.value))}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="productSku">Product</Label>
              <Select 
                value={productId} 
                onValueChange={setProductId}
                required={formType === "returns"}
              >
                <SelectTrigger id="productSku">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {formType === "returns" && (
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full"
                  required
                />
              </div>
            )}
            
            {formType === "returns" ? (
              <div>
                <Label htmlFor="returnReason">Reason for Return</Label>
                <Textarea
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Describe why the product is being returned"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="complaintType">Type of Complaint</Label>
                  <Select value={complaintType} onValueChange={setComplaintType} required>
                    <SelectTrigger id="complaintType">
                      <SelectValue placeholder="Select complaint type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quality Issue">Quality Issue</SelectItem>
                      <SelectItem value="Foreign Object">Foreign Object Found</SelectItem>
                      <SelectItem value="Late Delivery">Late Delivery</SelectItem>
                      <SelectItem value="Incorrect Order">Incorrect Order</SelectItem>
                      <SelectItem value="Customer Service">Customer Service</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="complaintDetails">Complaint Details</Label>
                  <Textarea
                    id="complaintDetails"
                    value={complaintDetails}
                    onChange={(e) => setComplaintDetails(e.target.value)}
                    placeholder="Provide details about the complaint"
                    rows={3}
                    required
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resolution Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Returns Required</Label>
              <RadioGroup
                value={returnsRequired}
                onValueChange={(value: "Yes" | "No") => setReturnsRequired(value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="returnsYes" />
                  <Label htmlFor="returnsYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="returnsNo" />
                  <Label htmlFor="returnsNo">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {returnsRequired === "Yes" && (
              <div>
                <Label htmlFor="returnStatus">Return Status</Label>
                <Select value={returnStatus} onValueChange={(value: "Pending" | "Processing" | "Completed" | "No Return Required") => setReturnStatus(value)}>
                  <SelectTrigger id="returnStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="No Return Required">No Return Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="resolutionStatus">Resolution Status</Label>
              <Select value={resolutionStatus} onValueChange={(value: "Open" | "In Progress" | "Resolved") => setResolutionStatus(value)}>
                <SelectTrigger id="resolutionStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="resolutionNotes">Resolution Notes</Label>
              <Textarea
                id="resolutionNotes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Notes about resolution or actions taken"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" className="mr-2">
            Submit {formType === "returns" ? "Return" : "Complaint"}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset Form
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReturnsComplaintsForm;
