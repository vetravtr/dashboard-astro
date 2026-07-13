# VETRA Dashboard Astro — Instruções para Agentes

## Antes de qualquer alteração, LEIA:

1. `~/VETRA/CONTEXTO_ATUAL.md` — estado atual do ecossistema
2. `~/VETRA/OBSIDIAN/HERMES_CONHECIMENTO_VETRA.md` — conhecimento consolidado
3. `~/VETRA/OBSIDIAN/Relatorio_20260713_Final.md` — último relatório completo
4. `~/VETRA_REPO/dashboard-astro/README.md` — documentação do projeto

## Regras do Comandante (NUNCA quebrar)

1. **NUNCA fazer deploy sem autorização explícita do Comandante**
2. **Sempre testar LOCAL primeiro** (`http://localhost:4323`)
3. **Sempre fazer backup antes de alterar** (`~/VETRA_CORE/backups/dashboard/`)
4. **NUNCA colocar secrets no código** — usar `.env` local, env vars na Vercel
5. **NUNCA fazer push especulativo** — se não tem certeza, pergunte primeiro

## Arquitetura

- **Astro 5 + React 19** (via `@astrojs/react`)
- **WalletConnect**: componente React `WalletConnectDash.jsx` com `client:only="react"`
- **Autenticação**: via tabela `dashboard_users` (NÃO Supabase Auth) com RLS + publishable key
- **APIs serverless**: em `src/pages/api/` (processadas pelo Astro)
- **Deploy**: Vercel (auto-deploy via GitHub push)

## Endpoints API

| Rota | Função | Método |
|------|--------|--------|
| `/api/auth` | Login/cadastro | POST |
| `/api/send-code` | Enviar código de verificação | POST |
| `/api/verify` | Validar código de verificação | POST |
| `/api/otc` | Registrar intenção OTC | POST |
| `/api/buyback` | Registrar/consultar buyback | POST/GET |
| `/api/blog` | Listar posts do blog | GET |
| `/api/lastro` | Dados de lastro | GET |
| `/api/nft-sold` | Total NFTs vendidos | GET |
| `/api/balances` | Saldo VTR/USDC via RPC | POST |

## Chaves e Secrets

- **Publishable key**: `sb_publishable_Je35tOpdxZdXWjXC8E-Sqw_Dboyt0ei` (pode ficar no frontend)
- **Service key**: `QfvT+dDMQqloq4ztvVIfhobF8rYWbmE4O/uA3AMAKUBRkBtAYgSQChOdxj+StEyAnkxwZvGG5F57v+wZ0qHQ1A==` (só no `.env` e Vercel)
- **SMTP_PASS**: `uups wijr tdyy tgij` (senha de app Gmail do vetraquant@gmail.com)

## Fluxo de Login (usar Supabase Auth)

1. Cadastro: `POST /auth/v1/signup` (publishable key) → Supabase envia email de confirmação
2. Salvar também em `dashboard_users` via REST para consulta futura
3. Login: buscar em `dashboard_users?email=eq.X` e comparar hash

## Serverless Functions

**NÃO funcionam online na Vercel** (FUNCTION_INVOCATION_FAILED).
- `/api/send-code`: só enviar email (não salvar no banco)
- `/api/auth`: NÃO usar — fazer auth direto do frontend com publishable key

## Problema Conhecido: Chave Service Key

A service key `QfvT+...` (novo formato Supabase) **NÃO funciona via REST** (`fetch` direto).
Só funciona com `@supabase/supabase-js` em backend Node.js.
Para operações no Supabase via frontend, usar **sempre publishable key + RLS**.

## Problemas Conhecidos e Soluções

| Problema | Solução |
|----------|---------|
| React client:only não hidrata | Usar script `is:inline` sem React para WalletConnect |
| QR Code não abre | Instalar `@walletconnect/modal@^2.6.2` |
| CORS no Supabase | Políticas RLS na tabela (Allow all) |
| Chave service_key bloqueada no GitHub | Colocar no `.env` e configurar env vars na Vercel |
