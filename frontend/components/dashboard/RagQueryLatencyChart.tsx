import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import { DailyQueryStatDto } from '@/services/dashboard/dashboardService';

interface RagQueryLatencyChartProps {
    dailyStats?: DailyQueryStatDto[];
}

export default function RagQueryLatencyChart({ dailyStats }: RagQueryLatencyChartProps) {
    const [mounted, setMounted] = useState(false);
    const [range, setRange] = useState<'7' | '14' | '30'>('14');

    useEffect(() => {
        setMounted(true);
    }, []);

    const sourceData = dailyStats && dailyStats.length > 0 ? dailyStats : [];
    const data = range === '7' ? sourceData.slice(-7) : sourceData;
    const peak = data.length > 0
        ? data.reduce((max, cur) => (cur.queries > max.queries ? cur : max), data[0])
        : null;


    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                        Tần suất hỏi đáp & Thời gian phản hồi
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Thống kê lượt hỏi đáp và tốc độ xử lý trong {range} ngày gần nhất
                    </p>
                </div>

                {/* Range switcher */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-medium self-start sm:self-auto">
                    {(['7', '14', '30'] as const).map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRange(r)}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                range === r
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                            }`}
                        >
                            {r} ngày
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend & Peak highlight */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 pb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-blue-600"></span>
                        <span className="text-gray-600 dark:text-slate-300 font-medium">
                            Lượt hỏi đáp
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-purple-500"></span>
                        <span className="text-gray-600 dark:text-slate-300 font-medium">
                            Thời gian phản hồi (ms)
                        </span>
                    </div>
                </div>

                <div className="text-[11px] font-mono text-gray-500 dark:text-slate-400">
                    {peak ? (
                        <>Đỉnh: <span className="text-blue-600 dark:text-blue-400 font-bold">{peak.queries.toLocaleString()} lượt</span> ({peak.date})</>
                    ) : (
                        <span>Chưa có dữ liệu trong khoảng thời gian này</span>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="w-full h-[260px] min-w-0">
                {mounted && data.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                        <span className="text-2xl">📊</span>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Chưa có dữ liệu truy vấn trong {range} ngày gần nhất</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">Biểu đồ sẽ tự cập nhật khi người dùng bắt đầu chat với AI</p>
                    </div>
                ) : mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/80" vertical={false} />

                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[0, 'auto']}
                                allowDataOverflow={false}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl text-xs space-y-1">
                                                <p className="font-semibold text-gray-900 dark:text-slate-100">{label}</p>
                                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                                    <span>Truy vấn: <strong>{payload[0]?.value?.toLocaleString()}</strong> lượt</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                                    <span>Phản hồi: <strong>{payload[1]?.value}</strong> ms</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="queries"
                                stroke="#2563EB"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorQueries)"
                            />
                            <Area
                                type="monotone"
                                dataKey="latency"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                fillOpacity={1}
                                fill="url(#colorLatency)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50/50 dark:bg-slate-800/50 rounded-xl text-xs text-gray-400">
                        Đang tải biểu đồ...
                    </div>
                )}
            </div>
        </div>
    );
}
