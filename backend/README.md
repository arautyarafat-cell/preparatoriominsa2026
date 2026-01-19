# Angola Saúde Prep Backend

Backend Node.js para o sistema de preparação de concursos.

## Pré-requisitos
- Node.js 18+
- Supabase Project
- OpenAI API Key

## Instalação

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o ambiente:
   - Copie `.env.example` para `.env`
   - Preencha `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY`

3. O Banco de dados (Supabase) deve ter a extensão `vector` e as tabelas criadas (já configurado via script).

## Scripts

- Iniciar servidor:
  ```bash
  node server.js
  ```
  O servidor rodará em `http://localhost:3000`.

## Endpoints

- `POST /upload`: Upload de conteúdo simples (texto) para RAG.
- `POST /generate/quiz`: Gera quiz baseado em tópico.
- `POST /generate/flashcards`: Gera flashcards.
- `POST /generate/game`: Gera caso clínico.
- `POST /correct`: Corrige resposta do usuário.
- `POST /sync`: Sincroniza dados offline.

## Estrutura

- `src/services/rag.js`: Lógica principal de embeddings e busca.
- `src/lib/`: Clientes externos (Supabase, OpenAI).
- `src/routes/`: Definição dos endpoints.
