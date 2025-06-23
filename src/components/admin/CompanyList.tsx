
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Calendar, Users, Eye, Edit, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompanyListProps {
  searchTerm: string;
  selectedPlan: string;
}

export const CompanyList = ({ searchTerm, selectedPlan }: CompanyListProps) => {
  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['admin-companies', searchTerm, selectedPlan],
    queryFn: async () => {
      let query = supabase
        .from('admin_empresa_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      if (selectedPlan) {
        query = query.eq('plano', selectedPlan);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar empresas:', error);
        throw error;
      }

      return data || [];
    }
  });

  const handleUpdatePlan = async (companyId: string, newPlan: string) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ plano: newPlan })
        .eq('id', companyId);

      if (error) throw error;
      
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
    }
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ ativa: !currentStatus })
        .eq('id', companyId);

      if (error) throw error;
      
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const getPlanColor = (plano: string) => {
    switch (plano) {
      case 'gratuito': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {companies?.map((company) => (
        <Card key={company.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900">{company.nome}</h3>
                  {!company.ativa && (
                    <Badge variant="destructive">Inativa</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{company.email || 'Email não informado'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{company.total_usuarios} usuários ({company.usuarios_ativos} ativos)</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getPlanColor(company.plano || 'gratuito')}>
                    {company.plano || 'gratuito'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver detalhes
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const newPlan = company.plano === 'gratuito' ? 'pro' : 'gratuito';
                    handleUpdatePlan(company.id, newPlan);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar plano
                </Button>
                
                <Button 
                  variant={company.ativa ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleToggleStatus(company.id, company.ativa)}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  {company.ativa ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {companies?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
            <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
