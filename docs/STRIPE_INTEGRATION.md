# Integração Stripe - Sistema de Assinaturas

## Visão Geral

Este documento descreve a integração completa com Stripe para gerenciamento de assinaturas mensais. O sistema foi migrado do Cakto/Asaas para usar exclusivamente o Stripe como gateway de pagamento.

## Configuração de Ambiente

### Secrets Obrigatórias (Supabase)

As seguintes secrets devem ser configuradas no Supabase:

```
STRIPE_SECRET_KEY=sk_test_... (Preview) / sk_live_... (Production)
STRIPE_WEBHOOK_SECRET=whsec_... (endpoint secret do webhook)
```

### Configuração do Produto Stripe

- **Produto**: Plano Starter
- **Preço**: R$ 87,00/mês (8700 centavos)
- **Price ID**: `price_1S6kx5Qy6q48BwIEjS7WXL6u`
- **Moeda**: BRL (Real Brasileiro)
- **Tipo**: Assinatura recorrente mensal

## Arquitetura

### Edge Functions

#### 1. `stripe-webhook`
- **Rota**: `POST /functions/v1/stripe-webhook`
- **Autenticação**: Desabilitada (`verify_jwt = false`)
- **Função**: Processa webhooks do Stripe

**Eventos Processados:**
- `checkout.session.completed`: Registra pagamento inicial
- `invoice.payment_succeeded`: Ativa assinatura e usuários
- `invoice.payment_failed`: Registra falha no pagamento
- `customer.subscription.updated/created`: Atualiza dados da assinatura
- `customer.subscription.deleted`: Cancela assinatura
- `charge.refunded`: Processa reembolsos e suspende assinatura

#### 2. `create-stripe-checkout`
- **Rota**: `POST /functions/v1/create-stripe-checkout`
- **Autenticação**: Habilitada (`verify_jwt = true`)
- **Função**: Cria sessão de checkout do Stripe

#### 3. `check-stripe-subscription`
- **Rota**: `POST /functions/v1/check-stripe-subscription`
- **Autenticação**: Habilitada (`verify_jwt = true`)
- **Função**: Verifica status da assinatura no Stripe

### Fluxo de Pagamento

1. **Seleção do Plano**: Usuário clica em "Assinar Agora"
2. **Criação do Checkout**: Chamada para `create-stripe-checkout`
3. **Redirecionamento**: Usuário é direcionado para o Stripe Checkout
4. **Processamento**: Stripe processa o pagamento
5. **Webhook**: Stripe envia eventos para `stripe-webhook`
6. **Ativação**: Sistema atualiza status e ativa usuários

### URLs de Retorno

- **Sucesso**: `/subscription/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancelamento**: `/subscription/cancel`

## Estrutura do Banco de Dados

### Tabela `subscriptions`
- Mantém a estrutura existente
- Status possíveis: `trial`, `active`, `suspended`, `cancelled`
- Campos importantes:
  - `current_period_start`: Início do período atual
  - `current_period_end`: Fim do período atual
  - `is_recurring`: Sempre `true` para assinaturas Stripe

### Tabela `payments`
- `external_event_id`: ID do evento Stripe
- `status`: `approved`, `refused`, `refunded`
- `amount_cents`: Valor em centavos
- `method`: Método de pagamento
- `raw`: Dados completos do evento Stripe

### Tabela `perfis`
- `ativo`: Campo atualizado automaticamente via webhook
- Ativado quando `invoice.payment_succeeded` é processado

## Segurança

### Validação de Webhook
- Verificação de assinatura usando `STRIPE_WEBHOOK_SECRET`
- Validação da origem dos eventos

### Idempotência
- Verificação de `external_event_id` antes do processamento
- Evita processamento duplicado de eventos

### RLS (Row Level Security)
- Mantidas as políticas existentes
- Usuários podem visualizar apenas dados da própria empresa
- Writes ocorrem via Edge Functions com service role

## Monitoramento

### Logs Importantes
- Todos os eventos Stripe são logados com detalhes
- Erros de processamento são registrados
- Status de ativação de usuários é monitorado

### Métricas Sugeridas
- Taxa de conversão de checkout
- Falhas de pagamento
- Cancelamentos de assinatura
- Tempo de ativação pós-pagamento

## Interface do Usuário

### Página de Assinatura
- Exibe apenas o "Plano Starter" por R$ 87,00/mês
- Botão "Assinar Agora" inicia o checkout
- Status da assinatura atual é exibido

### Páginas de Retorno
- `/subscription/success`: Confirmação de pagamento
- `/subscription/cancel`: Informação sobre cancelamento

## Testes

### Testes Automatizados
Execute os testes com:

```bash
npm test src/test/stripe-integration.test.ts
```

**Cobertura dos Testes:**
- Criação de sessão de checkout
- Processamento de webhooks
- Idempotência de eventos
- Fluxo de status de assinatura
- Configuração de preços

## Troubleshooting

### Problemas Comuns

1. **Webhook não está sendo processado**
   - Verifique se `STRIPE_WEBHOOK_SECRET` está configurada
   - Confirme se o endpoint está configurado no Stripe Dashboard

2. **Assinatura não ativa após pagamento**
   - Verifique logs da função `stripe-webhook`
   - Confirme se `invoice.payment_succeeded` foi recebido

3. **Erro no checkout**
   - Verifique se `STRIPE_SECRET_KEY` está configurada
   - Confirme se o Price ID está correto

### Links Úteis

- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Webhook Logs**: Stripe Dashboard → Developers → Webhooks
- **Edge Function Logs**: Supabase Dashboard → Edge Functions

## Migração de Sistemas Legados

### Remoção Completa
- ✅ Função `cakto-webhook` removida
- ✅ Todas as secrets `CAKTO_*` e `ASAAS_*` removidas
- ✅ Código e utilities legadas removidas
- ✅ Referências a sistemas antigos eliminadas

### Dados Preservados
- Mantidos todos os dados históricos em `payments` e `subscriptions`
- Perfis de usuário preservados
- Estrutura do banco de dados mantida

## Suporte

Para questões técnicas relacionadas à integração Stripe:
1. Consulte os logs das Edge Functions
2. Verifique o Stripe Dashboard para eventos
3. Use os testes automatizados para validar funcionamento