
import React, { useState, useEffect } from "react";
import { format, parseISO, isBefore } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, CalendarIcon, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NonWorkingDay {
  id: string;
  date: string;
  description: string;
  created_at: string;
}

const NonWorkingDaysManagement: React.FC = () => {
  const [nonWorkingDays, setNonWorkingDays] = useState<NonWorkingDay[]>([]);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newDescription, setNewDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { toast } = useToast();

  const fetchNonWorkingDays = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('non_working_days')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setNonWorkingDays(data || []);
    } catch (error) {
      console.error("Error fetching non-working days:", error);
      toast({
        title: "Error",
        description: "Failed to fetch non-working days.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNonWorkingDays();
  }, []);

  const addNonWorkingDay = async () => {
    if (!newDate) {
      toast({
        title: "Error",
        description: "Please select a date.",
        variant: "destructive",
      });
      return;
    }

    // Format the date to be stored in the database
    const formattedDate = format(newDate, "yyyy-MM-dd");

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('non_working_days')
        .insert([
          { 
            date: formattedDate, 
            description: newDescription.trim() || null 
          }
        ])
        .select();
      
      if (error) {
        // Check if it's a unique constraint error
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "This date is already marked as non-working.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Non-working day added successfully.",
        });
        
        // Reset form
        setNewDate(undefined);
        setNewDescription("");
        setShowCalendar(false);
        
        // Refresh the list
        fetchNonWorkingDays();
      }
    } catch (error) {
      console.error("Error adding non-working day:", error);
      toast({
        title: "Error",
        description: "Failed to add non-working day.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteNonWorkingDay = async (id: string) => {
    try {
      const { error } = await supabase
        .from('non_working_days')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Non-working day removed successfully.",
      });
      
      // Refresh the list
      fetchNonWorkingDays();
    } catch (error) {
      console.error("Error deleting non-working day:", error);
      toast({
        title: "Error",
        description: "Failed to remove non-working day.",
        variant: "destructive",
      });
    }
  };

  // Disable past dates in the calendar
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Non-Working Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <div className="flex items-center gap-2">
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDate ? format(newDate, "MMMM d, yyyy") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDate}
                      onSelect={setNewDate}
                      disabled={isDateDisabled}
                      className="pointer-events-auto"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g. Bank Holiday, Christmas, etc."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <Button
              onClick={addNonWorkingDay}
              disabled={!newDate || isAdding}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Non-Working Day
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Non-Working Days</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : nonWorkingDays.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No non-working days have been added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {nonWorkingDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div>
                    <p className="font-medium">
                      {format(parseISO(day.date), "EEEE, MMMM d, yyyy")}
                    </p>
                    {day.description && (
                      <p className="text-sm text-muted-foreground">
                        {day.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNonWorkingDay(day.id)}
                    aria-label="Delete non-working day"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NonWorkingDaysManagement;
