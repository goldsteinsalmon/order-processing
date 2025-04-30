
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getOrderProcessingDate } from "@/utils/dateUtils";

const EditStandingOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { standingOrders, updateStandingOrder } = useData();
  const { toast } = useToast();
  
  const order = standingOrders.find(order => order.id === id);
  
  const [frequency, setFrequency] = useState<"Weekly" | "Bi-Weekly" | "Monthly">("Weekly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"Delivery" | "Collection">("Delivery");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Load initial values
  useEffect(() => {
    if (order) {
      setFrequency(order.schedule.frequency);
      setDayOfWeek(order.schedule.dayOfWeek || 1);
      setDayOfMonth(order.schedule.dayOfMonth || 1);
      setDeliveryMethod(order.schedule.deliveryMethod);
      setActive(order.active);
      setNotes(order.notes || "");
    }
  }, [order]);
  
  // Check for changes
  useEffect(() => {
    if (order) {
      const changes = 
        frequency !== order.schedule.frequency ||
        (frequency === "Weekly" || frequency === "Bi-Weekly") && dayOfWeek !== order.schedule.dayOfWeek ||
        frequency === "Monthly" && dayOfMonth !== order.schedule.dayOfMonth ||
        deliveryMethod !== order.schedule.deliveryMethod ||
        active !== order.active ||
        notes !== (order.notes || "");
      
      setHasChanges(changes);
    }
  }, [frequency, dayOfWeek, dayOfMonth, deliveryMethod, active, notes, order]);
  
  if (!order) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Standing order not found</h2>
          <Button variant="outline" onClick={() => navigate("/standing-orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Standing Orders
          </Button>
        </div>
      </Layout>
    );
  }

  // Get day of week name
  const getDayOfWeekName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };
  
  const handleSave = () => {
    // Calculate next delivery date based on frequency settings
    let nextDeliveryDate = new Date();
    
    if (frequency === "Weekly" || frequency === "Bi-Weekly") {
      // Set to the next occurrence of the selected day of week
      const currentDayOfWeek = nextDeliveryDate.getDay();
      let daysToAdd = dayOfWeek - currentDayOfWeek;
      
      if (daysToAdd <= 0) {
        // If the day has already occurred this week, go to next week
        daysToAdd += 7;
      }
      
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + daysToAdd);
      
      // Add another week for Bi-Weekly
      if (frequency === "Bi-Weekly") {
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
      }
    } else if (frequency === "Monthly") {
      // Set to the selected day of the current month
      nextDeliveryDate.setDate(dayOfMonth);
      
      // If the day has already occurred this month, go to next month
      if (nextDeliveryDate < new Date()) {
        nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
      }
    }
    
    const nextProcessingDate = getOrderProcessingDate(nextDeliveryDate);
    
    const updatedStandingOrder = {
      ...order,
      schedule: {
        ...order.schedule,
        frequency,
        ...(frequency === "Weekly" || frequency === "Bi-Weekly" ? { dayOfWeek } : {}),
        ...(frequency === "Monthly" ? { dayOfMonth } : {}),
        deliveryMethod,
        nextDeliveryDate: nextDeliveryDate.toISOString()
      },
      active,
      notes: notes || undefined,
      nextProcessingDate: nextProcessingDate.toISOString(),
      updated: new Date().toISOString()
    };
    
    updateStandingOrder(updatedStandingOrder);
    
    toast({
      title: "Standing Order Updated",
      description: `Changes to standing order for ${order.customer.name} have been saved.`
    });
    
    navigate(`/standing-order-details/${order.id}`);
  };

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/standing-order-details/${order.id}`)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Edit Standing Order</h2>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex space-x-2">
                <dt className="font-medium">Customer:</dt>
                <dd>{order.customer.name}</dd>
              </div>
              <div className="flex space-x-2">
                <dt className="font-medium">Order ID:</dt>
                <dd>{order.id}</dd>
              </div>
              {order.customerOrderNumber && (
                <div className="flex space-x-2">
                  <dt className="font-medium">Customer Order #:</dt>
                  <dd>{order.customerOrderNumber}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Frequency</Label>
              <RadioGroup value={frequency} onValueChange={(value: "Weekly" | "Bi-Weekly" | "Monthly") => setFrequency(value)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Bi-Weekly" id="biweekly" />
                  <Label htmlFor="biweekly">Bi-Weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
              </RadioGroup>
            </div>
            
            {(frequency === "Weekly" || frequency === "Bi-Weekly") && (
              <div>
                <Label>Day of Week</Label>
                <Select 
                  value={dayOfWeek.toString()} 
                  onValueChange={(value) => setDayOfWeek(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of week" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {getDayOfWeekName(day)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {frequency === "Monthly" && (
              <div>
                <Label>Day of Month</Label>
                <Select 
                  value={dayOfMonth.toString()} 
                  onValueChange={(value) => setDayOfMonth(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Delivery Method</Label>
              <RadioGroup 
                value={deliveryMethod} 
                onValueChange={(value: "Delivery" | "Collection") => setDeliveryMethod(value)} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Collection" id="collection" />
                  <Label htmlFor="collection">Collection</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label>Status</Label>
              <RadioGroup 
                value={active ? "active" : "inactive"} 
                onValueChange={(value) => setActive(value === "active")} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="inactive" />
                  <Label htmlFor="inactive">Inactive</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional notes or instructions"
              rows={3}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">
              {hasChanges ? "You have unsaved changes" : "No changes made"}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate(`/standing-order-details/${order.id}`)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default EditStandingOrderPage;
