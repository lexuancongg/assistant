'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { PageResponse } from '@/models/page/pageResponse';
import Pagination from '@/components/pagination/pagination';
import ConfirmationDialog from '@/components/dialog/confirmDialog';
import { DistrictCreateRequest, DistrictResponse } from '@/models/district/district';
import districtService from '@/services/district/districtService';
import { CountryResponse } from '@/models/country/countryResponse';
import countryService from '@/services/country/countryService';
import provinceService from '@/services/province/provinceService';
import DistrictFormModal from '@/components/district/districtFormModal';

export default function DistrictsPage() {
    const [districts, setDistricts] = useState<DistrictResponse[]>([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<DistrictResponse | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<number | undefined>(undefined);
    const [selectedProvince, setSelectedProvince] = useState<number | undefined>(undefined);
    const [countries, setCountries] = useState<CountryResponse[]>([]);
    const [provinces, setProvinces] = useState<ProvinceResponse[]>([]);

    const fetchDistricts = useCallback(async () => {
        setLoading(true);
        try {
            const res: PageResponse<DistrictResponse> =
                await districtService.getDistricts(keyword, pageIndex, selectedCountry, selectedProvince);
            setDistricts(res.data);
            setTotalPages(res.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pageIndex, keyword, selectedCountry, selectedProvince]);

    useEffect(() => { fetchDistricts(); }, [fetchDistricts]);

    useEffect(() => {
        countryService.getCountries().then(setCountries).catch(console.error);
    }, []);

    useEffect(() => {
        provinceService.getProvinces(0, '', selectedCountry)
            .then(res => setProvinces(res.data))
            .catch(console.error);
    }, [selectedCountry]);

    const handleDelete = async (id: number) => {
        try {
            await districtService.deleteDistrict(id);
            fetchDistricts();
        } catch (err) {
            console.error(err);
        }
    };

    const selectClass = "border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition";

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Districts</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage district master data</p>
                </div>
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition text-sm font-semibold"
                >
                    <PlusIcon className="w-4 h-4" />
                    Add District
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        placeholder="Search districts..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                        onChange={(e) => {
                            const value = e.target.value;
                            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                            searchTimeoutRef.current = setTimeout(() => {
                                setKeyword(value);
                                setPageIndex(0);
                            }, 500);
                        }}
                    />
                </div>

                <select
                    value={selectedCountry ?? ''}
                    onChange={(e) => {
                        setSelectedCountry(e.target.value ? Number(e.target.value) : undefined);
                        setSelectedProvince(undefined);
                        setPageIndex(0);
                    }}
                    className={selectClass}
                >
                    <option value="">All countries</option>
                    {countries.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                <select
                    value={selectedProvince ?? ''}
                    onChange={(e) => {
                        setSelectedProvince(e.target.value ? Number(e.target.value) : undefined);
                        setPageIndex(0);
                    }}
                    className={selectClass}
                    disabled={!selectedCountry}
                >
                    <option value="">All provinces</option>
                    {provinces.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-gray-700">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                            <th className="px-6 py-3.5 text-left font-semibold">#</th>
                            <th className="px-6 py-3.5 text-left font-semibold">District Name</th>
                            <th className="px-6 py-3.5 text-left font-semibold">Province</th>
                            <th className="px-6 py-3.5 text-left font-semibold">Country</th>
                            <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex items-center justify-center gap-2 text-gray-400">
                                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                        Loading...
                                    </div>
                                </td>
                            </tr>
                        ) : districts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <BuildingOffice2Icon className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                                    <p className="text-gray-400 text-sm">No districts found</p>
                                </td>
                            </tr>
                        ) : (
                            districts.map((d, idx) => (
                                <tr key={d.id} className="hover:bg-indigo-50/40 transition-colors">
                                    <td className="px-6 py-4 text-gray-400 text-xs">{pageIndex * 10 + idx + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <BuildingOffice2Icon className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <span className="font-medium text-gray-800">{d.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                                            {d.provinceName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {d.countryName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setSelected(d); setOpen(true); }}
                                                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-4 h-4 text-indigo-600" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(d.id)}
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

            {/* Pagination */}
            <Pagination
                pageIndex={pageIndex}
                totalPages={totalPages}
                onPrev={() => setPageIndex(prev => prev - 1)}
                onNext={() => setPageIndex(prev => prev + 1)}
            />

            <DistrictFormModal
                open={open}
                onClose={() => { setOpen(false); setSelected(null); }}
                onSubmit={async (data: DistrictCreateRequest) => {
                    if (selected) {
                        await districtService.updateDistrict(selected.id, data);
                    } else {
                        await districtService.createDistrict(data);
                    }
                    setOpen(false);
                    setSelected(null);
                    fetchDistricts();
                }}
                defaultValues={selected ?? undefined}
            />

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