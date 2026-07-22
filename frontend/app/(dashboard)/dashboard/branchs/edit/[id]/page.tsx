'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import BranchForm from '@/components/branch/branchForm';
import branchService from '@/services/branch/branchService';
import { Branch, BranchField, BranchCreateRequest } from '@/models/branch/branch';
import toast from 'react-hot-toast';

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBranch = async () => {
      setLoadingDetail(true);
      try {
        const res = await branchService.getBranchById(id);
        setBranch(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchBranch();
  }, [id]);

  const handleSubmit = async (branchField: BranchField) => {
    setSubmitting(true);
    try {
      const payload: BranchCreateRequest = {
        name: branchField.name,
        code: branchField.code,
        description: branchField.description,
        status: branchField.status,
        address: { ...branchField.address },
      };

      await branchService.updateBranch(payload, id);
      toast.success("success update branchs")
      router.push('/dashboard/branchs');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDetail) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-gray-400 py-20">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          Loading branch...
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-center text-gray-400 py-20">Branch not found</p>
      </div>
    );
  }

  return <BranchForm defaultValues={branch} onSubmit={handleSubmit} loading={submitting} />;
}