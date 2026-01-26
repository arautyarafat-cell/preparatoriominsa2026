
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
        const slideIds = Array.from(presentationDoc.getElementsByTagName("p:sldId")).map(id => {
            return id.getAttribute("r:id");
        });

        const relsXml = await content.file("ppt/_rels/presentation.xml.rels")?.async("text");
        if (!relsXml) throw new Error("Arquivo inválido: rels não encontrado");

        const relsDoc = parser.parseFromString(relsXml, "text/xml");
        const relationships = Array.from(relsDoc.getElementsByTagName("Relationship"));

        const slideFiles: string[] = [];

        // Mapear rId para nomes de arquivos
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
                const numA = parseInt(a.match(/slide(\d+)\.xml/)![1]);
                const numB = parseInt(b.match(/slide(\d+)\.xml/)![1]);
                return numA - numB;
            });
            slideFiles.push(...slides.map(s => s.replace("ppt/slides/", "")));
        }

        const parsedSlides: ParsedSlide[] = [];

        // 2. Ler cada slide e suas imagens
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

            const textBodies = Array.from(slideDoc.getElementsByTagName("p:txBody"));

            textBodies.forEach((txBody, index) => {
                const paragraphs = Array.from(txBody.getElementsByTagName("a:p"));
                const bodyText = paragraphs.map(p => {
                    return Array.from(p.getElementsByTagName("a:t"))
                        .map(t => t.textContent)
                        .join("");
                }).filter(t => t.trim()).join("\n");

                if (bodyText) {
                    // Tenta identificar título pelo placeholder ou ordem
                    // Verifica se é placeholder de titulo
                    const isTitlePlaceholder = txBody.parentNode?.querySelector("p\\:nvSpPr > p\\:nvPr > p\\:ph[type='title']") ||
                        txBody.parentNode?.querySelector("p\\:nvSpPr > p\\:nvPr > p\\:ph[type='ctrTitle']");

                    if ((isTitlePlaceholder || (!title && index === 0)) && bodyText.length < 200) {
                        title = bodyText;
                    } else {
                        texts.push(bodyText);
                    }
                }
            });

            if (!title && texts.length > 0 && texts[0].length < 100) {
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

                // Encontrar r:embed ids nas tags <a:blip> (imagens) dentro do slide.xml
                const blips = Array.from(slideDoc.getElementsByTagName("a:blip"));

                for (const blip of blips) {
                    const embedId = blip.getAttribute("r:embed");
                    if (embedId) {
                        // Buscar o caminho da imagem no .rels
                        const rel = slideRels.find(r => r.getAttribute("Id") === embedId);
                        if (rel) {
                            let target = rel.getAttribute("Target");
                            if (target) {
                                // O Target geralmente é relativo, ex: "../media/image1.png"
                                // Precisamos normalizar para o caminho dentro do zip: "ppt/media/image1.png"
                                let imagePathInZip = "";
                                if (target.startsWith("../")) {
                                    imagePathInZip = "ppt/" + target.replace("../", "");
                                } else {
                                    imagePathInZip = "ppt/slides/" + target; // Caso raro se não estiver na pasta media padrao
                                }

                                const imgFile = content.file(imagePathInZip);
                                if (imgFile) {
                                    // Converter para Base64 para exibir inline
                                    const imgData = await imgFile.async("base64");

                                    // Tentar determinar extensão/mime type
                                    const ext = imagePathInZip.split('.').pop()?.toLowerCase();
                                    let mime = 'image/png';
                                    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
                                    if (ext === 'gif') mime = 'image/gif';
                                    if (ext === 'svg') mime = 'image/svg+xml';

                                    images.push(`data:${mime};base64,${imgData}`);
                                }
                            }
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
