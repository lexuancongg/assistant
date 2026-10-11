'use client';

import React from 'react';

interface RagStatusBannerProps {
    clusterName?: string;
    indexedChunks?: number;
    latencyMs?: number;
    onSync?: () => Promise<void> | void;
}

export default function RagStatusBanner({
    clusterName = 'QDRANT_CLUSTER_NODE_01: OPERATIONAL',
    indexedChunks = 144,
    latencyMs = 18,
}: RagStatusBannerProps) {
    return (
        <div className="w-full bg-white/90 dark:bg-slate-900/90 border-b border-gray-100 dark:border-slate-800/80 px-4 sm:px-6 py-2 transition-colors duration-200">
            <div className="max-w-[1600px] mx-auto flex items-center gap-2.5 text-xs">
                {/* Cluster Node Status Pill */}
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{clusterName}</span>
                </div>

                {/* Info Text */}
                <span className="hidden sm:inline text-gray-600 dark:text-slate-400 font-medium text-[11px]">
                    Cập nhật tự động:{' '}
                    <strong className="text-gray-900 dark:text-slate-200 font-semibold">
                        {indexedChunks.toLocaleString()}
                    </strong>{' '}
                    vector chunks sẵn sàng cho RAG Semantic Search với độ trễ{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">
                        &lt;{latencyMs}ms
                    </span>
                </span>
            </div>
        </div>
    );
}
