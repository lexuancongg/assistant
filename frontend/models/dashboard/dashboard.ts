type DashboardResponse = {
  summary: Summary
  charts: Charts
}

type Summary = {
  totalEmployees: number
  totalDepartments: number
  totalLocations: number
  pendingRequests: number
}

type Charts = {
  employeesByDepartment: DepartmentEmployeeCount[]
  employeeStatus: EmployeeStatus
}

type DepartmentEmployeeCount = {
  departmentName: string
  employeeCount: number
}

type EmployeeStatus = {
  active: number
  onLeave: number
  pending: number
}