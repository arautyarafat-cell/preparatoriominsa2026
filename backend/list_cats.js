import { supabase } from './src/lib/supabase.js';
(async () => {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name');

    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
})();
