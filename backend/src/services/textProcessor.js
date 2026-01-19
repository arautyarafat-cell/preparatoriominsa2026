/**
 * Text Processing Service
 * Cleans and structures extracted text from PDFs and documents
 */

/**
 * Clean and normalize extracted text
 */
export function cleanText(rawText) {
    if (!rawText) return '';

    let text = rawText;

    // Remove excessive whitespace and normalize line breaks
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\r/g, '\n');

    // Remove multiple consecutive spaces
    text = text.replace(/[ \t]+/g, ' ');

    // Remove page numbers like "1 1" or standalone numbers
    text = text.replace(/^\s*\d+\s*\d*\s*$/gm, '');

    // Clean up lines with just dots or dashes (table of contents formatting)
    text = text.replace(/\.{3,}/g, ' — ');
    text = text.replace(/\s+—\s+/g, ' — ');

    // Remove excessive line breaks (more than 2)
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim lines
    text = text.split('\n').map(line => line.trim()).join('\n');

    return text.trim();
}

/**
 * Detect and extract table of contents
 */
export function extractTableOfContents(text) {
    const lines = text.split('\n');
    const tocItems = [];
    const tocPattern = /^(\d+[-.]?\s*)?([A-Za-zÀ-ú\s]+)\s*[\.…—-]+\s*(\d+)\s*$/;

    for (const line of lines) {
        const match = line.match(tocPattern);
        if (match) {
            tocItems.push({
                number: match[1]?.trim() || '',
                title: match[2].trim(),
                page: parseInt(match[3])
            });
        }
    }

    return tocItems;
}

/**
 * Split text into logical sections based on headers and patterns
 */
export function splitIntoSections(text) {
    const sections = [];

    // Common header patterns for medical/educational documents
    const headerPatterns = [
        /^#+\s+(.+)$/,                           // Markdown headers
        /^(\d+[-.]?\s*)([A-Z][A-Za-zÀ-ú\s]+)$/,  // Numbered sections like "1. SINAIS VITAIS"
        /^([A-Z][A-Z\s]+)$/,                     // ALL CAPS titles
        /^(CAPÍTULO|CAPÍTULO|TEMA|TÓPICO|SEÇÃO|MÓDULO)\s*\d*[:\s-]*(.+)$/i // Explicit section markers
    ];

    const lines = text.split('\n');
    let currentSection = { title: 'Introdução', content: [] };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            if (currentSection.content.length > 0) {
                currentSection.content.push('');
            }
            continue;
        }

        let isHeader = false;
        let headerTitle = '';

        for (const pattern of headerPatterns) {
            const match = line.match(pattern);
            if (match && line.length < 100) { // Headers are usually short
                isHeader = true;
                headerTitle = match[2] || match[1] || line;
                break;
            }
        }

        if (isHeader && currentSection.content.length > 0) {
            // Save current section and start new one
            sections.push({
                title: currentSection.title,
                content: currentSection.content.join('\n').trim()
            });
            currentSection = { title: headerTitle, content: [] };
        } else if (isHeader && currentSection.content.length === 0) {
            // Update title of empty section
            currentSection.title = headerTitle;
        } else {
            currentSection.content.push(line);
        }
    }

    // Don't forget the last section
    if (currentSection.content.length > 0) {
        sections.push({
            title: currentSection.title,
            content: currentSection.content.join('\n').trim()
        });
    }

    return sections;
}

/**
 * Convert extracted text to structured Markdown format
 */
export function convertToMarkdown(rawText, documentTitle = 'Documento') {
    const cleanedText = cleanText(rawText);
    const sections = splitIntoSections(cleanedText);

    if (sections.length === 0) {
        // If no sections detected, just return cleaned text with basic formatting
        return `# ${documentTitle}\n\n${cleanedText}`;
    }

    let markdown = `# ${documentTitle}\n\n`;

    // Add table of contents if multiple sections
    if (sections.length > 2) {
        markdown += `## Índice\n\n`;
        sections.forEach((section, index) => {
            if (section.title && section.title !== 'Introdução') {
                markdown += `${index}. ${section.title}\n`;
            }
        });
        markdown += `\n---\n\n`;
    }

    // Add each section
    sections.forEach((section, index) => {
        if (section.content) {
            // Format section header
            markdown += `## ${section.title}\n\n`;

            // Format content - add paragraph breaks
            const paragraphs = section.content.split('\n\n');
            paragraphs.forEach(para => {
                if (para.trim()) {
                    markdown += `${para.trim()}\n\n`;
                }
            });
        }
    });

    return markdown;
}

/**
 * Generate a summary from the text
 */
export function generateLocalSummary(text, maxLength = 500) {
    const cleanedText = cleanText(text);
    const sections = splitIntoSections(cleanedText);

    if (sections.length === 0) {
        return cleanedText.substring(0, maxLength) + '...';
    }

    let summary = '';

    // Include section titles as summary points
    const sectionTitles = sections
        .filter(s => s.title && s.title !== 'Introdução')
        .map(s => `• ${s.title}`)
        .slice(0, 10);

    if (sectionTitles.length > 0) {
        summary = `**Principais Tópicos:**\n\n${sectionTitles.join('\n')}\n\n`;
    }

    // Add first paragraph as intro
    const firstContent = sections[0]?.content || '';
    const firstParagraph = firstContent.split('\n\n')[0]?.substring(0, 300) || '';
    if (firstParagraph) {
        summary += `**Resumo:** ${firstParagraph}...`;
    }

    return summary;
}

/**
 * Main processing function - processes raw text into structured content
 */
export function processDocument(rawText, filename = 'Documento') {
    const title = filename.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');

    const markdown = convertToMarkdown(rawText, title);
    const summary = generateLocalSummary(rawText);
    const sections = splitIntoSections(cleanText(rawText));

    return {
        title,
        content: markdown,
        summary,
        sectionCount: sections.length,
        wordCount: rawText.split(/\s+/).length,
        sections: sections.map(s => s.title)
    };
}
