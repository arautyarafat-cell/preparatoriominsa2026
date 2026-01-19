import { pipeline } from '@xenova/transformers';

let embeddingPipeline = null;

// Initialize the embedding model (lazy loading)
async function getEmbeddingPipeline() {
    if (!embeddingPipeline) {
        console.log('[Embeddings] Loading all-MiniLM-L6-v2 model...');
        embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('[Embeddings] Model loaded successfully!');
    }
    return embeddingPipeline;
}

// Generate embedding using Sentence-Transformers (all-MiniLM-L6-v2)
// This model produces 384-dimensional embeddings
export async function generateEmbedding(text) {
    const extractor = await getEmbeddingPipeline();

    // Clean and truncate text (model has 256 token limit, roughly 1000 chars)
    const cleanText = text.replace(/\n/g, ' ').trim().slice(0, 1000);

    const output = await extractor(cleanText, { pooling: 'mean', normalize: true });

    // Convert to regular array
    return Array.from(output.data);
}
