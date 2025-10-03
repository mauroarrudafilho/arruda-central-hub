// Design System - Arruda Hub
// Ponto de entrada único para todos os componentes e utilitários

// Tokens
export * from './tokens';

// Utilitários
export * from './utils';

// Componentes
export * from './components';

// Configurações
export * from './config';

// Re-exportações do shadcn/ui para conveniência
export { Badge } from '@/components/ui/badge';
export { Button } from '@/components/ui/button';
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export { Input } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
export { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Re-exportações do Lucide React para ícones
export * from 'lucide-react';
