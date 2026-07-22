'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  PauseCircleIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import branchService from '@/services/branch/branchService';
import countryService from '@/services/country/countryService';
import provinceService from '@/services/province/provinceService';

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
  MapPin,

} from 'lucide-react';
import {
  Branch,
  BranchCreateRequest,
  BranchField,
  BranchStatus,
} from '@/models/branch/branch';
import { CountryResponse } from '@/models/country/countryResponse';
import { PageResponse } from '@/models/page/pageResponse';

import Pagination from '@/components/pagination/pagination';
import ConfirmationDialog from '@/components/dialog/confirmDialog';
import { ChevronRight } from "lucide-react";

import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

export default function BranchPage() {
  
const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [countries, setCountries] = useState<CountryResponse[]>([]);
  const [provinces, setProvinces] = useState<ProvinceResponse[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number | undefined>();
  const [selectedProvince, setSelectedProvince] = useState<number | undefined>();

  // TODO: chưa có trong branchService.getBranches, hiện tại chỉ là UI placeholder
  const [selectedStatus, setSelectedStatus] = useState<BranchStatus | ''>('');

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await countryService.getCountries();
      setCountries(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchProvinces = useCallback(async (countryId?: number) => {
    if (!countryId) {
      setProvinces([]);
      setSelectedProvince(undefined);
      return;
    }
    try {
      const res = await provinceService.getProvinces(0, '', countryId);
      setProvinces(res.data);
      setSelectedProvince(undefined);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: bổ sung selectedStatus vào tham số gọi API khi backend hỗ trợ
      const res: PageResponse<Branch> = await branchService.getBranches(
        pageIndex,
        keyword,
        selectedCountry,
        selectedProvince
      );
      setBranches(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, keyword, selectedCountry, selectedProvince]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    fetchProvinces(selectedCountry);
  }, [selectedCountry, fetchProvinces]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setKeyword(value);
      setPageIndex(0);
    }, 500);
  };

  const handleReset = () => {
    setKeyword('');
    setSelectedCountry(undefined);
    setSelectedProvince(undefined);
    setSelectedStatus('');
    setPageIndex(0);
  };

 
  
const handleOpenEdit = (branch: Branch) => {
  router.push(`/dashboard/branchs/edit/${branch.id}`);
};
  
  

  const handleDelete = async (id: number) => {
    try {
      await branchService.deleteBranch(id);
      fetchBranches();
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteClick = (id: number) => setDeleteId(id);

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    await handleDelete(deleteId);
    toast.success("Delete branch success");
    setDeleteId(null);
  };



  const handleCancelDelete = () => setDeleteId(null);

  // TODO: số liệu này chỉ tính trên dữ liệu của TRANG hiện tại (branches),
  // không phải tổng toàn bộ hệ thống. Cần thay bằng API thống kê riêng
  // (vd: branchService.getBranchStats()) khi có backend.
  const activeCount = branches.filter((b) => b.status === 'ACTIVE').length;
  const inactiveCount = branches.filter((b) => b.status === 'INACTIVE').length;
  const withAddressCount = branches.filter((b) => !!b.address).length;

  // ---------------- RENDER ----------------
  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Dashboard</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-600 font-medium">Position</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-500 mt-1">Manage Branch and organizational structure</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/branchs/create")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {/* Stat cards (tạm tính theo trang hiện tại, xem TODO ở trên) */}
      {/*<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">*/}
      {/*  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">*/}
      {/*    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">*/}
      {/*      <MapPinIcon className="w-5 h-5 text-blue-600"/>*/}
      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <p className="text-xs text-gray-500">Total Branches</p>*/}
      {/*      <p className="text-2xl font-bold text-gray-900">{branches.length}</p>*/}
      {/*      <p className="text-xs text-gray-400">This page</p>*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">*/}
      {/*    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">*/}
      {/*      <BuildingStorefrontIcon className="w-5 h-5 text-green-600"/>*/}
      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <p className="text-xs text-gray-500">Active</p>*/}
      {/*      <p className="text-2xl font-bold text-gray-900">{activeCount}</p>*/}
      {/*      <p className="text-xs text-gray-400">*/}
      {/*        {branches.length > 0 ? `${Math.round((activeCount / branches.length) * 100)}% of page` : '—'}*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">*/}
      {/*    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">*/}
      {/*      <PauseCircleIcon className="w-5 h-5 text-orange-500"/>*/}
      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <p className="text-xs text-gray-500">Inactive</p>*/}
      {/*      <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>*/}
      {/*      <p className="text-xs text-gray-400">*/}
      {/*        {branches.length > 0 ? `${Math.round((inactiveCount / branches.length) * 100)}% of page` : '—'}*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">*/}
      {/*    <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">*/}
      {/*      <UserGroupIcon className="w-5 h-5 text-purple-600"/>*/}
      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <p className="text-xs text-gray-500">With Address</p>*/}
      {/*      <p className="text-2xl font-bold text-gray-900">{withAddressCount}</p>*/}
      {/*      <p className="text-xs text-gray-400">*/}
      {/*        {branches.length > 0 ? `${Math.round((withAddressCount / branches.length) * 100)}% of page` : '—'}*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              defaultValue={keyword}
              onChange={handleSearchChange}
              placeholder="Search by branch name or code..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => {
                setPageIndex(0);
                fetchBranches();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as BranchStatus | '')}
              className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
            <select
              value={selectedCountry ?? ''}
              onChange={(e) => setSelectedCountry(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Province</label>
            <select
              value={selectedProvince ?? ''}
              onChange={(e) => setSelectedProvince(e.target.value ? Number(e.target.value) : undefined)}
              disabled={!selectedCountry}
              className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">All provinces</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">


        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3.5 w-10">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3.5 text-left font-semibold">Stt</th>
                <th className="px-6 py-3.5 text-left font-semibold">Code</th>
                <th className="px-6 py-3.5 text-left font-semibold">Branch Name</th>
                <th className="px-6 py-3.5 text-left font-semibold">Description</th>
                <th className="px-6 py-3.5 text-left font-semibold">Status</th>
                <th className="px-6 py-3.5 text-left font-semibold">Address</th>
                <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div
                        className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <MapPinIcon className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 text-sm">No branches found</p>
                  </td>
                </tr>
              ) : (
                branches.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-indigo-50/40 transition-colors group">
                    <td className="px-5 py-3.5">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{pageIndex * 10 + idx + 1}</td>
                    <td className="px-6 py-4 text-gray-500">{b.code}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{b.name}</td>
                    <td className="px-6 py-4 text-gray-500">{b.description}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${b.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-100 text-red-500'
                          }`}
                      >
                        {b.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {b.address && (
                        <div className="max-w-xs">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-1 text-slate-400 shrink-0" />

                            <div className="space-y-1">
                              <p className="text-sm font-normal text-slate-700">
                                {b.address.specificAddress}
                              </p>

                              <p className="text-xs text-slate-500">
                                {b.address.districtName}, {b.address.provinceName}
                              </p>

                              <p className="text-xs text-slate-400">
                                {b.address.countryName}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                      >
                        <PencilIcon className="w-4 h-4 text-indigo-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(b.id)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


      </div>







      <Pagination
        pageIndex={pageIndex}
        totalPages={totalPages}
        onPrev={() => setPageIndex((p) => p - 1)}
        onNext={() => setPageIndex((p) => p + 1)}
      />

      {/* <BranchFormModal
        // open={open}
        defaultValues={selectedBranch ?? null}
        // onClose={handleCloseModal}
        onSubmit={handleSubmitBranch}
      /> */}

      <ConfirmationDialog
        isShow={deleteId !== null}
        title="Confirm delete"
        okText="Delete"
        cancelText="Cancel"
        ok={handleConfirmDelete}
        cancel={handleCancelDelete}
      >
        <p>Bạn có chắc muốn xoá không?</p>
      </ConfirmationDialog>
    </div>
  );
}
