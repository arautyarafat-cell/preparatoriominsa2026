import { processAndStoreContent } from '../services/rag.js';
import { supabase } from '../lib/supabase.js';
import { getCategoryId } from '../utils/categories.js';
import { processDocument, cleanText } from '../services/textProcessor.js';

export default async function uploadRoutes(fastify, options) {
    fastify.post('/upload', async (request, reply) => {
        let content, metadata, category_id, filename;

        // Limpar metadados
        metadata = {};

        try {
            if (request.isMultipart()) {
                const parts = request.parts();

                for await (const part of parts) {
                    if (part.file) {
                        try {
                            const buffer = await part.toBuffer();
                            filename = part.filename;

                            if (part.mimetype === 'application/pdf') {
                                const { extractTextFromBuffer } = await import('../services/pdf.js');
                                content = await extractTextFromBuffer(buffer);
                                metadata.filename = part.filename;
                                metadata.type = 'pdf';
                            } else {
                                // Assume text/plain
                                content = buffer.toString('utf-8');
                                metadata.filename = part.filename;
                                metadata.type = 'text';
                            }
                        } catch (err) {
                            console.error("File processing error:", err);
                            return reply.code(400).send({ error: 'Erro ao processar arquivo: ' + err.message });
                        }
                    } else {
                        // Fields
                        if (part.fieldname === 'category_id') {
                            category_id = part.value;
                        }
                        if (part.fieldname === 'metadata') {
                            try {
                                const meta = JSON.parse(part.value);
                                Object.assign(metadata, meta);
                            } catch (e) { }
                        }
                    }
                }
            } else {
                // Handle JSON body
                const body = request.body;
                content = body.content;
                metadata = body.metadata || {};
                category_id = body.category_id;
                filename = metadata.filename || 'documento';
            }

            if (!content) {
                return reply.code(400).send({ error: 'Conteúdo é obrigatório (arquivo ou texto)' });
            }

            // Resolve Category ID
            if (category_id) category_id = await getCategoryId(category_id);

            console.log(`[Upload] Processando conteúdo. Tipo: ${metadata.type || 'text'}, Tamanho: ${content.length} chars`);

            // Process and structure the content
            const processed = processDocument(content, filename || metadata.filename || 'Documento');
            console.log(`[Upload] Documento processado: ${processed.sectionCount} seções, ${processed.wordCount} palavras`);

            // 1. Create a Study Topic if category is provided
            if (category_id) {
                const { error: topicError } = await supabase
                    .from('study_topics')
                    .insert({
                        category_id,
                        title: processed.title,
                        content: processed.content,  // Use formatted Markdown content
                        summary: processed.summary,  // Add summary field
                        tags: ['Importado', metadata.type || 'text', ...processed.sections.slice(0, 5)]
                    });

                if (topicError) {
                    console.warn("Failed to create study topic:", topicError);
                } else {
                    console.log(`[Upload] Tópico de estudo criado: ${processed.title}`);
                }
            }

            // 2. Process for RAG (Search/AI) - use cleaned text
            await processAndStoreContent(cleanText(content), metadata, category_id);

            return {
                success: true,
                message: 'Conteúdo processado e disponível nos módulos de estudo.',
                details: {
                    title: processed.title,
                    sections: processed.sectionCount,
                    words: processed.wordCount
                }
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error: ' + error.message });
        }
    });
}
