
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Complaint } from "@/types";

export const useComplaintData = (toast: any) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Add complaint
  const addComplaint = async (complaint: Complaint): Promise<Complaint | null> => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert({
          customer_type: complaint.customer_type,
          customer_name: complaint.customer_name,
          customer_id: complaint.customer_id,
          contact_email: complaint.contact_email,
          contact_phone: complaint.contact_phone,
          date_submitted: complaint.date_submitted,
          order_number: complaint.order_number,
          invoice_number: complaint.invoice_number,
          product_sku: complaint.product_sku,
          product_id: complaint.product?.id,
          complaint_type: complaint.complaint_type,
          complaint_details: complaint.complaint_details,
          returns_required: complaint.returns_required,
          return_status: complaint.return_status,
          resolution_status: complaint.resolution_status,
          resolution_notes: complaint.resolution_notes,
          created: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      // Fetch product details if available
      let productData = null;
      if (complaint.product?.id) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', complaint.product.id)
          .single();
        
        if (!productError && product) {
          productData = {
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description,
            stock_level: product.stock_level,
            weight: product.weight,
            requires_weight_input: product.requires_weight_input,
            unit: product.unit,
            required: product.required
          };
        }
      }
      
      const newComplaint: Complaint = {
        id: data[0].id,
        customer_type: data[0].customer_type as "Private" | "Trade",
        customer_name: data[0].customer_name,
        customer_id: data[0].customer_id,
        contact_email: data[0].contact_email,
        contact_phone: data[0].contact_phone,
        date_submitted: data[0].date_submitted,
        order_number: data[0].order_number,
        invoice_number: data[0].invoice_number,
        product_sku: data[0].product_sku,
        product: productData,
        complaint_type: data[0].complaint_type,
        complaint_details: data[0].complaint_details,
        returns_required: data[0].returns_required as "Yes" | "No",
        return_status: data[0].return_status as "Pending" | "Processing" | "Completed" | "No Return Required",
        resolution_status: data[0].resolution_status as "Open" | "In Progress" | "Resolved",
        resolution_notes: data[0].resolution_notes,
        created: data[0].created,
        updated: data[0].updated
      };
      
      setComplaints([...complaints, newComplaint]);
      return newComplaint;
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

  // Update complaint
  const updateComplaint = async (complaint: Complaint): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          customer_type: complaint.customer_type,
          customer_name: complaint.customer_name,
          customer_id: complaint.customer_id,
          contact_email: complaint.contact_email,
          contact_phone: complaint.contact_phone,
          date_submitted: complaint.date_submitted,
          order_number: complaint.order_number,
          invoice_number: complaint.invoice_number,
          product_sku: complaint.product_sku,
          product_id: complaint.product?.id,
          complaint_type: complaint.complaint_type,
          complaint_details: complaint.complaint_details,
          returns_required: complaint.returns_required,
          return_status: complaint.return_status,
          resolution_status: complaint.resolution_status,
          resolution_notes: complaint.resolution_notes,
          updated: new Date().toISOString()
        })
        .eq('id', complaint.id);
      
      if (error) throw error;
      
      setComplaints(complaints.map(c => c.id === complaint.id ? complaint : c));
      return true;
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast({
        title: "Error",
        description: "Failed to update complaint.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    complaints,
    setComplaints,
    addComplaint,
    updateComplaint
  };
};
