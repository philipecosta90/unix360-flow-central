import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin, Calendar, Users, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface CompanyDetailDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (company: Company) => void;
}

export const CompanyDetailDialog = ({ 
  company, 
  open, 
  onOpenChange, 
  onEdit 
}: CompanyDetailDialogProps) => {
  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Detalhes da Empresa
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(company)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com nome e status */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold">{company.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={company.ativa ? "default" : "destructive"}>
                  {company.ativa ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Informações principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações de Contato</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{company.email || "Email não informado"}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{company.telefone || "Telefone não informado"}</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{company.endereco || "Endereço não informado"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Gerais</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>CNPJ: {company.cnpj || "Não informado"}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Cadastrada em: {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {company.total_usuarios} usuários ({company.usuarios_ativos} ativos)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};