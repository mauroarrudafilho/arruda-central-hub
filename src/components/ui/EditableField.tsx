import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MockDataIcon } from './MockDataIcon';

interface EditableFieldProps {
  label: string;
  value: string;
  isMock?: boolean;
  onSave?: (newValue: string) => Promise<boolean>;
  type?: 'text' | 'email' | 'date';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  isMock = false,
  onSave,
  type = 'text',
  placeholder,
  disabled = false,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave || editValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const success = await onSave(editValue);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const formatValue = (val: string) => {
    if (type === 'date' && val) {
      try {
        return new Date(val).toLocaleDateString('pt-BR');
      } catch {
        return val;
      }
    }
    return val;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          {isMock && <MockDataIcon />}
          {!disabled && onSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            disabled={saving}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 w-8 p-0"
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">
            {formatValue(value)}
          </span>
        </div>
      )}
    </div>
  );
};

export default EditableField;
