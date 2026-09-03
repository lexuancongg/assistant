'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface BreadcrumbContextValue {
    breadcrumb: string[];
    setBreadcrumb: (items: string[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
    breadcrumb: [],
    setBreadcrumb: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
    return (
        <BreadcrumbContext.Provider value={{ breadcrumb, setBreadcrumb }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumb() {
    return useContext(BreadcrumbContext);
}

/** Gọi trong 1 page để set breadcrumb hiển thị trên Topbar, VD: usePageBreadcrumb(['Quản lý file']) */
export function usePageBreadcrumb(items: string[]) {
    const { setBreadcrumb } = useContext(BreadcrumbContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setBreadcrumb(items);
    }, [JSON.stringify(items)]);
}
