# 🚀 CHECKLIST DE DEPLOY PARA PRODUÇÃO

## Angola Saúde 2026 - Frontend (Vercel) + Backend (Render)

---

## 📋 PRÉ-DEPLOY CHECKLIST

### 1. Segurança - Chaves de API

- [ ] **Regenerar Supabase Service Role Key**
  - Dashboard > Settings > API > Service Role Key > Regenerate
  
- [ ] **Regenerar OpenRouter API Key**
  - https://openrouter.ai/keys > Revogar antiga > Criar nova
  
- [ ] **Regenerar VoiceRSS API Key** (se usar TTS)
  - http://www.voicerss.org/ > Account > New Key

### 2. Supabase - Segurança do Banco

- [ ] **Verificar RLS em todas as tabelas**
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```
  
- [ ] **Ativar Leaked Password Protection**
  - Authentication > Providers > Email > Enable

- [ ] **Configurar Storage Policies**
  - Storage > proofs > Policies > Authenticated only

### 3. Código - Verificações

- [ ] **Sem chaves hardcoded no código**
  ```bash
  grep -r "sk-" . --include="*.js" --include="*.ts" --include="*.tsx"
  grep -r "eyJ" . --include="*.js" --include="*.ts" --include="*.tsx"
  ```

- [ ] **Verificar .gitignore**
  - .env, .env.local, .env.production não devem ser commitados

- [ ] **Build sem erros**
  ```bash
  # Frontend
  npm run build
  
  # Backend
  cd backend && npm ci --omit=dev
  ```

---

## 🖥️ DEPLOY BACKEND (Render)

### 1. Criar Web Service no Render

1. Dashboard > New > Web Service
2. Conectar repositório GitHub
3. Configurar:
   - **Name:** angola-saude-backend
   - **Root Directory:** backend
   - **Runtime:** Node
   - **Build Command:** npm ci --omit=dev
   - **Start Command:** npm start

### 2. Variáveis de Ambiente (Render Dashboard)

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| NODE_ENV | production | ✅ |
| PORT | 10000 | ✅ |
| SUPABASE_URL | https://xxx.supabase.co | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | (chave regenerada) | ✅ |
| FRONTEND_URL | https://xxx.vercel.app | ✅ |
| ALLOWED_ORIGINS | https://xxx.vercel.app | ✅ |
| OPENROUTER_API_KEY | (chave) | (para IA) |
| VOICERSS_API_KEY | (chave) | (para TTS) |
| ADMIN_EMAILS | admin@email.com | (para admin) |
| AI_MODEL | google/gemini-2.0-flash-exp:free | (modelo IA) |

### 3. Verificar Deploy

```bash
# Health check
curl https://seu-backend.onrender.com/

# Deve retornar:
# {"status":"ok","message":"Angola Health Prep Backend API",...}
```

---

## 🌐 DEPLOY FRONTEND (Vercel)

### 1. Importar Projeto

1. Vercel Dashboard > Add New > Project
2. Import repositório GitHub
3. Configurar:
   - **Framework Preset:** Vite
   - **Root Directory:** ./ (raiz)
   - **Build Command:** npm run build
   - **Output Directory:** dist

### 2. Variáveis de Ambiente (Vercel Dashboard)

| Variável | Valor |
|----------|-------|
| VITE_API_URL | https://seu-backend.onrender.com |

### 3. Configurar Settings

- **Build Command:** npm run build
- **Output Directory:** dist

---

## ✅ PÓS-DEPLOY VERIFICAÇÕES

### 1. Testar Autenticação

- [ ] Registro de novo usuário
- [ ] Login
- [ ] Logout
- [ ] Forget password

### 2. Testar Rate Limiting

```bash
# Fazer 15+ requests de login rapidamente
# Deve retornar 429 após 10 tentativas
for i in {1..15}; do
  curl -X POST https://backend.onrender.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### 3. Testar CORS

```bash
# Deve falhar (origem não permitida)
curl -H "Origin: https://evil-site.com" \
  https://backend.onrender.com/users
```

### 4. Testar Headers de Segurança

```bash
curl -I https://frontend.vercel.app | grep -E "(X-Frame|X-Content|Strict-Transport)"
```

### 5. Testar Funcionalidades

- [ ] Quiz funciona
- [ ] Flashcards carregam
- [ ] Upload de comprovante funciona
- [ ] TTS funciona (se ativo)
- [ ] Área admin acessível (para admins)

---

## 🔄 MANUTENÇÃO CONTÍNUA

### Semanal

- [ ] Verificar logs de erro no Render
- [ ] Verificar logs de autenticação no Supabase
- [ ] Verificar uso de rate limiting

### Mensal

- [ ] Atualizar dependências (`npm audit`)
- [ ] Revisar políticas RLS
- [ ] Verificar custos de IA/TTS

### Em Caso de Incidente

1. **Se chave exposta:** Regenerar IMEDIATAMENTE
2. **Se ataque DDoS:** Aumentar rate limiting
3. **Se breach:** Revogar todos os tokens, forçar reset de senhas

---

## 📞 CONTATOS DE EMERGÊNCIA

- **Supabase Status:** https://status.supabase.com
- **Render Status:** https://render-status.com
- **Vercel Status:** https://www.vercel-status.com

---

**Última atualização:** 20 de Janeiro de 2026
