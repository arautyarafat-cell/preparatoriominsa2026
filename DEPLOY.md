# 🚀 Guia de Deploy Gratuito: Vercel + Render

Este projeto está configurado para ser publicado gratuitamente usando:
- **Frontend**: Vercel
- **Backend**: Render

---

## 🏗️ Passo 1: Subir código para o GitHub

Antes de fazer o deploy, você precisa ter o código em um repositório GitHub.

1. Crie um novo repositório no GitHub (ex: `angola-saude-app`).
2. No terminal do VS Code, execute:
   ```bash
   git init
   git add .
   git commit -m "Deploy inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

---

## 🛠️ Passo 2: Deploy do Backend (Render)

O Render vai hospedar a API Node.js gratuitamente.

1. Acesse **[dashboard.render.com](https://dashboard.render.com/)** e faça login com GitHub.
2. Clique em **New +** -> **Web Service**.
3. Selecione seu repositório do GitHub.
4. Preencha os campos (a maioria já será detectada pelo `render.yaml`):
   - **Name**: `angola-saude-backend`
   - **Root Directory**: `backend` (IMPORTANTE: escreva `backend` aqui!)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. **Environment Variables**:
   Adicione as variáveis do seu arquivo `backend/.env` manualmente:
   - `SUPABASE_URL`: (copie do seu .env)
   - `SUPABASE_SERVICE_ROLE_KEY`: (copie do seu .env)
   - `OPENROUTER_API_KEY`: (copie do seu .env)
   - `AI_MODEL`: `mistralai/devstral-2512:free`
   - `VOICERSS_API_KEY`: (copie do seu .env)

6. Clique em **Create Web Service**.
7. Aguarde o deploy finalizar. O Render vai gerar uma URL (ex: `https://angola-saude-backend.onrender.com`).
   **Copie essa URL**, você vai precisar dela no Passo 3.

---

## 🌐 Passo 3: Deploy do Frontend (Vercel)

A Vercel vai hospedar o site React.

1. Acesse **[vercel.com](https://vercel.com/)** e faça login com GitHub.
2. Clique em **Add New...** -> **Project**.
3. Importe o repositório do GitHub.
4. Em **Build and Output Settings**, verifique:
   - **Framework Preset**: Vite (deve ser automático)
   - **Output Directory**: `dist`

5. Em **Environment Variables**, adicione:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: A URL do seu backend no Render (ex: `https://angola-saude-backend.onrender.com`) - **SEM A BARRA NO FINAL**

6. Clique em **Deploy**.

---

## ✅ Pronto!

Seu app estará no ar!
- Acesse a URL que a Vercel gerar (ex: `https://angola-saude-app.vercel.app`).
- O frontend vai se conectar automaticamente ao backend no Render.
- O banco de dados (Supabase) continua o mesmo.

### ⚠️ Observação sobre o plano gratuito do Render:
O serviço entra em "suspensão" após 15 minutos de inatividade. O primeiro acesso pode demorar cerca de 50 segundos para "acordar" o servidor. Isso é normal no plano gratuito.
