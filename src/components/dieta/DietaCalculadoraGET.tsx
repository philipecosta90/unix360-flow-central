import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Save, History, Info, User, Activity, AlertTriangle, Flame, Zap, Scale } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useCalculosEnergeticos } from '@/hooks/useCalculosEnergeticos';
import { 
  PROTOCOLOS_TMB, 
  FATORES_ATIVIDADE, 
  FATORES_INJURIA,
  calcularGET,
  calcularIdade,
  validarDadosAntropometricos,
  type ProtocoloTMB,
  type DadosAntropometricos
} from '@/utils/tmbCalculations';
import { DietaCalculoHistoricoDialog } from './DietaCalculoHistoricoDialog';

interface Cliente {
  id: string;
  nome: string;
  data_nascimento?: string;
  peso_kg?: number;
  altura_cm?: number;
  sexo?: 'masculino' | 'feminino';
  massa_livre_gordura_kg?: number;
}

export const DietaCalculadoraGET = () => {
  const clientsQuery = useClients();
  const clients = clientsQuery.data || [];
  const { saveCalculo, getUltimoCalculo } = useCalculosEnergeticos();
  
  // Estados do formulário
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [peso, setPeso] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [idade, setIdade] = useState<string>('');
  const [sexo, setSexo] = useState<'masculino' | 'feminino' | ''>('');
  const [mlg, setMlg] = useState<string>('');
  const [protocolo, setProtocolo] = useState<ProtocoloTMB>('mifflin_st_jeor');
  const [fatorAtividade, setFatorAtividade] = useState<number>(1.55);
  const [fatorInjuria, setFatorInjuria] = useState<number>(1.0);
  const [observacoes, setObservacoes] = useState<string>('');
  
  // Estados de resultado
  const [resultado, setResultado] = useState<{ tmb: number; get: number } | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  
  // Estados de UI
  const [saving, setSaving] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  // Cliente selecionado
  const clienteSelecionado = clients.find(c => c.id === selectedClienteId) as Cliente | undefined;

  // Carregar dados do cliente quando selecionado
  useEffect(() => {
    if (clienteSelecionado) {
      // Preencher dados do cliente
      if (clienteSelecionado.peso_kg) setPeso(String(clienteSelecionado.peso_kg));
      if (clienteSelecionado.altura_cm) setAltura(String(clienteSelecionado.altura_cm));
      if (clienteSelecionado.sexo) setSexo(clienteSelecionado.sexo);
      if (clienteSelecionado.massa_livre_gordura_kg) setMlg(String(clienteSelecionado.massa_livre_gordura_kg));
      
      // Calcular idade
      if (clienteSelecionado.data_nascimento) {
        const idadeCalculada = calcularIdade(clienteSelecionado.data_nascimento);
        setIdade(String(idadeCalculada));
      }
      
      // Reset resultado ao trocar cliente
      setResultado(null);
      setErros([]);
    }
  }, [clienteSelecionado]);

  // Verificar se protocolo requer MLG
  const protocoloInfo = PROTOCOLOS_TMB[protocolo];
  const requiresMLG = protocoloInfo?.requiresMLG || false;

  // Calcular GET
  const handleCalcular = () => {
    const dados: Partial<DadosAntropometricos> = {
      peso_kg: parseFloat(peso),
      altura_cm: parseInt(altura),
      idade: parseInt(idade),
      sexo: sexo as 'masculino' | 'feminino',
      massa_livre_gordura_kg: mlg ? parseFloat(mlg) : undefined
    };

    // Validar dados
    const validacao = validarDadosAntropometricos(dados);
    if (!validacao.valido) {
      setErros(validacao.erros);
      setResultado(null);
      return;
    }

    // Verificar se MLG é necessário
    if (requiresMLG && !mlg) {
      setErros(['O protocolo selecionado requer a Massa Livre de Gordura (MLG)']);
      setResultado(null);
      return;
    }

    try {
      const calc = calcularGET(
        protocolo,
        dados as DadosAntropometricos,
        fatorAtividade,
        fatorInjuria
      );
      setResultado({ tmb: calc.tmb, get: calc.get });
      setErros([]);
    } catch (error: any) {
      setErros([error.message]);
      setResultado(null);
    }
  };

  // Salvar cálculo
  const handleSalvar = async () => {
    if (!resultado || !selectedClienteId) return;

    setSaving(true);
    try {
      await saveCalculo({
        cliente_id: selectedClienteId,
        peso_kg: parseFloat(peso),
        altura_cm: parseInt(altura),
        idade: parseInt(idade),
        sexo: sexo as 'masculino' | 'feminino',
        massa_livre_gordura_kg: mlg ? parseFloat(mlg) : undefined,
        protocolo_tmb: protocolo,
        fator_atividade: fatorAtividade,
        fator_injuria: fatorInjuria,
        tmb_kcal: resultado.tmb,
        get_kcal: resultado.get,
        observacoes: observacoes || undefined
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações sobre protocolos */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Sobre os Protocolos de TMB</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Mifflin-St Jeor (1990):</strong> Recomendado como mais preciso para adultos saudáveis.</p>
          <p><strong>Harris-Benedict:</strong> Fórmula clássica, pode superestimar em obesos.</p>
          <p><strong>Katch-McArdle / Cunningham:</strong> Baseados em MLG, ideais para atletas.</p>
          <p><strong>FAO/OMS:</strong> Tabelas por faixa etária, desenvolvido pela OMS.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Análise de Gasto Energético
            </CardTitle>
            <CardDescription>
              Calcule TMB e GET usando protocolos científicos padronizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Cliente */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Selecionar Cliente
              </Label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Dados Antropométricos */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Scale className="h-4 w-4" />
                1. Dados Antropométricos
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="peso">Peso (kg) *</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.5"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altura">Altura (cm) *</Label>
                  <Input
                    id="altura"
                    type="number"
                    placeholder="Ex: 175"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade (anos) *</Label>
                  <Input
                    id="idade"
                    type="number"
                    placeholder="Ex: 32"
                    value={idade}
                    onChange={(e) => setIdade(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo *</Label>
                  <Select value={sexo} onValueChange={(v) => setSexo(v as 'masculino' | 'feminino')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mlg" className="flex items-center gap-2">
                  MLG - Massa Livre de Gordura (kg)
                  {requiresMLG && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                </Label>
                <Input
                  id="mlg"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 55.0 (opcional para maioria dos protocolos)"
                  value={mlg}
                  onChange={(e) => setMlg(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Fórmulas e Fatores */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                2. Fórmulas Padronizadas
              </Label>
              
              <div className="space-y-2">
                <Label htmlFor="protocolo">Protocolo TMB *</Label>
                <Select value={protocolo} onValueChange={(v) => setProtocolo(v as ProtocoloTMB)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROTOCOLOS_TMB).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {info.nome}
                          {info.requiresMLG && <Badge variant="secondary" className="text-xs">MLG</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{protocoloInfo?.descricao}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatorAtividade">Fator de Atividade Física *</Label>
                <Select value={String(fatorAtividade)} onValueChange={(v) => setFatorAtividade(parseFloat(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FATORES_ATIVIDADE.map((fator) => (
                      <SelectItem key={fator.valor} value={String(fator.valor)}>
                        {fator.valor.toFixed(2)} - {fator.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {FATORES_ATIVIDADE.find(f => f.valor === fatorAtividade)?.descricao}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatorInjuria">Fator de Injúria/Estresse</Label>
                <Select value={String(fatorInjuria)} onValueChange={(v) => setFatorInjuria(parseFloat(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FATORES_INJURIA.map((fator) => (
                      <SelectItem key={fator.valor} value={String(fator.valor)}>
                        {fator.valor.toFixed(2)} - {fator.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {FATORES_INJURIA.find(f => f.valor === fatorInjuria)?.descricao}
                </p>
              </div>
            </div>

            <Separator />

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Anotações adicionais sobre o cálculo..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Erros */}
            {erros.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Corrija os seguintes erros:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                  {erros.map((erro, i) => (
                    <li key={i}>{erro}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botão Calcular */}
            <Button 
              onClick={handleCalcular} 
              className="w-full" 
              size="lg"
              disabled={!peso || !altura || !idade || !sexo}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular GET
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="space-y-6">
          {resultado && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Resultados do Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cards de Resultado */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 text-center">
                      <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <p className="text-3xl font-bold">{resultado.tmb}</p>
                      <p className="text-sm text-muted-foreground">TMB (kcal)</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/10">
                    <CardContent className="pt-6 text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-3xl font-bold text-primary">{resultado.get}</p>
                      <p className="text-sm text-muted-foreground">GET (kcal)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detalhes do cálculo */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>Protocolo:</strong> {PROTOCOLOS_TMB[protocolo].nome}</p>
                  <p><strong>Fator de Atividade:</strong> {fatorAtividade.toFixed(2)} ({FATORES_ATIVIDADE.find(f => f.valor === fatorAtividade)?.nome})</p>
                  {fatorInjuria > 1 && (
                    <p><strong>Fator de Injúria:</strong> {fatorInjuria.toFixed(2)} ({FATORES_INJURIA.find(f => f.valor === fatorInjuria)?.nome})</p>
                  )}
                  <Separator className="my-2" />
                  <p className="text-muted-foreground">
                    <strong>Fórmula:</strong> GET = TMB × Fator Atividade{fatorInjuria > 1 ? ' × Fator Injúria' : ''}
                  </p>
                  <p className="text-muted-foreground">
                    GET = {resultado.tmb} × {fatorAtividade.toFixed(2)}{fatorInjuria > 1 ? ` × ${fatorInjuria.toFixed(2)}` : ''} = <strong>{resultado.get} kcal</strong>
                  </p>
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSalvar} 
                    disabled={saving || !selectedClienteId}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Cálculo'}
                  </Button>
                  {selectedClienteId && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowHistorico(true)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Histórico
                    </Button>
                  )}
                </div>

                {!selectedClienteId && (
                  <p className="text-xs text-muted-foreground text-center">
                    Selecione um cliente para salvar o cálculo no histórico
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Placeholder quando não há resultado */}
          {!resultado && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum cálculo realizado</p>
                <p className="text-sm">Preencha os dados e clique em "Calcular GET"</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de Histórico */}
      {selectedClienteId && (
        <DietaCalculoHistoricoDialog
          open={showHistorico}
          onOpenChange={setShowHistorico}
          clienteId={selectedClienteId}
          clienteNome={clienteSelecionado?.nome || ''}
        />
      )}
    </div>
  );
};
