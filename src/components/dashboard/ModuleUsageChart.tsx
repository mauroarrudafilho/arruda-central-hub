import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDesignTokens } from '@/hooks/useDesignTokens';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-blue-600">
          Acessos: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

interface ModuleUsageData {
  module: string;
  usage: number;
  color?: string;
}

interface ModuleUsageChartProps {
  data?: ModuleUsageData[];
  loading?: boolean;
}

const ModuleUsageChart: React.FC<ModuleUsageChartProps> = ({ 
  data = [
    { module: 'Comercial+', usage: 120 },
    { module: 'Financeiro', usage: 90 },
    { module: 'Degustações', usage: 75 },
    { module: 'Analytics', usage: 60 },
    { module: 'Always On', usage: 45 },
    { module: 'Logística', usage: 30 },
    { module: 'Trade Marketing', usage: 25 },
    { module: 'Reembolsos', usage: 15 }
  ], 
  loading = false 
}) => {
  const designTokens = useDesignTokens();

  if (loading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle 
            className="text-lg font-semibold"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Uso por Módulo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card 
      className="p-6"
      style={{ 
        borderColor: designTokens.colors.neutral[200],
        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
      }}
    >
      <CardHeader>
        <CardTitle 
          className="text-lg font-semibold text-gray-900"
          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
        >
          Uso por Módulo
        </CardTitle>
        <p 
          className="text-sm text-gray-600"
          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
        >
          Número de acessos nos últimos 30 dias
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={designTokens.colors.neutral[200]}
              />
              <XAxis 
                dataKey="module" 
                tick={{ 
                  fontSize: 12, 
                  fill: designTokens.colors.neutral[600],
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ 
                  fontSize: 12, 
                  fill: designTokens.colors.neutral[600],
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="usage" 
                fill={designTokens.colors.primary.DEFAULT}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleUsageChart;
