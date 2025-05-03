
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useReturnsComplaintsData = (toast: any) => {
  const [returnsComplaints, setReturnsComplaints] = useState<any[]>([]);

  // Add returns/complaints
  const addReturnsComplaints = async (complaint: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('returns_complaints')
        .insert({
          ...complaint,
          created_at: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;
      
      const newComplaint = data[0];
      setReturnsComplaints([newComplaint, ...returnsComplaints]);
      return newComplaint;
    } catch (error) {
      console.error('Error adding returns/complaints:', error);
      toast({
        title: "Error",
        description: "Failed to add returns/complaints record.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update returns/complaints
  const updateReturnsComplaints = async (complaint: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('returns_complaints')
        .update({
          ...complaint,
          updated_at: new Date().toISOString(),
        })
        .eq('id', complaint.id);
      
      if (error) throw error;
      
      setReturnsComplaints(returnsComplaints.map(c => c.id === complaint.id ? complaint : c));
      return true;
    } catch (error) {
      console.error('Error updating returns/complaints:', error);
      toast({
        title: "Error",
        description: "Failed to update returns/complaints record.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete returns/complaints
  const deleteReturnsComplaints = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('returns_complaints')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setReturnsComplaints(returnsComplaints.filter(c => c.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting returns/complaints:', error);
      toast({
        title: "Error",
        description: "Failed to delete returns/complaints record.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { 
    returnsComplaints, 
    setReturnsComplaints, 
    addReturnsComplaints, 
    updateReturnsComplaints, 
    deleteReturnsComplaints 
  };
};
