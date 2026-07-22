'use client'
import EmployeeForm from "@/components/employee/employeeForm";
import { EmployeeCreateRequest, EmployeeDetail, EmployeeDetailResponse, EmployeeField } from "@/models/employee/employee";
import employeeService from "@/services/employee/employeeService";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UpdateEmployee() {
    const params = useParams();
    const id = params.id;
    

    const [employee,setEmployee] = useState<EmployeeDetail>();

    useEffect(()=>{
        employeeService.getDetailEmployee(Number(id))
        .then((res)=>{
            setEmployee(res)    
        })
        .catch(error=>{
            console.log(error)
        })
    },[id])

    const handleUpdate = async (data: EmployeeField) => {
       
    }
    return (
        <EmployeeForm
           
            onSubmit={handleUpdate}
            defaultValue={employee}

        ></EmployeeForm>
    )
}