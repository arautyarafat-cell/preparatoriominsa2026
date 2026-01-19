/**
 * ==================================================
 * EXEMPLO DE AULA COMPLETA
 * Tema: Atendimento Inicial ao Politraumatizado
 * ==================================================
 * 
 * BLOCO 3 - EXEMPLO DE AULA COMPLETA
 * 
 * Este ficheiro contem um exemplo real de como uma aula
 * digital deve ser estruturada no sistema.
 */

import { DigitalLesson } from './lesson';

// ==================================================
// EXEMPLO: ATENDIMENTO INICIAL AO POLITRAUMATIZADO
// ==================================================

export const EXEMPLO_AULA_POLITRAUMATIZADO: DigitalLesson = {
    // Identificacao
    id: 'aula-politraumatizado-001',
    titulo: 'Atendimento Inicial ao Politraumatizado',
    area: 'tecnico_enfermagem',
    nivel: 'intermedio',

    // Metadados
    versao: '1.0.0',
    dataAtualizacao: '2026-01-13',
    autor: 'Sistema Angola Saude 2026',

    // Objectivos
    objectivoGeral: 'Compreender e aplicar o protocolo ABCDE no atendimento inicial ao paciente politraumatizado',
    objectivosEspecificos: [
        'Identificar as prioridades no atendimento de emergencia',
        'Aplicar correctamente a sequencia ABCDE',
        'Reconhecer sinais de alerta em cada etapa',
        'Executar intervencoes basicas de estabilizacao'
    ],

    // Pre-requisitos
    preRequisitos: [
        'Conhecimentos basicos de anatomia',
        'Nocoes de sinais vitais',
        'Fundamentos de biosseguranca'
    ],

    // ==================================================
    // SLIDES INTELIGENTES
    // ==================================================
    slides: [
        {
            id: 'slide-001',
            ordem: 1,
            titulo: 'O que e o Politraumatizado?',
            conteudoPrincipal: `
O **politraumatizado** e o paciente que sofreu lesoes multiplas em dois ou mais sistemas organicos, 
sendo pelo menos uma delas potencialmente fatal.

As principais causas incluem:
- Acidentes de viacao
- Quedas de altura
- Agressoes fisicas
- Acidentes de trabalho
      `,
            pontosChave: [
                { titulo: 'Definicao', descricao: 'Lesoes em 2+ sistemas, 1+ potencialmente fatal' },
                { titulo: 'Urgencia', descricao: 'Tempo e factor critico - "Hora de Ouro"' },
                { titulo: 'Abordagem', descricao: 'Sistematica e organizada - ABCDE' }
            ],
            audioScript: `
Vamos comecar por entender o que define um politraumatizado.
[PAUSA]
Imagina um acidente de viacao grave. O condutor pode ter traumatismo craniano, 
fracturas nas costelas e uma lesao no baco. Isto e um politraumatizado - 
multiplas lesoes em diferentes partes do corpo.
[PAUSA]
O ponto crucial aqui e que pelo menos uma dessas lesoes pode ser fatal se nao for tratada rapidamente.
Por isso existe o conceito de *Hora de Ouro* - os primeiros 60 minutos apos o trauma 
sao decisivos para a sobrevivencia.
[PAUSA]
E onde entras tu? Como tecnico, vais ser muitas vezes o primeiro contacto. 
A tua avaliacao rapida e sistematica pode salvar vidas.
      `,
            duracaoAudioSegundos: 75,
            interacao: {
                tipo: 'reflexao',
                pergunta: 'Ja alguma vez pensaste no que farias nos primeiros segundos ao encontrar uma vitima de acidente grave?',
                dicaContextual: 'Nao ha resposta certa aqui - o objectivo e reflectir sobre a importancia da preparacao.'
            },
            conceito: 'Politraumatizado: multiplas lesoes, pelo menos uma potencialmente fatal',
            relevanciaProva: 'alta',
            status: 'pending'
        },
        {
            id: 'slide-002',
            ordem: 2,
            titulo: 'O Protocolo ABCDE',
            conteudoPrincipal: `
O **ABCDE** e uma mnemonica universal para avaliacao primaria:

- **A** - Airway (Via aerea com proteccao cervical)
- **B** - Breathing (Respiracao e ventilacao)
- **C** - Circulation (Circulacao com controlo de hemorragia)
- **D** - Disability (Estado neurologico)
- **E** - Exposure (Exposicao e controlo de temperatura)
      `,
            pontosChave: [
                { titulo: 'Ordem Fixa', descricao: 'Sempre A antes de B, B antes de C...' },
                { titulo: 'Nao Saltar', descricao: 'Cada letra deve ser avaliada e estabilizada' },
                { titulo: 'Reavaliar', descricao: 'Voltar ao A se houver deterioracao' }
            ],
            audioScript: `
O ABCDE e a base de tudo no atendimento de emergencia. Vais ouvir falar disto constantemente.
[PAUSA]
Pensa assim: de que adianta tratar uma fractura se o paciente nao consegue respirar? 
Ou tratar a respiracao se a via aerea esta obstruida?
[PAUSA]
Por isso seguimos esta ordem. A de Airway vem primeiro porque sem via aerea patente, 
nada mais importa. Depois B de Breathing, porque precisamos de oxigenio. 
C de Circulation para garantir que o sangue chega aos orgaos.
D de Disability para avaliar o cerebro. E finalmente E de Exposure para ver todo o corpo.
[PAUSA]
Em provas de concurso, esta sequencia aparece constantemente. 
Grava bem: A-B-C-D-E, nesta ordem exacta.
      `,
            duracaoAudioSegundos: 80,
            conceito: 'ABCDE: sequencia obrigatoria de avaliacao primaria',
            relevanciaProva: 'alta',
            status: 'pending'
        },
        {
            id: 'slide-003',
            ordem: 3,
            titulo: 'A - Via Aerea',
            conteudoPrincipal: `
A primeira prioridade e garantir que o ar pode entrar nos pulmoes.

**Avaliar:**
- O paciente fala? (Se fala, a via aerea esta pervia)
- Ha ruidos anormais? (Roncos, gargarejos, estridores)
- Ha obstrucao visivel? (Sangue, vomito, corpos estranhos, lingua)

**Atencao:** Sempre com proteccao da coluna cervical!
      `,
            pontosChave: [
                { titulo: 'Regra de Ouro', descricao: 'Se o paciente fala claramente, a via esta patente' },
                { titulo: 'Sons de Alerta', descricao: 'Ronco = lingua; Gargarejo = liquidos; Estridor = laringe' },
                { titulo: 'Coluna Cervical', descricao: 'Imobilizar sempre ate descartar lesao' }
            ],
            audioScript: `
Chegamos ao A de Airway. Esta e a primeira coisa que vais avaliar.
[PAUSA]
Tens uma forma muito simples de saber se a via aerea esta bem: pergunta ao paciente como se chama.
Se ele responder claramente, a via aerea esta patente. Simples assim.
[PAUSA]
Mas atencao aos sons. Se ouvires um *ronco*, provavelmente a lingua esta a cair para tras - 
muito comum em pacientes inconscientes. 
Se ouvires *gargarejo*, ha liquidos - pode ser sangue ou vomito.
Se ouvires um *estridor* agudo, o problema esta na laringe.
[PAUSA]
E fundamental: num trauma, assume sempre que ha lesao da coluna cervical até provares o contrario.
Por isso, qualquer manobra na via aerea deve ser feita com imobilizacao cervical.
      `,
            duracaoAudioSegundos: 85,
            interacao: {
                tipo: 'verificacao',
                pergunta: 'Se um paciente politraumatizado responde "Joao" quando perguntas o nome, o que podes concluir sobre a via aerea?',
                respostaEsperada: 'A via aerea esta patente/pervia'
            },
            conceito: 'Via aerea: avaliar perviedade sempre com proteccao cervical',
            relevanciaProva: 'alta',
            status: 'pending'
        },
        {
            id: 'slide-004',
            ordem: 4,
            titulo: 'B - Respiracao',
            conteudoPrincipal: `
Mesmo com via aerea pervia, o paciente pode nao estar a ventilar adequadamente.

**Avaliar (VOS):**
- **V**er: Movimentos do torax (simetria, amplitude)
- **O**uvir: Sons respiratorios
- **S**entir: Fluxo de ar no rosto

**Frequencia normal:** 12-20 rpm em adultos
      `,
            pontosChave: [
                { titulo: 'VOS', descricao: 'Ver, Ouvir, Sentir - metodo de avaliacao' },
                { titulo: 'Taquipneia', descricao: '>20 rpm pode indicar hipoxia ou choque' },
                { titulo: 'Assimetria', descricao: 'Torax assimetrico sugere pneumotorax' }
            ],
            audioScript: `
Passamos ao B de Breathing. A via aerea pode estar livre, mas sera que o paciente consegue respirar?
[PAUSA]
Usamos a tecnica VOS: Ver, Ouvir, Sentir.
Ver os movimentos do torax - sao simetricos? Os dois lados expandem igual?
Ouvir os sons respiratorios - ha ruidos? Ausencia de som num lado?
Sentir o fluxo de ar.
[PAUSA]
Um ponto critico: se o torax de um lado nao se move como o outro, 
pensa imediatamente em pneumotorax. Isto e *emergencia*.
[PAUSA]
A frequencia respiratoria e muito importante. Entre 12 e 20 e normal num adulto.
Se esta acima de 20, o corpo esta a compensar algo - pode ser dor, hipoxia ou choque.
Se esta muito baixo, abaixo de 10, o paciente pode estar em falencia respiratoria.
      `,
            duracaoAudioSegundos: 80,
            conceito: 'Respiracao: avaliar com VOS, atentar a frequencia e simetria',
            relevanciaProva: 'alta',
            status: 'pending'
        },
        {
            id: 'slide-005',
            ordem: 5,
            titulo: 'C - Circulacao',
            conteudoPrincipal: `
Avaliar o estado circulatorio e controlar hemorragias visiveis.

**Avaliar:**
- Pulso (presenca, frequencia, ritmo, amplitude)
- Pele (cor, temperatura, humidade)
- Tempo de preenchimento capilar (<2 segundos e normal)
- Hemorragias externas

**Choque:** FC >100 bpm + Pele fria e palida + Ansiedade
      `,
            pontosChave: [
                { titulo: 'Pulso Radial', descricao: 'Se palpavel, PAS provavelmente >80 mmHg' },
                { titulo: 'Preench. Capilar', descricao: '>2 seg sugere hipoperfusao' },
                { titulo: 'Triade do Choque', descricao: 'Taquicardia + Pele fria/palida + Alteracao mental' }
            ],
            audioScript: `
No C de Circulation vamos avaliar se o sangue esta a circular bem.
[PAUSA]
O pulso e o teu melhor amigo aqui. Se consegues palpar o pulso radial, 
isso significa que a pressao arterial sistolica esta provavelmente acima de 80 mmHg. 
E uma estimativa rapida muito util.
[PAUSA]
A pele conta uma historia. Pele quente e rosada: boa perfusao. 
Pele fria, palida e suada: sinais de choque.
[PAUSA]
O tempo de preenchimento capilar e simples de fazer: pressiona a unha do paciente, 
liberta e conta quanto tempo demora a voltar a cor rosa. 
Se demorar mais de 2 segundos, ha problema na circulacao.
[PAUSA]
E nao te esquecas: hemorragias externas devem ser controladas imediatamente 
com compressao directa. Antes de qualquer outra coisa.
      `,
            duracaoAudioSegundos: 90,
            interacao: {
                tipo: 'aplicacao',
                pergunta: 'Um paciente tem pulso rapido, pele fria e palida, e esta ansioso. O que suspeitas?',
                respostaEsperada: 'Choque hipovolemico / hemorragico',
                dicaContextual: 'Lembra-te da triade do choque: taquicardia, pele fria/palida, alteracao mental.'
            },
            conceito: 'Circulacao: pulso, pele, preenchimento capilar e controlo de hemorragia',
            relevanciaProva: 'alta',
            status: 'pending'
        },
        {
            id: 'slide-006',
            ordem: 6,
            titulo: 'D - Estado Neurologico',
            conteudoPrincipal: `
Avaliacao rapida do nivel de consciencia e funcao neurologica.

**Escala AVDI (rapida):**
- **A**lerta
- **V**oz (responde a estimulos verbais)
- **D**or (responde a estimulos dolorosos)
- **I**nconsciente

**Pupilas:** Verificar tamanho, simetria e reactividade
      `,
            pontosChave: [
                { titulo: 'AVDI', descricao: 'Escala rapida: Alerta, Voz, Dor, Inconsciente' },
                { titulo: 'Glasgow', descricao: 'Escala mais detalhada (3-15 pontos)' },
                { titulo: 'Pupilas', descricao: 'Anisocoria (pupilas diferentes) = urgencia' }
            ],
            audioScript: `
D de Disability - aqui avaliamos o cerebro.
[PAUSA]
No atendimento inicial nao precisas da escala de Glasgow completa. 
Usamos a AVDI que e muito mais rapida.
O paciente esta Alerta? Responde a Voz? So responde a Dor? Ou esta totalmente Inconsciente?
[PAUSA]
Isto da-te uma ideia rapida do estado neurologico.
[PAUSA]
As pupilas sao fundamentais. Olha para elas: sao do mesmo tamanho? 
Reagem a luz? Se uma pupila esta muito maior que a outra - anisocoria - 
isto pode indicar lesao cerebral grave com herniacao.
[PAUSA]
Uma queda no nivel de consciencia durante o atendimento 
e sempre motivo para reavaliar todo o ABCDE desde o inicio.
      `,
            duracaoAudioSegundos: 75,
            conceito: 'Disability: AVDI para consciencia, pupilas para funcao cerebral',
            relevanciaProva: 'alta',
            status: 'pending'
        },
        {
            id: 'slide-007',
            ordem: 7,
            titulo: 'E - Exposicao',
            conteudoPrincipal: `
Despir o paciente para exame completo, prevenindo hipotermia.

**Acoes:**
- Remover toda a roupa (cortar se necessario)
- Examinar frente e costas
- Procurar feridas ocultas
- Cobrir imediatamente apos exame

**Atencao:** Hipotermia agrava choque e coagulopatia!
      `,
            pontosChave: [
                { titulo: 'Despir', descricao: 'Ver todo o corpo para lesoes ocultas' },
                { titulo: 'Log Roll', descricao: 'Rolar em bloco para ver costas' },
                { titulo: 'Cobrir', descricao: 'Prevenir hipotermia - usar cobertores' }
            ],
            audioScript: `
Finalmente, E de Exposure.
[PAUSA]
Aqui a ideia e simples: precisas de ver todo o corpo do paciente. 
Lesoes podem estar escondidas debaixo da roupa.
Uma pequena ferida nas costas pode ser entrada de uma lesao grave.
[PAUSA]
Por isso, removemos a roupa - corta se for preciso, nao percas tempo com botoes.
Examina a frente toda, depois faz o log roll para ver as costas.
O log roll e a tecnica de rolar o paciente em bloco, mantendo o alinhamento da coluna.
[PAUSA]
Mas atencao: assim que terminares o exame, *cobre o paciente*.
A hipotermia num politraumatizado e muito perigosa.
Piora a coagulacao do sangue e agrava o choque.
E a famosa "triade da morte": hipotermia, acidose e coagulopatia.
      `,
            duracaoAudioSegundos: 80,
            conceito: 'Exposicao: examinar todo o corpo e prevenir hipotermia',
            relevanciaProva: 'media',
            status: 'pending'
        },
        {
            id: 'slide-008',
            ordem: 8,
            titulo: 'Resumo e Aplicacao Pratica',
            conteudoPrincipal: `
O protocolo ABCDE salva vidas quando aplicado correctamente.

**Sequencia:**
1. A - Via aerea + Proteccao cervical
2. B - Respiracao (VOS)
3. C - Circulacao + Controlo hemorragia
4. D - Neurológico (AVDI + Pupilas)
5. E - Exposicao + Prevencao hipotermia

**Regra:** Se houver deterioracao, voltar ao A!
      `,
            pontosChave: [
                { titulo: 'Mnemonica', descricao: 'ABCDE - decorar a ordem e significado' },
                { titulo: 'Reavaliacao', descricao: 'Deterioracao = voltar ao inicio' },
                { titulo: 'Provas', descricao: 'Questao frequente em concursos' }
            ],
            audioScript: `
Vamos resumir o que aprendeste.
[PAUSA]
O ABCDE e o teu guia no caos de um atendimento de emergencia.
Quando tudo parece confuso, voltas a esta sequencia e segues passo a passo.
[PAUSA]
A de Airway com proteccao cervical.
B de Breathing com VOS.
C de Circulation com controlo de hemorragia.
D de Disability com AVDI e pupilas.
E de Exposure com prevencao de hipotermia.
[PAUSA]
E lembra-te: se em qualquer momento o paciente piorar, 
voltas ao A e recomecas. A via aerea e sempre a prioridade.
[PAUSA]
Nos concursos, esta materia aparece muito. Tanto em questoes teoricas 
como em casos clinicos. Domina bem cada letra e vaias estar preparado.
      `,
            duracaoAudioSegundos: 70,
            interacao: {
                tipo: 'conexao',
                pergunta: 'Como e que o ABCDE se relaciona com o conceito de "Hora de Ouro" que vimos no inicio?',
                dicaContextual: 'Pensa na importancia da rapidez e da sistematizacao para aproveitar esse tempo critico.'
            },
            conceito: 'ABCDE: protocolo sistematico de avaliacao primaria',
            relevanciaProva: 'alta',
            status: 'pending'
        }
    ],

    // ==================================================
    // AULA CONVERSACIONAL
    // ==================================================
    aulaConversacional: {
        estiloLinguagem: 'acessivel',
        ritmoAdaptavel: true,
        blocos: [
            {
                id: 'bloco-001',
                ordem: 1,
                tipo: 'introducao',
                fala: 'Hoje vamos falar de algo que pode literalmente salvar vidas: o atendimento ao politraumatizado. Imagina que estas de servico e chega uma vitima de acidente de viacao. O que farias primeiro? Antes de responder, deixa-me explicar porque esta materia e tao importante.',
                pausaReflexao: 3
            },
            {
                id: 'bloco-002',
                ordem: 2,
                tipo: 'explicacao',
                fala: 'Um politraumatizado nao e simplesmente alguem com muitas lesoes. E um paciente com lesoes em pelo menos dois sistemas do corpo, e onde pelo menos uma dessas lesoes pode ser fatal. O tempo aqui e absolutamente critico.',
                dicaContextual: 'Esta definicao aparece frequentemente em provas de concurso.'
            },
            {
                id: 'bloco-003',
                ordem: 3,
                tipo: 'explicacao',
                fala: 'Existe um conceito chamado "Hora de Ouro" - os primeiros 60 minutos apos o trauma sao decisivos. O que fizeres nesse tempo pode determinar se o paciente sobrevive ou nao. Por isso precisamos de uma abordagem sistematica.',
                perguntaAluno: 'Porque achas que uma abordagem sistematica e melhor do que simplesmente tratar a lesao mais obvia?',
                pausaReflexao: 5
            },
            {
                id: 'bloco-004',
                ordem: 4,
                tipo: 'explicacao',
                fala: 'A resposta esta no ABCDE. Esta mnemonica e universal - usada em todo o mundo. A de Airway, via aerea. B de Breathing, respiracao. C de Circulation, circulacao. D de Disability, estado neurologico. E de Exposure, exposicao. Vamos ver cada uma.',
                dicaContextual: 'Grava estas letras e o que significam. Vao aparecer nas provas.'
            },
            {
                id: 'bloco-005',
                ordem: 5,
                tipo: 'exemplo',
                fala: 'Imagina: chega um homem de 40 anos, vitima de acidente de mota. Esta inconsciente. O que fazes primeiro? Se disseste "verificar a via aerea", estas correcto. Antes de qualquer coisa, o A. E lembra-te: sempre com proteccao cervical, porque num trauma nunca sabes se ha lesao na coluna.',
                perguntaAluno: 'Se este paciente começasse a falar contigo claramente, o que poderias concluir sobre a via aerea dele?'
            },
            {
                id: 'bloco-006',
                ordem: 6,
                tipo: 'explicacao',
                fala: 'Exacto - se fala claramente, a via aerea esta patente. Passarias ao B. No B usamos a tecnica VOS: Ver os movimentos do torax, Ouvir os sons, Sentir o fluxo de ar. A simetria e muito importante - se um lado do torax nao se move, pensa em pneumotorax.'
            },
            {
                id: 'bloco-007',
                ordem: 7,
                tipo: 'aplicacao',
                fala: 'Agora uma situacao real: avalias o paciente e notas que o pulso esta rapido, a pele esta fria e palida, e ele esta agitado. Estavas no C, circulacao. O que suspeitas?',
                perguntaAluno: 'Qual e o teu diagnostico presumptivo?',
                pausaReflexao: 5,
                dicaContextual: 'Pensa na triade do choque: taquicardia, pele fria/palida, alteracao mental.'
            },
            {
                id: 'bloco-008',
                ordem: 8,
                tipo: 'explicacao',
                fala: 'Isto e a triade classica do choque hipovolemico. O corpo esta a perder sangue e a compensar. Pulso rapido para manter a pressao, vasoconstrição periferica que causa a pele fria e palida, e o cerebro ja esta a sofrer com menos oxigenio - dai a agitacao.',
                dicaContextual: 'Esta triade aparece muito em questoes de concurso sobre choque.'
            },
            {
                id: 'bloco-009',
                ordem: 9,
                tipo: 'explicacao',
                fala: 'No D, avaliamos o estado neurologico com a escala AVDI: Alerta, responde a Voz, responde a Dor, Inconsciente. E rapido e da uma ideia do estado cerebral. Tambem olhamos as pupilas - se uma estiver maior que a outra, e sinal de alarme grave.'
            },
            {
                id: 'bloco-010',
                ordem: 10,
                tipo: 'explicacao',
                fala: 'Finalmente, no E, despimos o paciente para ver todo o corpo. Lesoes podem estar ocultas. Mas assim que examinamos, cobrimos imediatamente. A hipotermia num politraumatizado e perigosa - faz parte da "triade da morte" junto com acidose e coagulopatia.'
            },
            {
                id: 'bloco-011',
                ordem: 11,
                tipo: 'resumo',
                fala: 'Entao, o que levas desta aula? Politraumatizado e lesoes multiplas com risco de vida. O ABCDE e a tua ferramenta: Airway, Breathing, Circulation, Disability, Exposure. Segue esta ordem sempre. E se o paciente piorar, volta ao A e recomeca. Esta preparado para a prova.',
                perguntaAluno: 'Consegues dizer de memoria o que significa cada letra do ABCDE?'
            }
        ]
    },

    // ==================================================
    // MINI-QUIZ
    // ==================================================
    miniQuiz: {
        titulo: 'Verificacao Rapida - ABCDE',
        descricao: 'Testa os teus conhecimentos sobre o atendimento inicial ao politraumatizado',
        pontuacaoMinima: 60,
        questoes: [
            {
                id: 'quiz-001',
                enunciado: 'No atendimento inicial ao politraumatizado, qual e a primeira prioridade segundo o protocolo ABCDE?',
                alternativas: [
                    { letra: 'A', texto: 'Controlar hemorragias externas' },
                    { letra: 'B', texto: 'Garantir via aerea pervia com proteccao cervical' },
                    { letra: 'C', texto: 'Avaliar o nivel de consciencia' },
                    { letra: 'D', texto: 'Verificar a pressao arterial' }
                ],
                correta: 'B',
                explicacao: 'A letra A do ABCDE significa Airway (Via Aerea). E a primeira prioridade porque sem via aerea patente, o paciente nao consegue receber oxigenio, tornando todas as outras intervencoes inuteis. A proteccao cervical e fundamental em trauma.',
                slideReferencia: 'slide-002'
            },
            {
                id: 'quiz-002',
                enunciado: 'Um paciente politraumatizado apresenta pulso rapido, pele fria e palida, e agitacao. Esta apresentacao sugere:',
                alternativas: [
                    { letra: 'A', texto: 'Estado neurologico normal' },
                    { letra: 'B', texto: 'Choque hipovolemico' },
                    { letra: 'C', texto: 'Hipotermia isolada' },
                    { letra: 'D', texto: 'Obstrucao da via aerea' }
                ],
                correta: 'B',
                explicacao: 'A triade de taquicardia (pulso rapido), pele fria/palida (vasoconstrição periferica) e alteracao do nivel de consciencia (agitacao) e classica do choque hipovolemico, geralmente causado por perda de sangue no politraumatizado.',
                slideReferencia: 'slide-005'
            },
            {
                id: 'quiz-003',
                enunciado: 'Na avaliacao da via aerea de um politraumatizado, se o paciente responde verbalmente de forma clara as tuas perguntas, podes concluir que:',
                alternativas: [
                    { letra: 'A', texto: 'Ha obstrucao parcial da via aerea' },
                    { letra: 'B', texto: 'A via aerea esta patente' },
                    { letra: 'C', texto: 'O paciente esta em choque' },
                    { letra: 'D', texto: 'Ha lesao da coluna cervical' }
                ],
                correta: 'B',
                explicacao: 'Se um paciente consegue falar claramente, isso indica que o ar esta a passar livremente pela via aerea, ou seja, a via aerea esta patente (pervia). Esta e uma avaliacao rapida e fiavel da perviedade da via aerea.',
                slideReferencia: 'slide-003'
            }
        ]
    },

    // ==================================================
    // FLASHCARDS
    // ==================================================
    flashcards: [
        {
            id: 'fc-001',
            frente: 'O que significa ABCDE no atendimento ao politraumatizado?',
            verso: 'A - Airway (Via Aerea), B - Breathing (Respiracao), C - Circulation (Circulacao), D - Disability (Estado Neurologico), E - Exposure (Exposicao)',
            slideOrigem: 'slide-002',
            prioridade: 'alta'
        },
        {
            id: 'fc-002',
            frente: 'O que e um politraumatizado?',
            verso: 'Paciente com lesoes multiplas em dois ou mais sistemas organicos, sendo pelo menos uma potencialmente fatal',
            slideOrigem: 'slide-001',
            prioridade: 'alta'
        },
        {
            id: 'fc-003',
            frente: 'O que e a "Hora de Ouro" no trauma?',
            verso: 'Os primeiros 60 minutos apos o trauma, periodo critico onde as intervencoes adequadas podem determinar a sobrevivencia',
            slideOrigem: 'slide-001',
            prioridade: 'alta'
        },
        {
            id: 'fc-004',
            frente: 'Como avaliar rapidamente se a via aerea esta patente?',
            verso: 'Se o paciente fala claramente, a via aerea esta patente',
            slideOrigem: 'slide-003',
            prioridade: 'alta'
        },
        {
            id: 'fc-005',
            frente: 'O que significa VOS na avaliacao respiratoria?',
            verso: 'Ver (movimentos do torax), Ouvir (sons respiratorios), Sentir (fluxo de ar)',
            slideOrigem: 'slide-004',
            prioridade: 'alta'
        },
        {
            id: 'fc-006',
            frente: 'Quais sao os sinais classicos de choque hipovolemico?',
            verso: 'Taquicardia (pulso rapido), pele fria e palida, alteracao do nivel de consciencia (agitacao)',
            slideOrigem: 'slide-005',
            prioridade: 'alta'
        },
        {
            id: 'fc-007',
            frente: 'O que significa AVDI na avaliacao neurologica?',
            verso: 'A - Alerta, V - responde a Voz, D - responde a Dor, I - Inconsciente',
            slideOrigem: 'slide-006',
            prioridade: 'alta'
        },
        {
            id: 'fc-008',
            frente: 'O que e anisocoria e o que pode indicar?',
            verso: 'Pupilas de tamanhos diferentes; pode indicar lesao cerebral grave com herniacao',
            slideOrigem: 'slide-006',
            prioridade: 'media'
        },
        {
            id: 'fc-009',
            frente: 'Porque e importante prevenir a hipotermia no politraumatizado?',
            verso: 'A hipotermia piora a coagulacao sanguinea e agrava o choque, fazendo parte da "triade da morte" (hipotermia, acidose, coagulopatia)',
            slideOrigem: 'slide-007',
            prioridade: 'media'
        },
        {
            id: 'fc-010',
            frente: 'Qual o tempo de preenchimento capilar normal?',
            verso: 'Menos de 2 segundos. Acima disto sugere hipoperfusao',
            slideOrigem: 'slide-005',
            prioridade: 'media'
        }
    ],

    // ==================================================
    // INTEGRACAO COM JOGOS
    // ==================================================
    integracaoJogos: {
        casoClinicoRelacionado: 'Homem de 35 anos, vitima de acidente de viacao, inconsciente, com escoriações multiplas e deformidade no femur direito. FC: 120 bpm, PA: 90/60 mmHg, FR: 24 ipm',
        termosParaDecifrar: [
            'POLITRAUMATIZADO',
            'PNEUMOTORAX',
            'CHOQUE',
            'CERVICAL',
            'EXPOSICAO'
        ],
        cenarioSimulacao: 'Es o primeiro profissional a chegar ao local de um acidente de viacao. Ha uma vitima presa nas ferragens, consciente mas muito ansiosa. Descreve a tua avaliacao inicial seguindo o ABCDE.'
    },

    // Estatisticas
    duracaoEstimadaMinutos: 25,
    numeroConceitos: 8,

    // Tags
    tags: ['trauma', 'emergencia', 'ABCDE', 'politraumatizado', 'choque', 'tecnico de enfermagem']
};

// ==================================================
// FUNCAO PARA GERAR AULAS VAZIAS (Template)
// ==================================================

export const criarAulaVazia = (
    id: string,
    titulo: string,
    area: 'medicina' | 'enfermagem' | 'tecnico_enfermagem' | 'tecnico_farmacia' | 'analises_clinicas',
    nivel: 'basico' | 'intermedio' | 'avancado'
): DigitalLesson => ({
    id,
    titulo,
    area,
    nivel,
    versao: '1.0.0',
    dataAtualizacao: new Date().toISOString().split('T')[0],
    autor: 'Sistema Angola Saude 2026',
    objectivoGeral: '',
    objectivosEspecificos: [],
    preRequisitos: [],
    slides: [],
    aulaConversacional: {
        estiloLinguagem: 'acessivel',
        ritmoAdaptavel: true,
        blocos: []
    },
    miniQuiz: {
        titulo: 'Verificacao Rapida',
        descricao: '',
        pontuacaoMinima: 60,
        questoes: []
    },
    flashcards: [],
    integracaoJogos: {
        termosParaDecifrar: []
    },
    duracaoEstimadaMinutos: 0,
    numeroConceitos: 0,
    tags: []
});
