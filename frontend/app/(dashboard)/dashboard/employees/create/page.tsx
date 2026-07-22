'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import EmployeeForm from '@/components/employee/employeeForm';
import { EmployeeField } from '@/models/employee/employee';
import employeeService from '@/services/employee/employeeService';

export default function CreateEmployeePage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (employee: EmployeeField) => {
        try {
            setLoading(true);
            console.log(employee)

            await employeeService.createEmployee(employee);

           router.push('/dashboard/employees')
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <EmployeeForm
            defaultValue={null}
            loading={loading}
            onSubmit={handleSubmit}
        />
    );
}