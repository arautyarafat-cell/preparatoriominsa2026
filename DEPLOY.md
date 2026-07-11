# 🚀 GUIA DE DEPLOY - Angola Saúde 2026

## 📋 Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL (Frontend)                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React + Vite App                                     │   │
│  │  - Headers de segurança (CSP, HSTS, X-Frame-Options) │   │
│  │  - Cache otimizado para assets estáticos             │   │
│  │  - Build minificado sem console.logs                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│                    VITE_API_URL                              │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTPS + CORS
┌────────────────────────────┼────────────────────────────────┐
│                            ▼                                 │
│                    RENDER (Backend)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Fastify API                                          │   │
│  │  - trustProxy ativo (processa X-Forwarded-For)       │   │
│  │  - Rate limiting por IP real                          │   │
│  │  - CORS restritivo                                    │   │
│  │  - Headers de segurança                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│                    SUPABASE_URL                              │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                            ▼                                 │
│                      SUPABASE                                │
│  - PostgreSQL com RLS                                        │
│  - Auth (autenticação)                                       │
│  - Storage (ficheiros)                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 PRÉ-REQUISITOS

Antes de fazer deploy, certifique-se que:

- ✅ Node.js 18+ instalado
- ✅ Conta Supabase com projeto criado
- ✅ Conta Render.com (backend)
- ✅ Conta Vercel (frontend)
- ✅ Repositório Git configurado

---

## 🛡️ CHECKLIST DE SEGURANÇA (OBRIGATÓRIO)

### Antes do Deploy:

- [x] **RLS ativado em todas as tabelas** ✅
- [x] **Políticas RLS seguras criadas** ✅
- [x] **Rate limiting implementado** ✅ (seguro para reverse proxies)
- [x] **Endpoints admin protegidos** ✅
- [ ] **Regenerar chaves expostas** ⚠️ (Ver secção abaixo)
- [x] **Verificar .gitignore** ✅
- [ ] **Ativar Leaked Password Protection** no Supabase Dashboard
- [ ] **Configurar variáveis de ambiente** nos serviços de hosting

### ⚠️ AÇÃO CRÍTICA: Regenerar Chaves

As seguintes chaves DEVEM ser regeneradas antes do deploy:

1. **Supabase Service Role Key**
   - Dashboard > Settings > API > Service Role Key > Regenerate

2. **OpenRouter API Key** 
   - https://openrouter.ai/keys > Revogar antiga > Criar nova
   
3. **VoiceRSS API Key** (se usar TTS)
   - http://www.voicerss.org/ > Account > Regenerar

---

## 🖥️ DEPLOY DO BACKEND (Render.com)

### Passo 1: Criar Web Service

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **New** > **Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `angola-saude-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm ci --omit=dev`
   - **Start Command:** `npm start`

### Passo 2: Configurar Variáveis de Ambiente

No Render Dashboard > Environment, adicione:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Ativa modo produção |
| `PORT` | `10000` | Porta padrão do Render |
| `SUPABASE_URL` | `https://xxx.supabase.co` | URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Chave regenerada |
| `FRONTEND_URL` | `https://xxx.vercel.app` | URL do frontend |
| `ALLOWED_ORIGINS` | `https://xxx.vercel.app` | Origens permitidas |
| `OPENROUTER_API_KEY` | `sk-or-...` | Chave de IA |
| `AI_MODEL` | `google/gemini-2.0-flash-exp:free` | Modelo IA |
| `VOICERSS_API_KEY` | `xxx` | Chave TTS (opcional) |
| `ADMIN_EMAILS` | `admin@email.com` | Emails de admins |

### Passo 3: Deploy

- O deploy é automático após push para o branch principal
- Verifique os logs no Dashboard

### Passo 4: Verificar

```bash
# Health check básico
curl https://preparatoriominsa2026.onrender.com/

# Deve retornar:
# {"status":"ok","message":"Angola Health Prep Backend API","version":"1.0.0","environment":"production"}

# Health check completo (com status do banco de dados)
curl https://preparatoriominsa2026.onrender.com/health

# Ping rápido
curl https://preparatoriominsa2026.onrender.com/health/ping
```

---

## 🌐 DEPLOY DO FRONTEND (Vercel)

### Passo 1: Importar Projeto

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **Add New** > **Project**
3. Importe seu repositório GitHub
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `/` (raiz)

### Passo 2: Configurar Variáveis de Ambiente

No Vercel Dashboard > Settings > Environment Variables:

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://seu-backend.onrender.com` |

### Passo 3: Deploy

- O deploy é automático após push
- Verifique o preview URL

---

## 🔒 DETALHES DE SEGURANÇA

### Rate Limiting Configurado

O rate limiting está configurado para funcionar atrás de reverse proxies:

| Tipo | Limite | Janela |
|------|--------|--------|
| **Geral** | 100 req | 15 min |
| **Autenticação** | 10 req | 15 min |
| **IA** | 30 req | 1 hora |
| **Admin** | 50 req | 15 min |
| **Upload** | 20 req | 1 hora |

### Headers de Segurança (Frontend)

O `vercel.json` inclui:
- `Strict-Transport-Security` (HSTS com preload)
- `Content-Security-Policy` (CSP restritivo)
- `X-Frame-Options: DENY` (anti-clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restringe APIs sensíveis)

### TrustProxy (Backend)

O Fastify está configurado com `trustProxy: true` em produção, permitindo:
- Obter IP real do cliente via `X-Forwarded-For`
- Protocolo correto (`https`) via `X-Forwarded-Proto`
- Rate limiting baseado no IP real, não no IP do proxy

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### 1. Testar Rate Limiting

```bash
# Fazer 15+ requests de login - deve bloquear após 10
for i in {1..15}; do
  curl -s -X POST https://backend.onrender.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' | jq .
done
```

### 2. Testar CORS

```bash
# Deve falhar (origem não permitida)
curl -H "Origin: https://evil-site.com" \
  https://backend.onrender.com/users
```

### 3. Testar Headers de Segurança

```bash
curl -I https://frontend.vercel.app | grep -E "(X-Frame|X-Content|Strict-Transport|Content-Security)"
```

### 4. Testar Funcionalidades

- [ ] Login/Registro funcionam
- [ ] Quiz carrega perguntas
- [ ] Flashcards funcionam
- [ ] Upload de comprovante funciona
- [ ] Área admin acessível (para admins)

---

## 🔍 MONITORAMENTO (Cron-Job.org / Keep-Alive)

### Health Check Endpoints

O backend possui endpoints dedicados para monitoramento de disponibilidade:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check completo (API + Banco) |
| `/health` | HEAD | Versão sem body (economia de bandwidth) |
| `/health/ping` | GET | Ping simples - resposta instantânea |

### Resposta do `/health`:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T12:00:00.000Z",
  "uptime": 3600.5,
  "api": {
    "status": "ok",
    "version": "1.0.0"
  },
  "database": {
    "status": "connected",
    "latency_ms": 150
  }
}
```

### Resposta do `/health/ping`:

```json
{
  "pong": true,
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

### Configurar Cron-Job.org (Evitar Sleep do Render)

O plano gratuito do Render entra em sleep após 15 minutos de inatividade. Para evitar isso:

1. Acesse [Cron-Job.org](https://cron-job.org)
2. Crie uma conta gratuita
3. Clique em **Create cronjob**
4. Configure:
   - **Title:** Angola Saúde Keep-Alive
   - **URL:** `https://preparatoriominsa2026.onrender.com/health/ping`
   - **Schedule:** Every 5 minutes (`*/5 * * * *`)
   - **Request Method:** GET
   - **Request Timeout:** 30 seconds
5. Clique em **Create**

### URLs de Monitoramento:

```
# Ping rápido (recomendado)
https://preparatoriominsa2026.onrender.com/health/ping

# Health check completo
https://preparatoriominsa2026.onrender.com/health
```

---

## �🔄 MANUTENÇÃO

### Monitoramento

1. **Logs do Backend** - Render Dashboard > Logs
2. **Logs do Supabase** - Dashboard > Logs
3. **Métricas** - Render Dashboard > Metrics

### Atualizações de Segurança

```bash
# Backend
cd backend
npm audit
npm audit fix

# Frontend
npm audit
npm audit fix
```

### Em Caso de Incidente

1. **Chave exposta:** Regenerar IMEDIATAMENTE
2. **Ataque DDoS:** Aumentar rate limiting
3. **Breach:** Revogar todos os tokens, forçar reset de senhas

---

## 📞 SUPORTE

Em caso de problemas de segurança:
- Email: security@angolasaude.ao
- Status pages:
  - https://status.supabase.com
  - https://render-status.com
  - https://www.vercel-status.com

---

**Última atualização:** 21 de Janeiro de 2026
