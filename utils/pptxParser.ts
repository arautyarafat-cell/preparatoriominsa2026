
import JSZip from 'jszip';

export interface ParsedSlide {
    title: string;
    content: string[];
    notes: string;
    images: string[]; // Array de imagens em Base64
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
        const slideIdList = presentationDoc.getElementsByTagName("p:sldIdList")[0];
        const slideIds = slideIdList ? Array.from(slideIdList.getElementsByTagName("p:sldId")).map(id => {
            return id.getAttribute("r:id");
        }) : [];

        const relsXml = await content.file("ppt/_rels/presentation.xml.rels")?.async("text");
        if (!relsXml) throw new Error("Arquivo inválido: rels não encontrado");

        const relsDoc = parser.parseFromString(relsXml, "text/xml");
        const relationships = Array.from(relsDoc.getElementsByTagName("Relationship"));

        const slideFiles: string[] = [];

        // Mapear rId para nomes de arquivos mantendo a ordem
        slideIds.forEach(rId => {
            const rel = relationships.find(r => r.getAttribute("Id") === rId);
            if (rel) {
                const target = rel.getAttribute("Target");
                if (target) {
                    slideFiles.push(target.replace("slides/", ""));
                }
            }
        });

        // Fallback: Se não achou mapeamento, pegar todos da pasta slides
        if (slideFiles.length === 0) {
            const allFiles = Object.keys(content.files);
            const slides = allFiles.filter(f => f.match(/ppt\/slides\/slide\d+\.xml/));
            slides.sort((a, b) => {
                const numA = parseInt(a.match(/slide(\d+)\.xml/)![1] || "0");
                const numB = parseInt(b.match(/slide(\d+)\.xml/)![1] || "0");
                return numA - numB;
            });
            slideFiles.push(...slides.map(s => s.replace("ppt/slides/", "")));
        }

        const parsedSlides: ParsedSlide[] = [];

        // Função auxiliar para extrair texto de um nó e seus filhos recursivamente
        const extractTextFromNode = (node: Element, texts: string[]) => {
            // Se for um parágrafo (a:p)
            if (node.tagName === "a:p") {
                const paragraphText = Array.from(node.getElementsByTagName("a:t"))
                    .map(t => t.textContent || "")
                    .join("");
                if (paragraphText.trim()) {
                    texts.push(paragraphText);
                }
                return;
            }

            // Se for uma tabela (a:tbl), processar linhas e células
            if (node.tagName === "a:tbl") {
                const rows = Array.from(node.getElementsByTagName("a:tr"));
                rows.forEach(row => {
                    const cells = Array.from(row.getElementsByTagName("a:tc"));
                    const cellTexts = cells.map(cell => {
                        const cellParagraphs = Array.from(cell.getElementsByTagName("a:p"));
                        return cellParagraphs.map(p =>
                            Array.from(p.getElementsByTagName("a:t")).map(t => t.textContent || "").join("")
                        ).join(" ").trim();
                    });
                    if (cellTexts.some(t => t)) {
                        texts.push("| " + cellTexts.join(" | ") + " |"); // Formato Markdown simples para tabela
                    }
                });
                return;
            }

            // Recursão para filhos (grupos, frames, etc)
            // No XML do PPTX, o conteúdo geralmente está dentro de p:sp (shape), p:grpSp (group shape), p:graphicFrame
            // Vamos iterar sobre os filhos diretos para manter a ordem
            const children = Array.from(node.children);
            for (const child of children) {
                extractTextFromNode(child, texts);
            }
        };

        // 2. Ler cada slide
        for (const filename of slideFiles) {
            const slideName = filename.includes('/') ? filename.split('/').pop() : filename;
            const slidePath = `ppt/slides/${slideName}`;
            const slideRelsPath = `ppt/slides/_rels/${slideName}.rels`;

            const slideXml = await content.file(slidePath)?.async("text");
            if (!slideXml) continue;

            const slideDoc = parser.parseFromString(slideXml, "text/xml");

            // --- Extração de Texto ---
            let title = "";
            let texts: string[] = [];

            // Buscar a árvore de formas principal (p:spTree)
            const spTree = slideDoc.getElementsByTagName("p:spTree")[0];
            if (spTree) {
                // Iterar sobre os elementos principais do slide
                const elements = Array.from(spTree.children);

                for (const el of elements) {
                    // Tentar identificar o título
                    const isTitlePlaceholder = el.querySelector("p\\:nvSpPr > p\\:nvPr > p\\:ph[type='title']") ||
                        el.querySelector("p\\:nvSpPr > p\\:nvPr > p\\:ph[type='ctrTitle']");

                    if (isTitlePlaceholder) {
                        const titleP = Array.from(el.getElementsByTagName("a:t")).map(t => t.textContent).join("");
                        if (titleP && !title) {
                            title = titleP;
                            continue; // Não adiciona o título ao corpo do texto
                        }
                    }

                    // Extrair texto genérico
                    extractTextFromNode(el, texts);
                }
            }

            // Fallback para título se não achou placeholder
            if (!title && texts.length > 0 && texts[0].length < 200) {
                // Assume a primeira linha como título se for curta
                title = texts[0];
                texts = texts.slice(1);
            }

            // --- Extração de Imagens ---
            const images: string[] = [];

            // Verifica se existe arquivo de relacionamentos para este slide
            const slideRelsXml = await content.file(slideRelsPath)?.async("text");

            if (slideRelsXml) {
                const slideRelsDoc = parser.parseFromString(slideRelsXml, "text/xml");
                const slideRels = Array.from(slideRelsDoc.getElementsByTagName("Relationship"));

                // Estratégia A: Buscar tags <a:blip> no XML do slide (imagens inseridas, backgrounds, etc)
                // Isso pega imagens dentro de grupos, tabelas e formas
                const blips = Array.from(slideDoc.getElementsByTagName("a:blip"));
                const processedEmbedIds = new Set<string>();

                for (const blip of blips) {
                    const embedId = blip.getAttribute("r:embed");
                    if (embedId && !processedEmbedIds.has(embedId)) {
                        processedEmbedIds.add(embedId);

                        const rel = slideRels.find(r => r.getAttribute("Id") === embedId);
                        if (rel) {
                            await processImageRel(rel, content, images);
                        }
                    }
                }

                // Estratégia B: Se não achou imagens via blip, mas tem relationships de imagem, tenta pegar (fallback)
                // Útil para alguns casos onde o parser XML falha em achar o blip aninhado
                if (images.length === 0) {
                    const imageRels = slideRels.filter(r => r.getAttribute("Type")?.includes("image"));
                    for (const rel of imageRels) {
                        if (!processedEmbedIds.has(rel.getAttribute("Id")!)) {
                            await processImageRel(rel, content, images);
                        }
                    }
                }
            }

            parsedSlides.push({
                title: title || `Slide ${parsedSlides.length + 1}`,
                content: texts.filter(t => t.trim().length > 0),
                notes: "",
                images: images
            });
        }

        return parsedSlides;

    } catch (error) {
        console.error("Erro ao processar PPTX:", error);
        throw new Error("Falha ao processar arquivo PowerPoint. " + (error instanceof Error ? error.message : ""));
    }
};

async function processImageRel(rel: Element, content: JSZip, images: string[]) {
    let target = rel.getAttribute("Target");
    if (target) {
        let imagePathInZip = "";
        if (target.startsWith("../")) {
            imagePathInZip = "ppt/" + target.replace("../", "");
        } else {
            // Caminhos relativos dentro de ppt/slides/
            // Se target for "media/image1.png", o caminho é "ppt/slides/media/image1.png" ?
            // Não, geralmente quando não tem ../ é relativo a ppt/slides, mas a pasta media costuma estar em ppt/media
            // O padrão do PowerPoint é colocar em ppt/media e referenciar com ../media/
            // Mas vamos tentar resolver
            imagePathInZip = "ppt/slides/" + target;
        }

        // Tenta achar direto primeiro (caso target seja absoluto dentro do zip ou algo assim)
        if (!content.file(imagePathInZip)) {
            // Tenta corrigir common path issues
            if (target.includes("media/")) {
                imagePathInZip = "ppt/media/" + target.split("media/")[1];
            }
        }

        const imgFile = content.file(imagePathInZip);
        if (imgFile) {
            const imgData = await imgFile.async("base64");
            const ext = imagePathInZip.split('.').pop()?.toLowerCase();
            let mime = 'image/png';
            if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
            if (ext === 'gif') mime = 'image/gif';
            if (ext === 'svg') mime = 'image/svg+xml';

            images.push(`data:${mime};base64,${imgData}`);
        }
    }
}
