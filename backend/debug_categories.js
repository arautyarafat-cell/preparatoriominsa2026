import { supabase } from './src/lib/supabase.js';

async function main() {
    console.log("Checking for orphaned questions...");

    // Get all valid categories
    const { data: categories } = await supabase.from('categories').select('id, name');

    if (!categories) {
        console.log("No categories found in DB.");
        return;
    }

    console.log("Valid Categories:");
    categories.forEach(c => console.log(` - ${c.name} (${c.id})`));

    // Get count of questions
    const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    console.log(`\nTotal questions: ${count}`);

    // Get distinct category_ids from questions
    const { data: distinctCats, error } = await supabase
        .from('questions')
        .select('category_id');

    if (error) {
        console.error("Error fetching question categories:", error);
        return;
    }

    // Process unique IDs
    const uniqueQuestionCatIds = [...new Set(distinctCats.map(q => q.category_id))];

    console.log("\nCategory IDs found in Questions table:");
    uniqueQuestionCatIds.forEach(id => {
        const matching = categories.find(c => c.id === id);
        console.log(` - ${id}: ${matching ? "MATCHES '" + matching.name + "'" : "!!! ORPHANED !!!"}`);
    });
}

main();
