'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

import countryService from '@/services/country/countryService';
import {
  CountryResponse,
  CountryCreateRequest,
} from '@/models/country/countryResponse';
import { PageResponse } from '@/models/page/pageResponse';

import Pagination from '@/components/pagination/pagination';
import ConfirmationDialog from '@/components/dialog/confirmDialog';
import CountryFormModal from '@/components/country/countryFormModel';

export default function CountryPage() {
  const [countries, setCountries] = useState<CountryResponse[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CountryResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ================= FETCH =================
  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res: PageResponse<CountryResponse> =
        await countryService.getCountriesPaging(pageIndex, keyword);

      setCountries(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, keyword]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

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

  const handleOpenCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleOpenEdit = (country: CountryResponse) => {
    setSelected(country);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelected(null);
  };

  const handleSubmitCountry = async (country: CountryCreateRequest) => {
    if (selected) {
      await countryService.updateCountry(selected.id, country);
    } else {
      await countryService.createCountry(country);
    }

    handleCloseModal();
    fetchCountries();
  };

  const handleDelete = async (id: number) => {
    try {
      await countryService.delete(id);
      fetchCountries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    await handleDelete(deleteId);
    setDeleteId(null);
  };

  const handleCancelDelete = () => {
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Countries
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage country master data
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition text-sm font-semibold"
        >
          <PlusIcon className="w-4 h-4" />
          Add Country
        </button>
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          onChange={handleSearchChange}
          placeholder="Search countries..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3.5 text-left font-semibold">#</th>
              <th className="px-6 py-3.5 text-left font-semibold">Country Name</th>
              <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : countries.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-16 text-center">
                  <GlobeAltIcon className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">No countries found</p>
                </td>
              </tr>
            ) : (
              countries.map((c, idx) => (
                <tr
                  key={c.id}
                  className="hover:bg-indigo-50/40 transition-colors group"
                >
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {pageIndex * 10 + idx + 1}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <GlobeAltIcon className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {c.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                      >
                        <PencilIcon className="w-4 h-4 text-indigo-600" />
                      </button>

                      <button
                        onClick={() => handleDeleteClick(c.id)}
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
      </div>

      <Pagination
        pageIndex={pageIndex}
        totalPages={totalPages}
        onPrev={() => setPageIndex(prev => prev - 1)}
        onNext={() => setPageIndex(prev => prev + 1)}
      />

      <CountryFormModal
        open={open}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCountry}
        defaultValues={selected ? { name: selected.name } : undefined}
      />

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