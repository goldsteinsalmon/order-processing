
import React from "react";
import Layout from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { format, addDays, addWeeks, addMonths, isBefore, isSameDay, startOfDay } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const StandingOrderSchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { standingOrders } = useData();
  
  const order = standingOrders.find(order => order.id === id);
  
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
  
  // Calculate upcoming schedule dates (next 10 weeks)
  const getUpcomingDates = () => {
    const today = startOfDay(new Date());
    const dates = [];
    const weeks = 10; // Show next 10 weeks of scheduled orders
    
    // Function to check if a date is in the skipped dates list
    const isSkippedDate = (date: Date) => {
      if (!order.schedule.skippedDates) return false;
      return order.schedule.skippedDates.some(skippedDate => 
        isSameDay(new Date(skippedDate), date)
      );
    };
    
    // Function to get the modified delivery info for a specific date if it exists
    const getModifiedDelivery = (date: Date) => {
      if (!order.schedule.modifiedDeliveries) return null;
      return order.schedule.modifiedDeliveries.find(delivery => 
        isSameDay(new Date(delivery.date), date)
      );
    };
    
    let currentDate = today;
    let count = 0;
    
    // Find the first occurrence based on the schedule
    if (order.schedule.frequency === "Weekly") {
      // Find the next occurrence of the specified day of the week
      const dayOfWeek = order.schedule.dayOfWeek || 0;
      let daysUntilNext = (dayOfWeek - currentDate.getDay() + 7) % 7;
      if (daysUntilNext === 0) daysUntilNext = 7; // If today is the day, get next week
      currentDate = addDays(currentDate, daysUntilNext);
    } else if (order.schedule.frequency === "Bi-Weekly") {
      // Find the next occurrence of the bi-weekly day
      const dayOfWeek = order.schedule.dayOfWeek || 0;
      let daysUntilNext = (dayOfWeek - currentDate.getDay() + 7) % 7;
      if (daysUntilNext === 0) daysUntilNext = 7; // If today is the day, get next week
      currentDate = addDays(currentDate, daysUntilNext);
    } else if (order.schedule.frequency === "Monthly") {
      // Find the next occurrence of the monthly day
      const dayOfMonth = order.schedule.dayOfMonth || 1;
      let tempDate = new Date(currentDate);
      tempDate.setDate(dayOfMonth);
      
      // If the day has already passed for this month, move to next month
      if (isBefore(tempDate, currentDate)) {
        tempDate = addMonths(tempDate, 1);
      }
      
      currentDate = tempDate;
    }
    
    // Now generate the dates
    while (count < (weeks * 2)) { // Generate more than needed and then filter
      if (!isSkippedDate(currentDate)) {
        const modifiedDelivery = getModifiedDelivery(currentDate);
        
        dates.push({
          date: new Date(currentDate),
          isModified: !!modifiedDelivery,
          modifications: modifiedDelivery?.modifications
        });
      }
      
      // Move to the next occurrence based on frequency
      if (order.schedule.frequency === "Weekly") {
        currentDate = addDays(currentDate, 7);
      } else if (order.schedule.frequency === "Bi-Weekly") {
        currentDate = addDays(currentDate, 14);
      } else if (order.schedule.frequency === "Monthly") {
        currentDate = addMonths(currentDate, 1);
      }
      
      count++;
    }
    
    // Limit to first 10 actual delivery dates
    return dates.slice(0, 10);
  };
  
  const upcomingDates = getUpcomingDates();

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/standing-order-details/${order.id}`)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Standing Order Schedule</h2>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex space-x-2">
              <dt className="font-medium">Customer:</dt>
              <dd>{order.customer.name}</dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Frequency:</dt>
              <dd>{order.schedule.frequency}</dd>
            </div>
            <div className="flex space-x-2">
              <dt className="font-medium">Status:</dt>
              <dd>
                <Badge variant={order.active ? "secondary" : "outline"}>
                  {order.active ? "Active" : "Inactive"}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deliveries (Next 10 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-2">Delivery Date</th>
                  <th className="text-left font-medium py-2">Status</th>
                  <th className="text-left font-medium py-2">Modifications</th>
                </tr>
              </thead>
              <tbody>
                {upcomingDates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500">
                      No upcoming deliveries found
                    </td>
                  </tr>
                ) : (
                  upcomingDates.map((delivery, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">
                        {format(delivery.date, "EEEE, MMMM d, yyyy")}
                      </td>
                      <td className="py-3">
                        {delivery.isModified ? (
                          <Badge variant="secondary">Modified</Badge>
                        ) : (
                          <Badge variant="default">Scheduled</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {delivery.isModified ? (
                          <div className="text-red-600">
                            {delivery.modifications?.items ? "Modified items" : ""}
                            {delivery.modifications?.notes ? (delivery.modifications.items ? " and " : "") + "Custom notes" : ""}
                          </div>
                        ) : "None"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default StandingOrderSchedulePage;
