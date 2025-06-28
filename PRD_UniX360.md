
# PRD - UniX360
## Product Requirements Document

### 1. VISÃO GERAL DO PRODUTO

**Nome do Produto:** UniX360  
**Versão:** 1.0  
**Data:** Dezembro 2024  

**Descrição:**  
UniX360 é uma plataforma de gestão empresarial completa que oferece soluções integradas para CRM, gestão financeira, contratos, atendimento ao cliente e administração de usuários. O sistema é projetado para ser adaptável a diferentes nichos de mercado (fitness, consultoria, médico, odontológico) com configurações específicas para cada segmento.

### 2. OBJETIVOS DO PRODUTO

**Objetivos Primários:**
- Centralizar a gestão de relacionamento com clientes (CRM)
- Automatizar processos financeiros e de cobrança
- Facilitar o gerenciamento de contratos e documentos
- Melhorar o sucesso do cliente através de acompanhamento personalizado
- Fornecer insights através de dashboards e relatórios

**Objetivos Secundários:**
- Adaptabilidade para diferentes nichos de mercado
- Interface responsiva para dispositivos móveis
- Sistema de permissões granular
- Integração com ferramentas externas

### 3. PÚBLICO-ALVO

**Usuários Primários:**
- Pequenas e médias empresas
- Consultores independentes
- Academias e estúdios de fitness
- Clínicas médicas e odontológicas
- Empresas de serviços em geral

**Personas:**
- **Administrador:** Gerencia usuários, configurações e tem acesso total
- **Operacional:** Executa tarefas diárias, gerencia clientes e prospects
- **Visualização:** Acesso apenas para consulta de dados e relatórios

### 4. FUNCIONALIDADES PRINCIPAIS

#### 4.1 SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO
- **Login seguro** com sistema de bloqueio por tentativas
- **Gerenciamento de perfis** de usuário
- **Três níveis de permissão:** Admin, Operacional, Visualização
- **Alteração de senha** com validação de segurança
- **Sistema de convites** para novos usuários

#### 4.2 DASHBOARD PRINCIPAL
- **Visão geral** com métricas principais
- **Próximas tarefas** e lembretes
- **Gráficos e indicadores** de performance
- **Configuração por nicho** com dados específicos

#### 4.3 CRM (CUSTOMER RELATIONSHIP MANAGEMENT)
- **Pipeline visual** estilo Kanban
- **Gestão de prospects** com estágios customizáveis
- **Atividades e follow-ups** automatizados
- **Relatórios de conversão** e performance
- **Filtros avançados** por responsável, período, tags
- **Sistema de alertas** para follow-ups vencidos

#### 4.4 GESTÃO FINANCEIRA
- **Controle de receitas e despesas**
- **Tarefas financeiras** com prazos
- **Gráficos de fluxo de caixa**
- **Relatórios financeiros** exportáveis
- **Alertas de vencimento** e inadimplência
- **KPIs financeiros** em tempo real

#### 4.5 GESTÃO DE CONTRATOS
- **Cadastro completo** de contratos
- **Status tracking** (Ativo, Pendente, Cancelado, Inativo)
- **Associação com clientes**
- **Busca e filtros** avançados
- **Armazenamento de documentos**
- **Histórico de alterações**

#### 4.6 GESTÃO DE CLIENTES
- **Cadastro completo** com dados personalizados por nicho
- **Histórico de interações**
- **Documentos e anexos**
- **Transações financeiras**
- **Status de relacionamento**

#### 4.7 SUCESSO DO CLIENTE (CS)
- **Dashboard de satisfação**
- **Processo de onboarding** estruturado
- **Registro de interações**
- **Métricas de engajamento**
- **Sistema NPS** integrado
- **Alertas proativos**

#### 4.8 GESTÃO DE TAREFAS
- **Cadastro de tarefas** com prazos
- **Calendário integrado**
- **Status de conclusão**
- **Associação com clientes**
- **Lembretes automáticos**
- **Visualização em lista e calendário**

#### 4.9 CONFIGURAÇÕES E ADMINISTRAÇÃO
- **Configurações por nicho** de mercado
- **Personalização de funil de vendas**
- **Configuração de métricas**
- **Gerenciamento de usuários** (apenas admins)
- **Configurações de empresa**

### 5. ESPECIFICAÇÕES TÉCNICAS

#### 5.1 ARQUITETURA
- **Frontend:** React + TypeScript + Vite
- **UI Framework:** Tailwind CSS + Shadcn/UI
- **Backend:** Supabase (BaaS)
- **Banco de Dados:** PostgreSQL
- **Autenticação:** Supabase Auth
- **Hospedagem:** Supabase + Edge Functions

#### 5.2 RESPONSIVIDADE
- Design totalmente responsivo
- Otimizado para desktop, tablet e mobile
- Menu mobile com drawer
- Componentes adaptáveis

#### 5.3 SEGURANÇA
- Row Level Security (RLS) no banco
- Sistema de permissões granular
- Validação de entrada rigorosa
- Rate limiting para APIs
- Logs de segurança

### 6. FLUXOS DE USUÁRIO PRINCIPAIS

#### 6.1 FLUXO DE LOGIN
1. Usuário acessa a aplicação
2. Insere credenciais
3. Sistema valida e autentica
4. Redirecionamento para dashboard

#### 6.2 FLUXO DE CRM
1. Acesso ao módulo CRM
2. Visualização do pipeline
3. Adição de novos prospects
4. Movimentação entre estágios
5. Registro de atividades
6. Conversão ou perda

#### 6.3 FLUXO DE CRIAÇÃO DE USUÁRIO (ADMIN)
1. Admin acessa painel administrativo
2. Clica em "Cadastrar Usuários"  
3. Preenche dados do novo usuário
4. Define nível de permissão
5. Sistema cria usuário via Edge Function
6. Confirmação de sucesso

### 7. REQUISITOS NÃO FUNCIONAIS

#### 7.1 PERFORMANCE
- Carregamento inicial < 3 segundos
- Transições suaves entre páginas
- Lazy loading de componentes
- Cache otimizado

#### 7.2 USABILIDADE
- Interface intuitiva e limpa
- Feedback visual para todas as ações
- Tooltips e ajuda contextual
- Acessibilidade básica

#### 7.3 CONFIABILIDADE
- Uptime > 99%
- Backup automático de dados
- Recuperação de falhas
- Logs detalhados

#### 7.4 ESCALABILIDADE
- Suporte a múltiplas empresas
- Crescimento horizontal
- Otimização de queries
- CDN para assets

### 8. INTEGRAÇÕES

#### 8.1 INTEGRACÕES ATUAIS
- Supabase Auth
- Supabase Database
- Supabase Edge Functions
- Supabase Storage

#### 8.2 INTEGRAÇÕES FUTURAS
- APIs de pagamento (Stripe, PagSeguro)
- E-mail marketing (Mailchimp, SendGrid)
- WhatsApp Business API
- Google Calendar
- Zoom/Teams para videochamadas

### 9. CONFIGURAÇÕES POR NICHO

#### 9.1 FITNESS
- Campos específicos: modalidades, planos, equipamentos
- Métricas: frequência, evolução física, satisfação
- Funil: Lead → Experimental → Matriculado → Ativo

#### 9.2 CONSULTORIA
- Campos específicos: áreas de expertise, projetos
- Métricas: resultados, ROI, satisfação
- Funil: Prospecção → Proposta → Contrato → Entrega

#### 9.3 MÉDICO/ODONTOLÓGICO
- Campos específicos: especialidades, tratamentos
- Métricas: adesão, satisfação, eficácia
- Funil: Consulta → Diagnóstico → Tratamento → Acompanhamento

### 10. ROADMAP

#### 10.1 FASE 1 (ATUAL)
- ✅ Sistema de autenticação
- ✅ Dashboard básico
- ✅ CRM completo
- ✅ Gestão financeira
- ✅ Gestão de contratos
- ✅ Administração de usuários

#### 10.2 FASE 2 (PRÓXIMOS 3 MESES)
- 📋 Integrações com pagamento
- 📋 Sistema de notificações
- 📋 Mobile app
- 📋 Relatórios avançados
- 📋 API pública

#### 10.3 FASE 3 (6 MESES)
- 📋 IA para insights
- 📋 Automações avançadas
- 📋 White-label
- 📋 Marketplace de integrações

### 11. MÉTRICAS DE SUCESSO

#### 11.1 MÉTRICAS DE PRODUTO
- Taxa de adoção por módulo
- Tempo médio de sessão
- Frequência de uso
- Taxa de retenção mensal

#### 11.2 MÉTRICAS DE NEGÓCIO
- Número de empresas ativas
- Receita recorrente mensal (MRR)
- Customer Lifetime Value (CLV)
- Net Promoter Score (NPS)

### 12. RISCOS E MITIGAÇÕES

#### 12.1 RISCOS TÉCNICOS
- **Dependência do Supabase:** Mitigação através de backup strategies
- **Performance em escala:** Monitoramento contínuo e otimizações
- **Segurança de dados:** Auditorias regulares e testes de penetração

#### 12.2 RISCOS DE NEGÓCIO
- **Concorrência:** Diferenciação através de nichos específicos
- **Mudanças regulatórias:** Compliance proativo
- **Churn de clientes:** Foco em customer success

### 13. SUPORTE E DOCUMENTAÇÃO

#### 13.1 DOCUMENTAÇÃO
- Manual do usuário por módulo
- Guias de configuração por nicho
- FAQ comum
- Tutoriais em vídeo

#### 13.2 SUPORTE
- Chat interno (futuro)
- E-mail de suporte
- Base de conhecimento
- Treinamentos personalizados

---

**Documento criado em:** Dezembro 2024  
**Última atualização:** Dezembro 2024  
**Próxima revisão:** Março 2025
