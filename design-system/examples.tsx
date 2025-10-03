// Exemplos de uso do Design System - Arruda Hub
// Baseado no padrão do Acordo Flow

import React from 'react';
import { 
  ArrudaCard, 
  ArrudaButton, 
  ArrudaInput,
  StatusBadge,
  RoleBadge,
  KPICard,
  PageHeader,
  getTypographyClasses,
  getGridClasses,
  getContainerClasses
} from './index';
import { 
  Users, 
  Shield, 
  Activity, 
  TrendingUp, 
  Settings,
  Plus,
  RefreshCw
} from 'lucide-react';

// Exemplo 1: Dashboard com KPIs
export const DashboardExample = () => {
  return (
    <div className={getContainerClasses('lg')}>
      <PageHeader
        title="Dashboard RBAC"
        description="Visão geral do sistema de gestão de usuários"
        actions={
          <>
            <ArrudaButton variant="outline" icon={RefreshCw}>
              Atualizar
            </ArrudaButton>
            <ArrudaButton variant="primary" icon={Plus}>
              Novo Usuário
            </ArrudaButton>
          </>
        }
      />

      <div className={getGridClasses(4, 'md')}>
        <KPICard
          title="Total de Usuários"
          value="17"
          subtitle="5 ativos nas últimas 24h"
          icon={Users}
          color="primary"
          trend={{ value: 12, label: "vs mês anterior", isPositive: true }}
        />
        
        <KPICard
          title="Sessões Ativas"
          value="3"
          subtitle="Usuários conectados"
          icon={Activity}
          color="success"
        />
        
        <KPICard
          title="Permissões"
          value="24"
          subtitle="Total de permissões"
          icon={Shield}
          color="secondary"
        />
        
        <KPICard
          title="Crescimento"
          value="+15%"
          subtitle="Usuários este mês"
          icon={TrendingUp}
          color="warning"
        />
      </div>
    </div>
  );
};

// Exemplo 2: Lista de Usuários
export const UsersListExample = () => {
  const users = [
    { id: 1, name: 'João Silva', email: 'joao@empresa.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Maria Santos', email: 'maria@empresa.com', role: 'manager', status: 'active' },
    { id: 3, name: 'Pedro Costa', email: 'pedro@empresa.com', role: 'user', status: 'pending' },
    { id: 4, name: 'Ana Oliveira', email: 'ana@empresa.com', role: 'user', status: 'inactive' },
  ];

  return (
    <div className={getContainerClasses('lg')}>
      <PageHeader
        title="Usuários"
        description="Gerencie usuários e suas permissões"
        actions={
          <ArrudaButton variant="primary" icon={Plus}>
            Adicionar Usuário
          </ArrudaButton>
        }
      />

      <div className={getGridClasses(1, 'md')}>
        {users.map((user) => (
          <ArrudaCard key={user.id} variant="elevated" padding="lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className={getTypographyClasses('lg', 'semibold')}>
                    {user.name}
                  </h3>
                  <p className={getTypographyClasses('sm', 'normal', 'neutral')}>
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <RoleBadge role={user.role as any} showIcon />
                <StatusBadge status={user.status as any} showIcon />
                <ArrudaButton variant="outline" size="sm">
                  Editar
                </ArrudaButton>
              </div>
            </div>
          </ArrudaCard>
        ))}
      </div>
    </div>
  );
};

// Exemplo 3: Formulário de Usuário
export const UserFormExample = () => {
  return (
    <div className={getContainerClasses('md')}>
      <PageHeader
        title="Novo Usuário"
        description="Adicione um novo usuário ao sistema"
      />

      <ArrudaCard variant="elevated" padding="lg">
        <form className="space-y-6">
          <div className={getGridClasses(2, 'md')}>
            <ArrudaInput
              label="Nome Completo"
              placeholder="Digite o nome completo"
              icon={Users}
            />
            
            <ArrudaInput
              label="E-mail"
              type="email"
              placeholder="usuario@empresa.com"
              icon={Users}
            />
          </div>

          <div className={getGridClasses(2, 'md')}>
            <ArrudaInput
              label="Senha"
              type="password"
              placeholder="Digite a senha"
              helperText="Mínimo de 6 caracteres"
            />
            
            <ArrudaInput
              label="Confirmar Senha"
              type="password"
              placeholder="Confirme a senha"
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <ArrudaButton variant="outline">
              Cancelar
            </ArrudaButton>
            <ArrudaButton variant="primary" icon={Plus}>
              Criar Usuário
            </ArrudaButton>
          </div>
        </form>
      </ArrudaCard>
    </div>
  );
};

// Exemplo 4: Configurações
export const SettingsExample = () => {
  return (
    <div className={getContainerClasses('lg')}>
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações do sistema"
        actions={
          <ArrudaButton variant="primary" icon={Settings}>
            Salvar Alterações
          </ArrudaButton>
        }
      />

      <div className={getGridClasses(2, 'lg')}>
        <ArrudaCard variant="default" padding="lg">
          <h3 className={getTypographyClasses('lg', 'semibold')}>
            Configurações Gerais
          </h3>
          <p className={getTypographyClasses('sm', 'normal', 'neutral')}>
            Configure as opções gerais do sistema
          </p>
          
          <div className="mt-4 space-y-4">
            <ArrudaInput
              label="Nome da Empresa"
              placeholder="Digite o nome da empresa"
            />
            
            <ArrudaInput
              label="URL Base"
              placeholder="https://empresa.com"
            />
          </div>
        </ArrudaCard>

        <ArrudaCard variant="default" padding="lg">
          <h3 className={getTypographyClasses('lg', 'semibold')}>
            Configurações de Segurança
          </h3>
          <p className={getTypographyClasses('sm', 'normal', 'neutral')}>
            Configure as opções de segurança
          </p>
          
          <div className="mt-4 space-y-4">
            <ArrudaInput
              label="Tempo de Sessão (minutos)"
              type="number"
              placeholder="60"
            />
            
            <ArrudaInput
              label="Tentativas de Login"
              type="number"
              placeholder="3"
            />
          </div>
        </ArrudaCard>
      </div>
    </div>
  );
};

// Exemplo 5: Página de Erro
export const ErrorPageExample = () => {
  return (
    <div className={getContainerClasses('sm')}>
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className={getTypographyClasses('2xl', 'bold')}>
          Acesso Negado
        </h1>
        
        <p className={getTypographyClasses('base', 'normal', 'neutral')}>
          Você não tem permissão para acessar esta página.
        </p>
        
        <div className="mt-6">
          <ArrudaButton variant="primary">
            Voltar ao Dashboard
          </ArrudaButton>
        </div>
      </div>
    </div>
  );
};

// Exemplo 6: Loading State
export const LoadingExample = () => {
  return (
    <div className={getContainerClasses('lg')}>
      <div className="space-y-6">
        {/* Loading Cards */}
        <div className={getGridClasses(3, 'md')}>
          {[1, 2, 3].map((i) => (
            <ArrudaCard key={i} variant="default" padding="lg">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </ArrudaCard>
          ))}
        </div>

        {/* Loading Button */}
        <div className="flex justify-center">
          <ArrudaButton variant="primary" loading>
            Carregando...
          </ArrudaButton>
        </div>
      </div>
    </div>
  );
};
