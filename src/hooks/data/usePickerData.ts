
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Picker } from "@/types";

export const usePickerData = (toast: any) => {
  const [pickers, setPickers] = useState<Picker[]>([]);

  // Add picker
  const addPicker = async (picker: Picker): Promise<Picker | null> => {
    try {
      const { data, error } = await supabase
        .from('pickers')
        .insert({
          name: picker.name,
          active: picker.active
        })
        .select();
      
      if (error) throw error;
      
      setPickers([...pickers, data[0]]);
      return data[0];
    } catch (error) {
      console.error('Error adding picker:', error);
      toast({
        title: "Error",
        description: "Failed to add picker.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update picker
  const updatePicker = async (picker: Picker): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .update({
          name: picker.name,
          active: picker.active
        })
        .eq('id', picker.id);
      
      if (error) throw error;
      
      setPickers(pickers.map(p => p.id === picker.id ? picker : p));
      return true;
    } catch (error) {
      console.error('Error updating picker:', error);
      toast({
        title: "Error",
        description: "Failed to update picker.",
        variant: "destructive",
      });
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
      
      setPickers(pickers.filter(picker => picker.id !== pickerId));
      return true;
    } catch (error) {
      console.error('Error deleting picker:', error);
      toast({
        title: "Error",
        description: "Failed to delete picker.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    pickers,
    setPickers,
    addPicker,
    updatePicker,
    deletePicker
  };
};
