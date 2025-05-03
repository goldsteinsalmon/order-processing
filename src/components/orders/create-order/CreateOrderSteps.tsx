import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { OrderFormValues, orderSchema } from "./orderSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBusinessDays } from "date-fns";
import { getNextWorkingDay } from "@/utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { Customer, Box, OrderItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";
import CustomerSelectionStep from "./CustomerSelectionStep";
import OrderDetailsStep from "./OrderDetailsStep";
import ProductSelectionStep from "./ProductSelectionStep";
import BoxDistributionStep from "./BoxDistributionStep";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const CreateOrderSteps: React.FC = () => {
  const navigate = useNavigate();
  const { customers, products, addOrder } = useData();
  const { toast } = useToast();
  
  // We'll keep currentStep to track progress visually
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [showOnHoldWarning, setShowOnHoldWarning] = React.useState(false);
  const [showSameDayWarning, setShowSameDayWarning] = React.useState(false);
  const [showCutOffWarning, setShowCutOffWarning] = React.useState(false);
  const [manualDateChange, setManualDateChange] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Order items state
  const [orderItems, setOrderItems] = React.useState<{ 
    productId: string; 
    quantity: number; 
    id: string;
  }[]>([{ productId: "", quantity: 0, id: crypto.randomUUID() }]);
  
  // Box distribution state - update to use camelCase properties for Box
  const [boxDistributions, setBoxDistributions] = React.useState<Box[]>([{ 
    id: crypto.randomUUID(),
    orderId: '',  // Will be filled when the order is created
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
  const getDefaultOrderDate = async () => {
    try {
      const currentHour = new Date().getHours();
      // If it's after 12 PM, set the default to 2 working days from now
      if (currentHour >= 12) {
        // Get next working day, then get next working day after that
        const nextDay = await getNextWorkingDay(new Date());
        return await getNextWorkingDay(nextDay);
      } else {
        return await getNextWorkingDay();
      }
    } catch (error) {
      console.error("Error getting default order date:", error);
      // Fallback to current date + 1 day if there's an error
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      deliveryMethod: "Delivery",
      orderDate: new Date(), // Will be updated after component mounts
    },
  });

  // Re-initialize form with updated default date when component mounts
  React.useEffect(() => {
    const initializeDefaultDate = async () => {
      try {
        const defaultDate = await getDefaultOrderDate();
        form.setValue("orderDate", defaultDate);
      } catch (error) {
        console.error("Error setting default date:", error);
      }
    };
    
    initializeDefaultDate();
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
    
    // Check for cut-off warning
    const checkCutOffWarning = async () => {
      try {
        const currentHour = new Date().getHours();
        const nextWorkingDayResult = await getNextWorkingDay(new Date());
        
        // Format both dates to compare just the date part (ignoring time)
        const isNextDay = format(orderDate, "yyyy-MM-dd") === format(nextWorkingDayResult, "yyyy-MM-dd");
        
        setShowCutOffWarning(currentHour >= 12 && isNextDay && manualDateChange);
      } catch (error) {
        console.error("Error checking cut-off warning:", error);
      }
    };
    
    checkCutOffWarning();
  }, [orderDate, manualDateChange]);
  
  // Update unassigned items when order items change
  React.useEffect(() => {
    if (selectedCustomer?.needsDetailedBoxLabels) {
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
          id: crypto.randomUUID(),
          orderId: '', 
          boxNumber: 1, 
          items: [], 
          completed: false,
          printed: false
        }]);
      }
    }
  }, [orderItems, products, selectedCustomer]);

  // Debug effect to log box distributions and unassigned items
  useEffect(() => {
    console.log("Box distributions:", boxDistributions);
    console.log("Unassigned items:", unassignedItems);
  }, [boxDistributions, unassignedItems]);
  
  // Add a new state to track if dialogs are in transition
  const [isDialogTransitioning, setIsDialogTransitioning] = React.useState(false);
  
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    
    // If customer is on hold, show warning dialog
    if (customer && customer.onHold) {
      setSelectedCustomer(customer);
      setShowOnHoldWarning(true);
    } else {
      // If not on hold, proceed normally
      form.setValue("customerId", customerId);
      setCurrentStep(2);
      setSelectedCustomer(customer || null);
    }
  };
  
  const handleCancelCustomerSelection = () => {
    // First clear the states
    setSelectedCustomer(null);
    setShowOnHoldWarning(false);
    
    // Show toast and navigate in the next event loop cycle to ensure
    // the dialog has time to close properly
    setTimeout(() => {
      toast({
        title: "Selection canceled",
        description: "You've canceled the on-hold customer selection. Returning to orders list.",
      });
      
      // Force navigation back to the orders list
      window.location.href = "/orders";
    }, 0);
  };
  
  const confirmOnHoldCustomer = () => {
    if (selectedCustomer) {
      form.setValue("customerId", selectedCustomer.id);
      setShowOnHoldWarning(false);
      setCurrentStep(2);
    }
  };
  
  const handleDateChange = async (date?: Date) => {
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
  
  const handleSubmit = () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    // Set submitting state to prevent double submissions
    setIsSubmitting(true);

    // Validate form
    form.trigger().then(isValid => {
      if (!isValid) {
        toast({
          title: "Validation error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validate items
      const hasInvalidItems = orderItems.some(
        item => item.productId === "" || item.quantity <= 0
      );
  
      if (hasInvalidItems) {
        toast({
          title: "Invalid items",
          description: "Please ensure all items have a product and a positive quantity.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // For customers with box labels, check if all items are assigned
      if (selectedCustomer?.needsDetailedBoxLabels) {
        // Clean up any empty unassigned items first
        const cleanedUnassignedItems = unassignedItems.filter(item => item.quantity > 0);
        
        if (cleanedUnassignedItems.length > 0) {
          console.log("Remaining unassigned items:", cleanedUnassignedItems);
          toast({
            title: "Unassigned items",
            description: "Please assign all items to boxes before submitting.",
            variant: "destructive",
          });
          setIsSubmitting(false);
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
          setIsSubmitting(false);
          return;
        }
      }

      // Get form values
      const data = form.getValues();

      // Process the order date - ensure it's a proper Date object
      let orderDateValue = data.orderDate;
      
      // Prepare order items - convert the format to match what the API expects
      const finalItems: OrderItem[] = orderItems
        .filter(item => item.productId && item.quantity > 0)
        .map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            id: item.id,
            orderId: "", // Will be filled in by the backend
            productId: item.productId, // Make sure we use the correct property name
            product: product,
            quantity: item.quantity
          };
        });
      
      console.log("Final order items:", finalItems);
      
      const newOrder = {
        id: crypto.randomUUID(),
        customerId: data.customerId,
        customer: customers.find(c => c.id === data.customerId)!,
        customerOrderNumber: data.customerOrderNumber || '',
        orderDate: format(orderDateValue, "yyyy-MM-dd"),
        requiredDate: format(orderDateValue, "yyyy-MM-dd"), // Default to same date
        deliveryMethod: data.deliveryMethod as "Delivery" | "Collection",
        items: finalItems, // Use the properly formatted items
        notes: data.notes || '',
        status: "Pending" as const,
        created: new Date().toISOString(),
        // Include box distributions if customer needs detailed box labels
        boxDistributions: selectedCustomer?.needsDetailedBoxLabels ? boxDistributions : undefined
      };

      // Log the order for debugging
      console.log("Creating new order:", newOrder);

      addOrder(newOrder)
        .then(result => {
          if (result) {
            toast({
              title: "Order created",
              description: "The order has been created successfully.",
            });
            // Reset form and navigate back
            resetForm();
            navigate("/orders");
          } else {
            toast({
              title: "Error",
              description: "Failed to create order. Please try again.",
              variant: "destructive",
            });
          }
        })
        .catch(error => {
          console.error("Error creating order:", error);
          toast({
            title: "Error",
            description: "Failed to create order: " + (error?.message || "Unknown error"),
            variant: "destructive",
          });
        })
        .finally(() => {
          // Reset submitting state regardless of outcome
          setIsSubmitting(false);
        });
    });
  };
  
  const resetForm = () => {
    // Initialize the form with a current date as fallback
    form.reset({
      customerId: "",
      customerOrderNumber: "",
      orderDate: new Date(),
      deliveryMethod: "Delivery",
      notes: "",
    });
    
    // Then asynchronously update with the proper next working day
    const updateWithWorkingDay = async () => {
      try {
        const nextWorkingDay = await getDefaultOrderDate();
        form.setValue("orderDate", nextWorkingDay);
      } catch (error) {
        console.error("Error updating form with working day:", error);
      }
    };
    updateWithWorkingDay();
    
    setOrderItems([{ productId: "", quantity: 1, id: crypto.randomUUID() }]);
    setBoxDistributions([{ 
      id: crypto.randomUUID(),
      orderId: '', 
      boxNumber: 1, 
      items: [], 
      completed: false,
      printed: false
    }]);
    setUnassignedItems([]);
    setCurrentStep(1);
    setManualDateChange(false);
  };

  const handleCancel = () => {
    // Use window.location for more reliable navigation
    window.location.href = "/orders";
  };

  // Determine progress percentage based on completed steps
  const calculateProgress = () => {
    // Basic steps: Customer and Details
    let steps = 2;
    let completed = 0;
    
    if (customerId) completed++;
    if (form.formState.isValid) completed++;
    
    // If customer needs detailed box labels, add another step
    if (selectedCustomer?.needsDetailedBoxLabels) {
      steps = 3;
      if (unassignedItems.length === 0 && boxDistributions.some(box => box.items.length > 0)) {
        completed++;
      }
    }
    
    return (completed / steps) * 100;
  };

  return (
    <>
      <Form {...form}>
        <form className="space-y-8">
          <div className="mb-6">
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">1. Customer</h3>
            <CustomerSelectionStep 
              onCustomerSelect={handleCustomerSelect} 
              customers={customers}
              selectedCustomer={selectedCustomer}
              disabled={showOnHoldWarning}
            />
          </Card>

          <Card className={`p-6 ${!customerId ? 'opacity-50' : ''}`}>
            <h3 className="text-lg font-medium mb-4">2. Order Details</h3>
            <OrderDetailsStep
              form={form}
              onDateChange={handleDateChange}
              onNext={() => setCurrentStep(3)}
              onBack={() => {}}
              hideNavigationButtons={true}
            />
          </Card>

          <Card className={`p-6 ${!customerId ? 'opacity-50' : ''}`}>
            <h3 className="text-lg font-medium mb-4">3. Products</h3>
            <ProductSelectionStep
              orderItems={orderItems}
              products={products}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onItemChange={handleItemChange}
              selectedCustomer={selectedCustomer}
              onContinue={() => {}}
              onCancel={handleCancel}
              hideNavigationButtons={true}
            />
          </Card>

          {selectedCustomer?.needsDetailedBoxLabels && (
            <Card className={`p-6 ${!customerId ? 'opacity-50' : ''}`}>
              <h3 className="text-lg font-medium mb-4">4. Box Distribution</h3>
              <BoxDistributionStep
                boxDistributions={boxDistributions}
                setBoxDistributions={setBoxDistributions}
                unassignedItems={unassignedItems}
                setUnassignedItems={setUnassignedItems}
                products={products}
                onBack={() => {}}
                onSubmit={() => {}}
              />
            </Card>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  {selectedCustomer?.needsDetailedBoxLabels ? "Continue to Box Distribution" : "Create Order"}
                </>
              )}
            </Button>
          </div>
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
      <AlertDialog 
        open={showOnHoldWarning} 
        onOpenChange={(open) => {
          // Only handle closing, not opening (which is managed by handleCustomerSelect)
          if (!open) {
            handleCancelCustomerSelection();
          }
        }}
      >
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
