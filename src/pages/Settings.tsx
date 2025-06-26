
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NicheSettings } from "@/components/settings/NicheSettings";
import { DocumentExporter } from "@/components/export/DocumentExporter";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Download, Palette, Users, KeyRound } from "lucide-react";

export default function Settings() {
  return (
    <div className="container mx-auto space-y-4 sm:space-y-6 px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">Personalize seu sistema para seu negócio</p>
        </div>
        <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#43B26D]" />
      </div>

      <Tabs defaultValue="niche" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="niche" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Palette className="w-4 h-4" />
            <span>Nicho</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <KeyRound className="w-4 h-4" />
            <span>Senha</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportação</span>
            <span className="sm:hidden">Export</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Users className="w-4 h-4" />
            <span>Equipe</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="niche">
          <NicheSettings />
        </TabsContent>

        <TabsContent value="password">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Segurança da Conta</h2>
              <p className="text-gray-600">Gerencie a senha da sua conta</p>
            </div>
            <ChangePasswordForm />
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Exportação de Dados</h2>
              <p className="text-gray-600">Exporte seus dados em diferentes formatos</p>
            </div>
            <DocumentExporter />
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Gerenciamento de Equipe</CardTitle>
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
