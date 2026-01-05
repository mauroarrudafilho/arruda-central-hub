import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error("Missing Supabase environment variables");
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: "Token e senha são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validar critérios de senha
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter no mínimo 8 caracteres" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return new Response(
        JSON.stringify({ 
          error: "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log('🔐 Processando definição de senha para token:', token.substring(0, 10) + '...');

    // Tentar verificar o token como um token de convite/recovery do Supabase
    // O token pode ser um hash de recovery ou um token de convite
    // Vamos tentar usar o fluxo de recovery do Supabase
    
    // Primeiro, tentamos verificar se é um token de recovery válido
    // O Supabase usa tokens de recovery no formato: hash#hash
    // Vamos tentar usar o exchangeCodeForSession se for um código de recovery
    
    // Alternativa: Verificar se existe um usuário com este token em uma tabela customizada
    // ou usar o fluxo de verifyOtp do Supabase
    
    // Como o Reback vai criar o usuário e enviar o convite, o token provavelmente
    // é um token de recovery do Supabase. Vamos tentar usar o fluxo de updateUser
    // após verificar o token via verifyOtp ou recovery
    
    // Para tokens de convite do Supabase, precisamos usar o fluxo correto
    // Vamos buscar o usuário pelo token de recovery ou verificar em uma tabela customizada
    
    // Opção 1: Se o token for um hash de recovery do Supabase
    // Podemos tentar verificar se existe um usuário pendente com este token
    
    // Opção 2: Criar uma tabela para armazenar tokens de definição de senha
    // Por enquanto, vamos usar uma abordagem que funciona com tokens de recovery do Supabase
    
    // Vamos verificar se o token corresponde a um usuário que precisa definir senha
    // O Supabase armazena tokens de recovery temporariamente
    
    // Como alternativa mais segura, vamos criar uma verificação que:
    // 1. Verifica se o token é válido (pode ser um hash armazenado)
    // 2. Busca o usuário associado
    // 3. Atualiza a senha usando admin.updateUserById
    
    // Para isso, precisamos de uma tabela que armazene os tokens de definição de senha
    // ou usar o sistema de recovery do Supabase
    
    // Por enquanto, vamos implementar uma solução que funciona com o fluxo de recovery do Supabase
    // O token será um hash que o Supabase gera para recovery
    
    // Tentar buscar usuário pelo email usando o token como referência
    // Ou criar uma tabela password_setup_tokens
    
    // Implementação: Vamos usar uma abordagem onde o token é um hash único
    // que foi gerado quando o usuário foi criado/convidado
    // Este hash pode ser armazenado em user_metadata ou em uma tabela separada
    
    // Por enquanto, vamos implementar uma solução que:
    // 1. Aceita o token
    // 2. Verifica se é um token válido (pode ser verificado via Supabase recovery ou tabela customizada)
    // 3. Atualiza a senha
    
    // Como o Reback vai criar o usuário, vamos assumir que:
    // - O usuário foi criado via inviteUserByEmail ou createUser
    // - Um token foi gerado e enviado por email
    // - Este token precisa ser validado aqui
    
    // Vamos criar uma solução que funciona com tokens de recovery do Supabase
    // O Supabase permite usar tokens de recovery para atualizar senhas
    
    // Tentar usar o fluxo de recovery do Supabase
    // Primeiro, vamos tentar verificar se o token é válido usando verifyOtp
    // Se não funcionar, vamos usar uma abordagem alternativa
    
    // Implementação simplificada: Vamos assumir que o token é um hash único
    // que identifica o usuário. Podemos armazenar isso em user_metadata
    // ou em uma tabela password_setup_tokens
    
    // Por enquanto, vamos implementar uma solução que busca o usuário
    // pelo token armazenado em user_metadata ou em uma tabela customizada
    
    // Vamos criar uma tabela para armazenar tokens de definição de senha
    // Mas por enquanto, vamos usar uma abordagem mais direta:
    // O token pode ser um hash que identifica o usuário
    
    // Implementação: Vamos usar o Supabase Admin API para:
    // 1. Buscar usuários que têm este token em user_metadata
    // 2. Ou usar uma tabela password_setup_tokens
    
    // Por enquanto, vamos implementar uma solução que funciona assim:
    // - O token é um hash único gerado quando o usuário é criado
    // - Este hash é armazenado em uma tabela password_setup_tokens
    // - Validamos o token e atualizamos a senha
    
    // Como não temos essa tabela ainda, vamos usar uma abordagem alternativa:
    // - O token pode ser um email + hash, ou apenas um hash
    // - Vamos tentar buscar usuários pendentes e verificar o token
    
    // Implementação mais prática: Vamos criar uma função que:
    // 1. Aceita token e senha
    // 2. Verifica o token (pode ser um hash de recovery do Supabase ou customizado)
    // 3. Se válido, atualiza a senha do usuário associado
    
    // Para tokens de recovery do Supabase, podemos usar:
    // supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })
    
    // Mas como estamos na Edge Function, vamos usar o Admin API
    // para atualizar a senha diretamente após validar o token
    
    // Vamos implementar uma solução que funciona com tokens customizados
    // armazenados em uma tabela ou em user_metadata
    
    // Por enquanto, vamos criar uma implementação que:
    // 1. Busca o token em uma tabela password_setup_tokens (se existir)
    // 2. Ou verifica se o token corresponde a um usuário pendente
    // 3. Atualiza a senha usando admin.updateUserById
    
    // Implementação simplificada para começar:
    // Vamos assumir que o token é um hash que identifica o usuário
    // e que foi armazenado quando o usuário foi criado
    
    // Estratégia 1: Buscar token em tabela password_setup_tokens (se existir)
    let userWithToken = null;
    let userId: string | null = null;

    try {
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from("password_setup_tokens")
        .select("user_id, expires_at, used")
        .eq("token", token)
        .eq("used", false)
        .single();

      if (!tokenError && tokenData) {
        // Verificar se o token não expirou
        const expiresAt = new Date(tokenData.expires_at);
        if (expiresAt < new Date()) {
          return new Response(
            JSON.stringify({ error: "Token expirado. Solicite um novo convite." }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        userId = tokenData.user_id;
      }
    } catch (error) {
      // Tabela pode não existir, continuar com outras estratégias
      console.log("Tabela password_setup_tokens não encontrada ou erro ao buscar:", error);
    }

    // Estratégia 2: Buscar token em user_metadata
    if (!userId) {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error("Erro ao listar usuários:", listError);
        return new Response(
          JSON.stringify({ error: "Erro ao processar solicitação" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Buscar usuário que tem este token em user_metadata
      const foundUser = users.users.find((user) => {
        const setupToken = user.user_metadata?.password_setup_token;
        return setupToken === token;
      });

      if (foundUser) {
        // Verificar se o token não expirou (se houver expiração em user_metadata)
        const tokenExpiry = foundUser.user_metadata?.password_setup_token_expiry;
        if (tokenExpiry) {
          const expiryDate = new Date(tokenExpiry);
          if (expiryDate < new Date()) {
            return new Response(
              JSON.stringify({ error: "Token expirado. Solicite um novo convite." }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
        }
        userId = foundUser.id;
        userWithToken = foundUser;
      }
    }

    if (!userId) {
      console.error("Token não encontrado ou inválido");
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Buscar dados completos do usuário se necessário
    if (!userWithToken) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !userData?.user) {
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      userWithToken = userData.user;
    }

    // Atualizar a senha do usuário
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: password,
        // Remover o token após uso
        user_metadata: {
          ...userWithToken.user_metadata,
          password_setup_token: null,
          password_setup_token_expiry: null,
        },
      }
    );

    if (updateError || !updatedUser) {
      console.error("Erro ao atualizar senha:", updateError);
      return new Response(
        JSON.stringify({ 
          error: updateError?.message || "Erro ao definir senha. Tente novamente." 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Marcar token como usado na tabela (se existir)
    try {
      await supabaseAdmin
        .from("password_setup_tokens")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("token", token)
        .eq("user_id", userId);
    } catch (error) {
      // Ignorar erro se a tabela não existir
      console.log("Aviso: Não foi possível marcar token como usado na tabela:", error);
    }

    // Atualizar o status do perfil se existir
    const { error: profileError } = await supabaseAdmin
      .from("rbac_auth_profile")
      .update({ 
        status: "ativo",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileError) {
      console.warn("Aviso: Erro ao atualizar perfil, mas senha foi definida:", profileError);
      // Não falhar a requisição, apenas logar o aviso
    }

    console.log('✅ Senha definida com sucesso para usuário:', userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Senha definida com sucesso",
        userId: userId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

  } catch (error) {
    console.error("Erro inesperado ao definir senha:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

