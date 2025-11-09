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

const createAuthClient = (authHeader: string) =>
  createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

type RelationshipCheck = {
  label: string;
  count: number;
};

async function gatherRelationships(userId: string): Promise<RelationshipCheck[]> {
  const checks: RelationshipCheck[] = [];

  const queries = [
    {
      label: "papéis ativos",
      query: supabaseAdmin
        .from("rbac_auth_user_role")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("ativo", true),
    },
    {
      label: "acessos a módulos",
      query: supabaseAdmin
        .from("rbac_user_module_access")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("ativo", true),
    },
    {
      label: "acessos a tenants",
      query: supabaseAdmin
        .from("rbac_user_tenant_access")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("ativo", true),
    },
    {
      label: "relações como gestor",
      query: supabaseAdmin
        .from("rbac_team_management")
        .select("id", { count: "exact", head: true })
        .eq("gestor_id", userId)
        .eq("ativo", true),
    },
    {
      label: "relações como membro de equipe",
      query: supabaseAdmin
        .from("rbac_team_management")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", userId)
        .eq("ativo", true),
    },
  ];

  for (const item of queries) {
    const { error, count } = await item.query;
    if (error) {
      throw error;
    }
    checks.push({ label: item.label, count: count ?? 0 });
  }

  return checks;
}

Deno.serve(async (req) => {
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAuth = createAuthClient(authHeader);
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !currentUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const roleResult = await supabaseAuth.rpc("get_user_role_v2", {
      _user_id: currentUser.id,
    });

    if (roleResult.error) {
      console.error("Error checking role:", roleResult.error);
      return new Response(
        JSON.stringify({ error: "Erro ao validar permissões" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const currentRole = Array.isArray(roleResult.data)
      ? roleResult.data[0]
      : roleResult.data;

    if (currentRole !== "admin") {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem excluir usuários." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Parâmetro userId é obrigatório." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (userId === currentUser.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode excluir o próprio usuário autenticado." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const profile = await supabaseAdmin
      .from("rbac_auth_profile")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile.error) {
      console.error("Erro ao buscar perfil:", profile.error);
      return new Response(
        JSON.stringify({ error: "Erro ao validar perfil do usuário." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!profile.data) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const relationships = await gatherRelationships(userId);
    const blocked = relationships.filter((item) => item.count > 0);

    if (blocked.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Não é possível excluir o usuário enquanto houver vínculos ativos.",
          details: blocked.map((item) => `${item.count} ${item.label}`).join(", "),
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const cleanupOperations = [
      supabaseAdmin.from("rbac_auth_user_role").delete().eq("user_id", userId),
      supabaseAdmin.from("rbac_user_module_access").delete().eq("user_id", userId),
      supabaseAdmin.from("rbac_user_tenant_access").delete().eq("user_id", userId),
      supabaseAdmin.from("rbac_team_management").delete().eq("usuario_id", userId),
      supabaseAdmin.from("rbac_team_management").delete().eq("gestor_id", userId),
      supabaseAdmin.from("rbac_auth_profile").delete().eq("user_id", userId),
    ];

    for (const op of cleanupOperations) {
      const { error } = await op;
      if (error) {
        console.error("Erro ao limpar dados relacionados:", error);
        return new Response(
          JSON.stringify({ error: "Erro ao remover dados relacionados ao usuário." }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    let warning: string | undefined;
    if (authDeleteError) {
      console.error("Erro ao remover usuário do Auth:", authDeleteError);
      warning = "Usuário removido das tabelas, mas ocorreu erro ao remover do Auth. Revise manualmente no painel de autenticação.";
    }

    return new Response(
      JSON.stringify({ success: true, warning }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error deleting user:", error);
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

