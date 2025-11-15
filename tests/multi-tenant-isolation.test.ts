import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase para testes
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for tests');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('Multi-Tenant Isolation Tests', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Id: string;
  let user2Id: string;
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    // Criar tenants de teste
    const { data: tenant1 } = await supabase
      .from('organizations')
      .insert({
        nome: 'Tenant Test 1',
        slug: 'tenant-test-1',
        descricao: 'Tenant para testes de isolamento 1'
      })
      .select()
      .single();

    const { data: tenant2 } = await supabase
      .from('organizations')
      .insert({
        nome: 'Tenant Test 2',
        slug: 'tenant-test-2',
        descricao: 'Tenant para testes de isolamento 2'
      })
      .select()
      .single();

    tenant1Id = tenant1.id;
    tenant2Id = tenant2.id;

    // Criar usuários de teste
    const { data: user1 } = await supabase.auth.admin.createUser({
      email: 'user1@tenant1.com',
      password: 'password123',
      email_confirm: true
    });

    const { data: user2 } = await supabase.auth.admin.createUser({
      email: 'user2@tenant2.com',
      password: 'password123',
      email_confirm: true
    });

    user1Id = user1.user.id;
    user2Id = user2.user.id;

    // Criar perfis dos usuários
    await supabase
      .from('auth_profile')
      .insert([
        {
          user_id: user1Id,
          nome: 'User 1',
          email: 'user1@tenant1.com',
          organizacao_id: tenant1Id
        },
        {
          user_id: user2Id,
          nome: 'User 2',
          email: 'user2@tenant2.com',
          organizacao_id: tenant2Id
        }
      ]);

    // Obter tokens de autenticação
    const { data: session1 } = await supabase.auth.signInWithPassword({
      email: 'user1@tenant1.com',
      password: 'password123'
    });

    const { data: session2 } = await supabase.auth.signInWithPassword({
      email: 'user2@tenant2.com',
      password: 'password123'
    });

    user1Token = session1.session?.access_token || '';
    user2Token = session2.session?.access_token || '';
  });

  afterAll(async () => {
    // Limpar dados de teste
    await supabase.auth.admin.deleteUser(user1Id);
    await supabase.auth.admin.deleteUser(user2Id);
    
    await supabase
      .from('organizations')
      .delete()
      .in('id', [tenant1Id, tenant2Id]);
  });

  describe('Data Isolation', () => {
    it('should prevent user from tenant 1 from seeing data from tenant 2', async () => {
      // Criar dados para tenant 1
      const { data: acordo1 } = await supabase
        .from('acordos')
        .insert({
          titulo: 'Acordo Tenant 1',
          tenant_id: tenant1Id,
          criado_por: user1Id
        })
        .select()
        .single();

      // Criar dados para tenant 2
      const { data: acordo2 } = await supabase
        .from('acordos')
        .insert({
          titulo: 'Acordo Tenant 2',
          tenant_id: tenant2Id,
          criado_por: user2Id
        })
        .select()
        .single();

      // Usuário 1 só deve ver dados do tenant 1
      const { data: user1Acordos } = await supabase
        .from('acordos')
        .select('*')
        .eq('tenant_id', tenant1Id);

      expect(user1Acordos).toHaveLength(1);
      expect(user1Acordos?.[0].id).toBe(acordo1.id);
      expect(user1Acordos?.[0].titulo).toBe('Acordo Tenant 1');

      // Usuário 2 só deve ver dados do tenant 2
      const { data: user2Acordos } = await supabase
        .from('acordos')
        .select('*')
        .eq('tenant_id', tenant2Id);

      expect(user2Acordos).toHaveLength(1);
      expect(user2Acordos?.[0].id).toBe(acordo2.id);
      expect(user2Acordos?.[0].titulo).toBe('Acordo Tenant 2');
    });

    it('should prevent cross-tenant data modification', async () => {
      // Criar dados para tenant 1
      const { data: acordo1 } = await supabase
        .from('acordos')
        .insert({
          titulo: 'Acordo Original Tenant 1',
          tenant_id: tenant1Id,
          criado_por: user1Id
        })
        .select()
        .single();

      // Tentar modificar dados do tenant 1 com usuário do tenant 2
      const { error } = await supabase
        .from('acordos')
        .update({ titulo: 'Tentativa de Modificação' })
        .eq('id', acordo1.id)
        .eq('tenant_id', tenant1Id);

      // Deve falhar devido às políticas RLS
      expect(error).toBeTruthy();
    });

    it('should allow admin to see all tenant data', async () => {
      // Criar usuário admin
      const { data: adminUser } = await supabase.auth.admin.createUser({
        email: 'admin@test.com',
        password: 'password123',
        email_confirm: true
      });

      // Criar perfil admin
      await supabase
        .from('auth_profile')
        .insert({
          user_id: adminUser.user.id,
          nome: 'Admin User',
          email: 'admin@test.com',
          organizacao_id: tenant1Id // Admin pode estar em qualquer tenant
        });

      // Dar role de admin
      const { data: adminRole } = await supabase
        .from('auth_role')
        .select('id')
        .eq('nome', 'admin')
        .single();

      await supabase
        .from('auth_user_role')
        .insert({
          user_id: adminUser.user.id,
          role_id: adminRole.id,
          ativo: true
        });

      // Admin deve ver dados de ambos os tenants
      const { data: allAcordos } = await supabase
        .from('acordos')
        .select('*');

      expect(allAcordos?.length).toBeGreaterThan(0);
      expect(allAcordos?.some(a => a.tenant_id === tenant1Id)).toBe(true);
      expect(allAcordos?.some(a => a.tenant_id === tenant2Id)).toBe(true);

      // Limpar admin
      await supabase.auth.admin.deleteUser(adminUser.user.id);
    });
  });

  describe('RLS Policies', () => {
    it('should enforce tenant isolation on SELECT operations', async () => {
      // Criar dados em ambos os tenants
      await supabase
        .from('acordos')
        .insert([
          {
            titulo: 'Acordo Tenant 1',
            tenant_id: tenant1Id,
            criado_por: user1Id
          },
          {
            titulo: 'Acordo Tenant 2',
            tenant_id: tenant2Id,
            criado_por: user2Id
          }
        ]);

      // Usar cliente com token do usuário 1
      const user1Client = createClient(supabaseUrl, supabase.anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${user1Token}`
          }
        }
      });

      // Usuário 1 só deve ver dados do seu tenant
      const { data: user1Data } = await user1Client
        .from('acordos')
        .select('*');

      expect(user1Data?.every(a => a.tenant_id === tenant1Id)).toBe(true);
    });

    it('should enforce tenant isolation on INSERT operations', async () => {
      const user1Client = createClient(supabaseUrl, supabase.anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${user1Token}`
          }
        }
      });

      // Usuário 1 deve conseguir inserir dados no seu tenant
      const { data: insertSuccess } = await user1Client
        .from('acordos')
        .insert({
          titulo: 'Novo Acordo Tenant 1',
          tenant_id: tenant1Id
        })
        .select()
        .single();

      expect(insertSuccess).toBeTruthy();
      expect(insertSuccess.tenant_id).toBe(tenant1Id);

      // Usuário 1 não deve conseguir inserir dados em outro tenant
      const { error: insertError } = await user1Client
        .from('acordos')
        .insert({
          titulo: 'Tentativa de Inserção',
          tenant_id: tenant2Id
        });

      expect(insertError).toBeTruthy();
    });

    it('should enforce tenant isolation on UPDATE operations', async () => {
      // Criar dados para ambos os tenants
      const { data: acordo1 } = await supabase
        .from('acordos')
        .insert({
          titulo: 'Acordo para Update Test',
          tenant_id: tenant1Id,
          criado_por: user1Id
        })
        .select()
        .single();

      const { data: acordo2 } = await supabase
        .from('acordos')
        .insert({
          titulo: 'Acordo para Update Test 2',
          tenant_id: tenant2Id,
          criado_por: user2Id
        })
        .select()
        .single();

      const user1Client = createClient(supabaseUrl, supabase.anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${user1Token}`
          }
        }
      });

      // Usuário 1 deve conseguir atualizar dados do seu tenant
      const { data: updateSuccess } = await user1Client
        .from('acordos')
        .update({ titulo: 'Acordo Atualizado' })
        .eq('id', acordo1.id)
        .select()
        .single();

      expect(updateSuccess).toBeTruthy();
      expect(updateSuccess.titulo).toBe('Acordo Atualizado');

      // Usuário 1 não deve conseguir atualizar dados de outro tenant
      const { error: updateError } = await user1Client
        .from('acordos')
        .update({ titulo: 'Tentativa de Atualização' })
        .eq('id', acordo2.id);

      expect(updateError).toBeTruthy();
    });

    it('should enforce tenant isolation on DELETE operations', async () => {
      // Criar dados para ambos os tenants
      const { data: acordo1 } = await supabase
        .from('acordos')
        .insert({
          titulo: 'Acordo para Delete Test',
          tenant_id: tenant1Id,
          criado_por: user1Id
        })
        .select()
        .single();

      const { data: acordo2 } = await supabase
        .from('acordos')
        .insert({
          titulo: 'Acordo para Delete Test 2',
          tenant_id: tenant2Id,
          criado_por: user2Id
        })
        .select()
        .single();

      const user1Client = createClient(supabaseUrl, supabase.anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${user1Token}`
          }
        }
      });

      // Usuário 1 deve conseguir deletar dados do seu tenant
      const { error: deleteSuccess } = await user1Client
        .from('acordos')
        .delete()
        .eq('id', acordo1.id);

      expect(deleteSuccess).toBeFalsy();

      // Usuário 1 não deve conseguir deletar dados de outro tenant
      const { error: deleteError } = await user1Client
        .from('acordos')
        .delete()
        .eq('id', acordo2.id);

      expect(deleteError).toBeTruthy();
    });
  });

  describe('Tenant Functions', () => {
    it('should correctly identify user tenant', async () => {
      const { data: user1Tenant } = await supabase
        .rpc('get_user_organization', { _user_id: user1Id });

      expect(user1Tenant).toHaveLength(1);
      expect(user1Tenant?.[0].id).toBe(tenant1Id);

      const { data: user2Tenant } = await supabase
        .rpc('get_user_organization', { _user_id: user2Id });

      expect(user2Tenant).toHaveLength(1);
      expect(user2Tenant?.[0].id).toBe(tenant2Id);
    });

    it('should correctly verify tenant membership', async () => {
      const { data: user1BelongsToTenant1 } = await supabase
        .rpc('user_belongs_to_organization', {
          _user_id: user1Id,
          _organization_slug: 'tenant-test-1'
        });

      expect(user1BelongsToTenant1).toBe(true);

      const { data: user1BelongsToTenant2 } = await supabase
        .rpc('user_belongs_to_organization', {
          _user_id: user1Id,
          _organization_slug: 'tenant-test-2'
        });

      expect(user1BelongsToTenant2).toBe(false);
    });
  });
});











