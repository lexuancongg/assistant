'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

import { PageResponse } from '@/models/page/pageResponse';
import { Branch } from '@/models/branch/branch';
import {
  DepartmentCreateRequest,
  Department,
} from '@/models/department/department';

import departmentService from '@/services/department/departmentService';
import branchService from '@/services/branch/branchService';

import DepartmentFormModal from '@/components/department/departmentFormModal';
import ConfirmationDialog from '@/components/dialog/confirmDialog';

// ---------- Page ----------

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(undefined);

  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 5;

  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ---- Fetch departments ----
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res: PageResponse<Department> =
          await departmentService.getDepartments(pageIndex, keyword, selectedBranch);

      setDepartments(res.data);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements ?? res.data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, keyword, selectedBranch]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // ---- Fetch branches (cho filter + form) ----
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await branchService.getAllBranch();
        setBranches(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBranches();
  }, []);

  // ---- Stats (tính từ data hiện có; thay bằng API riêng nếu BE có endpoint /stats) ----
  const stats = {
    total: totalElements,
    active: departments.filter((d) => d.status === 'ACTIVE').length,
    inactive: departments.filter((d) => d.status !== 'ACTIVE').length,
    withManager: departments.filter((d) => !!d.manager).length,
  };

  // ---- Handlers ----
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setKeyword(value);
      setPageIndex(0);
    }, 500);
  };

  const handleReset = () => {
    setSearchInput('');
    setKeyword('');
    setSelectedBranch(undefined);
    setPageIndex(0);
  };

  const handleDelete = async (id: number) => {
    try {
      await departmentService.deleteDepartment(id);
      fetchDepartments();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  return (
      <div className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-600 font-medium">Departments</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
            <p className="text-gray-500 mt-1">Manage departments and organizational structure</p>
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

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
              label="Total Departments"
              value={stats.total}
              sub="All company departments"
          />
          <StatCard
              icon={<Users className="w-5 h-5 text-green-600" />}
              iconBg="bg-green-50"
              label="Active"
              value={stats.active}
              sub={stats.total ? `${((stats.active / stats.total) * 100).toFixed(1)}% of total` : '—'}
          />
          <StatCard
              icon={<UserCheck className="w-5 h-5 text-orange-600" />}
              iconBg="bg-orange-50"
              label="Inactive"
              value={stats.inactive}
              sub={stats.total ? `${((stats.inactive / stats.total) * 100).toFixed(1)}% of total` : '—'}
          />
          <StatCard
              icon={<UserCog className="w-5 h-5 text-purple-600" />}
              iconBg="bg-purple-50"
              label="Managers"
              value={stats.withManager}
              sub="With department"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by name or code..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
                onClick={fetchDepartments}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Branch</label>
              <select
                  value={selectedBranch ?? ''}
                  onChange={(e) => {
                    setPageIndex(0);
                    setSelectedBranch(e.target.value ? Number(e.target.value) : undefined);
                  }}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
              >
                <option  value="">All Branches</option>
                {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                ))}
              </select>
            </div>

            {/* Status / Manager filter: nối API thật khi BE hỗ trợ filter này.
                        Hiện tại để dạng UI tĩnh, có thể bind state tương tự selectedBranch. */}
            <FilterSelectStatic label="Status" options={['All Status', 'ACTIVE', 'INACTIVE']} />
            <FilterSelectStatic label="Manager" options={['All Managers']} />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3.5 w-10">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-3.5 font-medium">Stt</th>
                <th className="px-3 py-3.5 font-medium">Code</th>
                <th className="px-3 py-3.5 font-medium">Department Name</th>
                <th className="px-3 py-3.5 font-medium">Branch</th>
                <th className="px-3 py-3.5 font-medium">Manager</th>
                <th className="px-3 py-3.5 font-medium">Employees</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-3 py-3.5 font-medium text-right">Actions</th>
              </tr>
              </thead>
              <tbody>
              {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
              ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-gray-400">
                      No departments found
                    </td>
                  </tr>
              ) : (
                  departments.map((dept ,index) => (
                      <tr
                          key={dept.id}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-3 py-3.5 text-gray-700">{index + 1}</td>
                        <td className="px-3 py-3.5">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-600">
                                                {dept.code}
                                            </span>
                        </td>
                        <td className="px-3 py-3.5 font-medium text-gray-900">{dept.name}</td>
                        <td className="px-3 py-3.5 text-gray-600">{dept.branch.name}</td>
                        <td className="px-3 py-3.5 text-gray-700">
                          {dept.manager?.name || (
                              <span className="text-gray-400 italic">No manager</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-gray-600">{50}</td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={dept.status} />
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <ActionButton
                                icon={<Pencil className="w-4 h-4" />}
                                variant="primary"
                                onClick={() => {
                                  setSelected(dept);
                                  setOpen(true);
                                }}
                            />
                            <ActionButton
                                icon={<Trash2 className="w-4 h-4" />}
                                variant="danger"
                                onClick={() => setDeleteId(dept.id)}
                            />
                          </div>
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>





          {/* Pagination footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                        {totalElements > 0
                            ? `Showing ${pageIndex * PAGE_SIZE + 1} to ${Math.min(
                                (pageIndex + 1) * PAGE_SIZE,
                                totalElements
                            )} of ${totalElements} departments`
                            : 'No departments'}
                    </span>

            <div className="flex items-center gap-1.5">
              <PageNavButton
                  icon={<ChevronLeft className="w-4 h-4" />}
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              />

              {Array.from({ length: totalPages }, (_, i) => i)
                  .filter(
                      (p) => p === 0 || p === totalPages - 1 || Math.abs(p - pageIndex) <= 0
                  )
                  .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                      p === 'ellipsis' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">
                                        ...
                                    </span>
                      ) : (
                          <button
                              key={p}
                              onClick={() => setPageIndex(p)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                  p === pageIndex
                                      ? 'bg-blue-600 text-white'
                                      : 'text-gray-600 hover:bg-gray-100'
                              }`}
                          >
                            {p + 1}
                          </button>
                      )
                  )}

              <PageNavButton
                  icon={<ChevronRight className="w-4 h-4" />}
                  disabled={pageIndex >= totalPages - 1}
                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              />
            </div>
          </div>
        </div>

        {/* Add / Edit modal */}
        <DepartmentFormModal
            open={open}
            onClose={() => {
              setOpen(false);
              setSelected(null);
            }}
            onSubmit={async (data: DepartmentCreateRequest) => {
              if (selected) {
                await departmentService.updateDepartment(selected.id, data);
              } else {
                await departmentService.createDepartment(data);
              }
              setOpen(false);
              setSelected(null);
              fetchDepartments();
            }}
            defaultValues={selected ? selected : undefined}
            branchs={branches}
        />

        {/* Confirm delete */}
        <ConfirmationDialog
            isShow={deleteId !== null}
            title="Confirm delete"
            okText="Delete"
            cancelText="Cancel"
            ok={async () => {
              if (deleteId !== null) await handleDelete(deleteId);
            }}
            cancel={() => setDeleteId(null)}
        >
          <p>Bạn có chắc muốn xoá phòng ban này không?</p>
        </ConfirmationDialog>
      </div>
  );
}

// ---------- Sub components ----------

function StatCard({
                    icon,
                    iconBg,
                    label,
                    value,
                    sub,
                  }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  sub: string;
}) {
  return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 leading-tight">{label}</p>
          <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
          <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>
        </div>
      </div>
  );
}

// Status/Manager filter chưa nối API — giữ UI tĩnh, dễ nối sau
function FilterSelectStatic({ label, options }: { label: string; options: string[] }) {
  return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <select className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white">
          {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
          ))}
        </select>
      </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
      <span
          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}
      >
            {status}
        </span>
  );
}

function ActionButton({
                        icon,
                        variant,
                        onClick,
                      }: {
  icon: React.ReactNode;
  variant: 'neutral' | 'primary' | 'danger';
  onClick?: () => void;
}) {
  const styles = {
    neutral: 'bg-gray-50 text-gray-500 hover:bg-gray-100',
    primary: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    danger: 'bg-red-50 text-red-500 hover:bg-red-100',
  };
  return (
      <button
          onClick={onClick}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${styles[variant]}`}
      >
        {icon}
      </button>
  );
}

function PageNavButton({
                         icon,
                         disabled,
                         onClick,
                       }: {
  icon: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
      <button
          onClick={onClick}
          disabled={disabled}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {icon}
      </button>
  );
}


// 'use client';
//
// import {useCallback, useEffect, useState} from 'react';
// import {
//   Building2,
//   Users,
//   UserCheck,
//   UserCog,
//   Search,
//   RotateCcw,
//   Plus,
//   Eye,
//   Pencil,
//   Trash2,
//   ChevronLeft,
//   ChevronRight,
// } from 'lucide-react';
// import {Department, DepartmentStatus} from "@/models/department/department";
// import {BranchResponse} from "@/models/branch/branchResponse";
// import {PageResponse} from "@/models/page/pageResponse";
// import departmentService from "@/services/department/departmentService";
// import branchService from "@/services/branch/branchService";
//
//
//
// interface  Branch{
//   id:number;
//   name:string;
// }
//
// const STATS = {
//   total: 24,
//   active: 20,
//   inactive: 4,
//   withManager: 18,
// };
//
// const BRANCHES = ['All Branches', 'Head Office', 'Branch 1'];
// const STATUSES = ['All Status', 'ACTIVE', 'INACTIVE'];
// const MANAGERS = [
//   'All Managers',
//   'Nguyễn Văn A',
//   'Trần Thị B',
//   'Lê Văn C',
//   'Phạm Thị D',
//   'Hoàng Văn E',
// ];
//
// const DEPARTMENTS: Department[] = [
//   {
//     id: 1,
//     code: 'IT',
//     name: 'Information Technology',
//     branch: 'Head Office',
//     manager: {
//       name: 'Nguyễn Văn A',
//       avatarUrl: 'https://i.pravatar.cc/40?img=12',
//     },
//     status: 'ACTIVE',
//     description: 'Manage system and technology infrastructure',
//   },
//   {
//     id: 2,
//     code: 'HR',
//     name: 'Human Resources',
//     branch: 'Head Office',
//     manager: {
//       name: 'Trần Thị B',
//       avatarUrl: 'https://i.pravatar.cc/40?img=47',
//     },
//     status: 'ACTIVE',
//     description: 'Recruitment and employee management',
//   },
//   {
//     id: 3,
//     code: 'FIN',
//     name: 'Finance',
//     branch: 'Head Office',
//     manager: {
//       name: 'Lê Văn C',
//       avatarUrl: 'https://i.pravatar.cc/40?img=33',
//     },
//     status: 'ACTIVE',
//     description: 'Accounting and financial management',
//   },
//   {
//     id: 4,
//     code: 'MKT',
//     name: 'Marketing',
//     branch: 'Branch 1',
//     manager: {
//       name: 'Phạm Thị D',
//       avatarUrl: 'https://i.pravatar.cc/40?img=45',
//     },
//     status: 'ACTIVE',
//     description: 'Marketing and brand development',
//   },
//   {
//     id: 5,
//     code: 'OPS',
//     name: 'Operations',
//     branch: 'Branch 1',
//     manager: {
//       name: 'Hoàng Văn E',
//       avatarUrl: 'https://i.pravatar.cc/40?img=14',
//     },
//     status: 'INACTIVE',
//     description: 'Operations and process management',
//   },
// ];
//
// const TOTAL_ITEMS = 24;
// const PAGE_SIZE = 5;
// const TOTAL_PAGES = Math.ceil(TOTAL_ITEMS / PAGE_SIZE);
//
// // Badge màu theo mã phòng ban
// const CODE_BADGE_STYLES: Record<string, string> = {
//   IT: 'bg-blue-50 text-blue-600',
//   HR: 'bg-green-50 text-green-600',
//   FIN: 'bg-purple-50 text-purple-600',
//   MKT: 'bg-orange-50 text-orange-600',
//   OPS: 'bg-cyan-50 text-cyan-600',
// };
//
// // ---------- Page ----------
//
// export default function DepartmentsPage() {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [branches, setBranches] = useState<BranchResponse[]>([]);
//   const [selectedBranch, setSelectedBranch] = useState<number | undefined>(undefined);
//   const [keyword, setKeyword] = useState('');
//   const [totalPages, setTotalPages] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [open, setOpen] = useState(false);
//
//
//   const [selected, setSelected] = useState<Department | null>(null);
//   const [deleteId, setDeleteId] = useState<number | null>(null);
//
//
//   const fetchDepartments = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res: PageResponse<Department> =
//           await departmentService.getDepartments(currentPage, keyword, selectedBranch);
//
//       setDepartments(res.data);
//       setTotalPages(res.totalPages);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentPage, keyword, selectedBranch]);
//
//   useEffect(() => {
//     fetchDepartments();
//   }, [fetchDepartments]);
//
//   // fetch branches
//   useEffect(() => {
//     const fetchBranches = async () => {
//       try {
//         const res = await branchService.getAllBranch();
//         setBranches(res);
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     fetchBranches();
//   }, []);
//
//   return (
//       <div className="flex flex-col gap-6">
//         {/* Breadcrumb */}
//         <div className="flex items-center gap-2 text-sm text-gray-400">
//           <span>Dashboard</span>
//           <ChevronRight className="w-3.5 h-3.5" />
//           <span className="text-gray-600 font-medium">Departments</span>
//         </div>
//
//         {/* Header */}
//         <div className="flex items-start justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
//             <p className="text-gray-500 mt-1">Manage departments and organizational structure</p>
//           </div>
//           <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm">
//             <Plus className="w-4 h-4" />
//             Add Department
//           </button>
//         </div>
//
//         {/* Stat cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard
//               icon={<Building2 className="w-5 h-5 text-blue-600" />}
//               iconBg="bg-blue-50"
//               label="Total Departments"
//               value={STATS.total}
//               sub="All company departments"
//           />
//           <StatCard
//               icon={<Users className="w-5 h-5 text-green-600" />}
//               iconBg="bg-green-50"
//               label="Active"
//               value={STATS.active}
//               sub={`${((STATS.active / STATS.total) * 100).toFixed(1)}% of total`}
//           />
//           <StatCard
//               icon={<UserCheck className="w-5 h-5 text-orange-600" />}
//               iconBg="bg-orange-50"
//               label="Inactive"
//               value={STATS.inactive}
//               sub={`${((STATS.inactive / STATS.total) * 100).toFixed(1)}% of total`}
//           />
//           <StatCard
//               icon={<UserCog className="w-5 h-5 text-purple-600" />}
//               iconBg="bg-purple-50"
//               label="Managers"
//               value={STATS.withManager}
//               sub="With department"
//           />
//         </div>
//
//         {/* Filters */}
//         <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col gap-4">
//           <div className="flex items-center gap-3">
//             <div className="relative flex-1">
//               <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
//               <input
//                   type="text"
//                   placeholder="Search by name or code..."
//                   className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
//               />
//             </div>
//             <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
//               <RotateCcw className="w-4 h-4" />
//               Reset
//             </button>
//             <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium">
//               <Search className="w-4 h-4" />
//               Search
//             </button>
//           </div>
//
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             <FilterSelect label="Branch" options={BRANCHES} />
//             <FilterSelect label="Status" options={STATUSES} />
//             <FilterSelect label="Manager" options={MANAGERS} />
//           </div>
//         </div>
//
//         {/* Table */}
//         <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//               <tr className="border-b border-gray-100 text-left text-gray-500">
//                 <th className="px-5 py-3.5 w-10">
//                   <input type="checkbox" className="rounded border-gray-300" />
//                 </th>
//                 <th className="px-3 py-3.5 font-medium">ID</th>
//                 <th className="px-3 py-3.5 font-medium">Code</th>
//                 <th className="px-3 py-3.5 font-medium">Department Name</th>
//                 <th className="px-3 py-3.5 font-medium">Branch</th>
//                 <th className="px-3 py-3.5 font-medium">Manager</th>
//                 <th className="px-3 py-3.5 font-medium">Status</th>
//                 {/*<th className="px-3 py-3.5 font-medium">Description</th>*/}
//                 <th className="px-3 py-3.5 font-medium text-right">Actions</th>
//               </tr>
//               </thead>
//               <tbody>
//               {DEPARTMENTS.map((dept) => (
//                   <tr
//                       key={dept.id}
//                       className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
//                   >
//                     <td className="px-5 py-3.5">
//                       <input type="checkbox" className="rounded border-gray-300" />
//                     </td>
//                     <td className="px-3 py-3.5 text-gray-700">{dept.id}</td>
//                     <td className="px-3 py-3.5">
//                                         <span
//                                             className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
//                                                 CODE_BADGE_STYLES[dept.code] ?? 'bg-gray-100 text-gray-600'
//                                             }`}
//                                         >
//                                             {dept.code}
//                                         </span>
//                     </td>
//                     <td className="px-3 py-3.5 font-medium text-gray-900">{dept.name}</td>
//                     <td className="px-3 py-3.5 text-gray-600">{dept.branch}</td>
//                     <td className="px-3 py-3.5">
//                       <div className="flex items-center gap-2">
//                         {/* eslint-disable-next-line @next/next/no-img-element */}
//                         <img
//                             src={dept.manager.avatarUrl}
//                             alt={dept.manager.name}
//                             className="w-7 h-7 rounded-full object-cover"
//                         />
//                         <span className="text-gray-700">{dept.manager.name}</span>
//                       </div>
//                     </td>
//                     <td className="px-3 py-3.5">
//                       <StatusBadge status={dept.status} />
//                     </td>
//                     {/*<td className="px-3 py-3.5 text-gray-500 max-w-[220px] truncate">*/}
//                     {/*  {dept.description}*/}
//                     {/*</td>*/}
//                     <td className="px-3 py-3.5">
//                       <div className="flex items-center justify-end gap-2">
//                         <ActionButton icon={<Eye className="w-4 h-4" />} variant="neutral" />
//                         <ActionButton icon={<Pencil className="w-4 h-4" />} variant="primary" />
//                         <ActionButton icon={<Trash2 className="w-4 h-4" />} variant="danger" />
//                       </div>
//                     </td>
//                   </tr>
//               ))}
//               </tbody>
//             </table>
//           </div>
//
//           {/* Pagination footer */}
//           <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
//                     <span className="text-sm text-gray-500">
//                         Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
//                       {Math.min(currentPage * PAGE_SIZE, TOTAL_ITEMS)} of {TOTAL_ITEMS} departments
//                     </span>
//
//             <div className="flex items-center gap-1.5">
//               <PageNavButton
//                   icon={<ChevronLeft className="w-4 h-4" />}
//                   disabled={currentPage === 1}
//                   onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//               />
//
//               {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1)
//                   .filter(
//                       (p) =>
//                           p === 1 ||
//                           p === TOTAL_PAGES ||
//                           Math.abs(p - currentPage) <= 0
//                   )
//                   .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
//                     if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
//                     acc.push(p);
//                     return acc;
//                   }, [])
//                   .map((p, idx) =>
//                       p === 'ellipsis' ? (
//                           <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">
//                                         ...
//                                     </span>
//                       ) : (
//                           <button
//                               key={p}
//                               onClick={() => setCurrentPage(p)}
//                               className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
//                                   p === currentPage
//                                       ? 'bg-blue-600 text-white'
//                                       : 'text-gray-600 hover:bg-gray-100'
//                               }`}
//                           >
//                             {p}
//                           </button>
//                       )
//                   )}
//
//               <PageNavButton
//                   icon={<ChevronRight className="w-4 h-4" />}
//                   disabled={currentPage === TOTAL_PAGES}
//                   onClick={() => setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))}
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//   );
// }
//
//
// function StatCard({
//                     icon,
//                     iconBg,
//                     label,
//                     value,
//                     sub,
//                   }: {
//   icon: React.ReactNode;
//   iconBg: string;
//   label: string;
//   value: number;
//   sub: string;
// }) {
//   return (
//       <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
//         <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
//           {icon}
//         </div>
//         <div>
//           <p className="text-xs text-gray-500 leading-tight">{label}</p>
//           <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
//           <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>
//         </div>
//       </div>
//   );
// }
//
// function FilterSelect({ label, options }: { label: string; options: string[] }) {
//   return (
//       <div className="flex flex-col gap-1.5">
//         <label className="text-xs font-medium text-gray-500">{label}</label>
//         <select className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white">
//           {options.map((opt) => (
//               <option key={opt} value={opt}>
//                 {opt}
//               </option>
//           ))}
//         </select>
//       </div>
//   );
// }
//
// function StatusBadge({ status }: { status: DepartmentStatus }) {
//   const isActive = status === 'ACTIVE';
//   return (
//       <span
//           className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
//               isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
//           }`}
//       >
//             {isActive ? 'ACTIVE' : 'INACTIVE'}
//         </span>
//   );
// }
//
// function ActionButton({
//                         icon,
//                         variant,
//                       }: {
//   icon: React.ReactNode;
//   variant: 'neutral' | 'primary' | 'danger';
// }) {
//   const styles = {
//     neutral: 'bg-gray-50 text-gray-500 hover:bg-gray-100',
//     primary: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
//     danger: 'bg-red-50 text-red-500 hover:bg-red-100',
//   };
//   return (
//       <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${styles[variant]}`}>
//         {icon}
//       </button>
//   );
// }
//
// function PageNavButton({
//                          icon,
//                          disabled,
//                          onClick,
//                        }: {
//   icon: React.ReactNode;
//   disabled?: boolean;
//   onClick?: () => void;
// }) {
//   return (
//       <button
//           onClick={onClick}
//           disabled={disabled}
//           className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//       >
//         {icon}
//       </button>
//   );
// }