# Integração Cakto - Sistema de Pagamentos

## Visão Geral

Este documento descreve a integração completa com o sistema de pagamentos Cakto, incluindo checkout hospedado e processamento de webhooks para ativação automática de assinaturas.

## Componentes da Integração

### 1. Edge Function - Webhook Handler
**Arquivo**: `supabase/functions/cakto-webhook/index.ts`

Processa eventos do Cakto e atualiza o banco de dados automaticamente:

- **pix_gerado**: Cria registro em payments com status "pending"
- **purchase_approved**: Ativa assinatura e cria/atualiza registro em subscriptions
- **purchase_refused**: Registra pagamento recusado
- **refund/chargeback**: Suspende assinatura
- **subscription_canceled**: Cancela assinatura

**Funcionalidades**:
- ✅ Verificação de assinatura do webhook via `CAKTO_WEBHOOK_SECRET`
- ✅ Idempotência (ignora eventos duplicados)
- ✅ Logs seguros (não expõe dados sensíveis)
- ✅ Mapeamento automático empresa_id → subscription

### 2. Componente de Checkout
**Arquivo**: `src/components/subscription/CaktoCheckout.tsx`

Interface para seleção de planos e redirecionamento para checkout:

- Exibe planos disponíveis (Básico R$ 75,00 / Premium R$ 150,00)
- Gera URL do checkout com parâmetros corretos
- Redireciona para checkout hospedado da Cakto

### 3. Páginas de Retorno
- **Success**: `src/pages/SubscriptionSuccess.tsx` - Confirma pagamento
- **Cancel**: `src/pages/SubscriptionCancel.tsx` - Pagamento cancelado
- **Subscription**: `src/pages/Subscription.tsx` - Gerencia assinatura

### 4. Hook de Assinatura Atualizado
**Arquivo**: `src/hooks/useSubscription.ts`

Gerencia status da assinatura com suporte a:
- Trial ativo/expirado
- Assinatura ativa com período atual
- Estados de upgrade necessário

## Configuração de Ambiente

### Secrets Requeridos
1. **CAKTO_WEBHOOK_SECRET**: Token de verificação do webhook
2. **CAKTO_CHECKOUT_BASE_URL**: URL base do checkout (ex: `https://checkout.cakto.com.br`)

### Rotas Configuradas
- `/subscription` - Página de planos
- `/subscription/success` - Retorno de sucesso
- `/subscription/cancel` - Retorno de cancelamento

## Fluxo de Pagamento

### 1. Seleção de Plano
```
Usuário acessa /subscription → Escolhe plano → Clica "Assine já"
```

### 2. Checkout Cakto
```
URL gerada: https://checkout.cakto.com.br?planId=basic&empresaId=xyz&email=user@example.com
```

### 3. Processamento via Webhook
```
Cakto envia evento → Edge function processa → Atualiza banco → Sistema ativado
```

## Estrutura do Banco de Dados

### Tabela `subscriptions`
- `cakto_customer_id` (text): ID do cliente na Cakto
- `cakto_subscription_id` (text): ID da assinatura na Cakto
- `status`: trial | active | suspended | cancelled
- `current_period_start/end`: Período ativo atual

### Tabela `payments`
- `external_event_id`: ID único do evento Cakto (para idempotência)
- `amount_cents`: Valor em centavos
- `method`: pix | credit_card | boleto
- `status`: pending | approved | refused | refunded

## Exemplo de Evento Webhook

```json
{
  "type": "purchase_approved",
  "id": "evt_123456789",
  "data": {
    "subscription_id": "sub_123",
    "customer_email": "cliente@empresa.com",
    "amount_cents": 7500,
    "currency": "BRL",
    "payment_method": "pix",
    "metadata": {
      "empresa_id": "empresa-uuid-here"
    }
  }
}
```

## Testes Automatizados

**Arquivo**: `src/test/cakto-integration.test.ts`

Cobertura de testes:
- ✅ Processamento de eventos purchase_approved
- ✅ Idempotência para eventos duplicados
- ✅ Cancelamento de assinatura
- ✅ Processamento de refunds
- ✅ Cálculo de status de trial
- ✅ Geração de URLs de checkout

## Segurança

### RLS Policies
- `payments`: Apenas service role pode INSERT/UPDATE
- `subscriptions`: Usuários podem READ da própria empresa
- Webhook function bypasses RLS usando service role key

### Validações
- Verificação de assinatura do webhook
- Sanitização de dados de entrada
- Logs seguros (sem exposição de secrets)

## Monitoramento

### Logs Importantes
```
Cakto webhook received: { event: "purchase_approved", external_event_id: "evt_123", empresa_id: "uuid" }
Subscription activated for empresa: uuid
Event already processed, skipping: evt_123
```

### Métricas Sugeridas
- Taxa de conversão trial → pagante
- Eventos de webhook processados
- Falhas de processamento
- Tempo de ativação pós-pagamento

## Troubleshooting

### Problemas Comuns

1. **Webhook não processa eventos**
   - Verificar `CAKTO_WEBHOOK_SECRET`
   - Conferir logs da edge function
   - Validar formato do evento

2. **Assinatura não ativa após pagamento**
   - Verificar se `empresa_id` está no metadata
   - Conferir RLS policies das tabelas
   - Validar webhook signature

3. **Checkout não funciona**
   - Verificar `CAKTO_CHECKOUT_BASE_URL`
   - Conferir parâmetros da URL gerada
   - Validar redirecionamento de retorno

### URLs de Monitoramento
- Edge Function Logs: https://supabase.com/dashboard/project/hfqzbljiwkrksmjyfdiy/functions/cakto-webhook/logs
- Webhook Configuration: https://supabase.com/dashboard/project/hfqzbljiwkrksmjyfdiy/settings/functions

## Próximos Passos

1. Configurar webhook URL no painel da Cakto
2. Testar fluxo completo em ambiente de staging
3. Implementar métricas de conversão
4. Adicionar notificações de falha via email/slack