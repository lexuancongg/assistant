'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, FileText, Zap, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface RagOptimizationCardProps {
    totalFiles?: number;
    aiIndexedFiles?: number;
}

export default function RagOptimizationCard({ totalFiles = 0, aiIndexedFiles = 0 }: RagOptimizationCardProps) {
    const [dismissed, setDismissed] = useState(false);
    const router = useRouter();

    if (dismissed) return null;

    const notIndexed = Math.max(0, totalFiles - aiIndexedFiles);
    const indexedPct = totalFiles > 0 ? Math.round((aiIndexedFiles / totalFiles) * 100) : 100;

    // Choose tip based on real system state
    const tip = notIndexed > 0
        ? {
              icon: <Zap className="w-3.5 h-3.5" />,
              iconBg: 'bg-amber-500',
              tag: 'CẦN XỬ LÝ',
              tagBg: 'bg-amber-500',
              title: `${notIndexed} tài liệu chưa đồng bộ tìm kiếm AI`,
              desc: `Hiện có ${notIndexed}/${totalFiles} tài liệu mới chưa được lập chỉ mục (${indexedPct}% hoàn thành). Hãy đồng bộ để nhân sự tra cứu dữ liệu đầy đủ nhất.`,
              action: 'Đồng bộ tri thức ngay',
              onAction: () => { toast.loading('Đang đồng bộ dữ liệu AI...'); router.push('/'); },
          }
        : {
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
              iconBg: 'bg-emerald-600',
              tag: 'HOẠT ĐỘNG TỐT',
              tagBg: 'bg-emerald-600',
              title: 'Dữ liệu đã được đồng bộ hoàn tất',
              desc: `Toàn bộ ${totalFiles} tài liệu đã được xử lý và sẵn sàng 100%. Hãy thường xuyên rà soát phân quyền thư mục và cập nhật các tài liệu mới nhất.`,
              action: 'Quản lý tài liệu',
              onAction: () => router.push('/files'),
          };

    return (
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>

            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg ${tip.iconBg} text-white flex items-center justify-center`}>
                            {tip.icon}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                            Đề xuất hệ thống
                        </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tip.tagBg} text-white uppercase tracking-wider`}>
                        {tip.tag}
                    </span>
                </div>

                {/* Title */}
                <p className="text-xs font-semibold text-gray-900 dark:text-slate-100 mb-1">{tip.title}</p>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                    {tip.desc}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-2">
                <button
                    type="button"
                    onClick={tip.onAction}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all active:scale-[0.98] text-center cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                    {tip.action}
                    <ArrowRight className="w-3 h-3" />
                </button>
                <button
                    type="button"
                    onClick={() => { setDismissed(true); toast.success('Đã ẩn đề xuất.'); }}
                    className="py-2 px-3 rounded-xl text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    Bỏ qua
                </button>
            </div>
        </div>
    );
}

