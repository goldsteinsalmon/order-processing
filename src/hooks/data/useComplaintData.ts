
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
          customer_type: complaint.customerType,
          customer_name: complaint.customerName,
          customer_id: complaint.customerId,
          contact_email: complaint.contactEmail,
          contact_phone: complaint.contactPhone,
          date_submitted: complaint.dateSubmitted,
          order_number: complaint.orderNumber,
          invoice_number: complaint.invoiceNumber,
          product_sku: complaint.productSku,
          product_id: complaint.product?.id,
          complaint_type: complaint.complaintType,
          complaint_details: complaint.complaintDetails,
          returns_required: complaint.returnsRequired,
          return_status: complaint.returnStatus,
          resolution_status: complaint.resolutionStatus,
          resolution_notes: complaint.resolutionNotes,
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
            stockLevel: product.stock_level,
            weight: product.weight,
            created: product.created,
            requiresWeightInput: product.requires_weight_input,
            unit: product.unit,
            required: product.required
          };
        }
      }
      
      const newComplaint: Complaint = {
        id: data[0].id,
        customerType: data[0].customer_type as "Private" | "Trade",
        customerName: data[0].customer_name,
        customerId: data[0].customer_id,
        contactEmail: data[0].contact_email,
        contactPhone: data[0].contact_phone,
        dateSubmitted: data[0].date_submitted,
        orderNumber: data[0].order_number,
        invoiceNumber: data[0].invoice_number,
        productSku: data[0].product_sku,
        product: productData,
        complaintType: data[0].complaint_type,
        complaintDetails: data[0].complaint_details,
        returnsRequired: data[0].returns_required as "Yes" | "No",
        returnStatus: data[0].return_status as "Pending" | "Processing" | "Completed" | "No Return Required",
        resolutionStatus: data[0].resolution_status as "Open" | "In Progress" | "Resolved",
        resolutionNotes: data[0].resolution_notes,
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
          customer_type: complaint.customerType,
          customer_name: complaint.customerName,
          customer_id: complaint.customerId,
          contact_email: complaint.contactEmail,
          contact_phone: complaint.contactPhone,
          date_submitted: complaint.dateSubmitted,
          order_number: complaint.orderNumber,
          invoice_number: complaint.invoiceNumber,
          product_sku: complaint.productSku,
          product_id: complaint.product?.id,
          complaint_type: complaint.complaintType,
          complaint_details: complaint.complaintDetails,
          returns_required: complaint.returnsRequired,
          return_status: complaint.returnStatus,
          resolution_status: complaint.resolutionStatus,
          resolution_notes: complaint.resolutionNotes,
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
