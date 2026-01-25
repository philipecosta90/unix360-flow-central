import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Users, Bot, Loader2, Calculator } from 'lucide-react';
import { useDietas } from '@/hooks/useDietas';
import { DietaTemplatesList } from './DietaTemplatesList';
import { DietaClientesList } from './DietaClientesList';
import { DietaTemplateDialog } from './DietaTemplateDialog';
import { DietaClienteDialog } from './DietaClienteDialog';
import { DietaAIDialog } from './DietaAIDialog';
import { DietaCalculadoraGET } from './DietaCalculadoraGET';

export const DietaModule = () => {
  const { templates, dietasClientes, loading } = useDietas();
  const [activeTab, setActiveTab] = useState('clientes');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Planos Alimentares
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie dietas personalizadas para seus clientes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAIDialog(true)}>
            <Bot className="h-4 w-4 mr-2" />
            Gerar com IA
          </Button>
          <Button onClick={() => activeTab === 'templates' ? setShowTemplateDialog(true) : setShowClienteDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'templates' ? 'Novo Template' : 'Nova Dieta'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">modelos reutilizáveis</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dietas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dietasClientes.filter(d => d.status === 'ativa').length}
            </div>
            <p className="text-xs text-muted-foreground">clientes com dieta ativa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dietas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dietasClientes.length}</div>
            <p className="text-xs text-muted-foreground">dietas criadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="clientes">Dietas dos Clientes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="calculadora" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            Calculadora GET
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DietaClientesList 
              dietas={dietasClientes}
              onNewDieta={() => setShowClienteDialog(true)}
            />
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DietaTemplatesList 
              templates={templates}
              onNewTemplate={() => setShowTemplateDialog(true)}
            />
          )}
        </TabsContent>

        <TabsContent value="calculadora" className="mt-4">
          <DietaCalculadoraGET />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DietaTemplateDialog 
        open={showTemplateDialog} 
        onOpenChange={setShowTemplateDialog} 
      />
      
      <DietaClienteDialog 
        open={showClienteDialog} 
        onOpenChange={setShowClienteDialog}
        templates={templates}
      />

      <DietaAIDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
      />
    </div>
  );
};
