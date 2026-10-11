import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle
} from 'docx';

/**
 * Phân tích phần tử DOM của trình soạn thảo thành đối tượng docx.Document
 */
export async function convertHtmlElementToDocxBlob(containerEl: HTMLElement, title = 'Tài liệu Word'): Promise<Blob> {
    const children: (Paragraph | Table)[] = [];

    // Duyệt qua từng phần tử con trực tiếp của vùng soạn thảo
    const childNodes = Array.from(containerEl.childNodes);

    if (childNodes.length === 0) {
        children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }));
    }

    for (const node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) {
                children.push(new Paragraph({
                    children: [new TextRun({ text, font: 'Calibri', size: 24 })],
                    spacing: { after: 120, line: 276 }
                }));
            }
            continue;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const el = node as HTMLElement;
        const tag = el.tagName.toUpperCase();

        // 1. Tiêu đề H1, H2, H3, H4
        if (tag === 'H1') {
            children.push(new Paragraph({
                text: el.innerText || '',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 240, after: 120 }
            }));
            continue;
        }
        if (tag === 'H2') {
            children.push(new Paragraph({
                text: el.innerText || '',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }));
            continue;
        }
        if (tag === 'H3') {
            children.push(new Paragraph({
                text: el.innerText || '',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 160, after: 80 }
            }));
            continue;
        }

        // 2. Bảng biểu TABLE
        if (tag === 'TABLE') {
            const rows: TableRow[] = [];
            const trList = el.querySelectorAll('tr');

            trList.forEach((tr, rowIndex) => {
                const cells: TableCell[] = [];
                const cellList = tr.querySelectorAll('th, td');

                cellList.forEach((cell) => {
                    const isHeader = rowIndex === 0 || cell.tagName.toUpperCase() === 'TH';
                    const cellText = (cell as HTMLElement).innerText || '';
                    cells.push(new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: cellText,
                                        bold: isHeader,
                                        font: 'Calibri',
                                        size: 22
                                    })
                                ],
                                spacing: { after: 60 }
                            })
                        ],
                        shading: isHeader ? { fill: 'F3F4F6' } : undefined,
                        margins: { top: 100, bottom: 100, left: 150, right: 150 }
                    }));
                });

                if (cells.length > 0) {
                    rows.push(new TableRow({ children: cells }));
                }
            });

            if (rows.length > 0) {
                children.push(new Table({
                    rows,
                    width: { size: 100, type: WidthType.PERCENTAGE }
                }));
                // Thêm một khoảng trống sau bảng
                children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
            }
            continue;
        }

        // 3. Danh sách UL / OL
        if (tag === 'UL' || tag === 'OL') {
            const liList = el.querySelectorAll('li');
            liList.forEach((li) => {
                const runs = extractTextRunsFromElement(li as HTMLElement);
                children.push(new Paragraph({
                    children: runs,
                    bullet: tag === 'UL' ? { level: 0 } : undefined,
                    spacing: { after: 80, line: 276 }
                }));
            });
            continue;
        }

        // 4. Đường phân cách ngang HR
        if (tag === 'HR') {
            children.push(new Paragraph({
                border: {
                    bottom: {
                        color: 'CBD5E1',
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6
                    }
                },
                spacing: { before: 120, after: 120 }
            }));
            continue;
        }

        // 5. Trích dẫn BLOCKQUOTE
        if (tag === 'BLOCKQUOTE') {
            const runs = extractTextRunsFromElement(el);
            runs.forEach(r => (r as any).options.italics = true);
            children.push(new Paragraph({
                children: runs,
                indent: { left: 720 },
                spacing: { before: 120, after: 120, line: 276 }
            }));
            continue;
        }

        // 6. Đoạn văn thông thường P hoặc DIV
        const alignment = getElementAlignment(el);
        const runs = extractTextRunsFromElement(el);

        if (runs.length > 0) {
            children.push(new Paragraph({
                children: runs,
                alignment,
                spacing: { after: 120, line: 276 }
            }));
        } else if (el.innerText && el.innerText.trim()) {
            children.push(new Paragraph({
                children: [new TextRun({ text: el.innerText.trim(), font: 'Calibri', size: 24 })],
                alignment,
                spacing: { after: 120, line: 276 }
            }));
        }
    }

    // Đảm bảo luôn có ít nhất một đoạn văn
    if (children.length === 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: title, font: 'Calibri', size: 28, bold: true })],
            spacing: { after: 120 }
        }));
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440, // 1 inch = 1440 dxa
                        right: 1440,
                        bottom: 1440,
                        left: 1440
                    }
                }
            },
            children
        }]
    });

    return await Packer.toBlob(doc);
}

/**
 * Trích xuất các phân đoạn text cùng định dạng (bold, italic, underline, color...) từ một element
 */
function extractTextRunsFromElement(root: HTMLElement): TextRun[] {
    const runs: TextRun[] = [];

    function walk(node: Node, parentStyles: { bold?: boolean; italics?: boolean; underline?: boolean; strike?: boolean; color?: string }) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text) {
                runs.push(new TextRun({
                    text,
                    bold: parentStyles.bold,
                    italics: parentStyles.italics,
                    underline: parentStyles.underline ? {} : undefined,
                    strike: parentStyles.strike,
                    color: parentStyles.color,
                    font: 'Calibri',
                    size: 24 // 12pt = 24 half-points
                }));
            }
            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toUpperCase();

            const currentStyles = { ...parentStyles };

            if (tag === 'STRONG' || tag === 'B' || el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight) >= 600) {
                currentStyles.bold = true;
            }
            if (tag === 'EM' || tag === 'I' || el.style.fontStyle === 'italic') {
                currentStyles.italics = true;
            }
            if (tag === 'U' || el.style.textDecoration.includes('underline')) {
                currentStyles.underline = true;
            }
            if (tag === 'S' || tag === 'STRIKE' || el.style.textDecoration.includes('line-through')) {
                currentStyles.strike = true;
            }
            if (el.style.color) {
                const hex = parseColorToHex(el.style.color);
                if (hex) currentStyles.color = hex;
            }

            for (const child of Array.from(node.childNodes)) {
                walk(child, currentStyles);
            }
        }
    }

    walk(root, {});
    return runs;
}

function getElementAlignment(el: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] {
    const align = el.style.textAlign || el.getAttribute('align') || '';
    switch (align.toLowerCase()) {
        case 'center':
            return AlignmentType.CENTER;
        case 'right':
            return AlignmentType.RIGHT;
        case 'justify':
            return AlignmentType.JUSTIFIED;
        default:
            return AlignmentType.LEFT;
    }
}

function parseColorToHex(color: string): string | undefined {
    if (!color) return undefined;
    if (color.startsWith('#')) return color.replace('#', '').slice(0, 6);
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
        return `${r}${g}${b}`;
    }
    return undefined;
}
