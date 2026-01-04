import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, CheckCircle2, Clock, Filter, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

// Componente de gráfico de evolução
const EvolutionChart = ({ historico }: { historico: CheckinHistorico[] }) => {
  const chartData = useMemo(() => {
    // Ordenar por data crescente para o gráfico
    return [...historico]
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .map(item => ({
        data: format(new Date(item.data), 'dd/MM', { locale: ptBR }),
        dataCompleta: format(new Date(item.data), "dd 'de' MMMM", { locale: ptBR }),
        score: item.scorePercent,
        scoreTotal: item.score,
        scoreMax: item.scoreMax,
      }));
  }, [historico]);

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

  if (chartData.length < 2) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg bg-muted/20">
        <p>Precisa de pelo menos 2 check-ins para mostrar o gráfico de evolução.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com métricas */}
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

      {/* Gráfico */}
      <div className="h-[200px] w-full">
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
              domain={[0, 100]} 
              tick={{ fontSize: 12 }} 
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                      <p className="font-medium">{data.dataCompleta}</p>
                      <p className="text-muted-foreground">
                        Score: <span className="font-semibold text-foreground">{data.score}%</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({data.scoreTotal}/{data.scoreMax} pts)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={70} stroke="hsl(var(--success))" strokeDasharray="5 5" strokeOpacity={0.5} />
            <ReferenceLine y={40} stroke="hsl(var(--warning))" strokeDasharray="5 5" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
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

        return {
          id: envio.id,
          data: envio.respondido_em || envio.enviado_em,
          score: envio.pontuacao_total || 0,
          scoreMax: envio.pontuacao_maxima || 0,
          scorePercent,
          revisado: envio.revisado || false,
          anotacoes: envio.anotacoes_profissional,
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
              <div className="grid grid-cols-[40px_100px_repeat(auto-fill,minmax(80px,1fr))_80px_100px] gap-2 p-3 bg-muted/50 rounded-t-lg font-medium text-sm border-b">
                <div></div>
                <div>Data</div>
                {secoesUnicas.map(secao => (
                  <div key={secao.nome} className="text-center" title={secao.nome}>
                    <span className="text-lg">{secao.icone}</span>
                  </div>
                ))}
                <div className="text-center">Score</div>
                <div className="text-center">Status</div>
              </div>

              {/* Linhas da tabela */}
              <div className="divide-y">
                {historico.map((item) => (
                  <Collapsible key={item.id} open={expandedRows.has(item.id)}>
                    <div className="grid grid-cols-[40px_100px_repeat(auto-fill,minmax(80px,1fr))_80px_100px] gap-2 p-3 items-center hover:bg-muted/30 transition-colors">
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
                        <Badge className={getScoreBadgeColor(item.scorePercent)}>
                          {item.scorePercent}%
                        </Badge>
                      </div>

                      <div className="text-center">
                        {item.revisado ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Revisado
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-primary"
                            onClick={() => handleMarcarRevisado(item.id)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Button>
                        )}
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
    </Card>
  );
};
