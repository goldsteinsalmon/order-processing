
import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { CheckIcon, XIcon } from 'lucide-react';

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number';
}

const EditableCell: React.FC<EditableCellProps> = ({ 
  value, 
  onSave,
  type = 'text'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  if (isEditing) {
    return (
      <div className="flex items-center">
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8"
        />
        <div className="flex ml-2">
          <Button variant="ghost" size="icon" onClick={handleSave} className="h-7 w-7">
            <CheckIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCancel} className="h-7 w-7">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="cursor-pointer p-2 hover:bg-accent hover:text-accent-foreground rounded"
      onDoubleClick={handleDoubleClick}
    >
      {value}
    </div>
  );
};

export default EditableCell;
