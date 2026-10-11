'use client';

import React from 'react';
import Link from 'next/link';
import { 
    FileText, 
    Sparkles, 
    Lock, 
    ShieldAlert, 
    RefreshCw, 
    ArrowRight, 
    Clock, 
    ArrowUpRight,
    UserCheck,
    CheckCircle2
} from 'lucide-react';
import { ActivityFeedDto } from '@/services/dashboard/dashboardService';

interface LiveAuditFeedProps {
    activities?: ActivityFeedDto[];
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export default function LiveAuditFeed({ activities, onRefresh, isRefreshing }: LiveAuditFeedProps) {
    const list = activities && activities.length > 0 ? activities : [];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs flex flex-col justify-between">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            Nhật ký hoạt động
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                            Realtime Live
                        </span>
                        {onRefresh && (
                            <button
                                type="button"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Cập nhật nhật ký ngay"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Activities List */}
                <div className="space-y-2.5">
                    {list.length === 0 ? (
                        <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1.5 opacity-60" />
                            <p className="text-xs text-slate-500 font-medium">Chưa có hoạt động nào được ghi nhận</p>
                        </div>
                    ) : (
                        list.map((item) => (
                            <div
                                key={item.id}
                                className={`group p-3 rounded-xl border transition-all text-xs flex items-start gap-3 ${
                                    item.isWarning
                                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:border-slate-200 dark:hover:border-slate-700/80 shadow-2xs'
                                }`}
                            >
                                {/* Category Icon */}
                                <div className="shrink-0 mt-0.5">
                                    {item.iconType === 'file' && (
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50 flex items-center justify-center">
                                            <FileText className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    {item.iconType === 'ai' && (
                                        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/50 flex items-center justify-center">
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    {item.iconType === 'access' && (
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/50 flex items-center justify-center">
                                            <Lock className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    {item.iconType === 'alert' && (
                                        <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50 flex items-center justify-center animate-pulse">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>

                                {/* Body content */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-slate-800 dark:text-slate-200 leading-snug">
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {item.actorName}
                                        </span>{' '}
                                        <span className={`text-2xs font-medium px-1.5 py-0.5 rounded ${
                                            item.isWarning 
                                                ? 'bg-rose-100/70 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' 
                                                : 'text-slate-600 dark:text-slate-300'
                                        }`}>
                                            {item.action}
                                        </span>{' '}
                                        {item.targetName && (
                                            <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer break-all inline-flex items-center gap-0.5">
                                                {item.targetName}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className={`mt-1.5 flex items-center gap-2 text-2xs ${
                                        item.isWarning 
                                            ? 'text-rose-600/90 dark:text-rose-400/80 font-medium' 
                                            : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                        <Clock className="w-3 h-3 opacity-70 shrink-0" />
                                        <span>{item.meta}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer: Link to full activity page */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link
                    href="/activity"
                    className="flex items-center justify-between text-2xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 group transition-colors"
                >
                    <span>Xem toàn bộ lịch sử kiểm toán hệ thống</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
            </div>
        </div>
    );
}
