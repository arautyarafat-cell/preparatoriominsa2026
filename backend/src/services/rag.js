import { generateEmbedding } from './embeddings.js';
import { supabase } from '../lib/supabase.js';

// Search relevant content using embeddings
export async function searchContext(query, category_id = null) {
    try {
        const embedding = await generateEmbedding(query);

        // Build the RPC call parameters
        const rpcParams = {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5
        };

        // Add category filter if provided
        if (category_id) {
            rpcParams.filter_category_id = category_id;
        }

        const { data: documents, error } = await supabase.rpc('match_materials_384', rpcParams);

        if (error) {
            console.warn('Error searching context:', error.message);
            return '';
        }

        if (!documents || documents.length === 0) {
            return '';
        }

        return documents.map(doc => doc.content).join('\n---\n');
    } catch (e) {
        console.warn('RAG search failed:', e.message);
        return '';
    }
}

// Store new content with its embedding
export async function processAndStoreContent(content, metadata = {}, category_id = null) {
    // Simple chunking strategy (split by paragraphs)
    const chunks = content.split(/\n\s*\n/);
    let processedCount = 0;

    for (const chunk of chunks) {
        if (chunk.trim().length < 50) continue; // Skip too small chunks

        try {
            const embedding = await generateEmbedding(chunk);

            const insertData = {
                content: chunk.trim(),
                metadata,
                embedding_384: embedding  // Use the 384-dim column
            };

            // Associate with category if provided
            if (category_id) {
                insertData.category_id = category_id;
            }

            const { error } = await supabase.from('materials').insert(insertData);

            if (error) {
                console.error('Error storing chunk:', error);
                throw error;
            }

            processedCount++;
        } catch (err) {
            console.error('Error processing chunk:', err.message);
            throw err;
        }
    }

    console.log(`[RAG] Processed and stored ${processedCount} chunks`);
    return processedCount;
}
