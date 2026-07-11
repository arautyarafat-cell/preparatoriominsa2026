/**
 * Health Check Endpoint
 * 
 * Endpoint público para monitoramento de disponibilidade e diagnóstico.
 * Usado por serviços como UptimeRobot, Render keep-alive, e diagnóstico interno.
 * 
 * Características:
 * - Sem autenticação necessária
 * - Query leve ao banco (SELECT 1)
 * - Resposta rápida para não impactar performance
 * - Informações de status da API e banco de dados
 */

import { supabase } from '../lib/supabase.js';

export default async function healthRoutes(fastify) {
    /**
     * GET /health
     * 
     * Endpoint principal de health check.
     * Verifica:
     * - Status da API (sempre ok se responder)
     * - Status da conexão com o banco de dados Supabase/Postgres
     * - Timestamp da verificação
     */
    fastify.get('/health', {
        schema: {
            description: 'Health check endpoint para monitoramento de disponibilidade',
            tags: ['health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['healthy', 'degraded'] },
                        timestamp: { type: 'string', format: 'date-time' },
                        uptime: { type: 'number' },
                        api: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', enum: ['ok', 'error'] },
                                version: { type: 'string' }
                            }
                        },
                        database: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', enum: ['connected', 'disconnected'] },
                                latency_ms: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const startTime = Date.now();

        // Status da API (sempre ok se chegou aqui)
        const apiStatus = {
            status: 'ok',
            version: '1.0.0'
        };

        // Verificar conexão com o banco de dados (query leve)
        let databaseStatus = {
            status: 'disconnected',
            latency_ms: 0
        };

        try {
            const dbStartTime = Date.now();

            // Query mais leve possível - apenas verifica se a conexão funciona
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .limit(1)
                .maybeSingle();

            const dbLatency = Date.now() - dbStartTime;

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = row not found - não é erro de conexão
                databaseStatus = {
                    status: 'disconnected',
                    latency_ms: dbLatency,
                    error: error.message
                };
            } else {
                databaseStatus = {
                    status: 'connected',
                    latency_ms: dbLatency
                };
            }
        } catch (err) {
            databaseStatus = {
                status: 'disconnected',
                latency_ms: 0,
                error: 'Connection failed'
            };
        }

        // Status geral
        const overallStatus = databaseStatus.status === 'connected' ? 'healthy' : 'degraded';

        // Construir resposta
        const response = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            api: apiStatus,
            database: databaseStatus
        };

        // Sempre retorna 200 para que o monitoramento funcione
        // O campo "status" indica se há problemas
        return reply.code(200).send(response);
    });

    /**
     * GET /health/ping
     * 
     * Endpoint mínimo de ping - resposta mais rápida possível.
     * Usado quando só precisa verificar se o servidor está respondendo.
     */
    fastify.get('/health/ping', {
        schema: {
            description: 'Ping simples - resposta mínima',
            tags: ['health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        pong: { type: 'boolean' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return reply.code(200).send({
            pong: true,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * HEAD /health
     * 
     * Versão HEAD para monitoramento sem body (economiza bandwidth).
     */
    fastify.head('/health', async (request, reply) => {
        return reply.code(200).send();
    });
}
