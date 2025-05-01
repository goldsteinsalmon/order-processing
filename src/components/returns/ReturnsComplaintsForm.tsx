import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";

const returnSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  customerType: z.enum(["Private", "Trade"]),
  contactEmail: z.string().email({ message: "Invalid email format." }).optional(),
  contactPhone: z.string().optional(),
  dateReturned: z.date(),
  orderNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  productId: z.string().min(1, { message: "Product ID is required." }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1." }),
  reason: z.string().optional(),
  returnsRequired: z.enum(["Yes", "No"]),
});

const complaintSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  customerType: z.enum(["Private", "Trade"]),
  contactEmail: z.string().email({ message: "Invalid email format." }).optional(),
  contactPhone: z.string().optional(),
  dateSubmitted: z.date(),
  orderNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  productId: z.string().optional(),
  complaintType: z.string().min(2, { message: "Complaint type must be at least 2 characters." }),
  complaintDetails: z.string().min(10, { message: "Complaint details must be at least 10 characters." }),
  returnsRequired: z.enum(["Yes", "No"]),
});

type ReturnFormValues = z.infer<typeof returnSchema>;
type ComplaintFormValues = z.infer<typeof complaintSchema>;

const ReturnsComplaintsForm = () => {
  const { addReturn, addComplaint, products } = useData();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const returnForm = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      customerType: "Private",
      dateReturned: new Date(),
      returnsRequired: "No",
      quantity: 1,
    },
  });

  const complaintForm = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      customerType: "Private",
      dateSubmitted: new Date(),
      returnsRequired: "No",
    },
  });

  useEffect(() => {
    if (products && products.length > 0) {
      // Set the initial product to the first one in the list
      setSelectedProduct(products[0]);
      returnForm.setValue("productId", products[0].id);
      complaintForm.setValue("productId", products[0].id);
    }
  }, [products, returnForm, complaintForm]);

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product);
    returnForm.setValue("productId", productId);
    complaintForm.setValue("productId", productId);
  };

  const handleSubmitReturn = async (data: ReturnFormValues) => {
    const newReturn = {
      id: crypto.randomUUID(),
      customerId: data.customerId || undefined,
      customerName: data.customerName,
      customerType: data.customerType as "Private" | "Trade",
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      dateReturned: format(data.dateReturned, "yyyy-MM-dd"),
      orderNumber: data.orderNumber || undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      productId: data.productId,
      productSku: selectedProduct?.sku || "",
      quantity: data.quantity,
      reason: data.reason,
      returnsRequired: data.returnsRequired as "Yes" | "No",
      returnStatus: "Pending",
      resolutionStatus: "Open",
      created: new Date().toISOString()
    };

    try {
      await addReturn(newReturn);
      toast({
        title: "Return submitted",
        description: "The return has been submitted successfully.",
      });
      returnForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit the return. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitComplaint = async (data: ComplaintFormValues) => {
    const newComplaint = {
      id: crypto.randomUUID(),
      customerId: data.customerId || undefined,
      customerName: data.customerName,
      customerType: data.customerType as "Private" | "Trade",
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      dateSubmitted: format(data.dateSubmitted, "yyyy-MM-dd"),
      orderNumber: data.orderNumber || undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      productId: data.productId || undefined,
      productSku: selectedProduct?.sku || undefined,
      complaintType: data.complaintType,
      complaintDetails: data.complaintDetails,
      returnsRequired: data.returnsRequired as "Yes" | "No",
      returnStatus: "Pending",
      resolutionStatus: "Open",
      created: new Date().toISOString()
    };

    try {
      await addComplaint(newComplaint);
      toast({
        title: "Complaint submitted",
        description: "The complaint has been submitted successfully.",
      });
      complaintForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit the complaint. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Return Form */}
      <div className="border rounded-md p-4">
        <h2 className="text-lg font-semibold mb-4">Submit a Return</h2>
        <form onSubmit={returnForm.handleSubmit(handleSubmitReturn)} className="space-y-4">
          <div>
            <Label htmlFor="return-customerName">Customer Name</Label>
            <Input id="return-customerName" type="text" {...returnForm.register("customerName")} />
            {returnForm.formState.errors.customerName && (
              <p className="text-red-500 text-sm">{returnForm.formState.errors.customerName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="return-customerType">Customer Type</Label>
            <Select {...returnForm.register("customerType")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Trade">Trade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="return-contactEmail">Contact Email</Label>
            <Input id="return-contactEmail" type="email" {...returnForm.register("contactEmail")} />
            {returnForm.formState.errors.contactEmail && (
              <p className="text-red-500 text-sm">{returnForm.formState.errors.contactEmail.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="return-contactPhone">Contact Phone</Label>
            <Input id="return-contactPhone" type="tel" {...returnForm.register("contactPhone")} />
          </div>
          <div>
            <Label>Date Returned</Label>
            <Controller
              control={returnForm.control}
              name="dateReturned"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2023-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
          <div>
            <Label htmlFor="return-orderNumber">Order Number</Label>
            <Input id="return-orderNumber" type="text" {...returnForm.register("orderNumber")} />
          </div>
          <div>
            <Label htmlFor="return-invoiceNumber">Invoice Number</Label>
            <Input id="return-invoiceNumber" type="text" {...returnForm.register("invoiceNumber")} />
          </div>
          <div>
            <Label htmlFor="return-productId">Product</Label>
            <Select onValueChange={handleProductChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {returnForm.formState.errors.productId && (
              <p className="text-red-500 text-sm">{returnForm.formState.errors.productId.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="return-quantity">Quantity</Label>
            <Input id="return-quantity" type="number" {...returnForm.register("quantity", { valueAsNumber: true })} />
            {returnForm.formState.errors.quantity && (
              <p className="text-red-500 text-sm">{returnForm.formState.errors.quantity.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="return-reason">Reason for Return</Label>
            <Textarea id="return-reason" {...returnForm.register("reason")} />
          </div>
          <div>
            <Label htmlFor="return-returnsRequired">Returns Required</Label>
            <Select {...returnForm.register("returnsRequired")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Submit Return</Button>
        </form>
      </div>

      {/* Complaint Form */}
      <div className="border rounded-md p-4">
        <h2 className="text-lg font-semibold mb-4">Submit a Complaint</h2>
        <form onSubmit={complaintForm.handleSubmit(handleSubmitComplaint)} className="space-y-4">
          <div>
            <Label htmlFor="complaint-customerName">Customer Name</Label>
            <Input id="complaint-customerName" type="text" {...complaintForm.register("customerName")} />
            {complaintForm.formState.errors.customerName && (
              <p className="text-red-500 text-sm">{complaintForm.formState.errors.customerName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="complaint-customerType">Customer Type</Label>
            <Select {...complaintForm.register("customerType")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Trade">Trade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="complaint-contactEmail">Contact Email</Label>
            <Input id="complaint-contactEmail" type="email" {...complaintForm.register("contactEmail")} />
            {complaintForm.formState.errors.contactEmail && (
              <p className="text-red-500 text-sm">{complaintForm.formState.errors.contactEmail.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="complaint-contactPhone">Contact Phone</Label>
            <Input id="complaint-contactPhone" type="tel" {...complaintForm.register("contactPhone")} />
          </div>
          <div>
            <Label>Date Submitted</Label>
            <Controller
              control={complaintForm.control}
              name="dateSubmitted"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2023-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
          <div>
            <Label htmlFor="complaint-orderNumber">Order Number</Label>
            <Input id="complaint-orderNumber" type="text" {...complaintForm.register("orderNumber")} />
          </div>
          <div>
            <Label htmlFor="complaint-invoiceNumber">Invoice Number</Label>
            <Input id="complaint-invoiceNumber" type="text" {...complaintForm.register("invoiceNumber")} />
          </div>
          <div>
            <Label htmlFor="complaint-productId">Product</Label>
            <Select onValueChange={handleProductChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="complaint-complaintType">Complaint Type</Label>
            <Input id="complaint-complaintType" type="text" {...complaintForm.register("complaintType")} />
            {complaintForm.formState.errors.complaintType && (
              <p className="text-red-500 text-sm">{complaintForm.formState.errors.complaintType.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="complaint-complaintDetails">Complaint Details</Label>
            <Textarea id="complaint-complaintDetails" {...complaintForm.register("complaintDetails")} />
            {complaintForm.formState.errors.complaintDetails && (
              <p className="text-red-500 text-sm">{complaintForm.formState.errors.complaintDetails.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="complaint-returnsRequired">Returns Required</Label>
            <Select {...complaintForm.register("returnsRequired")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Submit Complaint</Button>
        </form>
      </div>
    </div>
  );
};

export default ReturnsComplaintsForm;
