'use client';

import React, { useMemo } from 'react';

interface DiffPart {
    value: string;
    added?: boolean;
    removed?: boolean;
}

/**
 * Thuật toán tính toán sai khác ở cấp độ từ (Word-level LCS Diff)
 */
export function computeWordDiff(oldText: string, newText: string): { oldParts: DiffPart[]; newParts: DiffPart[] } {
    if (!oldText && !newText) return { oldParts: [], newParts: [] };
    if (!oldText) return { oldParts: [], newParts: [{ value: newText, added: true }] };
    if (!newText) return { oldParts: [{ value: oldText, removed: true }], newParts: [] };

    // Tách thành các từ và khoảng trắng
    const wordsOld = oldText.split(/(\s+)/);
    const wordsNew = newText.split(/(\s+)/);

    const n = wordsOld.length;
    const m = wordsNew.length;

    // Giới hạn an toàn để tránh quá tải bộ nhớ nếu văn bản quá dài
    if (n > 800 || m > 800) {
        return {
            oldParts: [{ value: oldText }],
            newParts: [{ value: newText }]
        };
    }

    // Bảng DP LCS
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            if (wordsOld[i] === wordsNew[j]) {
                dp[i + 1][j + 1] = dp[i][j] + 1;
            } else {
                dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    // Truy vết các vị trí trùng khớp
    let i = n, j = m;
    const matchedOld = new Set<number>();
    const matchedNew = new Set<number>();

    while (i > 0 && j > 0) {
        if (wordsOld[i - 1] === wordsNew[j - 1]) {
            matchedOld.add(i - 1);
            matchedNew.add(j - 1);
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    const oldParts: DiffPart[] = [];
    for (let idx = 0; idx < n; idx++) {
        const val = wordsOld[idx];
        if (/^\s+$/.test(val)) {
            oldParts.push({ value: val });
        } else if (matchedOld.has(idx)) {
            oldParts.push({ value: val });
        } else {
            oldParts.push({ value: val, removed: true });
        }
    }

    const newParts: DiffPart[] = [];
    for (let idx = 0; idx < m; idx++) {
        const val = wordsNew[idx];
        if (/^\s+$/.test(val)) {
            newParts.push({ value: val });
        } else if (matchedNew.has(idx)) {
            newParts.push({ value: val });
        } else {
            newParts.push({ value: val, added: true });
        }
    }

    return { oldParts, newParts };
}

interface DiffViewerProps {
    text: string;
    oppositeText?: string;
    isOld: boolean;
    showVisualDiff: boolean;
}

export default function DiffViewer({
    text,
    oppositeText,
    isOld,
    showVisualDiff
}: DiffViewerProps) {
    if (!showVisualDiff || !oppositeText || oppositeText === text) {
        return <span className="font-normal text-slate-700">{text}</span>;
    }

    const { oldParts, newParts } = useMemo(() => {
        return computeWordDiff(isOld ? text : oppositeText, isOld ? oppositeText : text);
    }, [text, oppositeText, isOld]);

    const parts = isOld ? oldParts : newParts;

    return (
        <span className="leading-relaxed">
            {parts.map((part, idx) => {
                if (part.removed) {
                    return (
                        <span
                            key={idx}
                            title="Nội dung đã bị xóa hoặc sửa đổi"
                            className="bg-red-100 text-red-800 line-through px-1 py-0.5 rounded text-[11px] font-medium border border-red-200/80 mx-0.5 inline-block"
                        >
                            {part.value}
                        </span>
                    );
                }
                if (part.added) {
                    return (
                        <span
                            key={idx}
                            title="Nội dung mới thêm hoặc thay thế"
                            className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded text-[11px] font-semibold border border-emerald-300/80 mx-0.5 inline-block"
                        >
                            {part.value}
                        </span>
                    );
                }
                return <span key={idx}>{part.value}</span>;
            })}
        </span>
    );
}
