# 🚀 GUIA DE DEPLOY - Angola Saúde 2026

## 📋 PRÉ-REQUISITOS

Antes de fazer deploy, certifique-se que:

- ✅ Node.js 18+ instalado
- ✅ Conta Supabase com projeto criado
- ✅ Conta no serviço de hosting (Render/Railway para backend, Vercel para frontend)
- ✅ Auditoria de segurança concluída (ver `SECURITY_AUDIT.md`)

---

## 🛡️ CHECKLIST DE SEGURANÇA (OBRIGATÓRIO)

### Antes do Deploy:

- [x] **RLS ativado em todas as tabelas** ✅ (migration aplicada)
- [x] **Políticas RLS seguras criadas** ✅ (utilizadores só acedem aos seus dados)
- [x] **Rate limiting implementado** ✅ (middleware de segurança)
- [x] **Endpoints admin protegidos** ✅ (requireAdmin middleware)
- [ ] **Regenerar chaves expostas** ⚠️ (Ver secção abaixo)
- [ ] **Verificar .gitignore** ✅
- [ ] **Ativar Leaked Password Protection** no Supabase Dashboard
- [ ] **Configurar variáveis de ambiente** nos serviços de hosting

### ⚠️ AÇÃO CRÍTICA: Regenerar Chaves

As seguintes chaves foram expostas durante o desenvolvimento e **DEVEM ser regeneradas**:

1. **Supabase Service Role Key**
   - Ir a: Supabase Dashboard > Settings > API > Service Role Key
   - Clicar em "Regenerate"
   - Atualizar em todos os ambientes

2. **OpenRouter API Key** 
   - Ir a: https://openrouter.ai/keys
   - Revogar chave atual e criar nova
   
3. **VoiceRSS API Key**
   - Ir a: http://www.voicerss.org/
   - Regenerar chave na conta

---

## 🖥️ DEPLOY DO BACKEND (Render/Railway)

### Opção A: Render.com

1. **Criar conta e novo Web Service**
   - Conectar repositório GitHub
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Configurar Variáveis de Ambiente**
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=https://rgnzrcuredtbwcnnimta.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<nova-chave-regenerada>
   OPENROUTER_API_KEY=<nova-chave-regenerada>
   AI_MODEL=google/gemini-2.0-flash-exp:free
   VOICERSS_API_KEY=<nova-chave-regenerada>
   ADMIN_EMAILS=admin@angolasaude.ao
   FRONTEND_URL=https://seu-frontend.vercel.app
   ALLOWED_ORIGINS=https://seu-frontend.vercel.app
   ```

3. **Deploy**
   - O deploy é automático após push para o branch principal

### Opção B: Railway.app

1. Criar projeto e conectar repo
2. Configurar variáveis como acima
3. Deploy automático

---

## 🌐 DEPLOY DO FRONTEND (Vercel)

1. **Criar conta Vercel e importar projeto**
   - Conectar repositório GitHub
   - Framework Preset: Vite
   - Root Directory: `/` (raiz)

2. **Configurar Variáveis de Ambiente**
   ```
   VITE_API_URL=https://seu-backend.onrender.com
   ```

3. **Deploy**
   - Automático após push

---

## 📦 DEPLOY SUPABASE

O Supabase já está configurado. Certifique-se de:

1. **Verificar RLS**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
   Todas as tabelas devem ter `rowsecurity = true`

2. **Ativar Leaked Password Protection**
   - Dashboard > Authentication > Providers > Email
   - Ativar "Leaked password protection"

3. **Configurar Storage Policies**
   - Storage > proofs > Policies
   - Adicionar política de upload apenas para authenticated

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### 1. Testar Endpoints Protegidos

```bash
# Deve retornar 401 (não autorizado)
curl https://seu-backend.onrender.com/users

# Deve retornar 429 após muitos requests (rate limiting)
for i in {1..150}; do curl -s https://seu-backend.onrender.com/ > /dev/null; done
```

### 2. Testar RLS

```bash
# Deve retornar array vazio ou erro (não dados de outros users)
curl -X GET "https://rgnzrcuredtbwcnnimta.supabase.co/rest/v1/user_profiles" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Authorization: Bearer TOKEN_DE_OUTRO_USER"
```

### 3. Testar CORS

```bash
# Deve falhar se origem não permitida
curl -H "Origin: https://site-malicioso.com" \
  https://seu-backend.onrender.com/users
```

---

## 🔄 MANUTENÇÃO

### Monitorização

1. **Logs do Backend** - Render/Railway Dashboard
2. **Logs do Supabase** - Dashboard > Logs
3. **Alertas** - Configurar notificações de erro

### Atualizações de Segurança

1. Executar `npm audit` regularmente
2. Atualizar dependências com vulnerabilidades
3. Revisar logs de autenticação semanalmente

---

## 📞 SUPORTE

Em caso de problemas de segurança, contactar imediatamente:
- Email: security@angolasaude.ao
- Telefone: +244 XXX XXX XXX

---

**Última atualização:** 19 de Janeiro de 2026
