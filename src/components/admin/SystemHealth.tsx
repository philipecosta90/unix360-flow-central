import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: Date;
}

export const SystemHealth = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runHealthChecks = async () => {
    setLoading(true);
    const checks: HealthCheck[] = [];

    try {
      // 1. Verificar conexão com Supabase
      try {
        const { error } = await supabase.from('empresas').select('count').limit(1);
        checks.push({
          name: 'Conexão Supabase',
          status: error ? 'error' : 'healthy',
          message: error ? `Erro: ${error.message}` : 'Conectado',
          lastCheck: new Date()
        });
      } catch (error) {
        checks.push({
          name: 'Conexão Supabase',
          status: 'error',
          message: 'Falha na conexão',
          lastCheck: new Date()
        });
      }

      // 2. Verificar Edge Functions (desabilitado após remoção de pagamentos)
      checks.push({
        name: 'Edge Functions',
        status: 'healthy',
        message: 'Sistema funcionando sem integrações de pagamento',
        lastCheck: new Date()
      });

      // 3. Verificar integridade dos dados
      try {
        const { data: orphanedProfiles } = await supabase
          .from('perfis')
          .select('id')
          .is('empresa_id', null);

        checks.push({
          name: 'Integridade dos Dados',
          status: orphanedProfiles && orphanedProfiles.length > 0 ? 'warning' : 'healthy',
          message: orphanedProfiles && orphanedProfiles.length > 0 
            ? `${orphanedProfiles.length} perfis órfãos encontrados`
            : 'Dados íntegros',
          lastCheck: new Date()
        });
      } catch (error) {
        checks.push({
          name: 'Integridade dos Dados',
          status: 'error',
          message: 'Erro na verificação',
          lastCheck: new Date()
        });
      }

      // 4. Sistema de assinaturas removido
      checks.push({
        name: 'Sistema de Pagamentos',
        status: 'healthy',
        message: 'Sistema limpo - sem integrações de pagamento',
        lastCheck: new Date()
      });

      // 5. Verificar logs de segurança
      try {
        const { data: recentLogs } = await supabase
          .from('audit_logs')
          .select('id')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(100);

        checks.push({
          name: 'Logs de Segurança',
          status: 'healthy',
          message: `${recentLogs?.length || 0} eventos nas últimas 24h`,
          lastCheck: new Date()
        });
      } catch (error) {
        checks.push({
          name: 'Logs de Segurança',
          status: 'error',
          message: 'Erro ao acessar logs',
          lastCheck: new Date()
        });
      }

      setHealthChecks(checks);
      
      const errorCount = checks.filter(c => c.status === 'error').length;
      const warningCount = checks.filter(c => c.status === 'warning').length;
      
      if (errorCount > 0) {
        toast({
          title: "Problemas Detectados",
          description: `${errorCount} erro(s) e ${warningCount} aviso(s) encontrados`,
          variant: "destructive"
        });
      } else if (warningCount > 0) {
        toast({
          title: "Avisos Detectados", 
          description: `${warningCount} aviso(s) encontrados`,
          variant: "default"
        });
      } else {
        toast({
          title: "Sistema Saudável",
          description: "Todos os sistemas funcionando normalmente",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Erro ao executar verificações:', error);
      toast({
        title: "Erro na Verificação",
        description: "Falha ao executar verificações de saúde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(runHealthChecks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Saudável</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Saúde do Sistema
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real dos componentes críticos
            </CardDescription>
          </div>
          <Button 
            onClick={runHealthChecks} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthChecks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <p className="font-medium">{check.name}</p>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(check.status)}
                <p className="text-xs text-muted-foreground mt-1">
                  {check.lastCheck.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {healthChecks.length === 0 && !loading && (
            <div className="text-center py-6 text-muted-foreground">
              <p>Nenhuma verificação executada</p>
              <Button onClick={runHealthChecks} className="mt-2">
                Executar Verificações
              </Button>
            </div>
          )}
          
          {loading && (
            <div className="text-center py-6">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Executando verificações...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};