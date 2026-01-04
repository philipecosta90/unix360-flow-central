import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, CheckCircle2, Clock, Filter, TrendingUp, TrendingDown, Minus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CheckinRespostasDialog } from "@/components/checkins/CheckinRespostasDialog";

interface ClientCheckinHistoryProps {
  clientId: string;
}

interface CheckinEnvio {
  id: string;
  template_id: string;
  enviado_em: string;
  respondido_em: string | null;
  pontuacao_total: number | null;
  pontuacao_maxima: number | null;
  revisado: boolean;
  status: string;
  anotacoes_profissional: string | null;
}

interface CheckinResposta {
  id: string;
  envio_id: string;
  pergunta_id: string;
  resposta: string | null;
  pontuacao: number | null;
  indicador_visual: string | null;
  resposta_arquivo: string | null;
  pergunta: {
    id: string;
    pergunta: string;
    secao: string;
    secao_icone: string | null;
    pontos_maximo: number | null;
    tipo: string;
  };
}

interface SecaoIndicador {
  nome: string;
  icone: string;
  indicador: 'verde' | 'amarelo' | 'vermelho' | 'neutro';
  pontuacao: number;
  pontuacaoMax: number;
  emoji: string;
}

interface CheckinHistorico {
  id: string;
  data: string;
  score: number;
  scoreMax: number;
  scorePercent: number;
  revisado: boolean;
  anotacoes: string | null;
  peso: string | null;
  secoes: SecaoIndicador[];
  respostas: CheckinResposta[];
}

const getIndicador = (pontuacao: number, max: number): { indicador: 'verde' | 'amarelo' | 'vermelho' | 'neutro', emoji: string } => {
  if (max === 0) return { indicador: 'neutro', emoji: '➖' };
  const percent = (pontuacao / max) * 100;
  if (percent >= 70) return { indicador: 'verde', emoji: '😄' };
  if (percent >= 40) return { indicador: 'amarelo', emoji: '😐' };
  return { indicador: 'vermelho', emoji: '😞' };
};

const getIndicadorColor = (indicador: string) => {
  switch (indicador) {
    case 'verde': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    case 'amarelo': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    case 'vermelho': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getScoreBadgeColor = (percent: number) => {
  if (percent >= 70) return 'bg-green-500 text-white';
  if (percent >= 40) return 'bg-yellow-500 text-white';
  return 'bg-red-500 text-white';
};

// Cores para as seções do gráfico comparativo
const SECTION_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)', // green
  'hsl(38, 92%, 50%)',  // amber
  'hsl(280, 65%, 60%)', // purple
  'hsl(199, 89%, 48%)', // blue
  'hsl(346, 77%, 50%)', // pink
  'hsl(24, 95%, 53%)',  // orange
  'hsl(173, 80%, 40%)', // teal
];

// Componente de gráfico de evolução
const EvolutionChart = ({ historico }: { historico: CheckinHistorico[] }) => {
  const [viewMode, setViewMode] = useState<'geral' | 'secoes' | 'peso'>('geral');
  const [activeSecoes, setActiveSecoes] = useState<Set<string>>(new Set());

  // Coletar todas as seções únicas
  const secoesUnicas = useMemo(() => {
    const secoesMap = new Map<string, string>();
    historico.forEach(h => {
      h.secoes.forEach(s => {
        if (!secoesMap.has(s.nome)) {
          secoesMap.set(s.nome, s.icone);
        }
      });
    });
    return Array.from(secoesMap.entries()).map(([nome, icone]) => ({ nome, icone }));
  }, [historico]);

  // Verificar se há dados de peso
  const temDadosPeso = useMemo(() => {
    return historico.some(h => h.peso !== null && h.peso !== '');
  }, [historico]);

  // Inicializar seções ativas
  useEffect(() => {
    if (secoesUnicas.length > 0 && activeSecoes.size === 0) {
      setActiveSecoes(new Set(secoesUnicas.map(s => s.nome)));
    }
  }, [secoesUnicas]);

  const chartData = useMemo(() => {
    // Ordenar por data crescente para o gráfico
    return [...historico]
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .map(item => {
        const pesoNum = item.peso ? parseFloat(item.peso.replace(',', '.')) : null;
        const dataPoint: Record<string, any> = {
          data: format(new Date(item.data), 'dd/MM', { locale: ptBR }),
          dataCompleta: format(new Date(item.data), "dd 'de' MMMM", { locale: ptBR }),
          score: item.scorePercent,
          scoreTotal: item.score,
          scoreMax: item.scoreMax,
          peso: pesoNum,
          pesoOriginal: item.peso,
        };
        
        // Adicionar score por seção
        item.secoes.forEach(secao => {
          const percent = secao.pontuacaoMax > 0 
            ? Math.round((secao.pontuacao / secao.pontuacaoMax) * 100) 
            : 0;
          dataPoint[secao.nome] = percent;
          dataPoint[`${secao.nome}_pts`] = `${secao.pontuacao}/${secao.pontuacaoMax}`;
        });
        
        return dataPoint;
      });
  }, [historico]);

  // Calcular range de peso para eixo Y
  const pesoRange = useMemo(() => {
    const pesos = chartData.filter(d => d.peso !== null).map(d => d.peso as number);
    if (pesos.length === 0) return { min: 50, max: 100 };
    const min = Math.floor(Math.min(...pesos) - 2);
    const max = Math.ceil(Math.max(...pesos) + 2);
    return { min, max };
  }, [chartData]);

  // Calcular tendência (média dos últimos 3 vs média dos primeiros 3)
  const tendencia = useMemo(() => {
    if (chartData.length < 2) return { tipo: 'neutro' as const, valor: 0 };
    
    const ultimosTres = chartData.slice(-3);
    const primeirosTres = chartData.slice(0, 3);
    
    const mediaUltimos = ultimosTres.reduce((acc, curr) => acc + curr.score, 0) / ultimosTres.length;
    const mediaPrimeiros = primeirosTres.reduce((acc, curr) => acc + curr.score, 0) / primeirosTres.length;
    
    const diferenca = mediaUltimos - mediaPrimeiros;
    
    if (diferenca > 5) return { tipo: 'subindo' as const, valor: Math.round(diferenca) };
    if (diferenca < -5) return { tipo: 'descendo' as const, valor: Math.round(Math.abs(diferenca)) };
    return { tipo: 'neutro' as const, valor: Math.round(Math.abs(diferenca)) };
  }, [chartData]);

  const mediaGeral = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((acc, curr) => acc + curr.score, 0) / chartData.length);
  }, [chartData]);

  const toggleSecao = (nome: string) => {
    const newActive = new Set(activeSecoes);
    if (newActive.has(nome)) {
      if (newActive.size > 1) { // Manter pelo menos uma seção ativa
        newActive.delete(nome);
      }
    } else {
      newActive.add(nome);
    }
    setActiveSecoes(newActive);
  };

  if (chartData.length < 2) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg bg-muted/20">
        <p>Precisa de pelo menos 2 check-ins para mostrar o gráfico de evolução.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com métricas e toggle de visualização */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tendência:</span>
            {tendencia.tipo === 'subindo' && (
              <Badge className="bg-green-500 text-white">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{tendencia.valor}%
              </Badge>
            )}
            {tendencia.tipo === 'descendo' && (
              <Badge className="bg-red-500 text-white">
                <TrendingDown className="h-3 w-3 mr-1" />
                -{tendencia.valor}%
              </Badge>
            )}
            {tendencia.tipo === 'neutro' && (
              <Badge variant="secondary">
                <Minus className="h-3 w-3 mr-1" />
                Estável
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Média geral:</span>
            <Badge className={getScoreBadgeColor(mediaGeral)}>
              {mediaGeral}%
            </Badge>
          </div>
        </div>
        
        {/* Toggle de visualização */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'geral' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode('geral')}
          >
            Score Geral
          </Button>
          <Button
            variant={viewMode === 'secoes' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode('secoes')}
          >
            Por Seção
          </Button>
          {temDadosPeso && (
            <Button
              variant={viewMode === 'peso' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode('peso')}
            >
              ⚖️ Peso
            </Button>
          )}
        </div>
      </div>

      {/* Filtro de seções (quando modo seções) */}
      {viewMode === 'secoes' && (
        <div className="flex flex-wrap gap-2">
          {secoesUnicas.map((secao, index) => (
            <button
              key={secao.nome}
              onClick={() => toggleSecao(secao.nome)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${activeSecoes.has(secao.nome) 
                  ? 'bg-primary/10 text-primary border border-primary/30' 
                  : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80'
                }
              `}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: SECTION_COLORS[index % SECTION_COLORS.length] }}
              />
              <span>{secao.icone}</span>
              <span>{secao.nome}</span>
            </button>
          ))}
        </div>
      )}

      {/* Gráfico */}
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="data" 
              tick={{ fontSize: 12 }} 
              className="text-muted-foreground"
              tickLine={false}
            />
            <YAxis 
              domain={viewMode === 'peso' ? [pesoRange.min, pesoRange.max] : [0, 100]} 
              tick={{ fontSize: 12 }} 
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={viewMode === 'peso' ? (value) => `${value}kg` : undefined}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm min-w-[140px]">
                      <p className="font-medium mb-2">{data.dataCompleta}</p>
                      {viewMode === 'geral' ? (
                        <>
                          <p className="text-muted-foreground">
                            Score: <span className="font-semibold text-foreground">{data.score}%</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({data.scoreTotal}/{data.scoreMax} pts)
                          </p>
                        </>
                      ) : viewMode === 'peso' ? (
                        <p className="text-muted-foreground">
                          Peso: <span className="font-semibold text-foreground">{data.pesoOriginal || '-'} kg</span>
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {secoesUnicas.map((secao, index) => (
                            activeSecoes.has(secao.nome) && data[secao.nome] !== undefined && (
                              <div key={secao.nome} className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: SECTION_COLORS[index % SECTION_COLORS.length] }}
                                  />
                                  <span className="text-xs">{secao.icone} {secao.nome}</span>
                                </span>
                                <span className="font-semibold text-xs">{data[secao.nome]}%</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {viewMode !== 'peso' && (
              <>
                <ReferenceLine y={70} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" strokeOpacity={0.4} />
                <ReferenceLine y={40} stroke="hsl(38, 92%, 50%)" strokeDasharray="5 5" strokeOpacity={0.4} />
              </>
            )}
            
            {viewMode === 'geral' ? (
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              />
            ) : viewMode === 'peso' ? (
              <Line
                type="monotone"
                dataKey="peso"
                stroke="hsl(280, 65%, 60%)"
                strokeWidth={2}
                dot={{ fill: "hsl(280, 65%, 60%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(280, 65%, 60%)" }}
                connectNulls
              />
            ) : (
              secoesUnicas.map((secao, index) => (
                activeSecoes.has(secao.nome) && (
                  <Line
                    key={secao.nome}
                    type="monotone"
                    dataKey={secao.nome}
                    name={secao.nome}
                    stroke={SECTION_COLORS[index % SECTION_COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: SECTION_COLORS[index % SECTION_COLORS.length], strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: SECTION_COLORS[index % SECTION_COLORS.length] }}
                  />
                )
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span>Bom (≥70%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-yellow-500"></div>
          <span>Atenção (40-69%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span>Crítico (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
};
export const ClientCheckinHistory = ({ clientId }: ClientCheckinHistoryProps) => {
  const { userProfile } = useAuth();
  const [historico, setHistorico] = useState<CheckinHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<string>('todos');
  const [secoesUnicas, setSecoesUnicas] = useState<{ nome: string; icone: string }[]>([]);
  const [dialogEnvio, setDialogEnvio] = useState<any>(null);
  const fetchHistorico = async () => {
    if (!userProfile?.empresa_id) return;

    try {
      setLoading(true);

      // Buscar check-ins respondidos do cliente
      const { data: envios, error: enviosError } = await supabase
        .from('checkin_envios')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('cliente_id', clientId)
        .eq('status', 'respondido')
        .order('respondido_em', { ascending: false });

      if (enviosError) throw enviosError;

      if (!envios || envios.length === 0) {
        setHistorico([]);
        setLoading(false);
        return;
      }

      // Buscar todas as respostas com perguntas para estes envios
      const envioIds = envios.map(e => e.id);
      const { data: respostas, error: respostasError } = await supabase
        .from('checkin_respostas')
        .select(`
          id,
          envio_id,
          pergunta_id,
          resposta,
          pontuacao,
          indicador_visual,
          resposta_arquivo,
          pergunta:checkin_perguntas(
            id,
            pergunta,
            secao,
            secao_icone,
            pontos_maximo,
            tipo
          )
        `)
        .in('envio_id', envioIds);

      if (respostasError) throw respostasError;

      // Coletar todas as seções únicas
      const secoesMap = new Map<string, string>();
      respostas?.forEach((r: any) => {
        if (r.pergunta?.secao) {
          secoesMap.set(r.pergunta.secao, r.pergunta.secao_icone || '📋');
        }
      });
      const secoes = Array.from(secoesMap.entries()).map(([nome, icone]) => ({ nome, icone }));
      setSecoesUnicas(secoes);

      // Processar histórico
      const historicoProcessado: CheckinHistorico[] = envios.map(envio => {
        const respostasEnvio = (respostas || []).filter((r: any) => r.envio_id === envio.id);
        
        // Agrupar por seção e calcular indicadores
        const secoesPontuacao = new Map<string, { pontuacao: number; max: number; icone: string }>();
        
        respostasEnvio.forEach((r: any) => {
          if (r.pergunta?.secao) {
            const secaoAtual = secoesPontuacao.get(r.pergunta.secao) || { pontuacao: 0, max: 0, icone: r.pergunta.secao_icone || '📋' };
            secaoAtual.pontuacao += r.pontuacao || 0;
            secaoAtual.max += r.pergunta.pontos_maximo || 0;
            secaoAtual.icone = r.pergunta.secao_icone || '📋';
            secoesPontuacao.set(r.pergunta.secao, secaoAtual);
          }
        });

        const secoesArray: SecaoIndicador[] = Array.from(secoesPontuacao.entries()).map(([nome, dados]) => {
          const { indicador, emoji } = getIndicador(dados.pontuacao, dados.max);
          return {
            nome,
            icone: dados.icone,
            indicador,
            pontuacao: dados.pontuacao,
            pontuacaoMax: dados.max,
            emoji
          };
        });

        const scorePercent = envio.pontuacao_maxima && envio.pontuacao_maxima > 0
          ? Math.round((envio.pontuacao_total || 0) / envio.pontuacao_maxima * 100)
          : 0;

        // Buscar peso nas respostas (pergunta que contenha "peso" no texto)
        let peso: string | null = null;
        respostasEnvio.forEach((r: any) => {
          if (r.pergunta?.pergunta && r.pergunta.pergunta.toLowerCase().includes('peso') && r.resposta) {
            peso = r.resposta;
          }
        });

        return {
          id: envio.id,
          data: envio.respondido_em || envio.enviado_em,
          score: envio.pontuacao_total || 0,
          scoreMax: envio.pontuacao_maxima || 0,
          scorePercent,
          revisado: envio.revisado || false,
          anotacoes: envio.anotacoes_profissional,
          peso,
          secoes: secoesArray,
          respostas: respostasEnvio as CheckinResposta[]
        };
      });

      // Aplicar filtro de período
      let historicoFiltrado = historicoProcessado;
      if (filtro !== 'todos') {
        const diasFiltro = parseInt(filtro);
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasFiltro);
        historicoFiltrado = historicoProcessado.filter(h => new Date(h.data) >= dataLimite);
      }

      setHistorico(historicoFiltrado);
    } catch (error) {
      console.error('Erro ao buscar histórico de check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [clientId, userProfile?.empresa_id, filtro]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleMarcarRevisado = async (envioId: string) => {
    try {
      const { error } = await supabase
        .from('checkin_envios')
        .update({ revisado: true })
        .eq('id', envioId);

      if (error) throw error;
      fetchHistorico();
    } catch (error) {
      console.error('Erro ao marcar como revisado:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Histórico de Check-ins
            <Badge variant="secondary">{historico.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {historico.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum check-in respondido encontrado.</p>
          </div>
        ) : (
          <>
            {/* Gráfico de Evolução */}
            <EvolutionChart historico={historico} />
            
            <ScrollArea className="w-full mt-6">
            <div className="min-w-[600px]">
              {/* Header da tabela */}
              <div className="grid grid-cols-[40px_90px_60px_repeat(auto-fill,minmax(70px,1fr))_70px_110px_80px] gap-3 p-3 bg-muted/50 rounded-t-lg font-medium text-sm border-b">
                <div></div>
                <div>Data</div>
                <div className="text-center">
                  <span className="text-lg">⚖️</span>
                  <span className="block text-[10px] text-muted-foreground">Peso</span>
                </div>
                {secoesUnicas.map(secao => (
                  <div key={secao.nome} className="text-center flex flex-col items-center gap-0.5">
                    <span className="text-lg">{secao.icone}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{secao.nome}</span>
                  </div>
                ))}
                <div className="text-center">Score</div>
                <div className="text-center">Status</div>
                <div className="text-center">Ações</div>
              </div>

              {/* Linhas da tabela */}
              <div className="divide-y">
                {historico.map((item) => (
                  <Collapsible key={item.id} open={expandedRows.has(item.id)}>
                    <div className="grid grid-cols-[40px_90px_60px_repeat(auto-fill,minmax(70px,1fr))_70px_110px_80px] gap-3 p-3 items-center hover:bg-muted/30 transition-colors">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleRow(item.id)}
                        >
                          {expandedRows.has(item.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <div className="text-sm font-medium">
                        {format(new Date(item.data), 'dd/MM/yy', { locale: ptBR })}
                      </div>

                      {/* Peso */}
                      <div className="text-center text-sm">
                        {item.peso ? (
                          <span className="font-medium">{item.peso}kg</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>

                      {secoesUnicas.map(secaoUnica => {
                        const secaoItem = item.secoes.find(s => s.nome === secaoUnica.nome);
                        if (!secaoItem) {
                          return (
                            <div key={secaoUnica.nome} className="text-center">
                              <span className="text-muted-foreground">-</span>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={secaoUnica.nome}
                            className={`text-center rounded-md py-1 ${getIndicadorColor(secaoItem.indicador)}`}
                            title={`${secaoItem.nome}: ${secaoItem.pontuacao}/${secaoItem.pontuacaoMax}`}
                          >
                            <span className="text-lg">{secaoItem.emoji}</span>
                          </div>
                        );
                      })}

                      <div className="text-center">
                        <Badge className={`${getScoreBadgeColor(item.scorePercent)} text-xs`}>
                          {item.scorePercent}%
                        </Badge>
                      </div>

                      <div className="text-center">
                        {item.revisado ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Revisado
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-primary h-7 px-2"
                            onClick={() => handleMarcarRevisado(item.id)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Button>
                        )}
                      </div>

                      {/* Botão Ver Respostas */}
                      <div className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setDialogEnvio({
                            id: item.id,
                            pontuacao_total: item.score,
                            pontuacao_maxima: item.scoreMax,
                            revisado: item.revisado,
                            anotacoes_profissional: item.anotacoes,
                            respondido_em: item.data,
                          })}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 bg-muted/20 rounded-b-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                          {/* Respostas agrupadas por seção */}
                          {secoesUnicas.map(secao => {
                            const respostasSecao = item.respostas.filter(
                              (r: any) => r.pergunta?.secao === secao.nome
                            );
                            if (respostasSecao.length === 0) return null;

                            return (
                              <div key={secao.nome} className="space-y-2">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <span>{secao.icone}</span>
                                  {secao.nome}
                                </h4>
                                <div className="space-y-1 pl-6">
                                  {respostasSecao.map((resp: any) => (
                                    <div key={resp.id} className="text-sm">
                                      <span className="text-muted-foreground">
                                        {resp.pergunta?.pergunta}:
                                      </span>{' '}
                                      <span className="font-medium">
                                        {resp.resposta || '-'}
                                      </span>
                                      {resp.pontuacao !== null && resp.pergunta?.pontos_maximo > 0 && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({resp.pontuacao}/{resp.pergunta.pontos_maximo})
                                        </span>
                                      )}
                                      {resp.resposta_arquivo && (
                                        <div className="mt-1 flex flex-wrap gap-2">
                                          {resp.resposta_arquivo.split('|||').map((url: string, idx: number) => (
                                            <a
                                              key={idx}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-block"
                                            >
                                              <img
                                                src={url}
                                                alt={`Foto ${idx + 1}`}
                                                className="h-16 w-16 object-cover rounded border hover:opacity-80 transition-opacity"
                                              />
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {item.anotacoes && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <h4 className="font-medium text-sm mb-1">📝 Anotações do Profissional</h4>
                            <p className="text-sm text-muted-foreground">{item.anotacoes}</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          </>
        )}
      </CardContent>

      {/* Dialog de Respostas */}
      <CheckinRespostasDialog
        open={!!dialogEnvio}
        onOpenChange={(open) => !open && setDialogEnvio(null)}
        envio={dialogEnvio}
      />
    </Card>
  );
};
