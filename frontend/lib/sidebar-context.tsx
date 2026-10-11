'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextValue {
    isOpen: boolean;
    setIsOpen: (open: boolean | ((v: boolean) => boolean)) => void;
    toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
    isOpen: true,
    setIsOpen: () => {},
    toggle: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('sidebar_is_open');
            if (saved !== null) {
                setIsOpen(JSON.parse(saved));
            }
        } catch (e) {}
    }, []);

    const handleSetIsOpen = (open: boolean | ((v: boolean) => boolean)) => {
        setIsOpen((prev) => {
            const next = typeof open === 'function' ? open(prev) : open;
            try {
                localStorage.setItem('sidebar_is_open', JSON.stringify(next));
            } catch (e) {}
            return next;
        });
    };

    const toggle = () => {
        handleSetIsOpen((prev) => !prev);
    };

    return (
        <SidebarContext.Provider value={{ isOpen, setIsOpen: handleSetIsOpen, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
