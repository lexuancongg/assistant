'use client';

import React from 'react';
import {
    Users, Building2, MapPin, Calendar, Plus, Search, Bell,
    TrendingUp, UserCheck, Award
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
const dashboardData: DashboardResponse = {
    summary: {
        totalEmployees: 128,
        totalDepartments: 8,
        totalLocations: 5,
        pendingRequests: 7
    },
    charts: {
        employeesByDepartment: [
            { departmentName: "Engineering", employeeCount: 45 },
            { departmentName: "Marketing", employeeCount: 32 },
            { departmentName: "Sales", employeeCount: 28 },
            { departmentName: "HR", employeeCount: 15 },
            { departmentName: "Finance", employeeCount: 8 }
        ],
        employeeStatus: {
            active: 80,
            onLeave: 30,
            pending: 18
        }
    }
};

const pieData = dashboardData.charts.employeesByDepartment.map((dept, index) => ({
    name: dept.departmentName,
    value: dept.employeeCount,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#14b8a6', '#f97316'][index % 5]
}));

const statusData = [
    { name: 'Active', value: dashboardData.charts.employeeStatus.active, color: '#10b981' },
    { name: 'On Leave', value: dashboardData.charts.employeeStatus.onLeave, color: '#f59e0b' },
    { name: 'Pending', value: dashboardData.charts.employeeStatus.pending, color: '#ef4444' }
];

const totalEmployees = dashboardData.summary.totalEmployees;

const Dashboard: React.FC = () => {
    return (
        <div className="flex bg-[#f8fafd] font-sans ">


                <div className="flex-1 overflow-auto  ">
                    <div className="grid grid-cols-4 gap-6">
                        
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className="flex justify-between">
                                <div>
                                    <div className="text-sm opacity-90">Total Employees</div>
                                    <div className="text-5xl font-bold mt-2">{dashboardData.summary.totalEmployees}</div>
                                </div>
                                <Users className="w-14 h-14 opacity-20" />
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-2xl">
                                <TrendingUp className="w-4 h-4" /> +128
                            </div>
                        </div>

                        {/* Departments */}
                        <div className="bg-gradient-to-br from-emerald-400 to-teal-300 rounded-3xl p-6 text-white relative overflow-hidden">
                            <div className="flex justify-between">
                                <div>
                                    <div className="text-sm opacity-90">Departments</div>
                                    <div className="text-5xl font-bold mt-2">{dashboardData.summary.totalDepartments}</div>
                                </div>
                                <Building2 className="w-14 h-14 opacity-20" />
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-2xl">
                                <TrendingUp className="w-4 h-4" /> +2
                            </div>
                        </div>

                        {/* Locations */}
                        <div className="bg-gradient-to-br from-amber-400 to-orange-300 rounded-3xl p-6 text-white relative overflow-hidden">
                            <div className="flex justify-between">
                                <div>
                                    <div className="text-sm opacity-90">Locations</div>
                                    <div className="text-5xl font-bold mt-2">{dashboardData.summary.totalLocations}</div>
                                </div>
                                <MapPin className="w-14 h-14 opacity-20" />
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-2xl">
                                <TrendingUp className="w-4 h-4" /> +1
                            </div>
                        </div>

                        {/* Pending Requests */}
                        <div className="bg-gradient-to-br from-rose-400 to-pink-300 rounded-3xl p-6 text-white relative overflow-hidden">
                            <div className="flex justify-between">
                                <div>
                                    <div className="text-sm opacity-90">Pending Requests</div>
                                    <div className="text-5xl font-bold mt-2">{dashboardData.summary.pendingRequests}</div>
                                </div>
                                <Calendar className="w-14 h-14 opacity-20" />
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-2xl">
                                <TrendingUp className="w-4 h-4" /> +32
                            </div>
                        </div>
                    </div>

                    {/* ROW 1 */}
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        {/* Top Departments Table */}
                        <div className="col-span-5 bg-white rounded-3xl p-6 shadow-sm">
                            <div className="font-semibold text-lg mb-5 flex items-center justify-between">
                                Top Departments
                                <span className="text-xs text-gray-400">Total {totalEmployees} ↑12 Since last month</span>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="text-xs text-gray-400 border-b">
                                        <th className="text-left pb-3 font-normal">Department</th>
                                        <th className="text-left pb-3 font-normal">Employees</th>
                                        <th className="text-right pb-3 font-normal">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {dashboardData.charts.employeesByDepartment.map((dept, i) => (
                                        <tr key={i} className="border-b last:border-0 h-12">
                                            <td className="font-medium">{dept.departmentName}</td>
                                            <td>
                                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500"
                                                        style={{ width: `${(dept.employeeCount / totalEmployees) * 100}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-right font-medium">{dept.employeeCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Top Locations - placeholder */}
                        <div className="col-span-4 bg-white rounded-3xl p-6 shadow-sm">
                            <div className="font-semibold text-lg mb-4">Top Locations</div>
                            <div className="relative h-64 bg-[#e0f2fe] rounded-2xl overflow-hidden flex items-center justify-center border">
                                <div className="absolute inset-0 bg-[radial-gradient(#bae6fd_1px,transparent_1px)] bg-[length:20px_20px] opacity-30" />
                                <div className="absolute top-[25%] left-[35%]">
                                    <MapPin className="w-8 h-8 text-orange-500 drop-shadow" />
                                    <div className="text-[10px] text-center -mt-1 font-medium">Ho Chi Minh</div>
                                </div>
                                <div className="absolute top-[15%] left-[55%]">
                                    <MapPin className="w-8 h-8 text-orange-500 drop-shadow" />
                                    <div className="text-[10px] text-center -mt-1 font-medium">Hanoi</div>
                                </div>
                                <div className="absolute top-[45%] left-[65%]">
                                    <MapPin className="w-8 h-8 text-orange-500 drop-shadow" />
                                    <div className="text-[10px] text-center -mt-1 font-medium">Da Nang</div>
                                </div>
                                <div className="absolute bottom-4 left-4 bg-white rounded-2xl px-4 py-2 text-xs shadow">
                                    Total {totalEmployees} ↑5 Since last month
                                </div>
                            </div>
                        </div>

                        {/* Recent Activities - placeholder */}
                        <div className="col-span-3 bg-white rounded-3xl p-6 shadow-sm">
                            <div className="font-semibold text-lg mb-5">Recent Activities</div>
                            <div className="space-y-5 text-sm">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-gray-100 rounded-2xl flex items-center justify-center text-lg">📋</div>
                                    <div className="flex-1">Sarah Lee requested leave <span className="text-orange-600 font-medium">Pending</span></div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-gray-100 rounded-2xl flex items-center justify-center text-lg">👥</div>
                                    <div className="flex-1">Admin added 5 new employees</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROW 2 */}
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        {/* Top Departments Progress */}
                        <div className="col-span-4 bg-white rounded-3xl p-6 shadow-sm">
                            <div className="font-semibold text-lg mb-6">Top Departments</div>
                            <div className="space-y-7">
                                {dashboardData.charts.employeesByDepartment.map((dept, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-white ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-teal-500', 'bg-orange-500'][i]}`}>
                                            {['👷', '📣', '💼', '👥', '💰'][i]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{dept.departmentName}</span>
                                                <span className="font-medium">{dept.employeeCount}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full">
                                                <div
                                                    className="h-2 rounded-full bg-blue-500"
                                                    style={{ width: `${(dept.employeeCount / totalEmployees) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="col-span-4 bg-white rounded-3xl p-6 shadow-sm">
                            <div className="font-semibold text-lg mb-6 flex items-center justify-between">
                                Employee Status
                                <span className="text-xs px-3 py-1 bg-gray-100 rounded-2xl">By Department</span>
                            </div>
                            <div className="flex justify-center">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={95}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mt-4">
                                {pieData.map((entry, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                                        <div className="flex-1">{entry.name}</div>
                                        <div className="font-medium">{entry.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-4 bg-white rounded-3xl p-6 shadow-sm">
                            <div className="font-semibold text-lg mb-6 flex items-center justify-between">
                                Employee Status
                                <span className="text-xs px-3 py-1 bg-gray-100 rounded-2xl">Current</span>
                            </div>

                            <ResponsiveContainer width="100%" height={290}>
                                <BarChart data={statusData} barCategoryGap={35}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 13, fill: '#64748b' }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '12px 16px'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
            </div>
        </div>
    );
};
export default Dashboard;