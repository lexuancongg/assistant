import Sidebar from "@/components/common/sidebar";
import Topbar from "@/components/common/topbar";


export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex overflow-x-hidden">
            <Sidebar />
            <div className="ml-64 flex flex-col min-h-screen w-full">
                <Topbar />
                <main className="p-6 bg-gray-50 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}