import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  CalendarIcon, 
  Plus, 
  Save, 
  X,
  User,
  Shield,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UserManagementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  type: 'role' | 'permission' | 'project';
  title: string;
  description: string;
  availableOptions?: Array<{
    id: string;
    name: string;
    description?: string;
    color?: string;
  }>;
  initialData?: Partial<FormData>;
}

interface FormData {
  optionId: string;
  active: boolean;
  expirationDate?: Date;
  notes?: string;
  level?: string;
  grantedBy?: string;
}

export const UserManagementForm: React.FC<UserManagementFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  type,
  title,
  description,
  availableOptions = [],
  initialData
}) => {
  const [formData, setFormData] = React.useState<FormData>({
    optionId: '',
    active: true,
    expirationDate: undefined,
    notes: '',
    level: 'viewer',
    grantedBy: '',
    ...initialData
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.optionId) {
      newErrors.optionId = 'Selecione uma opção';
    }

    if (type === 'project' && !formData.level) {
      newErrors.level = 'Selecione um nível de acesso';
    }

    if (formData.expirationDate && formData.expirationDate < new Date()) {
      newErrors.expirationDate = 'A data de expiração deve ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      optionId: '',
      active: true,
      expirationDate: undefined,
      notes: '',
      level: 'viewer',
      grantedBy: '',
      ...initialData
    });
    setErrors({});
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'role':
        return <Shield className="h-5 w-5" />;
      case 'permission':
        return <Shield className="h-5 w-5" />;
      case 'project':
        return <User className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getLevelOptions = () => {
    switch (type) {
      case 'project':
        return [
          { value: 'viewer', label: 'Visualizador' },
          { value: 'editor', label: 'Editor' },
          { value: 'admin', label: 'Administrador' }
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Seleção da opção */}
            <div className="space-y-2">
              <Label htmlFor="optionId">
                {type === 'role' ? 'Role' : type === 'permission' ? 'Permissão' : 'Projeto'}
              </Label>
              <Select
                value={formData.optionId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, optionId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione um ${type === 'role' ? 'role' : type === 'permission' ? 'permissão' : 'projeto'}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        {option.color && (
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <div>
                          <div className="font-medium">{option.name}</div>
                          {option.description && (
                            <div className="text-sm text-gray-500">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.optionId && (
                <p className="text-sm text-red-600">{errors.optionId}</p>
              )}
            </div>

            {/* Nível de acesso (apenas para projetos) */}
            {type === 'project' && (
              <div className="space-y-2">
                <Label htmlFor="level">Nível de Acesso</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um nível de acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    {getLevelOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-sm text-red-600">{errors.level}</p>
                )}
              </div>
            )}

            {/* Status ativo */}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Ativo</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>

            {/* Data de expiração */}
            <div className="space-y-2">
              <Label>Data de Expiração (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expirationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expirationDate ? (
                      format(formData.expirationDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecione uma data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expirationDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, expirationDate: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.expirationDate && (
                <p className="text-sm text-red-600">{errors.expirationDate}</p>
              )}
            </div>

            {/* Concedido por */}
            <div className="space-y-2">
              <Label htmlFor="grantedBy">Concedido por</Label>
              <Input
                id="grantedBy"
                value={formData.grantedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, grantedBy: e.target.value }))}
                placeholder="Nome do usuário que concedeu"
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};



