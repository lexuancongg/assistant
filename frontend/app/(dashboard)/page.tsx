'use client';

import React, { useEffect, useState } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import RagHeroBanner from '@/components/dashboard/RagHeroBanner';
import RagKpiGrid from '@/components/dashboard/RagKpiGrid';
import RagQueryLatencyChart from '@/components/dashboard/RagQueryLatencyChart';
import RagFormatDonut from '@/components/dashboard/RagFormatDonut';
import LiveAuditFeed from '@/components/dashboard/LiveAuditFeed';
import TopQueriedDocsTable from '@/components/dashboard/TopQueriedDocsTable';
import { UploadFileModal } from '@/components/files/FileModals';
import dashboardService, { DashboardStatsDto } from '@/services/dashboard/dashboardService';
import authenticationService from '@/services/auth/authenticationService';

export default function DashboardPage() {
    usePageBreadcrumb(['Tổng quan']);
    const [stats, setStats] = useState<DashboardStatsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        name: '',
        role: '',
        department: '',
    });

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);
        try {
            // 1. Try local storage user
            if (typeof window !== 'undefined') {
                const storedUser = window.localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        if (parsed.name) {
                            const deptName =
                                typeof parsed.department === 'object' && parsed.department !== null
                                    ? parsed.department.name || ''
                                    : parsed.departmentName ||
                                      (typeof parsed.department === 'string' ? parsed.department : '');

                            setCurrentUser({
                                name: parsed.name,
                                role: parsed.role || '',
                                department: deptName,
                            });
                        }
                    } catch (e) {}
                }
            }

            // 2. Fetch authenticated profile from server
            try {
                const authState = await authenticationService.checkAuthenticated();
                if (authState && authState.isAuthenticated && authState.authenticatedUser) {
                    setCurrentUser((prev) => ({
                        ...prev,
                        name: authState.authenticatedUser.username || prev.name,
                    }));
                }
            } catch (e) {
                // auth state check optional fallback
            }

            // 3. Fetch comprehensive real dashboard statistics
            const statsData = await dashboardService.getStats();
            if (statsData) {
                setStats(statsData);
            }
        } catch (err) {
            console.warn('Dashboard data fetch error:', err);
        } finally {
            if (!silent) setLoading(false);
            else setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();

        // Realtime polling: tự động đồng bộ thống kê và nhật ký audit mỗi 12 giây
        const intervalId = setInterval(() => {
            loadData(true);
        }, 12000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex-1 h-full w-full overflow-y-auto bg-gray-50 dark:bg-slate-950 scrollbar-thin">
            <div className="p-4 pb-16 space-y-4 max-w-[1600px] mx-auto w-full">
                {/* 1. Hero Banner */}
                <RagHeroBanner
                    userName={currentUser.name}
                    userRole={currentUser.role}
                    departmentName={currentUser.department}
                    totalFiles={stats?.totalFiles ?? 0}
                    indexedFiles={stats?.aiIndexedFiles ?? 0}
                    accuracy={stats?.ragAccuracy ?? null}
                    latencyMs={stats?.averageLatencyMs ?? null}
                    qdrantStatus={stats?.qdrantStatus ?? 'OPERATIONAL'}
                    onUploadClick={() => setShowUploadModal(true)}
                    onReindex={() => loadData(false)}
                />

                {/* 2. KPI Metrics Grid */}
                <RagKpiGrid
                    totalFiles={stats?.totalFiles ?? 0}
                    vectorIndexed={stats?.aiIndexedFiles ?? 0}
                    aiQueriesToday={stats?.aiQueriesToday ?? 0}
                    queriesGrowthPercent={stats?.queriesGrowthPercent ?? null}
                    ragAccuracy={stats?.ragAccuracy ?? null}
                    usedStorageGb={stats?.usedStorageGb ?? 0}
                    totalStorageGb={stats?.storageQuotaGb ?? 100}
                    totalFolders={stats?.totalFolders ?? 0}
                    totalStorageText={stats?.totalStorage ?? '0 B'}
                    userSatisfactionRate={stats?.userSatisfactionRate ?? null}
                    totalUsers={stats?.totalUsers ?? 0}
                    totalDepartments={stats?.totalDepartments ?? 0}
                    totalAiQueries={stats?.totalAiQueries ?? 0}
                    totalChunksIndexed={stats?.totalChunksIndexed ?? 0}
                    monthlyTokensUsed={stats?.monthlyTokensUsed ?? 0}
                />

                {/* 3. Performance Latency Chart & Format Distribution Donut */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <RagQueryLatencyChart dailyStats={stats?.dailyStats ?? []} />
                    </div>
                    <div className="lg:col-span-1">
                        <RagFormatDonut
                            totalFiles={stats?.totalFiles ?? 0}
                            formatStats={stats?.formatStats ?? []}
                        />
                    </div>
                </div>

                {/* 4. Bottom Grid: Top Queried Docs & Real-Time Audit Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <TopQueriedDocsTable
                            totalFiles={stats?.totalFiles ?? 0}
                            documents={stats?.topDocuments ?? []}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <LiveAuditFeed
                            activities={stats?.recentActivities ?? []}
                            onRefresh={() => loadData(true)}
                            isRefreshing={isRefreshing}
                        />
                    </div>
                </div>
            </div>

            {/* Modal tải lên file từ nút Quick Action */}
            {showUploadModal && (
                <UploadFileModal
                    parentFolderName="Kho tổng quan"
                    onClose={() => setShowUploadModal(false)}
                    onUpload={async () => {
                        setShowUploadModal(false);
                        await loadData(true);
                    }}
                />
            )}
        </div>
    );
}
