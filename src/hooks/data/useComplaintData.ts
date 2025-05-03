
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Complaint } from "@/types";
import { adaptComplaintToCamelCase } from "@/utils/typeAdapters";
import { useToast } from "@/hooks/use-toast";

export const useComplaintData = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const { toast } = useToast();

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, product:products(*)');
        
      if (error) {
        throw error;
      }

      // Convert snake_case to camelCase
      const formattedComplaints: Complaint[] = data.map(complaint => adaptComplaintToCamelCase(complaint));
      
      setComplaints(formattedComplaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast({
        title: "Error",
        description: "Failed to fetch complaints data.",
        variant: "destructive",
      });
    }
  };

  const addComplaint = async (newComplaint: Complaint): Promise<Complaint | null> => {
    try {
      // Convert camelCase to snake_case for database
      const dbComplaint = {
        id: newComplaint.id,
        customer_id: newComplaint.customerId,
        customer_name: newComplaint.customerName,
        customer_type: newComplaint.customerType,
        contact_email: newComplaint.contactEmail,
        contact_phone: newComplaint.contactPhone,
        date_submitted: newComplaint.dateSubmitted,
        order_number: newComplaint.orderNumber,
        invoice_number: newComplaint.invoiceNumber,
        product_id: newComplaint.productId,
        product_sku: newComplaint.productSku,
        complaint_type: newComplaint.complaintType,
        complaint_details: newComplaint.complaintDetails,
        returns_required: newComplaint.returnsRequired,
        return_status: newComplaint.returnStatus,
        resolution_status: newComplaint.resolutionStatus,
        resolution_notes: newComplaint.resolutionNotes,
        created: newComplaint.created
      };
      
      const { data, error } = await supabase
        .from('complaints')
        .insert([dbComplaint])
        .select('*, product:products(*)');
      
      if (error) {
        throw error;
      }

      // Convert the returned snake_case data to camelCase
      const addedComplaint = adaptComplaintToCamelCase(data[0]);
      
      setComplaints(prevComplaints => [...prevComplaints, addedComplaint]);
      
      return addedComplaint;
    } catch (error) {
      console.error("Error adding complaint:", error);
      toast({
        title: "Error",
        description: "Failed to add complaint data.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateComplaint = async (updatedComplaint: Complaint): Promise<boolean> => {
    try {
      // Convert camelCase to snake_case for database
      const dbComplaint = {
        id: updatedComplaint.id,
        customer_id: updatedComplaint.customerId,
        customer_name: updatedComplaint.customerName,
        customer_type: updatedComplaint.customerType,
        contact_email: updatedComplaint.contactEmail,
        contact_phone: updatedComplaint.contactPhone,
        date_submitted: updatedComplaint.dateSubmitted,
        order_number: updatedComplaint.orderNumber,
        invoice_number: updatedComplaint.invoiceNumber,
        product_id: updatedComplaint.productId,
        product_sku: updatedComplaint.productSku,
        complaint_type: updatedComplaint.complaintType,
        complaint_details: updatedComplaint.complaintDetails,
        returns_required: updatedComplaint.returnsRequired,
        return_status: updatedComplaint.returnStatus,
        resolution_status: updatedComplaint.resolutionStatus,
        resolution_notes: updatedComplaint.resolutionNotes,
        updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('complaints')
        .update(dbComplaint)
        .eq('id', updatedComplaint.id);
      
      if (error) {
        throw error;
      }
      
      setComplaints(prevComplaints =>
        prevComplaints.map(complaint =>
          complaint.id === updatedComplaint.id ? updatedComplaint : complaint
        )
      );
      
      return true;
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast({
        title: "Error",
        description: "Failed to update complaint data.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return {
    complaints,
    setComplaints,
    fetchComplaints,
    addComplaint,
    updateComplaint
  };
};
