import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, X, Filter, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CRMFiltersProps {
  filters: {
    search: string;
    tags: string[];
    responsavel: string;
    stage: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  };
  onFiltersChange: (filters: any) => void;
}

export const CRMFilters = ({ filters, onFiltersChange }: CRMFiltersProps) => {
  const { userProfile } = useAuth();
  const [showFilters, setShowFilters] = useState(false);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome, sobrenome')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('ativo', true);

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.empresa_id,
  });

  // Fetch stages
  const { data: stages = [] } = useQuery({
    queryKey: ['crm-stages', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('crm_stages')
        .select('id, nome')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.empresa_id,
  });

  // Fetch available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['crm-tags', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('crm_prospects')
        .select('tags')
        .eq('empresa_id', userProfile.empresa_id);

      if (error) throw error;
      
      const allTags = data.flatMap(item => item.tags || []);
      return [...new Set(allTags)].filter(Boolean);
    },
    enabled: !!userProfile?.empresa_id,
  });

  const updateFilters = (key: string, value: any) => {
    // Convert "todos" back to empty string for filtering logic
    const filterValue = value === "todos" ? "" : value;
    onFiltersChange({ ...filters, [key]: filterValue });
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = filters.tags.filter(tag => tag !== tagToRemove);
    updateFilters('tags', newTags);
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilters('tags', [...filters.tags, tag]);
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      tags: [],
      responsavel: "",
      stage: "",
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters = filters.search || filters.tags.length > 0 || filters.responsavel || filters.stage || filters.startDate || filters.endDate;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar prospects..."
              value={filters.search}
              onChange={(e) => updateFilters('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-gray-100" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stage Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Etapa
                </label>
                <Select value={filters.stage || "todos"} onValueChange={(value) => updateFilters('stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as etapas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as etapas</SelectItem>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Responsible Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Responsável
                </label>
                <Select value={filters.responsavel || "todos"} onValueChange={(value) => updateFilters('responsavel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os responsáveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os responsáveis</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nome} {member.sobrenome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tags
                </label>
                <Select onValueChange={addTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Período de Follow-up
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "dd/MM/yyyy") : "Início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => updateFilters('startDate', date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "dd/MM/yyyy") : "Fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => updateFilters('endDate', date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Tags */}
        {filters.tags.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tags selecionadas:
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <X 
                    className="h-3 w-3 ml-1" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Active Date Range */}
        {(filters.startDate || filters.endDate) && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Período selecionado:
            </label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filters.startDate ? format(filters.startDate, "dd/MM/yyyy") : "Sem início"}
                {" - "}
                {filters.endDate ? format(filters.endDate, "dd/MM/yyyy") : "Sem fim"}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => {
                    updateFilters('startDate', undefined);
                    updateFilters('endDate', undefined);
                  }}
                />
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
