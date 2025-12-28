import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <Sidebar />
            <main className="ml-64 mt-16 min-h-[calc(100vh-4rem)] p-6 transition-all duration-300">
                {children}
            </main>
        </>
    );
}
