
import { usePickerData } from './usePickerData';

export const usePickersData = (toast: any) => {
  const { pickers, setPickers, addPicker, updatePicker, deletePicker } = usePickerData(toast);
  
  return { pickers, setPickers, addPicker, updatePicker, deletePicker };
};
