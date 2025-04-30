import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Return } from "@/types";

const complaintsSchema = z.object({
  customerType: z.enum(["Private", "Trade"], {
    required_error: "Customer type is required",
  }),
  customerName: z.string().min(1, "Customer name is required"),
  customerId: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  dateReturned: z.date({ required_error: "Date returned is required" }),
  orderNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  productSku: z.string().optional(),
  complaintType: z.string().min(1, "Complaint type is required"),
  complaintDetails: z.string().min(1, "Complaint details are required"),
  returnsRequired: z.enum(["Yes", "No"], { required_error: "Returns required selection is required" }),
  returnStatus: z.string().optional(),
  resolutionStatus: z.enum(["Open", "In Progress", "Resolved"], {
    required_error: "Resolution status is required",
  }),
  resolutionNotes: z.string().optional(),
});

type ComplaintsFormValues = z.infer<typeof complaintsSchema>;

const ReturnsComplaintsForm: React.FC = () => {
  const { products, customers, addComplaint, addReturn } = useData();
  const { toast } = useToast();

  const form = useForm<ComplaintsFormValues>({
    resolver: zodResolver(complaintsSchema),
    defaultValues: {
      customerType: "Private",
      dateReturned: new Date(),
      returnsRequired: "No",
      resolutionStatus: "Open",
    },
  });

  const customerType = form.watch("customerType");
  const returnsRequired = form.watch("returnsRequired");
  const customerId = form.watch("customerId");
  
  // Update customer details when a trade customer is selected
  useEffect(() => {
    if (customerType === "Trade" && customerId) {
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (selectedCustomer) {
        form.setValue("customerName", selectedCustomer.name);
        form.setValue("contactEmail", selectedCustomer.email || "");
        form.setValue("contactPhone", selectedCustomer.phone || "");
      }
    }
  }, [customerId, customerType, customers, form]);
  
  const complaintTypes = [
    "Foreign Object Found",
    "Quality Issue",
    "Wrong Product",
    "Late Delivery",
    "Damaged Packaging",
    "Taste Issue",
    "Missing Item",
    "Other",
  ];

  const returnStatusOptions = [
    "Pending",
    "Processing",
    "Completed",
    "No Return Required",
  ] as const;

  type ReturnStatusType = typeof returnStatusOptions[number];

  const onSubmit = (data: ComplaintsFormValues) => {
    // If returns are required, create a return record
    if (data.returnsRequired === "Yes" && data.productSku) {
      const product = products.find(p => p.id === data.productSku);
      if (product) {
        // Convert returnStatus string to the correct literal type
        const inputReturnStatus = data.returnStatus || "Pending";
        
        // Type guard to ensure returnStatus is one of the allowed values
        const validReturnStatus: ReturnStatusType = 
          (inputReturnStatus === "Pending" || 
          inputReturnStatus === "Processing" || 
          inputReturnStatus === "Completed" || 
          inputReturnStatus === "No Return Required") 
            ? inputReturnStatus as ReturnStatusType 
            : "Pending";
        
        const returnItem: Return = {
          id: crypto.randomUUID(),
          customerType: data.customerType,
          customerName: data.customerName,
          customerId: data.customerId,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          dateReturned: format(data.dateReturned, "yyyy-MM-dd"),
          orderNumber: data.orderNumber,
          invoiceNumber: data.invoiceNumber,
          productSku: data.productSku,
          product: product,
          reason: data.complaintDetails,
          returnsRequired: data.returnsRequired,
          returnStatus: validReturnStatus,
          resolutionStatus: data.resolutionStatus,
          resolutionNotes: data.resolutionNotes,
          created: new Date().toISOString(),
        };
        
        addReturn(returnItem);
      }
    }

    // Create complaint record with proper type checking for returnStatus
    const inputReturnStatus = data.returnsRequired === "Yes" ? 
      (data.returnStatus || "Pending") : "No Return Required";
    
    // Type guard for complaint returnStatus
    const validReturnStatus: ReturnStatusType = 
      (inputReturnStatus === "Pending" || 
      inputReturnStatus === "Processing" || 
      inputReturnStatus === "Completed" || 
      inputReturnStatus === "No Return Required") 
        ? inputReturnStatus as ReturnStatusType 
        : "Pending";
    
    const complaint = {
      id: crypto.randomUUID(),
      customerType: data.customerType,
      customerName: data.customerName,
      customerId: data.customerId,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      dateSubmitted: format(data.dateReturned, "yyyy-MM-dd"),
      orderNumber: data.orderNumber,
      invoiceNumber: data.invoiceNumber,
      productSku: data.productSku,
      product: data.productSku ? products.find(p => p.id === data.productSku) : undefined,
      complaintType: data.complaintType,
      complaintDetails: data.complaintDetails,
      returnsRequired: data.returnsRequired,
      returnStatus: validReturnStatus,
      resolutionStatus: data.resolutionStatus,
      resolutionNotes: data.resolutionNotes,
      created: new Date().toISOString(),
    };
    
    addComplaint(complaint);

    toast({
      title: "Complaint registered",
      description: "The complaint has been successfully registered.",
    });

    // Reset form
    form.reset({
      customerType: "Private",
      customerName: "",
      customerId: "",
      contactEmail: "",
      contactPhone: "",
      dateReturned: new Date(),
      orderNumber: "",
      invoiceNumber: "",
      productSku: "",
      complaintType: "",
      complaintDetails: "",
      returnsRequired: "No",
      returnStatus: "",
      resolutionStatus: "Open",
      resolutionNotes: "",
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">New Customer Return</h2>
      <p className="text-gray-500 mb-6">Register a new customer return or complaint</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type *</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset customer-specific fields when changing type
                          if (value === "Private") {
                            form.setValue("customerId", "");
                          }
                        }} 
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Private" id="private" />
                          <label htmlFor="private">Private Customer</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Trade" id="trade" />
                          <label htmlFor="trade">Trade Customer</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {customerType === "Trade" ? (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Customer *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} 
                              {customer.accountNumber && ` - ${customer.accountNumber}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Return Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dateReturned"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Returned *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "MMMM d, yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => date && field.onChange(date)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter order number (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter invoice number (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productSku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product SKU</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Complaint Information</h3>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="complaintType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaint Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select complaint type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {complaintTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complaintDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaint Details *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter details about the complaint"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Resolution Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="returnsRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Returns Required *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {returnsRequired === "Yes" && (
                <FormField
                  control={form.control}
                  name="returnStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {returnStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="resolutionStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolutionNotes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Resolution Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter resolution notes (optional)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ReturnsComplaintsForm;
