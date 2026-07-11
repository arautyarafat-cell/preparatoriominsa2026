# Correções de Sessão/Autenticação

## Problema Reportado
Quando o utilizador ficava algum tempo sem usar a aplicação, ela deixava de reconhecer o banco de dados. As funcionalidades dependentes do Supabase falhavam silenciosamente, mas ao fazer logout e login novamente, tudo voltava a funcionar.

**Causa:** Expiração silenciosa do token JWT do Supabase (expira em 1 hora por padrão).

## Correções Implementadas

### 1. Frontend - Serviço de Autenticação (`services/auth.ts`)

#### Novas Funcionalidades:
- **`AUTH_EVENTS`**: Constantes para eventos customizados de autenticação
  - `SESSION_EXPIRED`: Quando a sessão expira
  - `SESSION_REFRESHED`: Quando a sessão é renovada
  - `SESSION_INVALID`: Quando a sessão é inválida (ex: device mismatch)
  - `LOGOUT`: Quando o utilizador faz logout

- **`refreshSession()` melhorado**:
  - Usa singleton pattern para evitar múltiplas chamadas simultâneas
  - Dispara eventos customizados quando a sessão expira ou é renovada
  - Logs detalhados para debugging

- **`validateSession()`**: Nova função para verificar se a sessão está válida
  - Faz request ao backend `/auth/me`
  - Tenta refresh automático se token expirado

- **`clearLocalSession()`**: Nova função para limpar sessão local sem chamar logout no servidor

- **`setupSessionManager()`**: Gestor de sessão completo
  - Refresh automático a cada 50 minutos (antes do JWT expirar em 60 min)
  - Verificação de sessão quando a página volta a ficar visível
  - Verificação de sessão quando a janela ganha foco
  - Listeners para eventos de sessão
  - Detecção de logout em outras abas via `storage` event

#### `authenticatedFetch()` melhorado:
- Verifica se há token antes de fazer request
- Dispara eventos quando sessão expira
- Logs detalhados para debugging

### 2. Frontend - Aplicação Principal (`App.tsx`)

- **Session Manager integrado**: `setupSessionManager()` é inicializado no `useEffect`
- **Handler de sessão expirada**: Redireciona para login automaticamente
- **Sincronização de estado**: Atualiza `user` quando sessão é renovada
- **Cleanup adequado**: Limpa listeners quando componente é desmontado

### 3. Frontend - Hook Auxiliar (`hooks/useAuthSession.ts`)

Hook alternativo para componentes que precisam de gestão de sessão mais granular:
- Estados de loading e erro
- Funções para refresh manual
- Integração com eventos de autenticação

### 4. Backend - Middleware de Autenticação (`backend/src/middleware/auth.js`)

#### Melhorias:
- **Códigos de erro específicos**:
  - `NO_AUTH_HEADER`: Header de autorização em falta
  - `NO_DEVICE_ID`: Device ID em falta
  - `TOKEN_EXPIRED`: Token expirado
  - `TOKEN_INVALID`: Token inválido
  - `USER_NOT_FOUND`: Utilizador não encontrado
  - `SESSION_ERROR`: Erro na validação de sessão
  - `DEVICE_MISMATCH`: Sessão ativa noutro dispositivo
  - `AUTH_ERROR`: Erro genérico de autenticação

- **Logs detalhados**: Cada falha de autenticação é registada com detalhes
- **Update de last_seen_at**: Atualiza em background sem bloquear resposta
- **`optionalAuthenticate()`**: Novo middleware para rotas que podem funcionar sem auth

## Fluxo de Funcionamento

```
1. Utilizador faz login
   ↓
2. Frontend recebe access_token e refresh_token
   ↓
3. Session Manager inicia timer de 50 minutos
   ↓
4. A cada 50 minutos OU quando página fica visível:
   - Tenta refresh do token
   - Se falhar, dispara evento SESSION_EXPIRED
   ↓
5. App.tsx reage ao evento:
   - Limpa estado do utilizador
   - Redireciona para login
   ↓
6. Utilizador faz login novamente
   - Nova sessão criada
   - Timer reiniciado
```

## Configuração Supabase

O token JWT do Supabase expira em **1 hora** por padrão. Esta configuração pode ser alterada no dashboard do Supabase em:

`Settings > Authentication > JWT expiry`

Valores recomendados:
- **3600** (1 hora) - padrão, bom para segurança
- **86400** (24 horas) - mais conveniente, menos seguro

## Testes Recomendados

1. **Teste de expiração manual**:
   - Fazer login
   - Esperar que o token expire (ou simular alterando o token no localStorage)
   - Verificar que o app redireciona para login

2. **Teste de visibilidade**:
   - Fazer login
   - Mudar para outra aba e esperar alguns minutos
   - Voltar à aba e verificar que a sessão ainda funciona

3. **Teste de multi-dispositivo**:
   - Fazer login no dispositivo A
   - Fazer login no dispositivo B com a mesma conta
   - Verificar que dispositivo A recebe erro DEVICE_MISMATCH

## Ficheiros Alterados

- `services/auth.ts` - Serviço de autenticação melhorado
- `App.tsx` - Integração do Session Manager
- `hooks/useAuthSession.ts` - Novo hook auxiliar
- `backend/src/middleware/auth.js` - Middleware melhorado
