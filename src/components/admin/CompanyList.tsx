
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Calendar, Users, Eye, Edit, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CompanyDetailDialog } from "./CompanyDetailDialog";
import { EditCompanyDialog } from "./EditCompanyDialog";

interface CompanyListProps {
  searchTerm: string;
  selectedPlan: string;
}

interface Company {
  id: string;
  nome: string;
  email?: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  created_at: string;
  ativa: boolean;
  total_usuarios: number;
  usuarios_ativos: number;
}

export const CompanyList = ({ searchTerm, selectedPlan }: CompanyListProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: allCompanies, isLoading, refetch } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_admin_empresa_stats');

      if (error) {
        console.error('Erro ao buscar empresas:', error);
        throw error;
      }

      return data || [];
    }
  });

  // Real-time subscription para atualizações automáticas
  useEffect(() => {
    const channelName = 'admin-companies-changes';
    supabase.getChannels().forEach((ch) => {
      if ((ch as any).topic === channelName) supabase.removeChannel(ch);
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'empresas'
        },
        (payload) => {
          console.log('🔄 Empresa atualizada em tempo real:', payload);
          
          // Invalidar e refetch a query para atualizar a lista
          queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
          
          // Mostrar toast informativo
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nova empresa cadastrada",
              description: `${payload.new?.nome || 'Uma nova empresa'} foi adicionada ao sistema.`,
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "Empresa atualizada",
              description: `${payload.new?.nome || 'Uma empresa'} foi modificada.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  // Filtrar dados no frontend
  const companies = allCompanies?.filter(company => {
    const matchesSearch = !searchTerm || 
      company.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === "todos" || !selectedPlan || 
      company.plano === selectedPlan;
    return matchesSearch && matchesPlan;
  });


  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ ativa: !currentStatus })
        .eq('id', companyId);

      if (error) throw error;
      
      toast({
        title: "Status atualizado",
        description: `Empresa ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível alterar o status da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company);
    setShowDetailDialog(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    refetch();
    setShowEditDialog(false);
    setSelectedCompany(null);
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
                
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewDetails(company)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver detalhes
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditCompany(company)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
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

      <CompanyDetailDialog
        company={selectedCompany}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onEdit={(company) => {
          setShowDetailDialog(false);
          handleEditCompany(company);
        }}
      />

      <EditCompanyDialog
        company={selectedCompany}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};
