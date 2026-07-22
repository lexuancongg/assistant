'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  UsersIcon,
  UserPlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

import { PageResponse } from '@/models/page/pageResponse';
import employeeService from '@/services/employee/employeeService';
import branchService from '@/services/branch/branchService';
import departmentService from '@/services/department/departmentService';
import positionService from '@/services/positions/positionService';

import Pagination from '@/components/pagination/pagination';
import ConfirmationDialog from '@/components/dialog/confirmDialog';
import EmployeeDetailModal from '@/components/employee/employeeDetailModal';

import {
  Employee,
  EmployeeDetailResponse,
  EmployeeStatus,
} from '@/models/employee/employee';

import { Branch } from '@/models/branch/branch';
import { Position } from '@/models/positions/position';
import { Department } from '@/models/department/department';
import CustomSelect from '@/components/item/customSelect';
import { useRouter } from 'next/navigation';

const statusStyles: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  ONLEAVE: 'bg-orange-50 text-orange-600',
  PENDING: 'bg-purple-50 text-purple-600',
};

const statusDotStyles: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-green-500',
  ONLEAVE: 'bg-orange-500',
  PENDING: 'bg-purple-500',
};

const statusLabel: Record<EmployeeStatus, string> = {
  ACTIVE: 'Active',
  ONLEAVE: 'On Leave',
  PENDING: 'Pending',
};

export default function EmployeePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // TODO: chưa có service trả về danh sách Job Title riêng, tạm để mảng rỗng
  const [jobTitles, setJobTitles] = useState<string[]>([]);

  // const [employeeMore, setEmployeeMore] = useState<EmployeeDetailResponse>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  // TODO: logic cũ filter theo branch — tạm giữ state, chưa có ô filter Branch trong UI mới
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const [selectedPosition, setSelectedPosition] = useState<number | undefined>();
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | undefined>();
  const [hireDateFrom, setHireDateFrom] = useState<string | undefined>();
  const [hireDateTo, setHireDateTo] = useState<string | undefined>();

  const [sortBy] = useState('name');
  const [sortDir] = useState<'asc' | 'desc'>('desc');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [moreInfoId, setMoreInfoId] = useState<number>();

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res: PageResponse<Employee> = await employeeService.getEmployees(
        keyword,
        undefined,
        undefined,
        selectedDepartment,
        selectedBranch,
        selectedPosition,
        selectedStatus,
        hireDateFrom ? new Date(hireDateFrom) : undefined,
        hireDateTo ? new Date(hireDateTo) : undefined,
        pageIndex,
        pageSize,
        sortBy,
        sortDir
      );

      setEmployees(res.data);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements ?? res.data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    selectedBranch,
    selectedDepartment,
    selectedPosition,
    selectedStatus,
    hireDateFrom,
    hireDateTo,
    pageIndex,
    pageSize,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // useEffect(() => {
  //   if (!moreInfoId) return;

  //   employeeService
  //     .getDetailEmployee(moreInfoId)
  //     .then(setEmployeeMore)
  //     .catch(console.error);
  // }, [moreInfoId]);

  useEffect(() => {
    if (!selectedBranch) {
      setDepartments([]);
      return;
    }

    departmentService
      .getDepartmentByBranch(selectedBranch)
      .then(setDepartments)
      .catch(console.error);
  }, [selectedBranch]);

  useEffect(() => {
    positionService.getPositionAlls().then(setPositions).catch(console.error);
    branchService.getAllBranch().then(setBranches).catch(console.error);
  }, []);

  const handleDelete = async (id: number) => {
    await employeeService.deleteEmployee(id);
    fetchEmployees();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const value = e.target.value;
    searchTimeoutRef.current = setTimeout(() => {
      setKeyword(value);
      setPageIndex(0);
    }, 400);
  };

  const handleReset = () => {
    setKeyword('');
    setSelectedDepartment(undefined);
    setSelectedPosition(undefined);
    setSelectedJobTitle(undefined);
    setSelectedStatus(undefined);
    setHireDateFrom(undefined);
    setHireDateTo(undefined);
    setPageIndex(0);
  };

  // TODO: số liệu Active/On Leave/Pending nên lấy từ API thống kê riêng,
  // hiện chỉ tính tạm trên trang dữ liệu hiện tại.
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const onLeaveCount = employees.filter((e) => e.status === 'ONLEAVE').length;
  const pendingCount = employees.filter((e) => e.status === 'PENDING').length;

  return (
    <div className="min-h-screen   text-gray-900">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-2">
        Dashboard <span className="mx-1">›</span>
        <span className="text-gray-600 font-medium">Employees</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Employee Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage employee information, departments and positions
          </p>
        </div>

        <Link href="/dashboard/employees/create">
          <button
         
           className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition text-sm font-semibold">
            <PlusIcon className="w-4 h-4" />
            New Employee
          </button>
        </Link>
      </div>

      {/* Stat cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
            <p className="text-xs text-gray-400">100% of active users</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-xs text-gray-400">
              {employees.length > 0 ? `${Math.round((activeCount / employees.length) * 100)}% of total` : '—'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <ClockIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">On Leave</p>
            <p className="text-2xl font-bold text-gray-900">{onLeaveCount}</p>
            <p className="text-xs text-gray-400">
              {employees.length > 0 ? `${Math.round((onLeaveCount / employees.length) * 100)}% of total` : '—'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <UserPlusIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            <p className="text-xs text-gray-400">Awaiting approval</p>
          </div>
        </div>
      </div> */}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              defaultValue={keyword}
              onChange={handleSearchChange}
              placeholder="Search by name, code or email..."
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
                fetchEmployees();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CustomSelect
            label="Branch"
            placeholder="All Branches"
            value={selectedBranch}
            onChange={(v) => setSelectedBranch(v as number | undefined)}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
            <select

              disabled={!selectedBranch}
              value={selectedDepartment ?? ''}
              onChange={(e) =>
                setSelectedDepartment(e.target.value ? Number(e.target.value) : undefined)
              }
              className={`w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition ${!selectedBranch
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : ""
                }`}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Position</label>
            <select
              value={selectedPosition ?? ''}
              onChange={(e) =>
                setSelectedPosition(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            >
              <option value="">All Positions</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Job Title</label>
            <select
              value={selectedJobTitle ?? ''}
              onChange={(e) => setSelectedJobTitle(e.target.value || undefined)}
              className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            >
              <option value="">All Job Titles</option>
              {jobTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={selectedStatus ?? ''}
              onChange={(e) =>
                setSelectedStatus((e.target.value as EmployeeStatus) || undefined)
              }
              className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ONLEAVE">On Leave</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Hire Date From</label>
            <input
              type="date"
              value={hireDateFrom ?? ''}
              onChange={(e) => setHireDateFrom(e.target.value || undefined)}
              className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Hire Date To</label>
            <input
              type="date"
              value={hireDateTo ?? ''}
              onChange={(e) => setHireDateTo(e.target.value || undefined)}
              className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-gray-500 bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 text-left font-semibold w-10">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="p-4 text-left font-semibold">Employee</th>
              <th className="p-4 text-left font-semibold">Department</th>
              <th className="p-4 text-left font-semibold">Position</th>
              <th className="p-4 text-left font-semibold">Job Title</th>
              <th className="p-4 text-left font-semibold">Hire Date</th>
              <th className="p-4 text-left font-semibold">Status</th>
              <th className="p-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="p-12 text-center" colSpan={8}>
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td className="p-16 text-center text-gray-400" colSpan={8}>
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((e) => (
                <tr key={e.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="p-4">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {e.avatarUrl ? (
                        <img
                          src={e.avatarUrl}
                          alt={e.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {e.name
                            .split(' ')
                            .slice(-1)[0]
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{e.name}</p>
                        <p className="text-xs text-gray-400">{e.code}</p>
                        <p className="text-xs text-gray-400">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-700">{e.department.name}</p>
                    <p className="text-xs text-gray-400">{e.branch.name}</p>
                  </td>
                  <td className="p-4 text-gray-600">{e.position.name}</td>
                 <td className="p-4 text-gray-600">
                    <div className="relative inline-block">
                      <span className="absolute -top-3 -right-3 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold leading-none shadow-sm">
                        {e.level.name}
                      </span>
                      {e.jobTitle.name}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{e.hireDate}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[e.status]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotStyles[e.status]}`} />
                      {statusLabel[e.status]}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setMoreInfoId(e.id)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition"
                      >
                        <EyeIcon className="w-4 h-4 text-green-600" />
                      </button>

                      <Link href={`/dashboard/employees/${e.id}/edit`}>
                        <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition">
                          <PencilIcon className="w-4 h-4 text-indigo-600" />
                        </button>
                      </Link>

                      <button
                        onClick={() => setDeleteId(e.id)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition"
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

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {employees.length === 0 ? 0 : pageIndex * pageSize + 1} to{' '}
            {pageIndex * pageSize + employees.length} of {totalElements} employees
          </p>

          <Pagination
            pageIndex={pageIndex}
            totalPages={totalPages}
            onPrev={() => setPageIndex((p) => p - 1)}
            onNext={() => setPageIndex((p) => p + 1)}
          />
        </div>
      </div>

      {/* Modal */}
      {/* <EmployeeDetailModal
        employeeDetail={employeeMore}
        open={!!moreInfoId}
        onClose={() => setMoreInfoId(undefined)}
      /> */}

      {/* Delete */}
      <ConfirmationDialog
        isShow={deleteId !== null}
        title="Delete employee?"
        okText="Delete"
        cancelText="Cancel"
        ok={async () => {
          if (deleteId) {
            await handleDelete(deleteId);
            setDeleteId(null);
          }
        }}
        cancel={() => setDeleteId(null)}
      >
        <p className="text-sm text-gray-500">This action cannot be undone.</p>
      </ConfirmationDialog>
    </div>
  );
}