
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Picker } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const usePickerData = () => {
  const { toast } = useToast();
  const [pickers, setPickers] = useState<Picker[]>([]);

  // Add picker
  const addPicker = async (picker: Partial<Picker>): Promise<Picker> => {
    try {
      const { data, error } = await supabase
        .from('pickers')
        .insert({
          name: picker.name,
          active: picker.active !== undefined ? picker.active : true,
        })
        .select();
      
      if (error) throw error;
      
      const newPicker = data[0] as Picker;
      setPickers([newPicker, ...pickers]);
      return newPicker;
    } catch (error) {
      console.error('Error adding picker:', error);
      if (toast) {
        toast({
          title: "Error",
          description: "Failed to add picker.",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  // Update picker
  const updatePicker = async (updatedPicker: Picker): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .update({
          name: updatedPicker.name,
          active: updatedPicker.active,
        })
        .eq('id', updatedPicker.id);
      
      if (error) throw error;
      
      setPickers(pickers.map(p => p.id === updatedPicker.id ? updatedPicker : p));
      return true;
    } catch (error) {
      console.error('Error updating picker:', error);
      if (toast) {
        toast({
          title: "Error",
          description: "Failed to update picker.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  // Delete picker
  const deletePicker = async (pickerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .delete()
        .eq('id', pickerId);
      
      if (error) throw error;
      
      setPickers(pickers.filter(p => p.id !== pickerId));
      return true;
    } catch (error) {
      console.error('Error deleting picker:', error);
      if (toast) {
        toast({
          title: "Error",
          description: "Failed to delete picker.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  return { pickers, setPickers, addPicker, updatePicker, deletePicker };
};
