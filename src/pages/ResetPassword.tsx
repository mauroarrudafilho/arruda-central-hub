import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Uma letra maiúscula")
      .regex(/[a-z]/, "Uma letra minúscula")
      .regex(/[0-9]/, "Um número")
      .regex(/[^A-Za-z0-9]/, "Um caractere especial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (token && email) {
          const { data } = await supabase.functions.invoke("verify-reset-token", {
            body: { token, email },
          });
          const result = data as { success?: boolean; error?: string };
          if (result?.success !== false) {
            setTokenValid(true);
            setIsValidatingToken(false);
            return;
          }
          setError(result?.error ?? "Token de redefinição inválido ou expirado.");
          setIsValidatingToken(false);
          return;
        }

        setError("Token de redefinição inválido ou expirado.");
      } catch {
        setError("Token de redefinição inválido ou expirado.");
      } finally {
        setIsValidatingToken(false);
      }
    };

    void validateToken();
  }, [searchParams]);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setError("");
    setIsLoading(true);

    try {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        throw new Error("Token não encontrado na URL.");
      }

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "verify-reset-token",
        { body: { token, email, newPassword: data.password } },
      );

      if (fnError) throw fnError;

      const result = fnData as { success?: boolean; error?: string };
      if (result?.success === false && result?.error) {
        throw new Error(result.error);
      }

      navigate("/auth?reset=success", { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao redefinir senha. Tente novamente.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const password = form.watch("password");

  const requirements = [
    { met: (password?.length ?? 0) >= 8, text: "Mínimo 8 caracteres" },
    { met: /[A-Z]/.test(password || ""), text: "Uma letra maiúscula" },
    { met: /[a-z]/.test(password || ""), text: "Uma letra minúscula" },
    { met: /[0-9]/.test(password || ""), text: "Um número" },
    { met: /[^A-Za-z0-9]/.test(password || ""), text: "Um caractere especial" },
  ];

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Validando token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Token de redefinição inválido ou expirado."}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
            Voltar para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">Digite sua nova senha abaixo</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 pr-10"
                {...form.register("password")}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          {password && (
            <ul className="space-y-1 rounded-lg bg-muted/50 p-3">
              {requirements.map((req) => (
                <li
                  key={req.text}
                  className={`text-xs flex items-center gap-2 ${
                    req.met ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  <span>•</span>
                  {req.text}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 pr-10"
                {...form.register("confirmPassword")}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redefinindo...
              </>
            ) : (
              "Redefinir senha"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Voltar para Login
          </Button>
        </div>
      </div>
    </div>
  );
}
