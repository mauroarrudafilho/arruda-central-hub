import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UserPlus } from 'lucide-react';

interface RoleOption {
  id: string;
  nome: string;
  descricao: string | null;
}

interface CreateUserResponse {
  success?: boolean;
  userId?: string;
  status?: string;
  temporaryPassword?: string | null;
  error?: string;
}

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'inativo', label: 'Inativo' },
];

const MIN_PASSWORD_LENGTH = 6;

const UserCreate = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string>('pendente');
  const NO_ROLE_VALUE = '__none__';
  const [roleId, setRoleId] = useState<string>(NO_ROLE_VALUE);
  const [sendInvite, setSendInvite] = useState<boolean>(true);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const { data, error } = await supabase
          .from('rbac_auth_role')
          .select('id, nome, descricao')
          .eq('ativo', true)
          .order('nome', { ascending: true });

        if (error) throw error;
        setRoles(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar roles:', error);
        toast({
          title: 'Erro ao carregar roles',
          description: error.message ?? 'Não foi possível carregar os roles disponíveis.',
          variant: 'destructive',
        });
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (sendInvite && status === 'ativo') {
      setStatus('pendente');
    }
  }, [sendInvite, status]);

  const isSubmitDisabled = useMemo(() => {
    if (!nome.trim() || !email.trim()) {
      return true;
    }

    if (!sendInvite && password && password.length < MIN_PASSWORD_LENGTH) {
      return true;
    }

    return submitting;
  }, [nome, email, password, sendInvite, submitting]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setTemporaryPassword(null);

    try {
      const payload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        status,
        roleId: roleId === NO_ROLE_VALUE ? null : roleId,
        sendInvite,
        password: sendInvite ? undefined : (password.trim() || undefined),
      };

      const { data, error } = await supabase.functions.invoke<CreateUserResponse>('create-user', {
        body: payload,
      });

      if (error) {
        console.error("create-user edge error", { error, context: (error as any)?.context });
        let errorMessage = error.message ?? 'Falha ao criar usuário';
        const context = (error as any)?.context;
        try {
          if (context && typeof (context as Response).clone === 'function') {
            const response = context as Response;
            const cloned = response.clone();
            const text = await cloned.text();
            if (text) {
              try {
                const parsed = JSON.parse(text);
                if (parsed?.error) {
                  errorMessage = parsed.error;
                  if (parsed?.details) {
                    errorMessage += ` (${parsed.details})`;
                  }
                } else {
                  errorMessage = text;
                }
              } catch {
                errorMessage = text;
              }
            }
          }
        } catch (parseError) {
          console.warn('Não foi possível interpretar resposta de erro da função create-user', parseError);
        }
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('Resposta inesperada do servidor');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.success || !data.userId) {
        throw new Error('Não foi possível concluir a criação do usuário.');
      }

      setTemporaryPassword(data.temporaryPassword ?? null);

      toast({
        title: 'Usuário criado com sucesso',
        description: data.temporaryPassword
          ? 'Compartilhe a senha temporária com o usuário e solicite a troca no primeiro acesso.'
          : 'Um convite foi enviado para o e-mail informado.',
      });

      if (data.warning) {
        toast({
          title: 'Atenção',
          description: data.warning,
        });
      }

      navigate(`/users/${data.userId}`);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message ?? 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="h-7 w-7" />
            Novo Usuário
          </h1>
          <p className="text-muted-foreground">
            Cadastre um novo usuário, defina o status inicial e atribua um papel padrão.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/users')}>
          Cancelar
        </Button>
      </div>

      <Alert>
        <AlertTitle>Convite por e-mail</AlertTitle>
        <AlertDescription>
          Com a opção &quot;Enviar convite&quot; ativada, será enviado um e-mail para o usuário concluir o cadastro.
          Desative-a para definir uma senha manualmente. Se nenhum papel for selecionado, o usuário terá acesso mínimo até que um papel seja atribuído.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Informações do usuário</CardTitle>
          <CardDescription>
            Campos obrigatórios: nome e e-mail. A senha é opcional quando o convite por e-mail está ativado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Ex: Maria Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status inicial</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Papel padrão</Label>
                <Select
                  value={roleId}
                  onValueChange={setRoleId}
                  disabled={loadingRoles || roles.length === 0}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder={loadingRoles ? 'Carregando...' : 'Selecionar papel (opcional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_ROLE_VALUE}>Nenhum papel inicial</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.descricao ? `${role.nome} — ${role.descricao}` : role.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="sendInvite" className="flex flex-col">
                    Enviar convite por e-mail
                    <span className="text-sm font-normal text-muted-foreground">
                      O usuário receberá um e-mail para definir a própria senha.
                    </span>
                  </Label>
                </div>
                <Switch id="sendInvite" checked={sendInvite} onCheckedChange={setSendInvite} />
              </div>

              {!sendInvite && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Senha inicial
                    <span className="ml-1 text-xs text-muted-foreground">
                      (mínimo de {MIN_PASSWORD_LENGTH} caracteres)
                    </span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Defina uma senha temporária"
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitDisabled}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando usuário...
                  </>
                ) : (
                  'Criar usuário'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {temporaryPassword && (
        <Alert>
          <AlertTitle>Senha temporária gerada</AlertTitle>
          <AlertDescription>
            Compartilhe a senha temporária abaixo com o usuário e solicite a troca no primeiro acesso:
            <span className="mt-2 block font-mono text-sm">{temporaryPassword}</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UserCreate;

