
import { supabase } from './src/lib/supabase.js';

async function checkQuestions() {
    console.log("Checking Questions distribution...");

    const { data: categories } = await supabase.from('categories').select('id, name');
    console.log("Categories:", categories);

    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, category_id, content');

    if (error) {
        console.error("Error fetching questions:", error);
        return;
    }

    console.log(`Total Questions: ${questions.length}`);

    const counts = {};
    questions.forEach(q => {
        const cat = categories.find(c => c.id === q.category_id)?.name || 'Unknown/Null';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    console.log("Counts by Category:", counts);
}

checkQuestions();
