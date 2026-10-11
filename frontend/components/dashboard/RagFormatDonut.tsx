import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { FormatStatDto } from '@/services/dashboard/dashboardService';

const DEFAULT_FORMAT_DATA: FormatStatDto[] = [
    { format: 'pdf', label: 'PDF Docs', count: 18, percentage: 64.3, color: '#1D4ED8' },
    { format: 'docx', label: 'MS Word', count: 5, percentage: 17.9, color: '#4F46E5' },
    { format: 'xlsx', label: 'Bảng Excel', count: 5, percentage: 17.9, color: '#7C3AED' },
];

interface RagFormatDonutProps {
    totalFiles?: number;
    formatStats?: FormatStatDto[];
}

export default function RagFormatDonut({ totalFiles = 28, formatStats }: RagFormatDonutProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const data = (formatStats && formatStats.length > 0) ? formatStats : DEFAULT_FORMAT_DATA;


    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                    Cơ cấu định dạng kho
                </h3>
                <PieIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            </div>

            <div className="flex items-center gap-4">
                {/* Donut Chart with Center Label */}
                <div className="relative w-36 h-36 shrink-0">
                    {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="percentage"
                                    nameKey="label"
                                    innerRadius={42}
                                    outerRadius={62}
                                    paddingAngle={3}
                                    stroke="none"
                                >
                                    {data.map((entry) => (
                                        <Cell key={entry.label} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-full text-xs text-gray-400">
                            ...
                        </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-base font-extrabold text-gray-900 dark:text-slate-100 font-mono leading-tight">
                            {totalFiles.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-tight">
                            TỆP TIN
                        </span>
                    </div>
                </div>

                {/* Legend breakdown */}
                <div className="flex-1 flex flex-col gap-2 text-xs">
                    {data.map((entry) => (
                        <div key={entry.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-gray-600 dark:text-slate-300 font-medium truncate">
                                    {entry.label}
                                </span>
                            </div>
                            <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">
                                {entry.percentage}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
