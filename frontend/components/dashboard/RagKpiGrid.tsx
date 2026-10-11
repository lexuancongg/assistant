'use client';

import React from 'react';
import { Folder, Zap, MessageSquare, ShieldCheck, HardDrive, TrendingUp, TrendingDown, Sparkles, ThumbsUp, Users, Coins } from 'lucide-react';

interface RagKpiGridProps {
    totalFiles?: number;
    vectorIndexed?: number;
    aiQueriesToday?: number;
    queriesGrowthPercent?: number | null;
    ragAccuracy?: number | null;
    usedStorageGb?: number;
    totalStorageGb?: number;
    totalFolders?: number;
    totalStorageText?: string;
    userSatisfactionRate?: number | null;
    totalUsers?: number;
    totalDepartments?: number;
    totalAiQueries?: number;
    activePersonasCount?: number;
    totalChunksIndexed?: number;
    monthlyTokensUsed?: number;
}

export default function RagKpiGrid({
    totalFiles = 0,
    vectorIndexed = 0,
    aiQueriesToday = 0,
    queriesGrowthPercent = null,
    ragAccuracy = null,
    usedStorageGb = 0,
    totalStorageGb = 100,
    totalFolders = 0,
    totalStorageText = '0 B',
    userSatisfactionRate = null,
    totalUsers = 0,
    totalDepartments = 0,
    totalAiQueries = 0,
    activePersonasCount = 0,
    monthlyTokensUsed = 0,
}: RagKpiGridProps) {
    const vectorPercentage = totalFiles > 0 ? ((vectorIndexed / totalFiles) * 100).toFixed(1) : '0.0';
    const storagePercentage = totalStorageGb > 0 ? ((usedStorageGb / totalStorageGb) * 100).toFixed(2) : '0.00';

    return (
        <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Card 1: Tổng tài liệu */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700/60 transition-all group">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-slate-400 uppercase">
                                TỔNG TÀI LIỆU
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Folder className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-mono">
                            {totalFiles.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/80 text-[11px]">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <TrendingUp className="w-3 h-3" />
                            <span>Lưu trữ an toàn</span>
                        </div>
                        <span className="text-gray-400 dark:text-slate-500 mt-0.5 block">{totalFolders} thư mục lưu trữ</span>
                    </div>
                </div>

                {/* Card 2: Tài liệu sẵn sàng AI */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-700/60 transition-all group">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-slate-400 uppercase">
                                TÀI LIỆU SẴN SÀNG AI
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <Zap className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-mono">
                            {vectorIndexed.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                                {vectorPercentage}% đã xử lý nội dung
                            </span>
                        </div>
                        <div className="w-full bg-purple-100 dark:bg-purple-950/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${vectorPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Card 3: Lượt hỏi đáp hôm nay */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all group">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-slate-400 uppercase">
                                LƯỢT HỎI ĐÁP HÔM NAY
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-mono">
                            {aiQueriesToday.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/80 text-[11px]">
                        {queriesGrowthPercent !== null ? (
                            <div className={`flex items-center gap-1 font-medium ${queriesGrowthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                {queriesGrowthPercent >= 0
                                    ? <TrendingUp className="w-3 h-3" />
                                    : <TrendingDown className="w-3 h-3" />}
                                <span>{queriesGrowthPercent >= 0 ? '+' : ''}{queriesGrowthPercent}% so hôm qua</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500 font-medium">
                                <span>Chưa có dữ liệu hôm qua</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 4: Độ chính xác trích dẫn */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700/60 transition-all group">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-slate-400 uppercase">
                                ĐỘ CHÍNH XÁC TRÍCH DẪN
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-mono">
                            {ragAccuracy !== null && ragAccuracy !== undefined ? `${ragAccuracy}%` : (
                                <span className="text-base font-semibold text-gray-400 dark:text-slate-500 font-sans">Chưa có dữ liệu</span>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/80 text-[11px]">
                        {ragAccuracy !== null && ragAccuracy !== undefined ? (
                            <span className="text-blue-600 dark:text-blue-400 font-medium block">
                                Trích xuất từ tài liệu chuẩn
                            </span>
                        ) : (
                            <span className="text-gray-400 dark:text-slate-500 block">
                                Cần câu hỏi để đánh giá
                            </span>
                        )}
                    </div>
                </div>

                {/* Card 5: Dung lượng lưu trữ */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:border-cyan-300 dark:hover:border-cyan-700/60 transition-all group">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-slate-400 uppercase">
                                DUNG LƯỢNG LƯU TRỮ
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                                <HardDrive className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-mono">
                            {totalStorageText} <span className="text-xs font-normal text-gray-400">/ {totalStorageGb}GB</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                                {storagePercentage}% hạn mức đã dùng
                            </span>
                        </div>
                        <div className="w-full bg-cyan-100 dark:bg-cyan-950/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                                className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enterprise Business & System Metrics (100% Real data from PostgreSQL) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-slate-900/80 dark:via-indigo-950/30 dark:to-slate-900/80 p-3 rounded-2xl border border-blue-100 dark:border-slate-800">
                {/* 1. User Satisfaction */}
                <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-blue-100/80 dark:border-slate-700/60 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <ThumbsUp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider truncate">
                            Độ Hài Lòng Phản Hồi
                        </div>
                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                            {userSatisfactionRate !== null && userSatisfactionRate !== undefined ? (
                                <>
                                    {userSatisfactionRate}% <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 font-sans">(Đánh giá thực tế)</span>
                                </>
                            ) : (
                                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 font-sans">Chưa có đánh giá</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Enterprise Scale (Users & Departments) */}
                <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-blue-100/80 dark:border-slate-700/60 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider truncate">
                            Quy Mô Doanh Nghiệp
                        </div>
                        <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                            {totalUsers} <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 font-sans">nhân sự • {totalDepartments} phòng ban</span>
                        </div>
                    </div>
                </div>

                {/* 3. Monthly LLM Tokens */}
                <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-blue-100/80 dark:border-slate-700/60 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Coins className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider truncate">
                            Tokens LLM Tháng Này
                        </div>
                        <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                            {monthlyTokensUsed.toLocaleString()} <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 font-sans">tokens</span>
                        </div>
                    </div>
                </div>

                {/* 4. Total Cumulative Inquiries */}
                <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-blue-100/80 dark:border-slate-700/60 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider truncate">
                            Tổng Lượt Hỏi Đáp AI
                        </div>
                        <div className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                            {totalAiQueries.toLocaleString()} <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 font-sans">lượt hỏi đáp</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
