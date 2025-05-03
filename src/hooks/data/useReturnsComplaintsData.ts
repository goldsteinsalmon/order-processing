
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useReturnsComplaintsData = (toast: any) => {
  const [returnsComplaints, setReturnsComplaints] = useState<any[]>([]);

  // Add returns/complaints
  const addReturnsComplaints = async (complaint: any): Promise<any | null> => {
    try {
      // Check if we're working with the "complaints" or "returns" table
      // based on the complaint type field presence
      const tableName = complaint.complaint_type ? 'complaints' : 'returns';
      
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          ...complaint,
          created: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;
      
      const newComplaint = data[0];
      setReturnsComplaints([newComplaint, ...returnsComplaints]);
      return newComplaint;
    } catch (error) {
      console.error(`Error adding ${complaint.complaint_type ? 'complaint' : 'return'}:`, error);
      toast({
        title: "Error",
        description: `Failed to add ${complaint.complaint_type ? 'complaint' : 'return'} record.`,
        variant: "destructive",
      });
      return null;
    }
  };

  // Update returns/complaints
  const updateReturnsComplaints = async (complaint: any): Promise<boolean> => {
    try {
      // Determine the table name based on complaint type
      const tableName = complaint.complaint_type ? 'complaints' : 'returns';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          ...complaint,
          updated: new Date().toISOString(),
        })
        .eq('id', complaint.id);
      
      if (error) throw error;
      
      setReturnsComplaints(returnsComplaints.map(c => c.id === complaint.id ? complaint : c));
      return true;
    } catch (error) {
      console.error(`Error updating ${complaint.complaint_type ? 'complaint' : 'return'}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${complaint.complaint_type ? 'complaint' : 'return'} record.`,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete returns/complaints
  const deleteReturnsComplaints = async (id: string, isComplaint: boolean = true): Promise<boolean> => {
    try {
      // Determine the table name
      const tableName = isComplaint ? 'complaints' : 'returns';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setReturnsComplaints(returnsComplaints.filter(c => c.id !== id));
      return true;
    } catch (error) {
      console.error(`Error deleting ${isComplaint ? 'complaint' : 'return'}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${isComplaint ? 'complaint' : 'return'} record.`,
        variant: "destructive",
      });
      return false;
    }
  };

  // Additional functions to support specific component needs
  const addReturn = async (returnData: any): Promise<any | null> => {
    return addReturnsComplaints({...returnData, complaint_type: null});
  };

  const addComplaint = async (complaintData: any): Promise<any | null> => {
    return addReturnsComplaints({...complaintData, complaint_type: complaintData.complaint_type || "General"});
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
