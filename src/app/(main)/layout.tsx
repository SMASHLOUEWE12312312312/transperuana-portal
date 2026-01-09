import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { MainContent } from "@/components/layout/MainContent";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <Header />
            <Sidebar />
            <MainContent>{children}</MainContent>
        </SidebarProvider>
    );
}
