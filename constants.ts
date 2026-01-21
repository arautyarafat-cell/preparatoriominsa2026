import { CategoryId, Category, Topic, StudyStats } from './types';

export const CATEGORIES: Category[] = [
  {
    id: CategoryId.TEC_ENFERMAGEM,
    title: 'Téc. Enfermagem',
    description: 'Procedimentos Básicos e Cuidados ao Paciente',
    icon: '🩹',
    color: 'bg-emerald-500',
    totalQuestions: 1000,
    totalTopics: 100,
    disponivel: true,
  },
  {
    id: CategoryId.MEDICO,
    title: 'Médico',
    description: 'Clínica Geral, Especialidades e Saúde Pública',
    icon: '🩺',
    color: 'bg-blue-600',
    totalQuestions: 2000,
    totalTopics: 200,
    disponivel: false, // Indisponível - apenas admins podem acessar
  },
  {
    id: CategoryId.ENFERMAGEM,
    title: 'Lic. Enfermagem',
    description: 'Assistência, Gestão e Processos de Enfermagem',
    icon: '👩‍⚕️',
    color: 'bg-teal-600',
    totalQuestions: 1500,
    totalTopics: 150,
    disponivel: false, // Indisponível - apenas admins podem acessar
  },
  {
    id: CategoryId.TEC_FARMACIA,
    title: 'Téc. Farmácia',
    description: 'Farmacologia, Dispensação e Logística',
    icon: '💊',
    color: 'bg-indigo-500',
    totalQuestions: 1200,
    totalTopics: 120,
    disponivel: false, // Indisponível - apenas admins podem acessar
  },
  {
    id: CategoryId.ANALISES_CLINICAS,
    title: 'Análises Clínicas',
    description: 'Laboratório, Hematologia e Biossegurança',
    icon: '🔬',
    color: 'bg-purple-600',
    totalQuestions: 1300,
    totalTopics: 130,
    disponivel: false, // Indisponível - apenas admins podem acessar
  },
];

export const MOCK_TOPICS: Topic[] = [
  {
    id: '1',
    categoryId: CategoryId.MEDICO,
    title: 'Hipertensão Arterial Sistêmica',
    tags: ['Cardiologia', 'Clínica Médica'],
    content: `# Hipertensão Arterial Sistêmica (HAS)

A Hipertensão Arterial Sistêmica (HAS) é uma condição clínica multifatorial caracterizada por elevação sustentada dos níveis pressóricos ≥ 140 e/ou 90 mmHg.

## Classificação (Diretrizes Angolanas/Internacionais)
- **Normal**: < 120/80 mmHg
- **Pré-hipertensão**: 120-139 / 80-89 mmHg
- **Estágio 1**: 140-159 / 90-99 mmHg
- **Estágio 2**: ≥ 160 / ≥ 100 mmHg

## Fatores de Risco
- Idade avançada
- Obesidade
- Ingestão excessiva de sal
- Sedentarismo
- Histórico familiar

## Tratamento
O tratamento envolve medidas não farmacológicas (mudança de estilo de vida) e farmacológicas (diuréticos, IECA, BRA, bloqueadores de canais de cálcio).`,
  },
  {
    id: '2',
    categoryId: CategoryId.ENFERMAGEM,
    title: 'Sistematização da Assistência de Enfermagem (SAE)',
    tags: ['Fundamentos', 'Gestão'],
    content: `# Sistematização da Assistência de Enfermagem (SAE)

A SAE organiza o trabalho profissional quanto ao método, pessoal e instrumentos, tornando possível a operacionalização do Processo de Enfermagem.

## Etapas do Processo de Enfermagem
1. **Coleta de dados (Histórico)**: Anamnese e exame físico.
2. **Diagnóstico de Enfermagem**: Julgamento clínico sobre as respostas da pessoa.
3. **Planejamento**: Determinação dos resultados esperados e intervenções.
4. **Implementação**: Realização das ações.
5. **Avaliação**: Análise da evolução do paciente.

## Importância Legal
A SAE é obrigatória em instituições de saúde públicas e privadas e assegura a qualidade da assistência.`,
  },
  {
    id: '3',
    categoryId: CategoryId.TEC_FARMACIA,
    title: 'Farmacocinética: Absorção e Distribuição',
    tags: ['Farmacologia', 'Básico'],
    content: `# Farmacocinética

Estudo do movimento do fármaco no organismo. "O que o organismo faz com o fármaco".

## Absorção
Passagem do fármaco do local de administração para a corrente sanguínea. Fatores que influenciam:
- Via de administração (Oral, IV, IM)
- Solubilidade do fármaco
- pH do meio

## Distribuição
Transporte do fármaco pelo sangue até os tecidos. Depende de:
- Fluxo sanguíneo regional
- Ligação às proteínas plasmáticas (Albumina)
- Permeabilidade capilar

## Metabolismo e Excreção
Ocorrem principalmente no fígado (biotransformação) e rins (eliminação).`,
  },
  {
    id: '4',
    categoryId: CategoryId.ANALISES_CLINICAS,
    title: 'Colheita de Sangue Venoso',
    tags: ['Coleta', 'Pré-analítica'],
    content: `# Procedimento de Colheita de Sangue Venoso

A fase pré-analítica é responsável por cerca de 70% dos erros laboratoriais.

## Materiais Necessários
- Garrote (torniquete)
- Agulha e adaptador ou seringa
- Tubos de coleta a vácuo
- Algodão e álcool 70%

## Ordem dos Tubos
Para evitar contaminação cruzada de aditivos:
1. Frasco de Hemocultura
2. Tubo Azul (Citrato de Sódio) - Coagulação
3. Tubo Vermelho/Amarelo (Sem aditivo ou com gel) - Sorologia/Bioquímica
4. Tubo Verde (Heparina)
5. Tubo Roxo (EDTA) - Hematologia
6. Tubo Cinza (Fluoreto) - Glicose

## Cuidados
O torniquete não deve permanecer por mais de 1 minuto para evitar hemoconcentração.`,
  },
  {
    id: '5',
    categoryId: CategoryId.TEC_ENFERMAGEM,
    title: 'Sinais Vitais e Monitorização',
    tags: ['Procedimentos', 'Fundamentos'],
    content: `# Sinais Vitais (SSVV)

Os sinais vitais são indicadores das funções vitais do corpo e fornecem dados imediatos sobre o estado de saúde do paciente.

## Temperatura (T)
- Valor normal (axilar): 35,5°C a 37,2°C
- Hipertermia: > 37,8°C
- Hipotermia: < 35°C

## Pulso (P)
- Frequência cardíaca normal (adulto): 60 a 100 bpm
- Taquicardia: > 100 bpm
- Bradicardia: < 60 bpm

## Respiração (R)
- Frequência respiratória normal (adulto): 12 a 20 ipm
- Taquipneia: > 20 ipm
- Bradipneia: < 12 ipm

## Pressão Arterial (PA)
- Normal: < 120/80 mmHg (Diretrizes atuais podem variar)
- Verificar sempre o tamanho correto do manguito.

## Dor
- Considerada o 5º sinal vital. Avaliar escala de 0 a 10.`
  }
];

export const MOCK_STATS: StudyStats = {
  questionsAnswered: 342,
  accuracy: 76,
  hoursStudied: 45,
  topicsCompleted: 12,
};