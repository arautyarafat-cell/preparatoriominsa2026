// Script para criar a tabela game_cases e depois inserir os casos
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas!');
    process.exit(1);
}

console.log('✅ Supabase conectado!');

const supabase = createClient(supabaseUrl, supabaseKey);

// Primeiro, verificar se a tabela existe tentando uma query
async function createTableIfNeeded() {
    console.log('\n📋 Verificando se tabela game_cases existe...');

    const { error: checkError } = await supabase.from('game_cases').select('id').limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
        console.log('⚠️ Tabela não existe. Criando via SQL...');

        // Usar a API de RPC para executar SQL (precisa ter função no Supabase)
        // Como alternativa, vamos tentar criar usando o método rpc
        console.log('\n⚠️ A tabela game_cases precisa ser criada manualmente no Supabase.');
        console.log('\n📝 Execute o seguinte SQL no Supabase SQL Editor:\n');
        console.log(`
CREATE TABLE IF NOT EXISTS game_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL,
    difficulty INTEGER DEFAULT 5,
    case_data JSONB NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_cases_category_used ON game_cases(category_id, used);
        `);
        return false;
    }

    console.log('✅ Tabela game_cases existe!');
    return true;
}

const CASES = [
    // TEC_ENFERMAGEM - 8 casos
    { category_id: 'TEC_ENFERMAGEM', difficulty: 3, case_data: { "name": "Maria Santos", "age": 68, "gender": "F", "avatar": "👵", "complaint": "Tontura ao levantar e fraqueza nas pernas", "vitals": { "bp": "90/60", "hr": "98", "temp": "36.2", "spo2": "96" }, "disease": "Hipotensão Postural", "options": ["Hipotensão Postural", "Hipertensão Arterial", "Arritmia Cardíaca", "Desidratação Grave"], "questions": [{ "text": "Quando começou a tontura?", "answer": "Sempre que levanto da cama ou cadeira", "clue": "Característica de hipotensão postural" }, { "text": "Está tomando algum medicamento?", "answer": "Sim, remédio para pressão alta", "clue": "Anti-hipertensivos podem causar hipotensão" }, { "text": "Bebeu água hoje?", "answer": "Pouca, não tenho sede", "clue": "Hidratação inadequada em idosos" }], "exams": { "sinaisVitais": "PA deitada: 120/80, PA em pé: 90/60", "glicemia": "95 mg/dL - Normal", "escalaGlasgow": "15 - Alerta", "escalaDor": "2/10", "balanco": "Negativo" }, "treatment": "Orientar mudanças posturais lentas, aumentar hidratação", "conduct": "Manter paciente deitada, elevar membros inferiores", "explanation": "Queda de pressão ao mudar de posição indica hipotensão postural." } },

    { category_id: 'TEC_ENFERMAGEM', difficulty: 4, case_data: { "name": "João Ferreira", "age": 72, "gender": "M", "avatar": "👴", "complaint": "Sudorese fria e tremores", "vitals": { "bp": "110/70", "hr": "110", "temp": "36.0", "spo2": "98" }, "disease": "Hipoglicemia", "options": ["Hipoglicemia", "Infarto do Miocárdio", "Crise de Ansiedade", "Febre"], "questions": [{ "text": "Tomou café da manhã hoje?", "answer": "Não, acordei atrasado", "clue": "Jejum prolongado" }, { "text": "É diabético?", "answer": "Sim, tomo insulina", "clue": "Insulina sem alimentação = hipoglicemia" }, { "text": "Como está se sentindo?", "answer": "Confuso e com fome", "clue": "Sintomas clássicos" }], "exams": { "sinaisVitais": "Taquicardia, sudorese", "glicemia": "48 mg/dL - BAIXA", "escalaGlasgow": "14 - Confuso", "escalaDor": "0/10", "balanco": "Jejum" }, "treatment": "Administrar glicose oral ou IV", "conduct": "Oferecer suco com açúcar, monitorar glicemia", "explanation": "Diabético em uso de insulina + jejum = hipoglicemia." } },

    { category_id: 'TEC_ENFERMAGEM', difficulty: 5, case_data: { "name": "Ana Luísa Mendes", "age": 45, "gender": "F", "avatar": "👩", "complaint": "Dificuldade para respirar", "vitals": { "bp": "140/90", "hr": "105", "temp": "36.5", "spo2": "91" }, "disease": "Oxigenação Inadequada", "options": ["Oxigenação Inadequada", "Ataque de Pânico", "Hipertensão", "Febre Alta"], "questions": [{ "text": "Há quanto tempo está com falta de ar?", "answer": "Começou há 2 horas, piorando", "clue": "Progressão indica problema respiratório" }, { "text": "Tem asma?", "answer": "Sim, desde criança", "clue": "Histórico de doença respiratória" }, { "text": "Usou a bombinha?", "answer": "Sim, mas não aliviou", "clue": "Broncoespasmo não controlado" }], "exams": { "sinaisVitais": "FR: 28 irpm", "glicemia": "110 mg/dL", "escalaGlasgow": "15", "escalaDor": "3/10", "balanco": "Normal" }, "treatment": "Oxigenoterapia, nebulização, posição Fowler", "conduct": "Elevar cabeceira, instalar O2, chamar enfermeiro", "explanation": "Saturação de 91% indica hipoxemia." } },

    { category_id: 'TEC_ENFERMAGEM', difficulty: 3, case_data: { "name": "Pedro Alves", "age": 82, "gender": "M", "avatar": "👴", "complaint": "Não consegue urinar há 12 horas", "vitals": { "bp": "150/95", "hr": "88", "temp": "37.2", "spo2": "97" }, "disease": "Retenção Urinária", "options": ["Retenção Urinária", "Infecção Urinária", "Insuficiência Renal", "Desidratação"], "questions": [{ "text": "Sente dor na barriga?", "answer": "Sim, está muito inchada", "clue": "Bexigoma palpável" }, { "text": "Tem problema de próstata?", "answer": "Sim, hiperplasia", "clue": "Causa comum em homens idosos" }, { "text": "Tentou urinar?", "answer": "Várias vezes, sai gotas", "clue": "Obstrução" }], "exams": { "sinaisVitais": "Abdome distendido", "glicemia": "105 mg/dL", "escalaGlasgow": "15", "escalaDor": "6/10", "balanco": "Débito: 0ml" }, "treatment": "Cateterismo vesical de alívio", "conduct": "Comunicar enfermeiro, preparar material para sondagem", "explanation": "Ausência de diurese + distensão + HPB indica retenção urinária." } },

    { category_id: 'TEC_ENFERMAGEM', difficulty: 4, case_data: { "name": "Conceição Oliveira", "age": 78, "gender": "F", "avatar": "👵", "complaint": "Pele muito vermelha nas costas", "vitals": { "bp": "130/85", "hr": "78", "temp": "36.8", "spo2": "96" }, "disease": "Risco de Úlcera por Pressão", "options": ["Risco de Úlcera por Pressão", "Alergia de Contato", "Queimadura", "Infecção de Pele"], "questions": [{ "text": "Há quanto tempo está acamada?", "answer": "5 dias, desde a cirurgia", "clue": "Imobilidade prolongada" }, { "text": "Mudaram sua posição?", "answer": "Poucas vezes", "clue": "Falta de mudança de decúbito" }, { "text": "A pele está íntegra?", "answer": "Está vermelha mas sem ferida", "clue": "Estágio 1" }], "exams": { "sinaisVitais": "Estáveis", "glicemia": "98 mg/dL", "escalaBraden": "12 - Alto risco", "escalaDor": "5/10 sacral", "balanco": "Normal" }, "treatment": "Mudança de decúbito a cada 2h, colchão pneumático", "conduct": "Reposicionar paciente, aplicar AGE, comunicar enfermeiro", "explanation": "Hiperemia + imobilidade + Braden baixo = alto risco de úlcera." } },

    { category_id: 'TEC_ENFERMAGEM', difficulty: 5, case_data: { "name": "Francisco Soares", "age": 55, "gender": "M", "avatar": "👨", "complaint": "Vômitos persistentes e dor abdominal", "vitals": { "bp": "100/60", "hr": "115", "temp": "37.5", "spo2": "97" }, "disease": "Desidratação", "options": ["Desidratação", "Apendicite", "Gastrite", "Intoxicação Alimentar"], "questions": [{ "text": "Há quanto tempo está vomitando?", "answer": "Desde ontem à noite", "clue": "Perdas volémicas" }, { "text": "Conseguiu beber água?", "answer": "Não, vomito tudo", "clue": "Incapacidade de reposição oral" }, { "text": "Sua boca está seca?", "answer": "Muito, a língua parece papel", "clue": "Sinal de desidratação" }], "exams": { "sinaisVitais": "Hipotensão, taquicardia", "glicemia": "85 mg/dL", "escalaGlasgow": "15", "escalaDor": "5/10", "balanco": "Negativo" }, "treatment": "Hidratação IV, antieméticos", "conduct": "Puncionar acesso calibroso, iniciar SF 0,9%", "explanation": "Vômitos + mucosas secas + taquicardia + hipotensão = desidratação." } },

    { category_id: 'TEC_ENFERMAGEM', difficulty: 4, case_data: { "name": "Regina Celia", "age": 62, "gender": "F", "avatar": "👩", "complaint": "Está muito agitada, tentando arrancar o soro", "vitals": { "bp": "145/90", "hr": "105", "temp": "36.8", "spo2": "96" }, "disease": "Agitação Psicomotora", "options": ["Agitação Psicomotora", "Ansiedade", "Hipóxia", "Dor Não Controlada"], "questions": [{ "text": "Ela está orientada?", "answer": "Não sabe onde está", "clue": "Desorientação" }, { "text": "Quando começou a agitação?", "answer": "Há 2 horas", "clue": "Mudança aguda" }, { "text": "Dormiu bem?", "answer": "Não, passou a noite acordada", "clue": "Privação de sono" }], "exams": { "sinaisVitais": "Taquicárdica, agitada", "glicemia": "180 mg/dL", "escalaGlasgow": "13", "escalaDor": "Impossível avaliar", "balanco": "Normal" }, "treatment": "Descartar causas orgânicas, contenção se necessário", "conduct": "Falar calmamente, ambiente tranquilo, chamar enfermeiro", "explanation": "Agitação súbita pode ser delirium." } },

    { category_id: 'TEC_ENFERMAGEM', difficulty: 5, case_data: { "name": "Luciana Pereira", "age": 42, "gender": "F", "avatar": "👩", "complaint": "Febre de 39°C há 2 horas", "vitals": { "bp": "110/70", "hr": "110", "temp": "39.2", "spo2": "97" }, "disease": "Febre Alta", "options": ["Febre Alta", "Hipotermia", "Estado Normal", "Hipertermia Maligna"], "questions": [{ "text": "Fez cirurgia recente?", "answer": "Sim, colecistectomia há 3 dias", "clue": "Risco de infecção pós-op" }, { "text": "A ferida está bem?", "answer": "Está vermelha e saindo líquido", "clue": "Sinais de infecção" }, { "text": "Tomou algo para febre?", "answer": "Não, estava esperando", "clue": "Aguardando conduta" }], "exams": { "sinaisVitais": "Febril, taquicárdica", "glicemia": "95 mg/dL", "escalaGlasgow": "15", "escalaDor": "4/10 na ferida", "balanco": "Normal" }, "treatment": "Antitérmico, compressas, comunicar sobre ferida", "conduct": "Administrar Dipirona se prescrita, descobrir paciente", "explanation": "Febre no pós-op + ferida alterada sugere infecção." } },

    // MEDICO - 5 casos
    { category_id: 'MEDICO', difficulty: 5, case_data: { "name": "Carlos Eduardo Silva", "age": 58, "gender": "M", "avatar": "👨", "complaint": "Dor forte no peito há 2 horas", "vitals": { "bp": "160/100", "hr": "95", "temp": "36.5", "spo2": "94" }, "disease": "Infarto Agudo do Miocárdio", "options": ["Infarto Agudo do Miocárdio", "Gastrite Aguda", "Pneumonia", "Costocondrite"], "questions": [{ "text": "Como é a dor?", "answer": "Aperto no peito, irradiando para braço esquerdo", "clue": "Padrão típico" }, { "text": "Tem diabetes ou hipertensão?", "answer": "Sim, ambos há 10 anos", "clue": "Fatores de risco" }, { "text": "Histórico familiar?", "answer": "Pai morreu de infarto", "clue": "HF positivo" }], "exams": { "hemograma": "Normal", "raiox": "Área cardíaca aumentada", "ecg": "Supradesnivelamento de ST em V1-V4", "usg": "Não indicado", "cultura": "Não indicado" }, "treatment": "AAS, Clopidogrel, Heparina, cateterismo", "conduct": "Monitorização, acesso venoso, oxigênio, morfina se dor", "explanation": "Dor precordial + ECG alterado + fatores de risco = IAM." } },

    { category_id: 'MEDICO', difficulty: 6, case_data: { "name": "Antônia Ferreira", "age": 34, "gender": "F", "avatar": "👩", "complaint": "Febre alta, tosse com catarro amarelo há 5 dias", "vitals": { "bp": "100/70", "hr": "110", "temp": "39.2", "spo2": "92" }, "disease": "Pneumonia Bacteriana", "options": ["Pneumonia Bacteriana", "Gripe Comum", "Tuberculose", "COVID-19"], "questions": [{ "text": "A tosse é produtiva?", "answer": "Sim, catarro amarelo-esverdeado", "clue": "Expectoração purulenta" }, { "text": "Sente dor ao respirar?", "answer": "Sim, do lado direito", "clue": "Dor pleurítica" }, { "text": "Tem falta de ar?", "answer": "Sim, piorou", "clue": "Comprometimento pulmonar" }], "exams": { "hemograma": "Leucocitose 18.000", "raiox": "Consolidação em lobo inferior direito", "ecg": "Taquicardia sinusal", "usg": "Não indicado", "cultura": "Colhida" }, "treatment": "Antibioticoterapia, hidratação", "conduct": "Internação, oxigenoterapia, antitérmicos", "explanation": "Febre + tosse produtiva + consolidação ao RX = pneumonia." } },

    { category_id: 'MEDICO', difficulty: 7, case_data: { "name": "Roberto Nascimento", "age": 62, "gender": "M", "avatar": "👴", "complaint": "Fraqueza súbita no lado direito do corpo", "vitals": { "bp": "180/110", "hr": "88", "temp": "36.6", "spo2": "97" }, "disease": "Acidente Vascular Cerebral", "options": ["Acidente Vascular Cerebral", "Enxaqueca", "Epilepsia", "Hipoglicemia"], "questions": [{ "text": "Quando começaram os sintomas?", "answer": "Há 1 hora, durante o almoço", "clue": "Início súbito" }, { "text": "Consegue levantar os braços?", "answer": "O direito não levanta", "clue": "Hemiparesia" }, { "text": "A fala está normal?", "answer": "Está enrolada", "clue": "Disartria" }], "exams": { "hemograma": "Normal", "raiox": "Não indicado", "ecg": "Fibrilação atrial", "usg": "Não indicado", "cultura": "Não indicado" }, "treatment": "TC de crânio urgente, avaliar trombólise", "conduct": "Estabilização, monitorização, NIH Stroke Scale", "explanation": "Déficit motor súbito + alteração de fala + FA = AVC." } },

    { category_id: 'MEDICO', difficulty: 5, case_data: { "name": "Laura Beatriz", "age": 28, "gender": "F", "avatar": "👩", "complaint": "Dor abdominal intensa no lado direito inferior", "vitals": { "bp": "120/80", "hr": "100", "temp": "38.0", "spo2": "98" }, "disease": "Apendicite Aguda", "options": ["Apendicite Aguda", "Cólica Menstrual", "Infecção Urinária", "Gastroenterite"], "questions": [{ "text": "Onde a dor começou?", "answer": "Na região do umbigo, depois desceu", "clue": "Migração típica" }, { "text": "Tem náuseas?", "answer": "Sim, vomitei 2 vezes", "clue": "Sintomas associados" }, { "text": "Última menstruação?", "answer": "Há 10 dias, normal", "clue": "Descarta causas ginecológicas" }], "exams": { "hemograma": "Leucocitose 14.000", "raiox": "Inespecífico", "ecg": "Normal", "usg": "Apêndice espessado 12mm", "cultura": "Não indicado" }, "treatment": "Apendicectomia de urgência", "conduct": "Jejum, hidratação, analgesia, antibiótico, preparar cirurgia", "explanation": "Dor que migrou para FID + febre + leucocitose = apendicite." } },

    { category_id: 'MEDICO', difficulty: 6, case_data: { "name": "Antônio Carlos", "age": 48, "gender": "M", "avatar": "👨", "complaint": "Dor intensa nas costas irradiando para barriga", "vitals": { "bp": "170/100", "hr": "108", "temp": "36.5", "spo2": "98" }, "disease": "Cólica Nefrética", "options": ["Cólica Nefrética", "Lombalgia Mecânica", "Pancreatite", "Aneurisma de Aorta"], "questions": [{ "text": "A dor melhora em alguma posição?", "answer": "Não consigo ficar parado", "clue": "Inquietação típica" }, { "text": "Notou sangue na urina?", "answer": "Sim, está vermelha", "clue": "Hematúria" }, { "text": "Já teve pedra nos rins?", "answer": "Sim, há 5 anos", "clue": "Histórico de litíase" }], "exams": { "hemograma": "Normal", "raiox": "Calcificação em ureter", "ecg": "Taquicardia sinusal", "usg": "Hidronefrose + cálculo 6mm", "cultura": "Não indicado" }, "treatment": "Analgesia potente, AINE, hidratação", "conduct": "Analgesia imediata, colher exames, avaliar internação", "explanation": "Dor em cólica + hematúria + cálculo ao USG = nefrolitíase." } },

    // ENFERMAGEM - 3 casos
    { category_id: 'ENFERMAGEM', difficulty: 5, case_data: { "name": "Josefa Maria", "age": 75, "gender": "F", "avatar": "👵", "complaint": "Não consegue respirar deitada", "vitals": { "bp": "150/95", "hr": "102", "temp": "36.4", "spo2": "89" }, "disease": "Padrão Respiratório Ineficaz", "options": ["Padrão Respiratório Ineficaz", "Débito Cardíaco Diminuído", "Ansiedade", "Troca de Gases Prejudicada"], "questions": [{ "text": "Há quanto tempo está assim?", "answer": "Piorou nos últimos 3 dias", "clue": "Descompensação progressiva" }, { "text": "Tem doença do coração?", "answer": "Sim, insuficiência cardíaca", "clue": "IC descompensada" }, { "text": "Os pés estão inchados?", "answer": "Muito, não cabem nos sapatos", "clue": "Edema de MMII" }], "exams": { "anamnese": "Ortopneia + DPN", "exameFisico": "Estertores em bases, edema ++/4+", "escalaBraden": "16", "escalaFugulin": "Intermediário", "historicoFamiliar": "Mãe faleceu de AVC" }, "treatment": "SAE completa, posicionamento Fowler alto, balanço hídrico", "conduct": "Prescrição de enfermagem: restrição hídrica, monitorar sinais", "explanation": "Ortopneia + estertores + edema = congestão pulmonar." } },

    { category_id: 'ENFERMAGEM', difficulty: 4, case_data: { "name": "Severino José", "age": 68, "gender": "M", "avatar": "👴", "complaint": "Inchaço generalizado e urinando pouco", "vitals": { "bp": "170/100", "hr": "78", "temp": "36.5", "spo2": "94" }, "disease": "Débito Cardíaco Diminuído", "options": ["Débito Cardíaco Diminuído", "Excesso de Volume de Líquidos", "Perfusão Tissular Ineficaz", "Intolerância à Atividade"], "questions": [{ "text": "Sente cansaço ao caminhar?", "answer": "Não consigo andar nem até o banheiro", "clue": "Intolerância severa" }, { "text": "Quanto está urinando?", "answer": "Muito pouco", "clue": "Oligúria" }, { "text": "Acorda à noite para urinar?", "answer": "Sim, 3-4 vezes", "clue": "Redistribuição noturna" }], "exams": { "anamnese": "Cardiopata, usa Furosemida e Carvedilol", "exameFisico": "Anasarca, B3 audível, hepatomegalia", "escalaBraden": "14", "escalaFugulin": "Alta dependência", "historicoFamiliar": "Irmão com IC" }, "treatment": "Monitorização hemodinâmica, controle de peso diário", "conduct": "Avaliar débito urinário, pesar, registrar ingesta e excreta", "explanation": "Edema + oligúria + B3 = IC. Diagnóstico: Débito cardíaco diminuído." } },

    { category_id: 'ENFERMAGEM', difficulty: 5, case_data: { "name": "Iracema Souza", "age": 80, "gender": "F", "avatar": "👵", "complaint": "Caiu em casa, está confusa", "vitals": { "bp": "100/65", "hr": "68", "temp": "35.8", "spo2": "95" }, "disease": "Confusão Aguda", "options": ["Confusão Aguda", "Demência", "Risco de Quedas", "Mobilidade Prejudicada"], "questions": [{ "text": "Estava confusa antes da queda?", "answer": "Não, era bem lúcida", "clue": "Mudança aguda" }, { "text": "Medicamentos novos?", "answer": "Começou Clonazepam há 3 dias", "clue": "Benzo causa confusão em idosos" }, { "text": "Bebeu água?", "answer": "Não sabemos", "clue": "Desidratação" }], "exams": { "anamnese": "Clonazepam + pouca ingesta oral", "exameFisico": "Desorientada, pele seca, turgor diminuído", "escalaBraden": "12", "escalaFugulin": "Alta dependência", "historicoFamiliar": "Sem demência" }, "treatment": "Investigar causas reversíveis, reorientação", "conduct": "CAM para delirium, hidratação, rever medicações", "explanation": "Confusão aguda + sedativo + desidratação = Delirium." } },

    // TEC_FARMACIA - 3 casos
    { category_id: 'TEC_FARMACIA', difficulty: 4, case_data: { "name": "José Roberto", "age": 72, "gender": "M", "avatar": "👴", "complaint": "Sangrando na gengiva após uso de medicamentos", "vitals": { "bp": "130/80", "hr": "70", "temp": "36.5", "spo2": "97" }, "disease": "Interação Medicamentosa", "options": ["Interação Medicamentosa", "Alergia Medicamentosa", "Superdosagem", "Subdosagem"], "questions": [{ "text": "Quais medicamentos toma?", "answer": "Varfarina, AAS e ibuprofeno", "clue": "Combinação perigosa" }, { "text": "Está sentindo algo diferente?", "answer": "Sangramento na gengiva", "clue": "Risco hemorrágico" }, { "text": "Quem receitou ibuprofeno?", "answer": "Comprei por conta", "clue": "Automedicação" }], "exams": { "prescricao": "Varfarina 5mg, AAS 100mg prescritos", "interacoes": "GRAVE: AAS + Varfarina + AINE", "alergias": "Nenhuma", "adesao": "Irregular", "estoque": "Disponível" }, "treatment": "Suspender ibuprofeno, encaminhar ao médico", "conduct": "Alertar sobre interação, orientar paracetamol", "explanation": "Varfarina + AAS + ibuprofeno = risco hemorrágico alto." } },

    { category_id: 'TEC_FARMACIA', difficulty: 3, case_data: { "name": "Maria das Dores", "age": 65, "gender": "F", "avatar": "👵", "complaint": "Medicamento parece diferente do habitual", "vitals": { "bp": "140/90", "hr": "75", "temp": "36.4", "spo2": "98" }, "disease": "Troca de Fabricante", "options": ["Troca de Fabricante", "Medicamento Vencido", "Dose Inadequada", "Falsificação"], "questions": [{ "text": "O que está diferente?", "answer": "A cor do comprimido mudou", "clue": "Possível troca de fabricante" }, { "text": "Verificou o nome na caixa?", "answer": "Está igual", "clue": "Mesmo princípio ativo" }, { "text": "Comprou onde?", "answer": "Na farmácia de sempre", "clue": "Fonte confiável" }], "exams": { "prescricao": "Atenolol 50mg", "interacoes": "Nenhuma", "alergias": "Penicilina", "adesao": "Boa", "estoque": "2 fabricantes disponíveis" }, "treatment": "Verificar lote, confirmar princípio ativo", "conduct": "Comparar com medicamento anterior, tranquilizar paciente", "explanation": "Genéricos de fabricantes diferentes podem ter aparência diferente." } },

    { category_id: 'TEC_FARMACIA', difficulty: 5, case_data: { "name": "Fernanda Costa", "age": 35, "gender": "F", "avatar": "👩", "complaint": "Manchas vermelhas após tomar antibiótico", "vitals": { "bp": "110/70", "hr": "90", "temp": "37.0", "spo2": "98" }, "disease": "Alergia Medicamentosa", "options": ["Alergia Medicamentosa", "Interação Medicamentosa", "Efeito Colateral", "Superdosagem"], "questions": [{ "text": "Quando começou?", "answer": "30 minutos após Amoxicilina", "clue": "Reação imediata" }, { "text": "Já teve alergia?", "answer": "Nunca tomei antibiótico antes", "clue": "Primeira exposição" }, { "text": "Tem coceira?", "answer": "Muita, em todo o corpo", "clue": "Urticária" }], "exams": { "prescricao": "Amoxicilina 500mg 8/8h", "interacoes": "Nenhuma", "alergias": "NOVA: Amoxicilina", "adesao": "2º dia de tratamento", "estoque": "Alternativas disponíveis" }, "treatment": "Suspender Amoxicilina, registrar alergia, avaliação médica", "conduct": "Orientar procurar hospital se piorar, nunca dispensar penicilinas", "explanation": "Urticária + prurido após antibiótico = reação alérgica." } },

    // ANALISES_CLINICAS - 3 casos
    { category_id: 'ANALISES_CLINICAS', difficulty: 5, case_data: { "name": "Cláudio Mendes", "age": 50, "gender": "M", "avatar": "👨", "complaint": "Exame de rotina, cansaço e falta de ar", "vitals": { "bp": "135/85", "hr": "78", "temp": "36.5", "spo2": "98" }, "disease": "Anemia Ferropriva", "options": ["Anemia Ferropriva", "Leucocitose", "Trombocitopenia", "Policitemia"], "questions": [{ "text": "Tem se sentido cansado?", "answer": "Sim, muito cansaço", "clue": "Sintomas de anemia" }, { "text": "Como é sua alimentação?", "answer": "Como pouca carne", "clue": "Baixa ingesta de ferro" }, { "text": "Notou sangramento?", "answer": "Fezes estão mais escuras", "clue": "Possível sangramento oculto" }], "exams": { "hemograma": "Hb: 9.5 g/dL, VCM: 68 fL, HCM: 24 pg", "bioquimica": "Ferro: 25, Ferritina: 8", "urina": "Normal", "coagulacao": "Normal", "cultura": "Não indicada" }, "treatment": "Suplementação de ferro, investigar causa", "conduct": "Liberar resultado com observação, orientar procurar médico", "explanation": "Hb baixa + VCM baixo + ferro baixo = anemia ferropriva." } },

    { category_id: 'ANALISES_CLINICAS', difficulty: 6, case_data: { "name": "Patrícia Lima", "age": 28, "gender": "F", "avatar": "👩", "complaint": "Exame de urina, ardência ao urinar há 3 dias", "vitals": { "bp": "110/70", "hr": "72", "temp": "36.8", "spo2": "99" }, "disease": "Infecção Urinária", "options": ["Infecção Urinária", "Glomerulopatia", "Contaminação", "Diabetes"], "questions": [{ "text": "Está com ardência?", "answer": "Sim, piora muito", "clue": "Disúria típica" }, { "text": "A urina está diferente?", "answer": "Mais escura e com cheiro", "clue": "Alterações características" }, { "text": "Tem febre?", "answer": "Não, só desconforto", "clue": "ITU baixa" }], "exams": { "hemograma": "Leucócitos: 11.000", "bioquimica": "Normal", "urina": "Leucócitos: +++, Nitrito: positivo, Bactérias: ++", "coagulacao": "Normal", "cultura": "Encaminhada" }, "treatment": "Antibioticoterapia conforme antibiograma", "conduct": "Liberar EAS com urgência, orientar procurar médico", "explanation": "Leucocitúria + nitrito positivo + bactérias = ITU." } },

    { category_id: 'ANALISES_CLINICAS', difficulty: 7, case_data: { "name": "Osvaldo Gomes", "age": 60, "gender": "M", "avatar": "👴", "complaint": "Exames para controle de diabetes", "vitals": { "bp": "150/95", "hr": "80", "temp": "36.5", "spo2": "97" }, "disease": "Insuficiência Renal", "options": ["Insuficiência Renal", "Diabetes Descompensado", "Infecção", "Normal"], "questions": [{ "text": "Como está o controle glicêmico?", "answer": "Não está bom", "clue": "DM mal controlado" }, { "text": "Tem inchaço?", "answer": "Sim, pernas e rosto", "clue": "Edema por retenção" }, { "text": "Urina está espumando?", "answer": "Sim, bastante espuma", "clue": "Proteinúria" }], "exams": { "hemograma": "Hb: 10.8 (anemia leve)", "bioquimica": "Creatinina: 3.2, Ureia: 85, Glicose: 210", "urina": "Proteína: +++, cilindros hialinos", "coagulacao": "Normal", "cultura": "Não indicada" }, "treatment": "Encaminhamento para nefrologista urgente", "conduct": "Resultado crítico - comunicar médico imediatamente", "explanation": "Creatinina elevada + proteinúria + anemia = insuficiência renal." } }
];

async function seedCases() {
    const tableExists = await createTableIfNeeded();

    if (!tableExists) {
        console.log('\n⚠️ Por favor, crie a tabela primeiro e execute este script novamente.');
        return;
    }

    console.log('\n🏥 Iniciando inserção de casos clínicos...\n');

    let inserted = 0;
    let errors = 0;

    for (const caseItem of CASES) {
        const { error } = await supabase.from('game_cases').insert({
            category_id: caseItem.category_id,
            difficulty: caseItem.difficulty,
            case_data: caseItem.case_data,
            used: false,
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error(`❌ Erro: ${caseItem.case_data.name} - ${error.message}`);
            errors++;
        } else {
            console.log(`✅ ${caseItem.case_data.name} (${caseItem.category_id})`);
            inserted++;
        }
    }

    console.log(`\n📊 Resumo: ${inserted} inseridos, ${errors} erros`);

    // Contar por categoria
    const { data: counts } = await supabase
        .from('game_cases')
        .select('category_id')
        .eq('used', false);

    if (counts) {
        const byCategory = {};
        counts.forEach(c => {
            byCategory[c.category_id] = (byCategory[c.category_id] || 0) + 1;
        });
        console.log('\n📁 Casos disponíveis por categoria:');
        Object.entries(byCategory).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count}`);
        });
    }
}

seedCases().then(() => {
    console.log('\n✨ Concluído!');
    process.exit(0);
}).catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
