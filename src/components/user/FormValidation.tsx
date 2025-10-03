import React from 'react';
import { z } from 'zod';

// Schemas de validação
export const roleAssignmentSchema = z.object({
  optionId: z.string().min(1, 'Selecione um role'),
  active: z.boolean(),
  expirationDate: z.date().optional(),
  notes: z.string().optional(),
  grantedBy: z.string().optional()
});

export const permissionAssignmentSchema = z.object({
  optionId: z.string().min(1, 'Selecione uma permissão'),
  active: z.boolean(),
  expirationDate: z.date().optional(),
  notes: z.string().optional(),
  grantedBy: z.string().optional()
});

export const projectAssignmentSchema = z.object({
  optionId: z.string().min(1, 'Selecione um projeto'),
  level: z.enum(['viewer', 'editor', 'admin']),
  active: z.boolean(),
  expirationDate: z.date().optional(),
  notes: z.string().optional(),
  grantedBy: z.string().optional()
});

export const userUpdateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  status: z.enum(['active', 'inactive', 'pending']),
  notes: z.string().optional()
});

// Tipos derivados dos schemas
export type RoleAssignmentData = z.infer<typeof roleAssignmentSchema>;
export type PermissionAssignmentData = z.infer<typeof permissionAssignmentSchema>;
export type ProjectAssignmentData = z.infer<typeof projectAssignmentSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;

// Hook para validação de formulários
export const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: Partial<T> = {}
) => {
  const [data, setData] = React.useState<Partial<T>>(initialData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validate = (field?: keyof T): boolean => {
    try {
      if (field) {
        // Validação de campo específico
        const fieldSchema = schema.shape[field as string];
        if (fieldSchema) {
          fieldSchema.parse(data[field]);
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as string];
            return newErrors;
          });
        }
      } else {
        // Validação completa
        schema.parse(data);
        setErrors({});
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const setFieldValue = (field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validação em tempo real
    setTimeout(() => validate(field), 100);
  };

  const setFieldTouched = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: keyof T): string | undefined => {
    return touched[field as string] ? errors[field as string] : undefined;
  };

  const hasErrors = (): boolean => {
    return Object.keys(errors).length > 0;
  };

  const reset = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    validate,
    setFieldValue,
    setFieldTouched,
    getFieldError,
    hasErrors,
    reset
  };
};

// Componente para exibir erros de validação
export const ValidationError: React.FC<{
  error?: string;
  className?: string;
}> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {error}
    </p>
  );
};

// Hook para validação de permissões
export const usePermissionValidation = () => {
  const validatePermissionAssignment = (data: PermissionAssignmentData): string[] => {
    const errors: string[] = [];

    try {
      permissionAssignmentSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => err.message));
      }
    }

    // Validações específicas de negócio
    if (data.expirationDate && data.expirationDate < new Date()) {
      errors.push('A data de expiração deve ser futura');
    }

    if (data.expirationDate && data.expirationDate > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
      errors.push('A data de expiração não pode ser superior a 1 ano');
    }

    return errors;
  };

  const validateRoleAssignment = (data: RoleAssignmentData): string[] => {
    const errors: string[] = [];

    try {
      roleAssignmentSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => err.message));
      }
    }

    // Validações específicas de negócio
    if (data.expirationDate && data.expirationDate < new Date()) {
      errors.push('A data de expiração deve ser futura');
    }

    if (data.expirationDate && data.expirationDate > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
      errors.push('A data de expiração não pode ser superior a 1 ano');
    }

    return errors;
  };

  const validateProjectAssignment = (data: ProjectAssignmentData): string[] => {
    const errors: string[] = [];

    try {
      projectAssignmentSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => err.message));
      }
    }

    // Validações específicas de negócio
    if (data.expirationDate && data.expirationDate < new Date()) {
      errors.push('A data de expiração deve ser futura');
    }

    if (data.expirationDate && data.expirationDate > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
      errors.push('A data de expiração não pode ser superior a 1 ano');
    }

    return errors;
  };

  return {
    validatePermissionAssignment,
    validateRoleAssignment,
    validateProjectAssignment
  };
};

// Hook para validação de usuário
export const useUserValidation = () => {
  const validateUserUpdate = (data: UserUpdateData): string[] => {
    const errors: string[] = [];

    try {
      userUpdateSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => err.message));
      }
    }

    // Validações específicas de negócio
    if (data.nome && data.nome.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }

    if (data.email && data.email.length > 255) {
      errors.push('Email deve ter no máximo 255 caracteres');
    }

    return errors;
  };

  return {
    validateUserUpdate
  };
};

// Utilitários de validação
export const validationUtils = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isStrongPassword: (password: string): boolean => {
    // Pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  },

  isFutureDate: (date: Date): boolean => {
    return date > new Date();
  },

  isWithinYear: (date: Date): boolean => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return date <= oneYearFromNow;
  },

  isValidIP: (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  },

  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};



