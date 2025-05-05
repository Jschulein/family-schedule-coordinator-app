
import React from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/MainNav";
import { Outlet } from "react-router-dom";

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <div className="border-r bg-white shadow-sm">
          <MainNav />
        </div>
        <div className="flex-1">
          <SidebarTrigger className="m-2 md:hidden" />
          <Outlet />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
