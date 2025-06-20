
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NicheSettings } from "@/components/settings/NicheSettings";
import { DocumentExporter } from "@/components/export/DocumentExporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Download, Palette, Users } from "lucide-react";

export default function Settings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">Personalize seu sistema para seu negócio</p>
        </div>
        <SettingsIcon className="w-8 h-8 text-[#43B26D]" />
      </div>

      <Tabs defaultValue="niche" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="niche" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Nicho
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportação
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="niche">
          <NicheSettings />
        </TabsContent>

        <TabsContent value="export">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Exportação de Dados</h2>
              <p className="text-gray-600">Exporte seus dados em diferentes formatos</p>
            </div>
            <DocumentExporter />
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Funcionalidade em desenvolvimento. Aqui você poderá gerenciar permissões e acessos da sua equipe.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
