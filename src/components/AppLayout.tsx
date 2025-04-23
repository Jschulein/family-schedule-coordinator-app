
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MainNav } from "@/components/MainNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <MainNav />
        <main className="flex-1">
          <SidebarTrigger className="m-2 md:hidden" />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
