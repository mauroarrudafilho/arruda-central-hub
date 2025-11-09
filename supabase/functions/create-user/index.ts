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

const generateTemporaryPassword = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, 16);

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

    if (currentRole !== "admin" && currentRole !== "gestor") {
      return new Response(
        JSON.stringify({ error: "Acesso negado" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      email,
      nome,
      status = "pendente",
      roleId,
      password,
      sendInvite = true,
    } = await req.json();

    if (!email || !nome) {
      return new Response(
        JSON.stringify({ error: "Nome e e-mail são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(nome).trim();

    if (!normalizedEmail || !normalizedName) {
      return new Response(
        JSON.stringify({ error: "Nome e e-mail não podem ser vazios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let userId: string | null = null;
    let temporaryPassword: string | null = null;

    if (sendInvite && !password) {
      const { data, error } = await supabaseAdmin.auth.admin
        .inviteUserByEmail(normalizedEmail, {
          data: { nome: normalizedName },
        });

      if (error || !data?.user) {
        console.error("Error inviting user:", error);
        return new Response(
          JSON.stringify({
            error: error?.message ?? "Erro ao convidar usuário",
            details: (error as any)?.error_description ?? (error as any)?.message ?? null,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      userId = data.user.id;
    } else {
      const finalPassword = password && password.length >= 6
        ? password
        : generateTemporaryPassword();

      if (!password) {
        temporaryPassword = finalPassword;
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { nome: normalizedName },
      });

      if (error || !data?.user) {
        console.error("Error creating user:", error);
        return new Response(
          JSON.stringify({
            error: error?.message ?? "Erro ao criar usuário",
            details: (error as any)?.error_description ?? (error as any)?.message ?? null,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      userId = data.user.id;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Erro ao obter usuário criado" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const statusMap: Record<string, string> = {
      pendente: "inativo",
      ativo: "ativo",
      inativo: "inativo",
      suspenso: "suspenso",
    };
    const normalizedStatus = statusMap[(status || "").toLowerCase()] ?? (sendInvite ? "inativo" : "ativo");

    const { error: profileError } = await supabaseAdmin.from(
      "rbac_auth_profile",
    ).upsert({
      user_id: userId,
      email: normalizedEmail,
      nome: normalizedName,
      status: normalizedStatus,
      two_factor_enabled: false,
    }, { onConflict: "user_id" });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({
          error: "Erro ao criar perfil do usuário",
          details: profileError.message ?? profileError.code ?? null,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rolesToAssign = roleId
      ? [roleId]
      : [];

    let hadRoleErrors = false;

    for (const role of rolesToAssign) {
      const { error: roleError } = await supabaseAdmin.from(
        "rbac_auth_user_role",
      ).insert({
        user_id: userId,
        role_id: role,
        ativo: true,
        concedido_por: currentUser.id,
      });

      if (roleError) {
        hadRoleErrors = true;
        console.error("Error assigning role:", roleError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        temporaryPassword,
        status: normalizedStatus,
        roleAssigned: !hadRoleErrors,
        warning: hadRoleErrors
          ? "Usuário criado, mas houve erro ao atribuir o papel selecionado. Ajuste manualmente na tela de detalhes."
          : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error creating user:", error);
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

