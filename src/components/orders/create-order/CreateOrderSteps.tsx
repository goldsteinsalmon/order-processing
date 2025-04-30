
import React from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { OrderFormValues, orderSchema } from "./orderSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBusinessDays } from "date-fns";
import { getNextWorkingDay } from "@/utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { Customer, Box, OrderItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";
import CustomerSelectionStep from "./CustomerSelectionStep";
import OrderDetailsStep from "./OrderDetailsStep";
import ProductSelectionStep from "./ProductSelectionStep";
import BoxDistributionStep from "./BoxDistributionStep";
import { format } from "date-fns";

type OrderStep = "customer" | "details" | "items" | "boxes";

const CreateOrderSteps: React.FC = () => {
  const navigate = useNavigate();
  const { customers, products, addOrder } = useData();
  const { toast } = useToast();
  
  // State for managing the current step
  const [currentStep, setCurrentStep] = React.useState<OrderStep>("customer");
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [showOnHoldWarning, setShowOnHoldWarning] = React.useState(false);
  const [showSameDayWarning, setShowSameDayWarning] = React.useState(false);
  const [showCutOffWarning, setShowCutOffWarning] = React.useState(false);
  const [manualDateChange, setManualDateChange] = React.useState(false);
  
  // Order items state
  const [orderItems, setOrderItems] = React.useState<{ 
    productId: string; 
    quantity: number; 
    id: string;
  }[]>([{ productId: "", quantity: 0, id: crypto.randomUUID() }]);
  
  // Box distribution state
  const [boxDistributions, setBoxDistributions] = React.useState<Box[]>([{ 
    boxNumber: 1, 
    items: [], 
    completed: false,
    printed: false
  }]);
  
  const [unassignedItems, setUnassignedItems] = React.useState<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
  }[]>([]);
  
  // Get the default order date based on current time
  const getDefaultOrderDate = () => {
    const currentHour = new Date().getHours();
    // If it's after 12 PM, set the default to 2 working days from now
    if (currentHour >= 12) {
      return addBusinessDays(new Date(), 2);
    } else {
      return getNextWorkingDay();
    }
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      deliveryMethod: "Delivery",
      orderDate: getDefaultOrderDate(),
    },
  });

  // Re-initialize form with updated default date when component mounts
  React.useEffect(() => {
    form.setValue("orderDate", getDefaultOrderDate());
  }, []);

  const orderDate = form.watch("orderDate");
  const customerId = form.watch("customerId");
  
  // Effect to check if customer needs detailed box labels
  React.useEffect(() => {
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [customerId, customers]);
  
  React.useEffect(() => {
    if (!manualDateChange || !orderDate) {
      return;
    }

    // Check for same day warning - only show when selecting today's date
    setShowSameDayWarning(isToday(orderDate));
    
    // Check for cut-off warning - only show when selecting next working day after 12 PM
    const currentHour = new Date().getHours();
    const nextWorkingDay = getNextWorkingDay(new Date());
    
    // Format both dates to compare just the date part (ignoring time)
    const isNextDay = format(orderDate, "yyyy-MM-dd") === format(nextWorkingDay, "yyyy-MM-dd");
    
    setShowCutOffWarning(currentHour >= 12 && isNextDay && manualDateChange);
  }, [orderDate, manualDateChange]);
  
  // Update unassigned items when order items change
  React.useEffect(() => {
    if (currentStep === "boxes" && selectedCustomer?.needsDetailedBoxLabels) {
      const newUnassignedItems = orderItems
        .filter(item => item.productId && item.quantity > 0)
        .map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            id: item.id,
            productId: item.productId,
            productName: product ? product.name : "Unknown Product",
            quantity: item.quantity
          };
        });
      
      setUnassignedItems(newUnassignedItems);
      
      // Initialize box distributions with empty boxes
      if (boxDistributions.length === 0) {
        setBoxDistributions([{ 
          boxNumber: 1, 
          items: [], 
          completed: false,
          printed: false
        }]);
      }
    }
  }, [currentStep, orderItems, products, selectedCustomer, boxDistributions]);
  
  const handleCancelCustomerSelection = () => {
    setSelectedCustomer(null);
    setShowOnHoldWarning(false);
  };
  
  const confirmOnHoldCustomer = () => {
    if (selectedCustomer) {
      form.setValue("customerId", selectedCustomer.id);
      setShowOnHoldWarning(false);
      // Move to next step
      setCurrentStep("details");
    }
  };
  
  const handleContinueToBoxes = () => {
    // Validate items before proceeding
    const hasInvalidItems = orderItems.some(
      item => item.productId === "" || item.quantity <= 0
    );

    if (hasInvalidItems) {
      toast({
        title: "Invalid items",
        description: "Please ensure all items have a product and a positive quantity.",
        variant: "destructive",
      });
      return;
    }

    if (selectedCustomer?.needsDetailedBoxLabels) {
      setCurrentStep("boxes");
      
      // Initialize box distributions if needed
      if (boxDistributions.length === 0) {
        setBoxDistributions([{ 
          boxNumber: 1, 
          items: [], 
          completed: false,
          printed: false
        }]);
      }
    } else {
      // If customer doesn't need box labels, submit the form directly
      handleSubmit();
    }
  };
  
  const handleSubmit = () => {
    // Get form values
    const data = form.getValues();
    
    // Validate items if not using box distribution
    if (!selectedCustomer?.needsDetailedBoxLabels) {
      const hasInvalidItems = orderItems.some(
        item => item.productId === "" || item.quantity <= 0
      );
  
      if (hasInvalidItems) {
        toast({
          title: "Invalid items",
          description: "Please ensure all items have a product and a positive quantity.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For customers with box labels, check if all items are assigned
      if (unassignedItems.length > 0) {
        toast({
          title: "Unassigned items",
          description: "Please assign all items to boxes before submitting.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if there are empty boxes
      const hasEmptyBoxes = boxDistributions.some(box => box.items.length === 0);
      if (hasEmptyBoxes) {
        toast({
          title: "Empty boxes",
          description: "Please remove any empty boxes before submitting.",
          variant: "destructive",
        });
        return;
      }
    }

    // Prepare order items array
    const finalOrderItems: OrderItem[] = selectedCustomer?.needsDetailedBoxLabels 
      ? boxDistributions.flatMap(box => 
          box.items.map(item => ({
            id: crypto.randomUUID(),
            productId: item.productId,
            product: products.find(p => p.id === item.productId)!,
            quantity: item.quantity,
            boxNumber: box.boxNumber
          }))
        )
      : orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          product: products.find(p => p.id === item.productId)!,
          quantity: item.quantity
        }));

    const newOrder = {
      id: crypto.randomUUID(),
      customerId: data.customerId,
      customer: customers.find(c => c.id === data.customerId)!,
      customerOrderNumber: data.customerOrderNumber,
      orderDate: format(data.orderDate, "yyyy-MM-dd"),
      deliveryMethod: data.deliveryMethod as "Delivery" | "Collection",
      items: finalOrderItems,
      notes: data.notes,
      status: "Pending" as const,
      created: new Date().toISOString(),
      // Include box distributions if customer needs detailed box labels
      boxDistributions: selectedCustomer?.needsDetailedBoxLabels ? boxDistributions : undefined
    };

    addOrder(newOrder);
    
    toast({
      title: "Order created",
      description: "The order has been created successfully.",
    });

    // Reset form and navigate back
    resetForm();
    navigate("/orders");
  };
  
  const resetForm = () => {
    form.reset({
      customerId: "",
      customerOrderNumber: "",
      orderDate: getDefaultOrderDate(),
      deliveryMethod: "Delivery",
      notes: "",
    });
    setOrderItems([{ productId: "", quantity: 1, id: crypto.randomUUID() }]);
    setBoxDistributions([{ boxNumber: 1, items: [], completed: false, printed: false }]);
    setUnassignedItems([]);
    setCurrentStep("customer");
    setManualDateChange(false);
  };

  const handleCancel = () => {
    navigate("/orders");
  };
  
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    
    // If customer is on hold, show warning dialog
    if (customer && customer.onHold) {
      setSelectedCustomer(customer);
      setShowOnHoldWarning(true);
    } else {
      // If not on hold, proceed normally
      form.setValue("customerId", customerId);
      setCurrentStep("details");
    }
  };
  
  const handleDateChange = (date?: Date) => {
    if (date) {
      setManualDateChange(true);
      form.setValue("orderDate", date);
    }
  };
  
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Handlers for order items
  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 0, id: crypto.randomUUID() }]);
  };

  const handleRemoveItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: "productId" | "quantity", value: string | number) => {
    setOrderItems(
      orderItems.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };
  
  // Render appropriate step based on currentStep
  const renderStep = () => {
    switch (currentStep) {
      case "customer":
        return (
          <CustomerSelectionStep 
            onCustomerSelect={handleCustomerSelect} 
            customers={customers} 
          />
        );
      case "details":
        return (
          <OrderDetailsStep
            form={form}
            onDateChange={handleDateChange}
            onNext={() => setCurrentStep("items")}
            onBack={() => setCurrentStep("customer")}
          />
        );
      case "items":
        return (
          <ProductSelectionStep
            orderItems={orderItems}
            products={products}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onItemChange={handleItemChange}
            selectedCustomer={selectedCustomer}
            onContinue={handleContinueToBoxes}
            onCancel={handleCancel}
          />
        );
      case "boxes":
        return (
          <BoxDistributionStep
            boxDistributions={boxDistributions}
            setBoxDistributions={setBoxDistributions}
            unassignedItems={unassignedItems}
            setUnassignedItems={setUnassignedItems}
            products={products}
            onBack={() => setCurrentStep("items")}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Form {...form}>
        <form className="space-y-6">
          {renderStep()}
        </form>
      </Form>

      {/* Same Day Warning Dialog */}
      <Dialog open={showSameDayWarning} onOpenChange={setShowSameDayWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Same Day Order Warning</DialogTitle>
            <DialogDescription>
              You are picking today's date. Are you sure you want to place a same-day order?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSameDayWarning(false)}>Yes, I'm Sure</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cut-off Time Warning Dialog */}
      <Dialog open={showCutOffWarning} onOpenChange={setShowCutOffWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Cut-off Time Warning</DialogTitle>
            <DialogDescription>
              It's past the 12 PM cut-off time. Are you sure you want to place an order for the next working day?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowCutOffWarning(false)}>Yes, I'm Sure</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* On Hold Customer Warning Dialog */}
      <AlertDialog open={showOnHoldWarning} onOpenChange={setShowOnHoldWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Customer On Hold Warning</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCustomer && (
                <>
                  <p className="font-medium text-red-500 mb-2">
                    {selectedCustomer.name} is currently on hold.
                  </p>
                  <p className="mb-4">
                    Reason: {selectedCustomer.holdReason || "No reason provided"}
                  </p>
                  <p>Are you sure you want to proceed with this customer?</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelCustomerSelection}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmOnHoldCustomer}>
              Yes, Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateOrderSteps;
