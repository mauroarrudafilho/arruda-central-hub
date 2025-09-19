import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Camera, Shield, Clock } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone?: string;
  departamento?: string;
  cargo?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  ultimo_login?: string;
  two_factor_enabled: boolean;
  roles: string[];
}

const Profile = () => {
  const { user } = useAuthState();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    departamento: '',
    cargo: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('auth_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user roles
      const { data: userRoles } = await supabase
        .from('auth_user_role')
        .select(`
          auth_role:role_id (
            nome
          )
        `)
        .eq('user_id', user.id)
        .eq('ativo', true);

      const roles = userRoles?.map(ur => ur.auth_role?.nome).filter(Boolean) || [];

      const fullProfile = {
        ...profileData,
        roles
      };

      setProfile(fullProfile);
      setFormData({
        nome: fullProfile.nome || '',
        telefone: fullProfile.telefone || '',
        departamento: fullProfile.departamento || '',
        cargo: fullProfile.cargo || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('auth_profile')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          departamento: formData.departamento,
          cargo: formData.cargo,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-muted rounded animate-pulse"></div>
          <div className="md:col-span-2 h-64 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold">Perfil não encontrado</h2>
        <p className="text-muted-foreground">Não foi possível carregar suas informações.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.nome)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{profile.nome}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button variant="outline" size="sm" className="flex items-center gap-2 mx-auto">
                <Camera className="h-4 w-4" />
                Alterar Foto
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Papéis</div>
                <div className="flex flex-wrap gap-1">
                  {profile.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Último Login
                </div>
                <div className="text-sm text-muted-foreground">
                  {profile.ultimo_login 
                    ? new Date(profile.ultimo_login).toLocaleString('pt-BR')
                    : 'Nunca'
                  }
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Autenticação 2FA
                </div>
                <Badge variant={profile.two_factor_enabled ? "default" : "secondary"}>
                  {profile.two_factor_enabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Seu cargo"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    placeholder="Seu departamento"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      nome: profile.nome || '',
                      telefone: profile.telefone || '',
                      departamento: profile.departamento || '',
                      cargo: profile.cargo || '',
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Segurança</CardTitle>
          <CardDescription>
            Gerencie suas configurações de segurança (em desenvolvimento)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/20">
            <h3 className="font-medium mb-2">Autenticação de Dois Fatores (2FA)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Adicione uma camada extra de segurança à sua conta
            </p>
            <Button variant="outline" disabled>
              Configurar 2FA (Em breve)
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg bg-muted/20">
            <h3 className="font-medium mb-2">Alterar Senha</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Atualize sua senha regularmente para manter sua conta segura
            </p>
            <Button variant="outline" disabled>
              Alterar Senha (Em breve)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;