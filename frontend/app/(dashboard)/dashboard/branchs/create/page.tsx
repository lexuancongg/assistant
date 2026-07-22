'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BranchForm from '@/components/branch/branchForm';
import branchService from '@/services/branch/branchService';
import { BranchField, BranchCreateRequest } from '@/models/branch/branch';
import toast from "react-hot-toast";
export default function CreateBranchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (branchField: BranchField) => {
    setLoading(true);
    try {
      const branch: BranchCreateRequest = {
        name: branchField.name,
        code: branchField.code,
        description: branchField.description,
        status: branchField.status,
        address: { ...branchField.address },
      };

      await branchService.createBranch(branch);
      toast.success("Create branch success!");
      router.push('/dashboard/branchs');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 bg-gray-50 min-h-screen">
       
        <BranchForm defaultValues={null} onSubmit={handleSubmit} loading={loading} />;
      </div>
    </>
  )
}