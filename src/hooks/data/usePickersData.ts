
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Picker } from "@/types";

export const usePickerData = () => {
  const [pickers, setPickers] = useState<Picker[]>([]);

  const addPicker = async (picker: Picker): Promise<Picker | null> => {
    try {
      const { data, error } = await supabase
        .from('pickers')
        .insert({
          name: picker.name,
          active: picker.active
        })
        .select();

      if (error) {
        console.error('Error adding picker:', error);
        return null;
      }

      const newPicker = data?.[0] as Picker;
      setPickers([...pickers, newPicker]);
      return newPicker;
    } catch (error) {
      console.error('Error adding picker:', error);
      return null;
    }
  };

  const updatePicker = async (picker: Picker): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .update({
          name: picker.name,
          active: picker.active
        })
        .eq('id', picker.id);

      if (error) {
        console.error('Error updating picker:', error);
        return false;
      }

      setPickers(pickers.map(p => p.id === picker.id ? picker : p));
      return true;
    } catch (error) {
      console.error('Error updating picker:', error);
      return false;
    }
  };

  const deletePicker = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pickers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting picker:', error);
        return false;
      }

      setPickers(pickers.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting picker:', error);
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

export const usePickersData = (toast: any) => {
  return usePickerData();
};
