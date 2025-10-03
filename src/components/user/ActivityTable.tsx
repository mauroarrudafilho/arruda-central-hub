import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Monitor
} from 'lucide-react';
import { UserActivity } from '@/hooks/useUserActivity';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityTableProps {
  activities: UserActivity[];
  loading?: boolean;
  onViewDetails?: (activity: UserActivity) => void;
  showActions?: boolean;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({
  activities,
  loading = false,
  onViewDetails,
  showActions = true
}) => {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'read':
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'write':
      case 'edit':
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'delete':
      case 'remove':
        return <Trash2 className="h-4 w-4" />;
      case 'create':
      case 'add':
        return <Plus className="h-4 w-4" />;
      case 'login':
      case 'logout':
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusVariant = (success: boolean) => {
    if (success) {
      return 'default';
    }
    return 'destructive';
  };

  const getStatusText = (success: boolean) => {
    if (success) {
      return 'Sucesso';
    }
    return 'Falha';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d atrás`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
  };

  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'user':
        return <Shield className="h-4 w-4" />;
      case 'role':
        return <Shield className="h-4 w-4" />;
      case 'permission':
        return <Shield className="h-4 w-4" />;
      case 'module':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={`skeleton-${i}`} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma atividade encontrada
        </h3>
        <p className="text-gray-600">
          Este usuário ainda não possui atividades registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Ação</TableHead>
            <TableHead>Recurso</TableHead>
            <TableHead>Módulo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>IP</TableHead>
            {showActions && <TableHead className="w-[100px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getActionIcon(activity.action)}
                  <span className="font-medium">{activity.action}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  {getResourceTypeIcon(activity.resource_type)}
                  <div>
                    <div className="font-medium">{activity.resource_type}</div>
                    {activity.resource_id && (
                      <div className="text-sm text-gray-500">
                        ID: {activity.resource_id}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                {activity.module_name ? (
                  <Badge variant="outline">{activity.module_name}</Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(activity.success)}
                  <Badge variant={getStatusVariant(activity.success) as any}>
                    {getStatusText(activity.success)}
                  </Badge>
                </div>
                {activity.error_message && (
                  <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                    {activity.error_message}
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                {activity.ip_address ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-mono">
                      {activity.ip_address}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              
              {showActions && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails?.(activity)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
