import pptxgen from 'pptxgenjs';

export interface SlideStat {
    label: string;
    value: string;
    subtext?: string;
}

export interface CompareColumn {
    tag: string;
    title: string;
    points: string[];
}

export interface PillarCard {
    badge: string;
    title: string;
    techStack: string;
    highlights: string[];
}

export interface TimelineStep {
    phaseNumber: string;
    phaseName: string;
    duration: string;
    keyTasks: string[];
    deliverable: string;
}

export interface TableData {
    headers: string[];
    rows: string[][];
}

export interface SlideContent {
    slideNumber: number;
    layoutType?: 'compare' | 'pillars' | 'timeline' | 'table' | 'metrics' | 'standard' | string;
    title: string;
    category: string;
    subtitle?: string;
    compareData?: CompareColumn[];
    pillars?: PillarCard[];
    timelineSteps?: TimelineStep[];
    tableData?: TableData;
    bulletPoints?: string[];
    keyTakeaway?: string;
    stats?: SlideStat[];
}

export interface PresentationData {
    presentationTitle: string;
    subtitle: string;
    author?: string;
    targetAudience?: string;
    theme?: string;
    slides: SlideContent[];
}

/**
 * Xuất dữ liệu slide có cấu trúc thành file Microsoft PowerPoint (.pptx) chuẩn Executive Pitch Deck
 */
export async function exportToPowerPoint(data: PresentationData): Promise<string> {
    const pres = new pptxgen();

    // 1. Cấu hình tỉ lệ màn hình chuẩn 16:9 Widescreen (13.33 x 7.5 inches)
    pres.layout = 'LAYOUT_16x9';
    pres.title = data.presentationTitle;
    pres.subject = data.subtitle;
    pres.author = data.author || 'Enterprise AI Assistant';
    pres.company = 'B2B Enterprise Solutions & Software Services';

    // Bảng màu chuẩn C-Level / Big4 Consulting Deck
    const COLOR_PRIMARY = '0A2540';     // Deep Midnight Navy
    const COLOR_ACCENT = '2563EB';      // Royal Blue
    const COLOR_CYAN = '0EA5E9';        // Electric Cyan
    const COLOR_TEXT_MAIN = '0F172A';   // Dark Slate
    const COLOR_TEXT_MUTED = '64748B';  // Muted Slate Gray
    const COLOR_BG_LIGHT = 'F8FAFC';    // Soft Light Gray
    const COLOR_BORDER = 'E2E8F0';      // Subtle Border

    const COLOR_RED = 'DC2626';         // Alert Red
    const COLOR_RED_BG = 'FEF2F2';      // Light Red Fill
    const COLOR_RED_BORDER = 'FECACA';

    const COLOR_GREEN = '059669';       // Emerald Green
    const COLOR_GREEN_BG = 'ECFDF5';    // Light Green Fill
    const COLOR_GREEN_BORDER = 'A7F3D0';

    // Helper: Thêm header chuẩn chung cho mọi slide nội dung
    const addSlideHeader = (slide: any, item: SlideContent) => {
        // Top accent line
        slide.addShape(pres.ShapeType.rect, {
            x: 0,
            y: 0,
            w: '100%',
            h: 0.08,
            fill: { color: COLOR_ACCENT }
        });

        // Category Tag
        slide.addText(item.category.toUpperCase(), {
            x: 0.8,
            y: 0.4,
            w: 11.5,
            h: 0.25,
            fontSize: 10,
            bold: true,
            color: COLOR_ACCENT,
            charSpacing: 1.5
        });

        // Action Title
        slide.addText(item.title, {
            x: 0.8,
            y: 0.65,
            w: 11.7,
            h: 0.55,
            fontSize: 18,
            bold: true,
            color: COLOR_PRIMARY
        });

        // Subtitle nếu có
        if (item.subtitle) {
            slide.addText(item.subtitle, {
                x: 0.8,
                y: 1.15,
                w: 11.7,
                h: 0.3,
                fontSize: 11,
                color: COLOR_TEXT_MUTED,
                italic: true
            });
        }

        // Header separator line
        slide.addShape(pres.ShapeType.line, {
            x: 0.8,
            y: item.subtitle ? 1.5 : 1.35,
            w: 11.7,
            h: 0,
            line: { color: COLOR_BORDER, width: 1 }
        });
    };

    // Helper: Thêm footer chuẩn cho slide
    const addSlideFooter = (slide: any, pageIndex: number, totalPages: number) => {
        slide.addText(`Enterprise AI Assistant • Báo Cáo Chiến Lược • Trang ${pageIndex}/${totalPages}`, {
            x: 0.8,
            y: 6.9,
            w: 7.0,
            h: 0.3,
            fontSize: 9,
            color: COLOR_TEXT_MUTED
        });

        slide.addText('Tài liệu mật nội bộ & Bản quyền giải pháp', {
            x: 8.0,
            y: 6.9,
            w: 4.5,
            h: 0.3,
            fontSize: 9,
            color: COLOR_TEXT_MUTED,
            align: 'right'
        });
    };

    // =========================================================================
    // SLIDE 1: COVER SLIDE (TRANG BÌA EXECUTIVE ĐẲNG CẤP)
    // =========================================================================
    const coverSlide = pres.addSlide();
    coverSlide.background = { color: 'FFFFFF' };

    // Decorative gradient/accent header
    coverSlide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.18,
        fill: { color: COLOR_PRIMARY }
    });
    coverSlide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0.18,
        w: '100%',
        h: 0.06,
        fill: { color: COLOR_ACCENT }
    });

    // Enterprise pill badge
    coverSlide.addShape(pres.ShapeType.roundRect, {
        x: 1.0,
        y: 1.0,
        w: 5.2,
        h: 0.38,
        fill: { color: 'EFF6FF' },
        line: { color: 'BFDBFE', width: 1 },
        rectRadius: 0.08
    });
    coverSlide.addText('BÁO CÁO CHIẾN LƯỢC & KIẾN TRÚC GIẢI PHÁP CNTT', {
        x: 1.1,
        y: 1.05,
        w: 5.0,
        h: 0.28,
        fontSize: 10,
        bold: true,
        color: COLOR_ACCENT,
        charSpacing: 1.2
    });

    // Main Presentation Title
    coverSlide.addText(data.presentationTitle, {
        x: 1.0,
        y: 1.6,
        w: 11.3,
        h: 1.6,
        fontSize: 27,
        bold: true,
        color: COLOR_PRIMARY,
        valign: 'middle',
        lineSpacingMultiple: 1.2
    });

    // Subtitle
    coverSlide.addText(data.subtitle, {
        x: 1.0,
        y: 3.3,
        w: 11.3,
        h: 0.8,
        fontSize: 13,
        color: COLOR_TEXT_MUTED,
        italic: true,
        lineSpacingMultiple: 1.3
    });

    // Divider line
    coverSlide.addShape(pres.ShapeType.line, {
        x: 1.0,
        y: 4.3,
        w: 11.3,
        h: 0,
        line: { color: COLOR_BORDER, width: 1.5 }
    });

    // Metadata 4-box grid
    const todayStr = new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    const metaBoxes = [
        { label: 'ĐƠN VỊ TƯ VẤN / THỰC HIỆN', val: data.author || 'Ban Kỹ thuật & Giải pháp AI' },
        { label: 'ĐỐI TƯỢNG BÁO CÁO', val: data.targetAudience || 'Hội Đồng Giám Khảo & Ban Giám Đốc' },
        { label: 'NGÀY PHÁT HÀNH', val: todayStr },
        { label: 'TIÊU CHUẨN KIẾN TRÚC', val: 'Enterprise Microservices & Cloud' }
    ];

    metaBoxes.forEach((box, i) => {
        const bx = 1.0 + i * 2.9;
        coverSlide.addShape(pres.ShapeType.roundRect, {
            x: bx,
            y: 4.6,
            w: 2.7,
            h: 1.3,
            fill: { color: COLOR_BG_LIGHT },
            line: { color: COLOR_BORDER, width: 1 },
            rectRadius: 0.08
        });

        coverSlide.addText(box.label, {
            x: bx + 0.15,
            y: 4.75,
            w: 2.4,
            h: 0.3,
            fontSize: 8.5,
            bold: true,
            color: COLOR_ACCENT
        });

        coverSlide.addText(box.val, {
            x: bx + 0.15,
            y: 5.1,
            w: 2.4,
            h: 0.65,
            fontSize: 11,
            bold: true,
            color: COLOR_TEXT_MAIN,
            lineSpacingMultiple: 1.2
        });
    });

    const totalSlideCount = data.slides.length + 2; // +1 Cover, +1 Closing

    // =========================================================================
    // SLIDE NỘI DUNG: XỬ LÝ THEO TỪNG BỐ CỤC (LAYOUT TYPE)
    // =========================================================================
    data.slides.forEach((item, index) => {
        const slide = pres.addSlide();
        slide.background = { color: 'FFFFFF' };

        addSlideHeader(slide, item);
        const startY = item.subtitle ? 1.7 : 1.55;

        // ---------------------------------------------------------------------
        // LAYOUT 1: COMPARE (SO SÁNH 2 CỘT: HIỆN TRẠNG VS GIẢI PHÁP ĐỘT PHÁ)
        // ---------------------------------------------------------------------
        if (item.layoutType === 'compare' && item.compareData && item.compareData.length >= 2) {
            const colWidth = 5.65;
            const leftCol = item.compareData[0];
            const rightCol = item.compareData[1];

            // Cột Trái (Hiện Trạng - AS-IS / Pain Points)
            slide.addShape(pres.ShapeType.roundRect, {
                x: 0.8,
                y: startY,
                w: colWidth,
                h: 4.4,
                fill: { color: COLOR_RED_BG },
                line: { color: COLOR_RED_BORDER, width: 1.5 },
                rectRadius: 0.1
            });

            slide.addText(leftCol.tag, {
                x: 1.1,
                y: startY + 0.2,
                w: 5.0,
                h: 0.3,
                fontSize: 10,
                bold: true,
                color: COLOR_RED
            });

            slide.addText(leftCol.title, {
                x: 1.1,
                y: startY + 0.5,
                w: 5.0,
                h: 0.45,
                fontSize: 14,
                bold: true,
                color: '991B1B'
            });

            const leftBullets = leftCol.points.map(pt => ({
                text: pt.replace(/\*\*/g, ''),
                options: {
                    fontSize: 11.5,
                    color: '7F1D1D',
                    bullet: { type: 'bullet' as const },
                    lineSpacingMultiple: 1.35,
                    paraSpaceAfter: 8
                }
            }));
            slide.addText(leftBullets, {
                x: 1.1,
                y: startY + 1.05,
                w: 5.0,
                h: 3.1,
                valign: 'top'
            });

            // Cột Phải (Giải Pháp Đột Phá - TO-BE / Breakthrough)
            slide.addShape(pres.ShapeType.roundRect, {
                x: 6.85,
                y: startY,
                w: colWidth,
                h: 4.4,
                fill: { color: COLOR_GREEN_BG },
                line: { color: COLOR_GREEN_BORDER, width: 1.5 },
                rectRadius: 0.1
            });

            slide.addText(rightCol.tag, {
                x: 7.15,
                y: startY + 0.2,
                w: 5.0,
                h: 0.3,
                fontSize: 10,
                bold: true,
                color: COLOR_GREEN
            });

            slide.addText(rightCol.title, {
                x: 7.15,
                y: startY + 0.5,
                w: 5.0,
                h: 0.45,
                fontSize: 14,
                bold: true,
                color: '065F46'
            });

            const rightBullets = rightCol.points.map(pt => ({
                text: pt.replace(/\*\*/g, ''),
                options: {
                    fontSize: 11.5,
                    color: '064E3B',
                    bullet: { type: 'bullet' as const },
                    lineSpacingMultiple: 1.35,
                    paraSpaceAfter: 8
                }
            }));
            slide.addText(rightBullets, {
                x: 7.15,
                y: startY + 1.05,
                w: 5.0,
                h: 3.1,
                valign: 'top'
            });

            // Bottom Takeaway Bar
            if (item.keyTakeaway) {
                slide.addShape(pres.ShapeType.roundRect, {
                    x: 0.8,
                    y: startY + 4.55,
                    w: 11.7,
                    h: 0.55,
                    fill: { color: 'EFF6FF' },
                    line: { color: 'BFDBFE', width: 1 },
                    rectRadius: 0.08
                });
                slide.addText(`💡 ĐIỂM CỐT LÕI: ${item.keyTakeaway}`, {
                    x: 1.0,
                    y: startY + 4.65,
                    w: 11.3,
                    h: 0.35,
                    fontSize: 10.5,
                    bold: true,
                    color: '1E3A8A'
                });
            }
        }

        // ---------------------------------------------------------------------
        // LAYOUT 2: PILLARS (3-4 KHỐI TRỤ CỘT CÔNG NGHỆ & KIẾN TRÚC)
        // ---------------------------------------------------------------------
        else if (item.layoutType === 'pillars' && item.pillars && item.pillars.length > 0) {
            const count = Math.min(item.pillars.length, 4);
            const cardWidth = count === 4 ? 2.75 : 3.7;
            const gap = count === 4 ? 0.23 : 0.3;

            item.pillars.slice(0, 4).forEach((pillar, pIdx) => {
                const px = 0.8 + pIdx * (cardWidth + gap);

                // Card container
                slide.addShape(pres.ShapeType.roundRect, {
                    x: px,
                    y: startY,
                    w: cardWidth,
                    h: 4.4,
                    fill: { color: COLOR_BG_LIGHT },
                    line: { color: COLOR_BORDER, width: 1.2 },
                    rectRadius: 0.1
                });

                // Top pillar header bar
                slide.addShape(pres.ShapeType.rect, {
                    x: px,
                    y: startY,
                    w: cardWidth,
                    h: 0.08,
                    fill: { color: COLOR_ACCENT }
                });

                // Badge
                slide.addText(pillar.badge.toUpperCase(), {
                    x: px + 0.15,
                    y: startY + 0.2,
                    w: cardWidth - 0.3,
                    h: 0.3,
                    fontSize: 9,
                    bold: true,
                    color: COLOR_ACCENT
                });

                // Pillar Title
                slide.addText(pillar.title, {
                    x: px + 0.15,
                    y: startY + 0.5,
                    w: cardWidth - 0.3,
                    h: 0.55,
                    fontSize: 13,
                    bold: true,
                    color: COLOR_PRIMARY
                });

                // Tech Stack pill box
                slide.addShape(pres.ShapeType.roundRect, {
                    x: px + 0.15,
                    y: startY + 1.1,
                    w: cardWidth - 0.3,
                    h: 0.45,
                    fill: { color: 'EFF6FF' },
                    line: { color: 'DBEAFE', width: 1 },
                    rectRadius: 0.06
                });
                slide.addText(pillar.techStack, {
                    x: px + 0.2,
                    y: startY + 1.15,
                    w: cardWidth - 0.4,
                    h: 0.35,
                    fontSize: 8.5,
                    bold: true,
                    color: COLOR_ACCENT,
                    align: 'center'
                });

                // Highlights bullets
                const highBullets = pillar.highlights.map(hl => ({
                    text: hl,
                    options: {
                        fontSize: 10.5,
                        color: COLOR_TEXT_MAIN,
                        bullet: { type: 'bullet' as const },
                        lineSpacingMultiple: 1.3,
                        paraSpaceAfter: 6
                    }
                }));
                slide.addText(highBullets, {
                    x: px + 0.15,
                    y: startY + 1.7,
                    w: cardWidth - 0.3,
                    h: 2.5,
                    valign: 'top'
                });
            });

            // Bottom Takeaway Bar
            if (item.keyTakeaway) {
                slide.addShape(pres.ShapeType.roundRect, {
                    x: 0.8,
                    y: startY + 4.55,
                    w: 11.7,
                    h: 0.55,
                    fill: { color: 'F1F5F9' },
                    line: { color: COLOR_BORDER, width: 1 },
                    rectRadius: 0.08
                });
                slide.addText(`💡 KIẾN TRÚC ĐÚC KẾT: ${item.keyTakeaway}`, {
                    x: 1.0,
                    y: startY + 4.65,
                    w: 11.3,
                    h: 0.35,
                    fontSize: 10.5,
                    bold: true,
                    color: COLOR_PRIMARY
                });
            }
        }

        // ---------------------------------------------------------------------
        // LAYOUT 3: TIMELINE (4 BƯỚC TIẾN ĐỘ TRIỂN KHAI NGANG CHUẨN AGILITY)
        // ---------------------------------------------------------------------
        else if (item.layoutType === 'timeline' && item.timelineSteps && item.timelineSteps.length > 0) {
            const count = Math.min(item.timelineSteps.length, 4);
            const stepWidth = 2.75;
            const gap = 0.23;

            item.timelineSteps.slice(0, 4).forEach((step, sIdx) => {
                const sx = 0.8 + sIdx * (stepWidth + gap);

                // Step box
                slide.addShape(pres.ShapeType.roundRect, {
                    x: sx,
                    y: startY,
                    w: stepWidth,
                    h: 4.4,
                    fill: { color: COLOR_BG_LIGHT },
                    line: { color: COLOR_BORDER, width: 1.2 },
                    rectRadius: 0.1
                });

                // Phase Number Badge
                slide.addShape(pres.ShapeType.roundRect, {
                    x: sx + 0.15,
                    y: startY + 0.15,
                    w: 0.7,
                    h: 0.4,
                    fill: { color: COLOR_PRIMARY },
                    rectRadius: 0.06
                });
                slide.addText(step.phaseNumber, {
                    x: sx + 0.15,
                    y: startY + 0.18,
                    w: 0.7,
                    h: 0.35,
                    fontSize: 11,
                    bold: true,
                    color: 'FFFFFF',
                    align: 'center'
                });

                // Duration badge
                slide.addText(step.duration, {
                    x: sx + 0.95,
                    y: startY + 0.2,
                    w: stepWidth - 1.1,
                    h: 0.3,
                    fontSize: 10,
                    bold: true,
                    color: COLOR_ACCENT
                });

                // Phase Name
                slide.addText(step.phaseName, {
                    x: sx + 0.15,
                    y: startY + 0.65,
                    w: stepWidth - 0.3,
                    h: 0.5,
                    fontSize: 12.5,
                    bold: true,
                    color: COLOR_PRIMARY
                });

                // Key Tasks
                const taskBullets = step.keyTasks.map(t => ({
                    text: t,
                    options: {
                        fontSize: 10,
                        color: COLOR_TEXT_MAIN,
                        bullet: { type: 'bullet' as const },
                        lineSpacingMultiple: 1.25,
                        paraSpaceAfter: 5
                    }
                }));
                slide.addText(taskBullets, {
                    x: sx + 0.15,
                    y: startY + 1.2,
                    w: stepWidth - 0.3,
                    h: 2.1,
                    valign: 'top'
                });

                // Deliverable bottom box
                slide.addShape(pres.ShapeType.roundRect, {
                    x: sx + 0.12,
                    y: startY + 3.4,
                    w: stepWidth - 0.24,
                    h: 0.85,
                    fill: { color: 'EFF6FF' },
                    line: { color: 'BFDBFE', width: 1 },
                    rectRadius: 0.06
                });
                slide.addText('📦 NGHIỆM THU (DELIVERABLE):', {
                    x: sx + 0.18,
                    y: startY + 3.45,
                    w: stepWidth - 0.36,
                    h: 0.2,
                    fontSize: 7.5,
                    bold: true,
                    color: COLOR_ACCENT
                });
                slide.addText(step.deliverable, {
                    x: sx + 0.18,
                    y: startY + 3.65,
                    w: stepWidth - 0.36,
                    h: 0.55,
                    fontSize: 9,
                    bold: true,
                    color: '1E3A8A',
                    lineSpacingMultiple: 1.15
                });
            });

            // Bottom Takeaway
            if (item.keyTakeaway) {
                slide.addShape(pres.ShapeType.roundRect, {
                    x: 0.8,
                    y: startY + 4.55,
                    w: 11.7,
                    h: 0.55,
                    fill: { color: 'F1F5F9' },
                    line: { color: COLOR_BORDER, width: 1 },
                    rectRadius: 0.08
                });
                slide.addText(`💡 TIẾN ĐỘ CAM KẾT: ${item.keyTakeaway}`, {
                    x: 1.0,
                    y: startY + 4.65,
                    w: 11.3,
                    h: 0.35,
                    fontSize: 10.5,
                    bold: true,
                    color: COLOR_PRIMARY
                });
            }
        }

        // ---------------------------------------------------------------------
        // LAYOUT 4: TABLE (BẢNG DỰ TOÁN NGÂN SÁCH & PHÂN BỔ TÀI CHÍNH)
        // ---------------------------------------------------------------------
        else if (item.layoutType === 'table' && item.tableData && item.tableData.headers) {
            const td = item.tableData;
            
            // Dựng bảng Native PowerPoint Table
            const tableRows: any[][] = [];

            // 1. Header row
            const headerRow = td.headers.map((h, hIdx) => ({
                text: h,
                options: {
                    bold: true,
                    color: 'FFFFFF',
                    fill: { color: COLOR_PRIMARY },
                    fontSize: 10.5,
                    align: hIdx >= 2 ? 'center' : 'left',
                    valign: 'middle'
                }
            }));
            tableRows.push(headerRow);

            // 2. Data rows
            td.rows.forEach((r, rIdx) => {
                const isTotalRow = rIdx === td.rows.length - 1 || r[0].toLowerCase().includes('tổng');
                const rowCells = r.map((c, cIdx) => ({
                    text: c,
                    options: {
                        bold: isTotalRow,
                        color: isTotalRow ? COLOR_PRIMARY : COLOR_TEXT_MAIN,
                        fill: { color: isTotalRow ? 'EFF6FF' : (rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF') },
                        fontSize: isTotalRow ? 10.5 : 10,
                        align: cIdx >= 2 ? 'center' : 'left',
                        valign: 'middle'
                    }
                }));
                tableRows.push(rowCells);
            });

            // Add Table to slide
            slide.addTable(tableRows, {
                x: 0.8,
                y: startY,
                w: 11.7,
                h: 3.4,
                border: { pt: 1, color: COLOR_BORDER },
                colW: [3.2, 4.3, 1.4, 1.6, 1.2]
            });

            // Stats Cards bên dưới bảng (ROI, Hoàn vốn, Tiết kiệm)
            if (item.stats && item.stats.length > 0) {
                const statCount = Math.min(item.stats.length, 3);
                const sWidth = 3.7;
                const sGap = 0.3;

                item.stats.slice(0, 3).forEach((stat, stIdx) => {
                    const stX = 0.8 + stIdx * (sWidth + sGap);
                    slide.addShape(pres.ShapeType.roundRect, {
                        x: stX,
                        y: startY + 3.6,
                        w: sWidth,
                        h: 1.0,
                        fill: { color: COLOR_BG_LIGHT },
                        line: { color: COLOR_BORDER, width: 1 },
                        rectRadius: 0.08
                    });

                    slide.addText(stat.value, {
                        x: stX + 0.15,
                        y: startY + 3.65,
                        w: sWidth - 0.3,
                        h: 0.45,
                        fontSize: 17,
                        bold: true,
                        color: COLOR_ACCENT
                    });

                    slide.addText(`${stat.label} ${stat.subtext ? '• ' + stat.subtext : ''}`, {
                        x: stX + 0.15,
                        y: startY + 4.1,
                        w: sWidth - 0.3,
                        h: 0.4,
                        fontSize: 8.5,
                        bold: true,
                        color: COLOR_TEXT_MUTED
                    });
                });
            }

            // Bottom Takeaway
            if (item.keyTakeaway) {
                slide.addShape(pres.ShapeType.roundRect, {
                    x: 0.8,
                    y: startY + 4.75,
                    w: 11.7,
                    h: 0.45,
                    fill: { color: 'EFF6FF' },
                    line: { color: 'BFDBFE', width: 1 },
                    rectRadius: 0.06
                });
                slide.addText(`💡 ĐÁNH GIÁ TÀI CHÍNH: ${item.keyTakeaway}`, {
                    x: 1.0,
                    y: startY + 4.82,
                    w: 11.3,
                    h: 0.3,
                    fontSize: 9.5,
                    bold: true,
                    color: '1E3A8A'
                });
            }
        }

        // ---------------------------------------------------------------------
        // LAYOUT 5: METRICS (LƯỚI CHỈ SỐ TÁC ĐỘNG ROI LỚN & CAM KẾT VẬN HÀNH)
        // ---------------------------------------------------------------------
        else if (item.layoutType === 'metrics' || (item.stats && item.stats.length >= 4)) {
            // 4 Big Stat Cards side-by-side
            const statItems = (item.stats || []).slice(0, 4);
            const mWidth = 2.75;
            const mGap = 0.23;

            statItems.forEach((st, mIdx) => {
                const mx = 0.8 + mIdx * (mWidth + mGap);

                slide.addShape(pres.ShapeType.roundRect, {
                    x: mx,
                    y: startY,
                    w: mWidth,
                    h: 1.8,
                    fill: { color: COLOR_BG_LIGHT },
                    line: { color: COLOR_BORDER, width: 1.5 },
                    rectRadius: 0.1
                });

                // Top small accent
                slide.addShape(pres.ShapeType.rect, {
                    x: mx,
                    y: startY,
                    w: mWidth,
                    h: 0.06,
                    fill: { color: COLOR_ACCENT }
                });

                // Big Number Value
                slide.addText(st.value, {
                    x: mx + 0.1,
                    y: startY + 0.2,
                    w: mWidth - 0.2,
                    h: 0.65,
                    fontSize: 26,
                    bold: true,
                    color: COLOR_ACCENT,
                    align: 'center'
                });

                // Label
                slide.addText(st.label.toUpperCase(), {
                    x: mx + 0.1,
                    y: startY + 0.9,
                    w: mWidth - 0.2,
                    h: 0.35,
                    fontSize: 10,
                    bold: true,
                    color: COLOR_PRIMARY,
                    align: 'center'
                });

                // Subtext
                if (st.subtext) {
                    slide.addText(st.subtext, {
                        x: mx + 0.1,
                        y: startY + 1.25,
                        w: mWidth - 0.2,
                        h: 0.45,
                        fontSize: 9,
                        color: COLOR_TEXT_MUTED,
                        align: 'center',
                        italic: true
                    });
                }
            });

            // Action commitments (Bottom container)
            slide.addShape(pres.ShapeType.roundRect, {
                x: 0.8,
                y: startY + 2.05,
                w: 11.7,
                h: 2.45,
                fill: { color: 'F8FAFC' },
                line: { color: COLOR_BORDER, width: 1 },
                rectRadius: 0.1
            });

            slide.addText('CAM KẾT CHẤT LƯỢNG DỊCH VỤ & BƯỚC HÀNH ĐỘNG TIẾP THEO', {
                x: 1.1,
                y: startY + 2.2,
                w: 11.0,
                h: 0.3,
                fontSize: 11,
                bold: true,
                color: COLOR_PRIMARY
            });

            const commitBullets = (item.bulletPoints || []).map(pt => ({
                text: pt.replace(/\*\*/g, ''),
                options: {
                    fontSize: 11,
                    color: COLOR_TEXT_MAIN,
                    bullet: { type: 'bullet' as const },
                    lineSpacingMultiple: 1.35,
                    paraSpaceAfter: 6
                }
            }));
            slide.addText(commitBullets, {
                x: 1.1,
                y: startY + 2.55,
                w: 11.0,
                h: 1.8,
                valign: 'top'
            });

            // Takeaway
            if (item.keyTakeaway) {
                slide.addShape(pres.ShapeType.roundRect, {
                    x: 0.8,
                    y: startY + 4.65,
                    w: 11.7,
                    h: 0.5,
                    fill: { color: 'EFF6FF' },
                    line: { color: 'BFDBFE', width: 1 },
                    rectRadius: 0.06
                });
                slide.addText(`💡 ĐÚC KẾT CHIẾN LƯỢC: ${item.keyTakeaway}`, {
                    x: 1.0,
                    y: startY + 4.73,
                    w: 11.3,
                    h: 0.35,
                    fontSize: 10,
                    bold: true,
                    color: '1E3A8A'
                });
            }
        }

        // ---------------------------------------------------------------------
        // LAYOUT 6: STANDARD (BULLET POINTS NÂNG CAO + CARDS BÊN PHẢI)
        // ---------------------------------------------------------------------
        else {
            const hasRightCol = (item.stats && item.stats.length > 0) || !!item.keyTakeaway;
            const leftWidth = hasRightCol ? 7.2 : 11.7;

            const bulletItems = (item.bulletPoints || []).map(point => ({
                text: point.replace(/\*\*/g, ''),
                options: {
                    fontSize: 13,
                    color: COLOR_TEXT_MAIN,
                    bullet: { type: 'bullet' as const },
                    lineSpacingMultiple: 1.4,
                    paraSpaceAfter: 12
                }
            }));

            slide.addText(bulletItems, {
                x: 0.8,
                y: startY + 0.1,
                w: leftWidth,
                h: 4.8,
                valign: 'top'
            });

            if (hasRightCol) {
                let rightY = startY + 0.1;

                if (item.stats && item.stats.length > 0) {
                    item.stats.forEach(stat => {
                        slide.addShape(pres.ShapeType.roundRect, {
                            x: 8.4,
                            y: rightY,
                            w: 4.1,
                            h: 1.1,
                            fill: { color: COLOR_BG_LIGHT },
                            line: { color: COLOR_BORDER, width: 1.2 },
                            rectRadius: 0.08
                        });

                        slide.addText(stat.value, {
                            x: 8.6,
                            y: rightY + 0.1,
                            w: 3.7,
                            h: 0.5,
                            fontSize: 18,
                            bold: true,
                            color: COLOR_ACCENT
                        });

                        slide.addText(stat.label.toUpperCase(), {
                            x: 8.6,
                            y: rightY + 0.6,
                            w: 3.7,
                            h: 0.35,
                            fontSize: 9,
                            bold: true,
                            color: COLOR_TEXT_MUTED
                        });

                        rightY += 1.3;
                    });
                }

                if (item.keyTakeaway) {
                    slide.addShape(pres.ShapeType.roundRect, {
                        x: 8.4,
                        y: rightY,
                        w: 4.1,
                        h: 1.9,
                        fill: { color: 'EFF6FF' },
                        line: { color: 'BFDBFE', width: 1.2 },
                        rectRadius: 0.08
                    });

                    slide.addText('💡 ĐIỂM CỐT LÕI (KEY TAKEAWAY)', {
                        x: 8.6,
                        y: rightY + 0.15,
                        w: 3.7,
                        h: 0.3,
                        fontSize: 9,
                        bold: true,
                        color: COLOR_ACCENT
                    });

                    slide.addText(item.keyTakeaway, {
                        x: 8.6,
                        y: rightY + 0.45,
                        w: 3.7,
                        h: 1.3,
                        fontSize: 11,
                        color: '1E3A8A',
                        italic: true,
                        lineSpacingMultiple: 1.3
                    });
                }
            }
        }

        // Add Slide Footer
        addSlideFooter(slide, index + 2, totalSlideCount);
    });

    // =========================================================================
    // SLIDE CUỐI: KẾT LUẬN & LIÊN HỆ BẢN QUYỀN (EXECUTIVE CLOSING SLIDE)
    // =========================================================================
    const closingSlide = pres.addSlide();
    closingSlide.background = { color: COLOR_PRIMARY };

    closingSlide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.12,
        fill: { color: COLOR_CYAN }
    });

    closingSlide.addText('ENTERPRISE SOLUTIONS & SOFTWARE SERVICES', {
        x: 1.2,
        y: 1.8,
        w: 11.0,
        h: 0.4,
        fontSize: 11,
        bold: true,
        color: COLOR_CYAN,
        charSpacing: 2
    });

    closingSlide.addText('Sẵn Sàng Triển Khai & Khẳng Định Giá Trị Đột Phá', {
        x: 1.2,
        y: 2.3,
        w: 11.0,
        h: 1.2,
        fontSize: 27,
        bold: true,
        color: 'FFFFFF'
    });

    closingSlide.addText(
        'Đề xuất giải pháp được xây dựng dựa trên khảo sát thực tế và các tiêu chuẩn kiến trúc phần mềm quốc tế.\n' +
        'Hệ thống đảm bảo tính toàn vẹn dữ liệu, khả năng mở rộng linh hoạt và tỷ suất hoàn vốn ROI tối ưu.\n\n' +
        'Kính chúc Hội đồng Giám khảo & Quý Doanh nghiệp nhiều thành công và phát triển vượt bậc!',
        {
            x: 1.2,
            y: 3.6,
            w: 11.0,
            h: 1.5,
            fontSize: 13,
            color: 'CBD5E1',
            lineSpacingMultiple: 1.45
        }
    );

    // Bottom Contact & Q&A Box
    closingSlide.addShape(pres.ShapeType.roundRect, {
        x: 1.2,
        y: 5.4,
        w: 11.0,
        h: 1.1,
        fill: { color: '0F2F4F' },
        line: { color: '1E4976', width: 1 },
        rectRadius: 0.08
    });

    closingSlide.addText('PHIÊN HỎI ĐÁP (Q&A) & THẢO LUẬN CHI TIẾT', {
        x: 1.5,
        y: 5.55,
        w: 5.0,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: COLOR_CYAN
    });

    closingSlide.addText('Rất mong nhận được các câu hỏi, góp ý và đánh giá quý báu từ Hội đồng.', {
        x: 1.5,
        y: 5.85,
        w: 5.0,
        h: 0.45,
        fontSize: 11,
        color: 'E2E8F0'
    });

    closingSlide.addText('LIÊN HỆ ĐỘI NGŨ THỰC HIỆN\nHotline: 1900 8888 • Email: solutions@enterprise-ai.vn', {
        x: 6.8,
        y: 5.65,
        w: 5.0,
        h: 0.65,
        fontSize: 10,
        color: '94A3B8',
        align: 'right',
        lineSpacingMultiple: 1.3
    });

    // File name sanitize
    const sanitizedTitle = data.presentationTitle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 50);

    const fileName = `De_Xuat_${sanitizedTitle || 'Presentation'}.pptx`;

    // 4. Xuất và tự động kích hoạt tải file về máy
    await pres.writeFile({ fileName });
    return fileName;
}
