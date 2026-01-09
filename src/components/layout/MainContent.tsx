'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

export function MainContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();

    return (
        <main
            className={cn(
                "mt-16 min-h-[calc(100vh-4rem)] p-6",
                "transition-all duration-300 ease-in-out",
                collapsed ? "ml-16" : "ml-64"
            )}
        >
            {children}
        </main>
    );
}
