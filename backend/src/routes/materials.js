import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCategoryId } from '../utils/categories.js';
import { pipeline } from 'stream';
import util from 'util';

const pump = util.promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');

export default async function materialRoutes(fastify, options) {

    // Upload material
    fastify.post('/materials', async (request, reply) => {
        try {
            const parts = request.parts();
            let title = 'Sem título';
            let category_id = null;
            let fileInfo = null;

            for await (const part of parts) {
                if (part.file) {
                    const filename = `${Date.now()}-${part.filename.replace(/\s+/g, '_')}`;
                    const savePath = path.join(UPLOAD_DIR, filename);

                    // Create dir if not exists (redundant if mkdir already run but safe)
                    if (!fs.existsSync(UPLOAD_DIR)) {
                        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
                    }

                    await pump(part.file, fs.createWriteStream(savePath));

                    fileInfo = {
                        path: `/uploads/${filename}`,
                        type: part.mimetype
                    };
                } else {
                    if (part.fieldname === 'title') title = part.value;
                    if (part.fieldname === 'category_id') category_id = part.value;
                }
            }

            if (!fileInfo) {
                return reply.code(400).send({ error: 'Nenhum arquivo enviado' });
            }

            // Get file size
            const stats = fs.statSync(path.join(UPLOAD_DIR, path.basename(fileInfo.path)));
            const sizeMB = (stats.size / 1024 / 1024).toFixed(1) + ' MB';

            // Resolve Category ID
            if (category_id) category_id = await getCategoryId(category_id);

            const { data, error } = await supabase
                .from('materials')
                .insert({
                    title,
                    category_id,
                    file_path: fileInfo.path,
                    file_type: 'PDF',
                    file_size: sizeMB
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // Get materials by category ID
    fastify.get('/materials/category/:categoryId', async (request, reply) => {
        const { categoryId } = request.params;
        try {
            const resolvedId = await getCategoryId(categoryId);

            if (!resolvedId) {
                return { success: true, materials: [] };
            }

            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .eq('category_id', resolvedId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, materials: data || [] };
        } catch (error) {
            console.error('Error fetching materials by category:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // Get materials by array of IDs (para materiais complementares de aulas)
    fastify.post('/materials/by-ids', async (request, reply) => {
        const { ids } = request.body;
        try {
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return { success: true, materials: [] };
            }

            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .in('id', ids)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, materials: data || [] };
        } catch (error) {
            console.error('Error fetching materials by IDs:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // List materials
    fastify.get('/materials', async (request, reply) => {
        const { category_id } = request.query;
        try {
            let query = supabase.from('materials').select('*').order('created_at', { ascending: false });

            if (category_id) {
                const resolvedId = await getCategoryId(category_id);
                if (resolvedId) {
                    query = query.eq('category_id', resolvedId);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Delete material
    fastify.delete('/materials/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            // Get file path first
            const { data: item, error: fetchError } = await supabase
                .from('materials')
                .select('file_path')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Delete from DB
            const { error: deleteError } = await supabase
                .from('materials')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Delete file from disk
            if (item && item.file_path) {
                const filePath = path.join(UPLOAD_DIR, path.basename(item.file_path));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            return { success: true };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
