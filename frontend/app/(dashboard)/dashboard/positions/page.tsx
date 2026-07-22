
'use client';



import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ArrowsUpDownIcon,
    BuildingOffice2Icon,
    UserGroupIcon,
    PauseCircleIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import {
    Building2,
    Users,
    UserCheck,
    UserCog,
    Search,
    RotateCcw,
    Plus,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import positionService from '@/services/positions/positionService';
import { Position, PositionCreateRequest, PositionStatus } from '@/models/positions/position';
import { PageResponse } from '@/models/page/pageResponse';
import Pagination from '@/components/pagination/pagination';
import PositionFormModal from '@/components/position/PositionFormModal';
import ConfirmationDialog from '@/components/dialog/confirmDialog';
import toast from 'react-hot-toast';

const PAGE_SIZE = 8;

type InUseFilter = 'IN_USE' | 'NOT_IN_USE';
type SortDirection = 'asc' | 'desc';

interface PositionStats {
    total: number;
    active: number;
    inactive: number;
    inUse: number;
}

const LEVEL_OPTIONS = [0, 1, 2, 3, 4, 5];

const CODE_COLORS = [
    'bg-blue-50 text-blue-700',
    'bg-green-50 text-green-700',
    'bg-purple-50 text-purple-700',
    'bg-orange-50 text-orange-700',
    'bg-cyan-50 text-cyan-700',
    'bg-teal-50 text-teal-700',
    'bg-amber-50 text-amber-700',
    'bg-pink-50 text-pink-700',
];

function getCodeColor(code: string) {
    let hash = 0;
    for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
    return CODE_COLORS[Math.abs(hash) % CODE_COLORS.length];
}


function CodeBadge({ code }: { code: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${getCodeColor(code)}`}>
            {code}
        </span>
    );
}

function StatusBadge({ status }: { status: PositionStatus }) {
    const isActive = status === PositionStatus.ACTIVE;
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
        >
            {isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
    );
}

function Sparkline({ color }: { color: string }) {
    return (
        <svg width="64" height="28" viewBox="0 0 64 28" fill="none" aria-hidden="true">
            <polyline
                points="0,20 10,16 20,18 30,10 40,14 50,6 64,8"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}


function StatCard({
    icon: Icon,
    iconBg,
    iconColor,
    label,
    value,
    helper,
    sparklineColor,
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    iconBg: string;
    iconColor: string;
    label: string;
    value: number | string;
    helper: string;
    sparklineColor: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{helper}</p>
                </div>
            </div>
            <Sparkline color={sparklineColor} />
        </div>
    );
}


export default function PositionsPage() {
    const router = useRouter();

    const [positions, setPositions] = useState<Position[]>([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);

    // Applied search keyword (goes to the backend)
    const [keyword, setKeyword] = useState('');
    const [draftKeyword, setDraftKeyword] = useState('');

    const [statusFilter, setStatusFilter] = useState<PositionStatus | undefined>(undefined);
    const [levelFilter, setLevelFilter] = useState<undefined | number>(undefined);
    const [inUseFilter, setInUseFilter] = useState<InUseFilter | undefined>(undefined);

    const [sortField, setSortField] = useState<'name' | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [stats, setStats] = useState<PositionStats>({ total: 0, active: 0, inactive: 0, inUse: 0 });

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Position | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPositions = useCallback(async () => {
        setLoading(true);
        try {
            const res: PageResponse<Position> = await positionService.getPositions(pageIndex, keyword);
            setPositions(res.data);
            setTotalPages(res.totalPages);
            setTotalElements(res.totalElements);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [pageIndex, keyword]);

    // const fetchStats = useCallback(async () => {
    //     // Optional: if you add a dedicated stats endpoint, wire it up here.
    //     const service = positionService as unknown as { getPositionStats?: () => Promise<PositionStats> };
    //     if (service.getPositionStats) {
    //         try {
    //             setStats(await service.getPositionStats());
    //             return;
    //         } catch (err) {
    //             console.error('Fetch stats error:', err);
    //         }
    //     }
    //     // Rough fallback — only reflects the currently loaded page, not the whole dataset.
    //     const active = positions.filter((p) => p.status === 'ACTIVE').length;
    //     setStats({
    //         total: totalElements,
    //         active,
    //         inactive: positions.length - active,
    //         inUse: positions.filter((p) => p.inUse > 0).length,
    //     });
    // }, [positions, totalElements]);

    useEffect(() => {
        fetchPositions();
    }, [fetchPositions]);

    // useEffect(() => {
    //     fetchStats();
    // }, [positions]);

    // const visiblePositions = useMemo(() => {
    //     let result = positions.filter((p) => {
    //         if (statusFilter !==undefined && p.status !== statusFilter) return false;
    //         if (levelFilter !== undefined && p.level !== levelFilter) return false;
    //         if (inUseFilter === 'IN_USE' && p.inUse <= 0) return false;
    //         if (inUseFilter === 'NOT_IN_USE' && p.inUse > 0) return false;
    //         return true;
    //     });

    //     if (sortField === 'name') {
    //         result = [...result].sort((a, b) =>
    //             sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    //         );
    //     }

    //     return result;
    // }, [positions, statusFilter, levelFilter, inUseFilter, sortField, sortDirection]);

    const handleSearch = () => {
        setKeyword(draftKeyword);
        setPageIndex(0);
    };

    const handleReset = () => {
        setDraftKeyword('');
        setKeyword('');
        setStatusFilter(undefined);
        setLevelFilter(undefined);
        setInUseFilter(undefined);
        setSortField(null);
        setPageIndex(0);
    };

    const toggleSort = () => {
        if (sortField !== 'name') {
            setSortField('name');
            setSortDirection('asc');
        } else {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        }
    };

    // const toggleSelectAll = () => {
    //     setSelectedIds((prev) =>
    //         prev.size === visiblePositions.length ? new Set() : new Set(visiblePositions.map((p) => p.id))
    //     );
    // };

    // const toggleSelectOne = (id: number) => {
    //     setSelectedIds((prev) => {
    //         const next = new Set(prev);
    //         next.has(id) ? next.delete(id) : next.add(id);
    //         return next;
    //     });
    // };

    const handleDelete = async (id: number) => {
        try {
            await positionService.deletePosition(id);
            fetchPositions();
        } catch (err) {
            console.error(err);
        }
    };





    const handleSubmit = async (position: PositionCreateRequest) => {
                    if (selected) {
                        await positionService.updatePosition(selected.id, position);
                        toast.success("success update position")
                        
                    } else {
                        await positionService.createPosition(position);
                        toast.success("success create position")
                    }
                    setOpen(false);
                    setSelected(null);
                    fetchPositions();
                }

    const startItem = positions.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
    const endItem = pageIndex * PAGE_SIZE + positions.length;

    return (
        <div className=" space-y-6 bg-gray-50 min-h-screen">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-600 font-medium">Position</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Position Management</h1>
                    <p className="text-gray-500 mt-1">Manage Position and organizational structure</p>
                </div>
                <button
                    onClick={() => {
                        setSelected(null);
                        setOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Department
                </button>
            </div>

            {/* Stats */}
            {/*<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">*/}
            {/*    <StatCard*/}
            {/*        icon={BuildingOffice2Icon}*/}
            {/*        iconBg="bg-blue-50"*/}
            {/*        iconColor="text-blue-600"*/}
            {/*        label="Total Positions"*/}
            {/*        value={stats.total}*/}
            {/*        helper="All company positions"*/}
            {/*        sparklineColor="#2563eb"*/}
            {/*    />*/}
            {/*    <StatCard*/}
            {/*        icon={UserGroupIcon}*/}
            {/*        iconBg="bg-green-50"*/}
            {/*        iconColor="text-green-600"*/}
            {/*        label="Active"*/}
            {/*        value={stats.active}*/}
            {/*        helper={stats.total ? `${((stats.active / stats.total) * 100).toFixed(1)}% of total` : '—'}*/}
            {/*        sparklineColor="#16a34a"*/}
            {/*    />*/}
            {/*    <StatCard*/}
            {/*        icon={PauseCircleIcon}*/}
            {/*        iconBg="bg-orange-50"*/}
            {/*        iconColor="text-orange-500"*/}
            {/*        label="Inactive"*/}
            {/*        value={stats.inactive}*/}
            {/*        helper={stats.total ? `${((stats.inactive / stats.total) * 100).toFixed(1)}% of total` : '—'}*/}
            {/*        sparklineColor="#f97316"*/}
            {/*    />*/}
            {/*    <StatCard*/}
            {/*        icon={UserIcon}*/}
            {/*        iconBg="bg-purple-50"*/}
            {/*        iconColor="text-purple-600"*/}
            {/*        label="In Use"*/}
            {/*        value={stats.inUse}*/}
            {/*        helper="Positions assigned"*/}
            {/*        sparklineColor="#9333ea"*/}
            {/*    />*/}
            {/*</div>*/}

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon
                            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={draftKeyword}
                            placeholder="Search by name or code..."
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                            onChange={(e) => {
                                const value = e.target.value;
                                setDraftKeyword(value);
                                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                searchTimeoutRef.current = setTimeout(() => {
                                    setKeyword(value);
                                    setPageIndex(0);
                                }, 500);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={handleSearch}
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                        >
                            <MagnifyingGlassIcon className="w-4 h-4" />
                            Search
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value ? e.target.value as PositionStatus  : undefined)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                        >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                        >
                            <option value="">All Levels</option>
                            {LEVEL_OPTIONS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                    Level {lvl}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">In Use</label>
                        <select
                            value={inUseFilter}
                            onChange={(e) => setInUseFilter(e.target.value as InUseFilter)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                        >
                            <option value="ALL">All</option>
                            <option value="IN_USE">In Use</option>
                            <option value="NOT_IN_USE">Not In Use</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-700">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                {/* <th className="px-6 py-3.5 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size > 0 && selectedIds.size === visiblePositions.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                                />
                            </th> */}
                                <th className="px-5 py-3.5 w-10">
                                    <input type="checkbox" className="rounded border-gray-300" />
                                </th>
                                <th className="px-6 py-3.5 font-semibold">Stt</th>
                                <th className="px-6 py-3.5 font-semibold">Code</th>
                                <th className="px-6 py-3.5 font-semibold">
                                    <button onClick={toggleSort}
                                        className="inline-flex items-center gap-1 hover:text-gray-700">
                                        Position Name
                                        <ArrowsUpDownIcon className="w-3.5 h-3.5" />
                                    </button>
                                </th>
                                <th className="px-6 py-3.5 font-semibold">Description</th>
                                <th className="px-6 py-3.5 font-semibold">Level</th>
                                <th className="px-6 py-3.5 font-semibold">Status</th>
                                <th className="px-6 py-3.5 font-semibold">In Use</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : positions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                        No positions found
                                    </td>
                                </tr>
                            ) : (
                                positions.map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                                        {/* <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(p.id)}
                                            onChange={() => toggleSelectOne(p.id)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                                        />
                                    </td> */}
                                        <td className="px-5 py-3.5">
                                            <input type="checkbox" className="rounded border-gray-300" />
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{pageIndex * PAGE_SIZE + idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <CodeBadge code={p.code} />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={p.description}>
                                            {p.description}
                                        </td>
                                        <td className="px-6 py-4">{p.level}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="px-6 py-4">{p.inUse}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/positions/${p.id}`)}
                                                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
                                                    title="View"
                                                >
                                                    <EyeIcon className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelected(p);
                                                        setOpen(true);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-4 h-4 text-indigo-600" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(p.id)}
                                                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3.5 border-t border-gray-100 text-sm text-gray-500">
                    Showing {startItem} to {endItem} of {totalElements} positions
                </div>
            </div>

            {/* Pagination */}
            <Pagination
                pageIndex={pageIndex}
                totalPages={totalPages}
                onPrev={() => setPageIndex((prev) => prev - 1)}
                onNext={() => setPageIndex((prev) => prev + 1)}
            />

            {/* Form Modal */}
            <PositionFormModal
                open={open}
                onClose={() => {
                    setOpen(false);
                    setSelected(null);
                }}
                onSubmit={handleSubmit}
                defaultValues={
                    selected
                        ? selected
                        : undefined
                }
            />

            {/* Confirm Delete */}
            <ConfirmationDialog
                isShow={deleteId !== null}
                title="Confirm delete"
                okText="Delete"
                cancelText="Cancel"
                ok={async () => {
                    if (deleteId !== null) {
                        await handleDelete(deleteId);
                        setDeleteId(null);
                    }
                }}
                cancel={() => setDeleteId(null)}
            >
                <p>Bạn có chắc muốn xoá không?</p>
            </ConfirmationDialog>
        </div>
    );
}

