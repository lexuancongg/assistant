import * as XLSX from 'xlsx';

// Dynamic loader for PDF.js to render PDF page 1
function loadPdfJs(): Promise<any> {
    if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
    if ((window as any).pdfjsLib) {
        return Promise.resolve((window as any).pdfjsLib);
    }

    return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('pdfjs-cdn-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                const pdfjs = (window as any).pdfjsLib;
                if (pdfjs) {
                    pdfjs.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    resolve(pdfjs);
                } else {
                    reject(new Error('pdfjsLib not found on window'));
                }
            });
            existingScript.addEventListener('error', () => reject(new Error('PDF.js script load error')));
            return;
        }

        const script = document.createElement('script');
        script.id = 'pdfjs-cdn-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.onload = () => {
            const pdfjs = (window as any).pdfjsLib;
            if (pdfjs) {
                pdfjs.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve(pdfjs);
            } else {
                reject(new Error('pdfjsLib not initialized'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
        document.head.appendChild(script);
    });
}

/**
 * Capture real thumbnail from PDF Page 1
 */
async function capturePdfThumbnail(arrayBuffer: ArrayBuffer): Promise<Blob | null> {
    try {
        const pdfjs = await loadPdfJs();
        const loadingTask = pdfjs.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (!pdf.numPages || pdf.numPages < 1) return null;

        const page = await pdf.getPage(1);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = 480 / unscaledViewport.width;
        const viewport = page.getViewport({ scale: Math.max(1.0, scale) });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (!context) return null;

        await page.render({ canvasContext: context, viewport }).promise;

        return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
        });
    } catch (err) {
        console.warn('[ThumbnailGenerator] PDF capture failed:', err);
        return null;
    }
}

/**
 * Capture thumbnail from Image file
 */
async function captureImageThumbnail(file: File | Blob): Promise<Blob | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const targetWidth = Math.min(480, img.naturalWidth || 480);
            const targetHeight = Math.round(((img.naturalHeight || 300) / (img.naturalWidth || 480)) * targetWidth);

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });
}

/**
 * Capture real thumbnail from Spreadsheet (XLSX / XLS / CSV) using actual Sheet 1 data
 */
async function captureSpreadsheetThumbnail(arrayBuffer: ArrayBuffer, fileName: string): Promise<Blob | null> {
    try {
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) return null;

        const ws = wb.Sheets[firstSheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const canvas = document.createElement('canvas');
        const width = 480;
        const height = 320;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Excel Green Header
        ctx.fillStyle = '#107C41';
        ctx.fillRect(0, 0, width, 28);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillText(fileName.slice(0, 45), 12, 19);

        // Sheet tab indicator
        ctx.font = '10px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(`Sheet: ${firstSheetName}`, width - 110, 19);

        // Columns layout
        const rowHeaderWidth = 32;
        const colWidth = Math.floor((width - rowHeaderWidth) / 4);
        const rowHeight = 22;

        // Column Header Bar (A, B, C, D)
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(0, 28, width, 20);
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 28, width, 20);

        ctx.fillStyle = '#6B7280';
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.textAlign = 'center';
        ['A', 'B', 'C', 'D'].forEach((colName, i) => {
            const x = rowHeaderWidth + i * colWidth + colWidth / 2;
            ctx.fillText(colName, x, 42);
        });

        // Rows data
        const maxRows = 12;
        ctx.textAlign = 'left';
        for (let r = 0; r < maxRows; r++) {
            const y = 48 + r * rowHeight;
            if (y + rowHeight > height) break;

            const isHeaderRow = r === 0;
            ctx.fillStyle = isHeaderRow ? '#ECFDF5' : r % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
            ctx.fillRect(0, y, width, rowHeight);

            // Row index
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '9px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(String(r + 1), rowHeaderWidth / 2, y + 15);
            ctx.textAlign = 'left';

            // Vertical divider for row index
            ctx.strokeStyle = '#E5E7EB';
            ctx.beginPath();
            ctx.moveTo(rowHeaderWidth, y);
            ctx.lineTo(rowHeaderWidth, y + rowHeight);
            ctx.stroke();

            // Cell contents
            const rowData = data[r] || [];
            for (let c = 0; c < 4; c++) {
                const cellX = rowHeaderWidth + c * colWidth;
                const cellVal = String(rowData[c] !== undefined ? rowData[c] : '').trim();

                ctx.strokeStyle = '#E5E7EB';
                ctx.strokeRect(cellX, y, colWidth, rowHeight);

                if (cellVal) {
                    ctx.fillStyle = isHeaderRow ? '#065F46' : '#1F2937';
                    ctx.font = isHeaderRow ? 'bold 10px Arial, sans-serif' : '10px Arial, sans-serif';
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(cellX + 4, y, colWidth - 8, rowHeight);
                    ctx.clip();
                    ctx.fillText(cellVal, cellX + 6, y + 15);
                    ctx.restore();
                }
            }
        }

        return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
        });
    } catch (err) {
        console.warn('[ThumbnailGenerator] Spreadsheet capture failed:', err);
        return null;
    }
}

/**
 * Capture real thumbnail from Word document (DOCX) using mammoth / text parser
 */
async function captureDocxThumbnail(arrayBuffer: ArrayBuffer, fileName: string): Promise<Blob | null> {
    try {
        const mammoth = await import('mammoth');
        const { value: text } = await mammoth.extractRawText({ arrayBuffer });
        const lines = text
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        return renderDocumentCanvas(lines, fileName, 'DOCX');
    } catch (err) {
        console.warn('[ThumbnailGenerator] DOCX extraction failed:', err);
        return null;
    }
}

/**
 * Capture real thumbnail from plain text / code files
 */
async function captureTextThumbnail(file: File | Blob, fileName: string, ext: string): Promise<Blob | null> {
    try {
        const rawText = await file.text();
        const lines = rawText
            .split('\n')
            .map((l) => l.trimEnd())
            .filter((l) => l.trim().length > 0)
            .slice(0, 30);

        return renderDocumentCanvas(lines, fileName, ext.toUpperCase());
    } catch (err) {
        return null;
    }
}

/**
 * Helper to render an authentic paper document sheet onto canvas with crisp typography
 */
function renderDocumentCanvas(lines: string[], fileName: string, badgeText: string): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    const width = 480;
    const height = 620;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    // Realistic document page with soft border
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Accent top bar
    const isDocx = badgeText === 'DOCX';
    ctx.fillStyle = isDocx ? '#2563EB' : '#059669';
    ctx.fillRect(0, 0, width, 6);

    // Document Header Row
    ctx.fillStyle = isDocx ? '#EFF6FF' : '#ECFDF5';
    ctx.fillRect(16, 18, 42, 18);
    ctx.fillStyle = isDocx ? '#1D4ED8' : '#047857';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, 37, 30);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(fileName.slice(0, 42), 68, 31);

    // Subtle header line
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 44);
    ctx.lineTo(width - 16, 44);
    ctx.stroke();

    // Render body paragraphs
    let currentY = 66;
    const maxLines = Math.min(lines.length, 24);

    for (let i = 0; i < maxLines; i++) {
        if (currentY > height - 40) break;
        const line = lines[i];
        const isHeading =
            i === 0 ||
            line.toUpperCase() === line && line.length < 50 ||
            line.startsWith('Điều ') ||
            line.startsWith('Chương ');

        if (isHeading) {
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 11px Arial, sans-serif';
            ctx.fillText(line.slice(0, 55), 24, currentY);
            currentY += 19;
        } else {
            ctx.fillStyle = '#4B5563';
            ctx.font = '10px Arial, sans-serif';
            ctx.fillText(line.slice(0, 68), 24, currentY);
            currentY += 16;
        }
    }

    // Official stamp watermark at bottom right
    ctx.save();
    ctx.translate(width - 90, height - 40);
    ctx.rotate(-0.06);
    ctx.strokeStyle = isDocx ? '#2563EB' : '#059669';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-40, -14, 80, 22);
    ctx.fillStyle = isDocx ? '#1D4ED8' : '#047857';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ CHÍNH THỨC', 0, 1);
    ctx.restore();

    return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
    });
}

/**
 * Universal File Thumbnail Generator
 * Generates an authentic, real-content JPEG thumbnail for ANY file (PDF, Image, DOCX, XLSX, TXT, CSV)
 */
export async function generateFileThumbnail(file: File): Promise<Blob | null> {
    if (!file) return null;
    const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase() : '';

    try {
        // 1. Image files (PNG, JPG, WEBP, GIF, BMP)
        if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
            return await captureImageThumbnail(file);
        }

        // 2. PDF documents (render real page 1 via PDF.js)
        if (ext === 'pdf' || file.type === 'application/pdf') {
            const buf = await file.arrayBuffer();
            return await capturePdfThumbnail(buf);
        }

        // 3. Excel Spreadsheets (render real Sheet 1 cells via SheetJS)
        if (['xlsx', 'xls', 'csv'].includes(ext)) {
            const buf = await file.arrayBuffer();
            return await captureSpreadsheetThumbnail(buf, file.name);
        }

        // 4. Word Documents (render real paragraphs via mammoth)
        if (['docx', 'doc'].includes(ext)) {
            const buf = await file.arrayBuffer();
            return await captureDocxThumbnail(buf, file.name);
        }

        // 5. Plain Text, Markdown, Code
        if (['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'html', 'css', 'xml'].includes(ext) || file.type.startsWith('text/')) {
            return await captureTextThumbnail(file, file.name, ext);
        }

        return null;
    } catch (err) {
        console.warn(`[ThumbnailGenerator] Failed to generate thumbnail for ${file.name}:`, err);
        return null;
    }
}

/**
 * Generate thumbnail from an ArrayBuffer and file metadata (for existing files streamed from backend)
 */
export async function generateThumbnailFromBuffer(
    arrayBuffer: ArrayBuffer,
    fileName: string,
    fileType: string
): Promise<Blob | null> {
    const ext = (fileType || (fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.') + 1) : '')).toLowerCase();

    try {
        if (ext === 'pdf') {
            return await capturePdfThumbnail(arrayBuffer);
        }

        if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
            const blob = new Blob([arrayBuffer]);
            return await captureImageThumbnail(blob);
        }

        if (['xlsx', 'xls', 'csv'].includes(ext)) {
            return await captureSpreadsheetThumbnail(arrayBuffer, fileName);
        }

        if (['docx', 'doc'].includes(ext)) {
            return await captureDocxThumbnail(arrayBuffer, fileName);
        }

        if (['txt', 'md', 'json', 'js', 'ts', 'py', 'java', 'html', 'css'].includes(ext)) {
            const blob = new Blob([arrayBuffer], { type: 'text/plain' });
            return await captureTextThumbnail(blob, fileName, ext);
        }

        return null;
    } catch {
        return null;
    }
}
