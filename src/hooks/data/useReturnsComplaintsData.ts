
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useReturnsComplaintsData = () => {
  const { toast } = useToast();
  const [returnsComplaints, setReturnsComplaints] = useState<any[]>([]);

  const addReturnsComplaints = async (data: any): Promise<any | null> => {
    try {
      // Depending on the type, we'll insert into the appropriate table
      if (data.type === 'return') {
        const { data: returnData, error } = await supabase
          .from('returns')
          .insert(data.returnData)
          .select();

        if (error) throw error;
        return returnData?.[0] || null;
      } else {
        const { data: complaintData, error } = await supabase
          .from('complaints')
          .insert(data.complaintData)
          .select();

        if (error) throw error;
        return complaintData?.[0] || null;
      }
    } catch (error) {
      console.error('Error adding returns/complaints:', error);
      toast({
        title: "Error",
        description: "Failed to add returns/complaints data.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateReturnsComplaints = async (data: any): Promise<boolean> => {
    try {
      if (data.type === 'return') {
        const { error } = await supabase
          .from('returns')
          .update(data.returnData)
          .eq('id', data.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('complaints')
          .update(data.complaintData)
          .eq('id', data.id);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating returns/complaints:', error);
      toast({
        title: "Error",
        description: "Failed to update returns/complaints data.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteReturnsComplaints = async (id: string): Promise<boolean> => {
    try {
      // Try to delete from both tables, one will succeed
      try {
        await supabase.from('returns').delete().eq('id', id);
      } catch (e) {
        console.log('Not in returns table, trying complaints');
      }

      try {
        await supabase.from('complaints').delete().eq('id', id);
      } catch (e) {
        console.log('Not in complaints table');
      }

      return true;
    } catch (error) {
      console.error('Error deleting returns/complaints:', error);
      toast({
        title: "Error",
        description: "Failed to delete returns/complaints data.",
        variant: "destructive",
      });
      return false;
    }
  };

  const addReturn = async (returnData: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .insert(returnData)
        .select();

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error adding return:', error);
      toast({
        title: "Error",
        description: "Failed to add return.",
        variant: "destructive",
      });
      return null;
    }
  };

  const addComplaint = async (complaintData: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert(complaintData)
        .select();

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error adding complaint:', error);
      toast({
        title: "Error",
        description: "Failed to add complaint.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    returnsComplaints,
    setReturnsComplaints,
    addReturnsComplaints,
    updateReturnsComplaints,
    deleteReturnsComplaints,
    addReturn,
    addComplaint
  };
};
