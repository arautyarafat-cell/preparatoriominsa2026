
import JSZip from 'jszip';

export interface ParsedSlide {
    title: string;
    content: string[];
    notes: string;
}

export const parsePPTX = async (file: File): Promise<ParsedSlide[]> => {
    try {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);

        // 1. Encontrar a ordem e nomes dos slides
        const presentationXml = await content.file("ppt/presentation.xml")?.async("text");
        if (!presentationXml) throw new Error("Arquivo inválido: presentation.xml não encontrado");

        const parser = new DOMParser();
        const presentationDoc = parser.parseFromString(presentationXml, "text/xml");
        const slideIds = Array.from(presentationDoc.getElementsByTagName("p:sldId")).map(id => {
            const rId = id.getAttribute("r:id");
            return rId;
        });

        const relsXml = await content.file("ppt/_rels/presentation.xml.rels")?.async("text");
        if (!relsXml) throw new Error("Arquivo inválido: rels não encontrado");

        const relsDoc = parser.parseFromString(relsXml, "text/xml");
        const relationships = Array.from(relsDoc.getElementsByTagName("Relationship"));

        const slideFiles: string[] = [];

        // Mapear rId para nomes de arquivos e ordenar corretamente
        slideIds.forEach(rId => {
            const rel = relationships.find(r => r.getAttribute("Id") === rId);
            if (rel) {
                const target = rel.getAttribute("Target");
                if (target) {
                    // O target geralmente é "slides/slide1.xml", mas pode variar
                    slideFiles.push(target.replace("slides/", ""));
                }
            }
        });

        // Se não conseguiu mapear pela ordem, tenta pegar todos os slides na pasta
        if (slideFiles.length === 0) {
            const allFiles = Object.keys(content.files);
            const slides = allFiles.filter(f => f.match(/ppt\/slides\/slide\d+\.xml/));
            // Ordenar numericamente
            slides.sort((a, b) => {
                const numA = parseInt(a.match(/slide(\d+)\.xml/)![1]);
                const numB = parseInt(b.match(/slide(\d+)\.xml/)![1]);
                return numA - numB;
            });
            slideFiles.push(...slides.map(s => s.replace("ppt/slides/", "")));
        }

        const parsedSlides: ParsedSlide[] = [];

        // 2. Ler cada slide
        for (const filename of slideFiles) {
            // O caminho pode variar, mas geralmente é ppt/slides/
            const slidePath = `ppt/slides/${filename.includes('/') ? filename.split('/').pop() : filename}`;
            const slideXml = await content.file(slidePath)?.async("text");

            if (!slideXml) continue;

            const slideDoc = parser.parseFromString(slideXml, "text/xml");

            // Extrair Título (geralmente o texto no placeholder de título ou o primeiro texto grande)
            let title = "";
            let texts: string[] = [];

            // Procurar texto em p:txBody (text body)
            const textBodies = Array.from(slideDoc.getElementsByTagName("p:txBody"));

            textBodies.forEach((txBody, index) => {
                const paragraphs = Array.from(txBody.getElementsByTagName("a:p"));
                const bodyText = paragraphs.map(p => {
                    return Array.from(p.getElementsByTagName("a:t"))
                        .map(t => t.textContent)
                        .join("");
                }).filter(t => t.trim()).join("\n");

                if (bodyText) {
                    // Assumir que o primeiro textBody é o título se ainda não temos um
                    // OU verificar placeholders se possível (mais complexo)
                    // Simplificação: Primeiro texto curto é título, resto é conteúdo
                    if (!title && index === 0 && bodyText.length < 100) {
                        title = bodyText;
                    } else {
                        texts.push(bodyText);
                    }
                }
            });

            // Se não achou em txBody, procura em quaquer a:t (texto solto)
            if (!title && texts.length === 0) {
                const allTexts = Array.from(slideDoc.getElementsByTagName("a:t")).map(t => t.textContent || "");
                if (allTexts.length > 0) {
                    title = allTexts[0];
                    texts = allTexts.slice(1);
                }
            }

            // Tentar recuperar notas
            // As notas ficam em ppt/notesSlides/notesSlideX.xml e precisam de mapeamento via rels do slide
            // Por simplicidade, vamos pular notas nesta versão inicial ou implementar se crítico.

            parsedSlides.push({
                title: title || `Slide ${parsedSlides.length + 1}`,
                content: texts.filter(t => t.trim().length > 0),
                notes: ""
            });
        }

        return parsedSlides;

    } catch (error) {
        console.error("Erro ao processar PPTX:", error);
        throw new Error("Falha ao processar arquivo PowerPoint. " + (error instanceof Error ? error.message : ""));
    }
};
