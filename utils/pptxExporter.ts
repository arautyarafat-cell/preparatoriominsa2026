/**
 * Exportador de Slides para PowerPoint (.pptx)
 * Usa pptxgenjs para criar arquivos compatíveis com Microsoft PowerPoint
 */

import PptxGenJS from 'pptxgenjs';

export interface SlideData {
    titulo: string;
    conteudoPrincipal: string;
    pontosChave?: { titulo: string; descricao: string }[];
    conceito?: string;
    relevanciaProva?: 'alta' | 'media' | 'baixa';
}

export interface ExportOptions {
    titulo: string;
    autor?: string;
    tema?: 'azul' | 'verde' | 'vermelho' | 'roxo' | 'laranja';
}

// Cores dos temas
const TEMAS = {
    azul: { primary: '0066CC', secondary: '003366', accent: 'E6F0FF' },
    verde: { primary: '228B22', secondary: '006400', accent: 'E8F5E9' },
    vermelho: { primary: 'CC0000', secondary: '800000', accent: 'FFEBEE' },
    roxo: { primary: '6A1B9A', secondary: '4A148C', accent: 'F3E5F5' },
    laranja: { primary: 'E65100', secondary: 'BF360C', accent: 'FFF3E0' }
};

/**
 * Exporta slides para um arquivo PowerPoint (.pptx)
 */
export const exportToPPTX = async (
    slides: SlideData[],
    options: ExportOptions
): Promise<void> => {
    const pptx = new PptxGenJS();

    // Configurações do documento
    pptx.author = options.autor || 'Angola Saúde 2026';
    pptx.title = options.titulo;
    pptx.subject = 'Aula Digital';
    pptx.company = 'Preparatório MINSA 2026';

    // Layout 16:9
    pptx.layout = 'LAYOUT_16x9';

    const tema = TEMAS[options.tema || 'azul'];

    // Slide de capa
    const slideCapa = pptx.addSlide();

    // Fundo gradiente para capa
    slideCapa.background = { color: tema.primary };

    // Título principal centralizado
    slideCapa.addText(options.titulo, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1.5,
        fontSize: 44,
        fontFace: 'Calibri',
        color: 'FFFFFF',
        bold: true,
        align: 'center',
        valign: 'middle'
    });

    // Subtítulo
    slideCapa.addText('Aula Digital - Preparatório MINSA 2026', {
        x: 0.5,
        y: 4.2,
        w: 9,
        h: 0.5,
        fontSize: 20,
        fontFace: 'Calibri',
        color: 'FFFFFF',
        align: 'center'
    });

    // Data
    slideCapa.addText(new Date().toLocaleDateString('pt-PT'), {
        x: 0.5,
        y: 5,
        w: 9,
        h: 0.4,
        fontSize: 14,
        fontFace: 'Calibri',
        color: 'CCCCCC',
        align: 'center'
    });

    // Processar cada slide
    slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();

        // Fundo branco
        slide.background = { color: 'FFFFFF' };

        // Barra superior colorida
        slide.addShape('rect' as PptxGenJS.ShapeType, {
            x: 0,
            y: 0,
            w: 10,
            h: 0.08,
            fill: { color: tema.primary }
        });

        // Título do slide
        slide.addText(slideData.titulo, {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.8,
            fontSize: 32,
            fontFace: 'Calibri',
            color: tema.secondary,
            bold: true
        });

        // Linha separadora
        slide.addShape('line' as PptxGenJS.ShapeType, {
            x: 0.5,
            y: 1.15,
            w: 9,
            h: 0,
            line: { color: tema.primary, width: 2 }
        });

        // Conteúdo principal
        // Remover tags HTML e converter para texto simples
        const conteudoLimpo = slideData.conteudoPrincipal
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();

        slide.addText(conteudoLimpo, {
            x: 0.5,
            y: 1.4,
            w: 9,
            h: 2,
            fontSize: 18,
            fontFace: 'Calibri',
            color: '333333',
            valign: 'top',
            wrap: true
        });

        // Pontos chave como bullets
        if (slideData.pontosChave && slideData.pontosChave.length > 0) {
            const pontosY = 3.5;

            // Título da seção de pontos chave
            slide.addText('Pontos-Chave:', {
                x: 0.5,
                y: pontosY - 0.4,
                w: 9,
                h: 0.4,
                fontSize: 16,
                fontFace: 'Calibri',
                color: tema.primary,
                bold: true
            });

            // Bullets com pontos chave
            const bulletItems = slideData.pontosChave.map(ponto => ({
                text: `${ponto.titulo}: ${ponto.descricao}`,
                options: {
                    bullet: { type: 'bullet' as const, color: tema.primary },
                    color: '444444'
                }
            }));

            slide.addText(bulletItems, {
                x: 0.7,
                y: pontosY,
                w: 8.5,
                h: 1.5,
                fontSize: 14,
                fontFace: 'Calibri',
                valign: 'top'
            });
        }

        // Conceito central (rodapé)
        if (slideData.conceito) {
            slide.addShape('rect' as PptxGenJS.ShapeType, {
                x: 0.5,
                y: 4.8,
                w: 9,
                h: 0.6,
                fill: { color: tema.accent }
            });

            slide.addText(`💡 ${slideData.conceito}`, {
                x: 0.6,
                y: 4.85,
                w: 8.8,
                h: 0.5,
                fontSize: 12,
                fontFace: 'Calibri',
                color: tema.secondary,
                italic: true
            });
        }

        // Número do slide
        slide.addText(`${index + 1}`, {
            x: 9.2,
            y: 5.2,
            w: 0.5,
            h: 0.3,
            fontSize: 10,
            fontFace: 'Calibri',
            color: '999999',
            align: 'right'
        });

        // Indicador de relevância
        if (slideData.relevanciaProva) {
            const cores = {
                alta: 'CC0000',
                media: 'FF9900',
                baixa: '00AA00'
            };

            slide.addText(`● ${slideData.relevanciaProva.toUpperCase()}`, {
                x: 8.5,
                y: 0.4,
                w: 1,
                h: 0.3,
                fontSize: 8,
                fontFace: 'Calibri',
                color: cores[slideData.relevanciaProva],
                bold: true,
                align: 'right'
            });
        }
    });

    // Slide final
    const slideFinal = pptx.addSlide();
    slideFinal.background = { color: tema.primary };

    slideFinal.addText('Fim da Apresentação', {
        x: 0.5,
        y: 2.2,
        w: 9,
        h: 1,
        fontSize: 40,
        fontFace: 'Calibri',
        color: 'FFFFFF',
        bold: true,
        align: 'center'
    });

    slideFinal.addText('Bom estudo! 📚', {
        x: 0.5,
        y: 3.3,
        w: 9,
        h: 0.6,
        fontSize: 24,
        fontFace: 'Calibri',
        color: 'FFFFFF',
        align: 'center'
    });

    slideFinal.addText('Angola Saúde 2026 - Preparatório MINSA', {
        x: 0.5,
        y: 4.5,
        w: 9,
        h: 0.4,
        fontSize: 14,
        fontFace: 'Calibri',
        color: 'CCCCCC',
        align: 'center'
    });

    // Gerar e download
    const filename = `${options.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
    await pptx.writeFile({ fileName: filename });
};

/**
 * Exporta slides como Blob (útil para uploads)
 */
export const exportToPPTXBlob = async (
    slides: SlideData[],
    options: ExportOptions
): Promise<Blob> => {
    const pptx = new PptxGenJS();

    pptx.author = options.autor || 'Angola Saúde 2026';
    pptx.title = options.titulo;
    pptx.layout = 'LAYOUT_16x9';

    const tema = TEMAS[options.tema || 'azul'];

    // ... (mesma lógica de criação de slides)
    // Simplificado para retornar Blob

    slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' };

        slide.addText(slideData.titulo, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 1,
            fontSize: 32,
            fontFace: 'Calibri',
            color: tema.secondary,
            bold: true
        });

        const conteudoLimpo = slideData.conteudoPrincipal.replace(/<[^>]*>/g, '');
        slide.addText(conteudoLimpo, {
            x: 0.5,
            y: 1.6,
            w: 9,
            h: 3,
            fontSize: 18,
            fontFace: 'Calibri',
            color: '333333'
        });
    });

    return await pptx.write({ outputType: 'blob' }) as Blob;
};
