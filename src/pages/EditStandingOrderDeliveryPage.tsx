import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Order, StandingOrder, StandingOrderItem } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const EditStandingOrderDeliveryPage: React.FC = () => {
  const { id, deliveryDate } = useParams<{ id: string; deliveryDate: string }>();
  const navigate = useNavigate();
  const { standingOrders, updateStandingOrder, addOrder } = useData();

  const [standingOrder, setStandingOrder] = useState<StandingOrder | null>(null);
  const [modifiedDelivery, setModifiedDelivery] = useState<{ date: string; notes?: string; items?: StandingOrderItem[] }>({ date: deliveryDate || "" });
  const [isModified, setIsModified] = useState(false);
  const [orderItems, setOrderItems] = useState<StandingOrderItem[]>([]);

  useEffect(() => {
    if (id) {
      const foundStandingOrder = standingOrders.find(so => so.id === id);
      if (foundStandingOrder) {
        setStandingOrder(foundStandingOrder);
        setOrderItems(foundStandingOrder.items);
      }
    }
  }, [id, standingOrders]);

  useEffect(() => {
    if (standingOrder) {
      const parsedDeliveryDate = deliveryDate ? new Date(deliveryDate) : null;
      if (parsedDeliveryDate) {
        setModifiedDelivery(prev => ({ ...prev, date: parsedDeliveryDate.toISOString() }));
      }
    }
  }, [standingOrder, deliveryDate]);

  const handleSave = async () => {
    if (!standingOrder) return;

    // Create a new order based on the standing order and modifications
    const newOrderId = crypto.randomUUID();
    const deliveryDate = modifiedDelivery.date || standingOrder.schedule.nextDeliveryDate;

    // Map standing order items to order items
    const mappedItems = orderItems.map(item => ({
      id: crypto.randomUUID(),
      orderId: newOrderId,
      productId: item.productId,
      product: item.product,
      quantity: item.quantity
    }));

    const newOrder: Order = {
      id: newOrderId,
      customerId: standingOrder.customerId,
      customer: standingOrder.customer,
      customerOrderNumber: standingOrder.customerOrderNumber,
      orderDate: new Date().toISOString(),
      requiredDate: deliveryDate,
      deliveryMethod: standingOrder.deliveryMethod,
      notes: modifiedDelivery.notes || standingOrder.notes,
      status: "Pending",
      fromStandingOrder: standingOrder.id,
      items: mappedItems
    };

    // Save the new order
    await addOrder(newOrder);

    // Update the standing order's modified deliveries
    const updatedStandingOrder = {
      ...standingOrder,
      schedule: {
        ...standingOrder.schedule,
        modifiedDeliveries: [
          ...(standingOrder.schedule.modifiedDeliveries || []),
          {
            date: deliveryDate,
            modifications: {
              notes: !!modifiedDelivery.notes,
              items: isModified
            }
          }
        ]
      }
    };

    // Save the updated standing order
    await updateStandingOrder(updatedStandingOrder);

    // Navigate back to the standing order details page
    navigate(`/standing-orders/${id}`);
  };

  const handleCancel = () => {
    navigate(`/standing-orders/${id}`);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setModifiedDelivery(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setIsModified(true);
    setOrderItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  if (!standingOrder) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Delivery for {format(new Date(modifiedDelivery.date), "PPP")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="deliveryDate">Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !modifiedDelivery.date && "text-muted-foreground"
                  )}
                >
                  {modifiedDelivery.date ? (
                    format(new Date(modifiedDelivery.date), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={modifiedDelivery.date ? new Date(modifiedDelivery.date) : undefined}
                  onSelect={(date) => setModifiedDelivery(prev => ({ ...prev, date: date?.toISOString() || "" }))}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="mb-4">
            <Label htmlFor="notes">Delivery Notes</Label>
            <Textarea
              id="notes"
              placeholder="Delivery Instructions"
              value={modifiedDelivery.notes || standingOrder.notes}
              onChange={handleNotesChange}
            />
          </div>

          <div className="mb-4">
            <h3>Items</h3>
            <ul>
              {orderItems.map(item => (
                <li key={item.id} className="flex items-center justify-between py-2 border-b">
                  <span>{item.product.name}</span>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleItemQuantityChange(item.id, Math.max(0, item.quantity - 1))}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      className="w-20 mx-2 text-center"
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleItemQuantityChange(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Delivery</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditStandingOrderDeliveryPage;
