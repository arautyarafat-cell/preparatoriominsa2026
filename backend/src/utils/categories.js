import { supabase } from '../lib/supabase.js';

const CATEGORY_NAME_MAP = {
    'MEDICO': 'Médicos',
    'ENFERMAGEM': 'Enfermeiros',
    'TEC_ENFERMAGEM': 'Técnicos de Enfermagem',
    'TEC_FARMACIA': 'Técnicos de Farmácia',
    'ANALISES_CLINICAS': 'Técnicos de Análises Clínicas'
};

export const getCategoryId = async (idOrCode) => {
    if (!idOrCode) return null;

    // Check if valid UUID v4
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode)) {
        return idOrCode;
    }

    // Try to find by mapped name
    const name = CATEGORY_NAME_MAP[idOrCode];
    if (name) {
        const { data, error } = await supabase.from('categories').select('id').eq('name', name).single();
        if (data) {
            console.log(`[CategoryResolver] Resolved ${idOrCode} -> ${data.id}`);
            return data.id;
        }
        if (error) {
            console.warn(`[CategoryResolver] Error finding category by name "${name}":`, error.message);
        }
    }

    // Try partial name match as fallback
    const { data, error } = await supabase.from('categories').select('id').ilike('name', `%${idOrCode}%`).maybeSingle();
    if (data) {
        console.log(`[CategoryResolver] Resolved partial ${idOrCode} -> ${data.id}`);
        return data.id;
    }
    if (error) {
        console.warn(`[CategoryResolver] Error in partial search:`, error.message);
    }

    // Return null instead of the original code to prevent UUID type errors
    console.warn(`[CategoryResolver] Could not resolve category for code: ${idOrCode}`);
    return null;
};
