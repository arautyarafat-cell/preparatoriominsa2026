# Sistema de Aulas Digitais - Angola Saude 2026
## Documentacao Completa para Preparacao de Concursos

---

# BLOCO 1 - ESTRUTURA DO CURSO

## 1.1 Arquitectura Geral

```
CURSO DE PREPARACAO PARA CONCURSOS DE SAUDE 2026
|
+-- AREAS PROFISSIONAIS
|   +-- Medicina
|   +-- Licenciatura em Enfermagem
|   +-- Tecnico de Enfermagem
|   +-- Tecnico de Farmacia
|   +-- Analises Clinicas
|
+-- NIVEIS DE DIFICULDADE
|   +-- Basico (Fundamentos)
|   +-- Intermedio (Pratica)
|   +-- Avancado (Casos Complexos)
|
+-- MODULOS POR AREA
    +-- Modulo 1: Fundamentos Teoricos
    +-- Modulo 2: Pratica Clinica
    +-- Modulo 3: Legislacao e Etica
    +-- Modulo 4: Saude Publica
    +-- Modulo 5: Simulados e Revisao
```

## 1.2 Componentes do Sistema

| Componente | Descricao | Objectivo |
|------------|-----------|-----------|
| Slides Inteligentes | Apresentacao visual estruturada | Transmitir conhecimento de forma clara |
| Audio Explicativo | Narracao complementar | Aprofundar conceitos sem repetir texto |
| Aula Conversacional | Dialogo estilo professor | Manter engajamento e verificar compreensao |
| Mini-Quiz | Avaliacao rapida | Verificar aprendizagem imediata |
| Flashcards | Revisao activa | Fixar conceitos essenciais |
| Jogos de Simulacao | Aplicacao pratica | Preparar para cenarios reais |
| IA Conversacional | Tutor inteligente | Responder duvidas personalizadas |

## 1.3 Fluxo de Aprendizagem

```
INICIO
   |
   v
[Seleccionar Area] --> [Seleccionar Modulo] --> [Seleccionar Aula]
                                                       |
                                                       v
                              +------------------------+------------------------+
                              |                        |                        |
                              v                        v                        v
                       [Modo Slides]          [Modo Conversacional]      [Modo Rapido]
                              |                        |                        |
                              v                        v                        v
                       [Ver Slides]           [Seguir Dialogo]         [Apenas Quiz]
                       [Ouvir Audio]          [Responder Perguntas]          |
                              |                        |                        |
                              +------------------------+------------------------+
                                                       |
                                                       v
                                               [Mini-Quiz]
                                                       |
                              +------------------------+------------------------+
                              |                                                 |
                              v                                                 v
                       [Passou >= 60%]                                 [Nao Passou]
                              |                                                 |
                              v                                                 v
                       [Flashcards]                                    [Rever Aula]
                       [Jogos]                                                  |
                       [Proxima Aula]                                          |
                              |                                                 |
                              +------------------------+------------------------+
                                                       |
                                                       v
                                                    [FIM]
```

---

# BLOCO 2 - MODELO DE AULA

## 2.1 Estrutura de Identificacao

```
AULA: [Titulo Claro e Especifico]
-------------------------------------
Area: [Medicina | Enfermagem | Tec. Enfermagem | Tec. Farmacia | Analises]
Nivel: [Basico | Intermedio | Avancado]
Duracao Estimada: XX minutos
Pre-requisitos: [Lista]
```

## 2.2 Componentes Obrigatorios

### A) Slides Inteligentes (8-10 por aula)
- Titulo (max 60 caracteres)
- Conteudo principal (max 150 palavras)
- 2-4 pontos-chave
- Um conceito central
- Relevancia para prova (alta/media/baixa)

### B) Audio por Slide (1-2 minutos)
- NAO ler o texto do slide
- Explicar com outras palavras
- Dar exemplos praticos
- Conectar com a pratica profissional
- Antecipar duvidas comuns

### C) Aula Conversacional
- Blocos de 50-100 palavras
- Perguntas frequentes ao aluno
- Tom acessivel mas profissional
- Progressao logica do conteudo

### D) Mini-Quiz (1-3 questoes)
- Focado nos conceitos-chave
- 4 alternativas por questao
- Feedback imediato com explicacao
- Referencia ao slide correspondente

### E) Flashcards (5-10 por aula)
- Frente: Pergunta ou termo
- Verso: Resposta concisa
- Prioridade baseada em relevancia

---

# BLOCO 4 - FLUXO DA AULA CONVERSACIONAL

## 4.1 Estrutura do Dialogo

```
FASE 1: INTRODUCAO (1-2 blocos)
|-- Saudacao contextual
|-- Apresentacao do tema
|-- Relevancia para concurso
|-- Pergunta inicial de engajamento

        |
        v

FASE 2: DESENVOLVIMENTO (3-5 blocos por conceito)
|-- Explanacao do conceito
|-- Exemplo pratico
|-- Pergunta de verificacao
|-- Dica contextual
|-- Conexao com proximo conceito

        |
        v

FASE 3: APLICACAO (2-3 blocos)
|-- Cenario pratico
|-- Pergunta de aplicacao
|-- Discussao de alternativas
|-- Reforco do conceito

        |
        v

FASE 4: RESUMO (1-2 blocos)
|-- Recapitulacao dos pontos principais
|-- Termos-chave para memorizar
|-- Orientacao para proximo passo
|-- Motivacao final

        |
        v

FASE 5: AVALIACAO
|-- Mini-quiz automatico
```

## 4.2 Tipos de Perguntas ao Aluno

| Tipo | Exemplo | Momento |
|------|---------|---------|
| Reflexao | "Ja pensaste porque isto e importante?" | Inicio de conceito |
| Verificacao | "Qual e a primeira prioridade?" | Apos explicacao |
| Aplicacao | "O que farias nesta situacao?" | Apos exemplo |
| Conexao | "Como isto se relaciona com...?" | Transicao |

## 4.3 Elementos de Ritmo

- **[PAUSA]**: Momento de reflexao (2-5 segundos)
- **[ENFASE]**: Termo importante destacado
- **[TRANSICAO]**: Mudanca de topico
- **[RESUMO]**: Recapitulacao breve

---

# BLOCO 5 - MODELO DE SLIDE

## 5.1 Template de Slide

```json
{
  "id": "slide-XXX-001",
  "ordem": 1,
  "titulo": "Titulo Curto e Directo (max 60 chars)",
  
  "conteudoPrincipal": "Texto principal do slide. Deve ser curto, claro e focado em um unico conceito. Use **negrito** para termos importantes e listas para organizar informacao.",
  
  "pontosChave": [
    {
      "titulo": "Ponto 1",
      "descricao": "Descricao breve do ponto"
    },
    {
      "titulo": "Ponto 2", 
      "descricao": "Descricao breve do ponto"
    }
  ],
  
  "audioScript": "Texto do audio que NAO repete o conteudo do slide. Explica com outras palavras, da exemplos e conecta com a pratica.",
  
  "duracaoAudioSegundos": 90,
  
  "interacao": {
    "tipo": "reflexao|verificacao|aplicacao|conexao",
    "pergunta": "Pergunta para o aluno",
    "respostaEsperada": "Resposta esperada (opcional)",
    "dicaContextual": "Dica para ajudar (opcional)"
  },
  
  "conceito": "Conceito central em uma frase",
  "relevanciaProva": "alta|media|baixa",
  "status": "pending|viewed|completed"
}
```

## 5.2 Regras de Conteudo

**FAZER:**
- Maximo 150 palavras no conteudo principal
- Um conceito por slide
- Usar listas e formatacao
- Destacar termos tecnicos
- Incluir dados concretos

**NAO FAZER:**
- Texto corrido longo
- Multiplos conceitos
- Linguagem vaga
- Excesso de detalhes
- Repeticao desnecessaria

---

# BLOCO 6 - MODELO DE MINI-QUIZ

## 6.1 Template de Questao

```json
{
  "id": "quiz-001",
  "enunciado": "Pergunta clara e objectiva, sem ambiguidades",
  "alternativas": [
    { "letra": "A", "texto": "Opcao A" },
    { "letra": "B", "texto": "Opcao B" },
    { "letra": "C", "texto": "Opcao C" },
    { "letra": "D", "texto": "Opcao D" }
  ],
  "correta": "B",
  "explicacao": "Explicacao clara do porque B esta correcta e as outras estao erradas",
  "slideReferencia": "slide-XXX-003"
}
```

## 6.2 Tipos de Questoes Recomendados

| Tipo | Descricao | Exemplo |
|------|-----------|---------|
| Conceitual | Define ou caracteriza | "O que e...?" |
| Aplicacao | Cenario pratico | "Dado que..., qual conduta?" |
| Identificacao | Reconhecer caracteristicas | "Qual sinal indica...?" |
| Sequencial | Ordem de acoes | "Qual a primeira prioridade?" |

## 6.3 Regras de Qualidade

**FAZER:**
- Enunciado claro e directo
- Alternativas homogeneas em tamanho
- Explicacao que ensina
- Referencia ao slide fonte

**NAO FAZER:**
- Questoes capciosas
- Pegadinhas desnecessarias
- Alternativas muito similares
- "Nenhuma das anteriores"
- "Todas as anteriores"

---

# BLOCO 7 - ESTRUTURA DE DADOS (JSON)

## 7.1 Aula Completa

```json
{
  "id": "aula-tema-001",
  "titulo": "Nome da Aula",
  "area": "tecnico_enfermagem",
  "nivel": "intermedio",
  
  "versao": "1.0.0",
  "dataAtualizacao": "2026-01-13",
  "autor": "Sistema Angola Saude 2026",
  
  "objectivoGeral": "Objectivo principal da aula",
  "objectivosEspecificos": [
    "Objectivo especifico 1",
    "Objectivo especifico 2"
  ],
  
  "preRequisitos": ["Conhecimento 1", "Conhecimento 2"],
  
  "slides": [/* Array de LessonSlide */],
  
  "aulaConversacional": {
    "estiloLinguagem": "acessivel",
    "ritmoAdaptavel": true,
    "blocos": [/* Array de ConversationalBlock */]
  },
  
  "miniQuiz": {
    "titulo": "Verificacao Rapida",
    "descricao": "Teste os seus conhecimentos",
    "pontuacaoMinima": 60,
    "questoes": [/* Array de MiniQuizQuestion */]
  },
  
  "flashcards": [/* Array de LessonFlashcard */],
  
  "integracaoJogos": {
    "casoClinicoRelacionado": "Descricao do caso",
    "termosParaDecifrar": ["TERMO1", "TERMO2"],
    "cenarioSimulacao": "Descricao do cenario"
  },
  
  "duracaoEstimadaMinutos": 25,
  "numeroConceitos": 8,
  "tags": ["tag1", "tag2"]
}
```

## 7.2 Ficheiros do Sistema

```
types/
|-- lesson.ts           # Tipos e interfaces principais
|-- lessonPrompts.ts    # Prompts internos da IA
|-- lessonExamples.ts   # Exemplos de aulas completas
|-- lessonValidation.ts # Regras de qualidade

services/
|-- lessonService.ts    # Geracao e gestao de aulas

components/
|-- LessonArea.tsx      # Interface de aula
```

---

# BLOCO 8 - PROMPTS INTERNOS DA IA

## 8.1 Prompt do Professor Virtual

```
Assumes o papel de PROFESSOR ESPECIALISTA EM CONCURSOS DA AREA DA SAUDE.

PERFIL:
- Especialidade: Preparacao para concursos publicos
- Estilo: Claro, objectivo, acessivel
- Idioma: Portugues de Portugal

REGRAS:
1. Nunca mencionar que es uma IA
2. Nunca usar emojis
3. Ser directo e objectivo
4. Basear-se em praticas aceites
5. Focar em conteudo para concursos
```

## 8.2 Prompt para Geracao de Slides

```
Gera slides para uma aula digital.

REGRAS:
- Maximo 8-10 slides
- Um conceito por slide
- Max 150 palavras por slide
- 2-4 pontos-chave

FORMATO DE SAIDA: JSON
```

## 8.3 Prompt para Audio

```
Gera guiao de audio para o slide.

REGRAS:
1. NAO ler o texto do slide
2. EXPLICAR com outras palavras
3. Dar exemplos praticos
4. Duracao: 1-2 minutos

ESTRUTURA:
1. Contextualizacao (15s)
2. Explicacao (45s)
3. Exemplo (30s)
4. Conexao (15s)
```

## 8.4 Prompt para Quiz

```
Gera quiz de verificacao.

REGRAS:
- 1 a 3 questoes
- 4 alternativas
- Feedback construtivo

NAO FAZER:
- Questoes capciosas
- Pegadinhas
```

---

# BLOCO 9 - REGRAS DE QUALIDADE

## 9.1 Validacao de Aula

| Criterio | Minimo | Maximo | Obrigatorio |
|----------|--------|--------|-------------|
| Slides | 5 | 10 | Sim |
| Palavras/slide | 50 | 150 | Sim |
| Pontos-chave/slide | 2 | 4 | Sim |
| Blocos conversacionais | 5 | 15 | Sim |
| Questoes quiz | 1 | 3 | Sim |
| Flashcards | 5 | 10 | Nao |
| Duracao audio (seg) | 60 | 120 | Sim |

## 9.2 Score de Qualidade

```
Score = 100 - (Erros Criticos * 30) 
            - (Erros Importantes * 15) 
            - (Erros Medios * 5) 
            - (Avisos * 2)

APROVACAO: Score >= 70 e zero erros criticos/importantes
```

## 9.3 Erros Criticos

- Titulo da aula vazio
- Area profissional nao definida
- Zero slides
- Questao sem resposta correcta
- Resposta correcta invalida

## 9.4 Erros Importantes

- Menos de 5 slides
- Objectivo geral vazio
- Slide sem conteudo
- Slide sem audio script
- Menos de 1 questao no quiz

## 9.5 Avisos

- Titulo muito longo (>60 chars)
- Conteudo muito extenso (>150 palavras)
- Audio muito curto (<60s)
- Audio muito longo (>120s)
- Poucos pontos-chave
- Poucas interacoes

## 9.6 Checklist Pre-Publicacao

- [ ] Titulo claro e especifico
- [ ] Area e nivel definidos
- [ ] Objectivos bem formulados
- [ ] 5-10 slides completos
- [ ] Audio para cada slide
- [ ] Aula conversacional estruturada
- [ ] Quiz com 1-3 questoes
- [ ] Flashcards de revisao
- [ ] Score de qualidade >= 70

---

## Conclusao

Este sistema foi desenhado para:
- Ser **escalavel** (geracao automatica com IA)
- Ser **leve** (sem video, texto e audio apenas)
- Ser **diferenciado** (aula conversacional interactiva)
- Estar **preparado para 2026**
- Ser **facil de integrar** em web e mobile
- **Gerar aulas automaticamente** com IA

O foco esta na **qualidade pedagogica** e **adequacao a concursos**, respeitando o contexto lusofono e as melhores praticas da area da saude.
