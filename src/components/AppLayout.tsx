
import React from 'react';
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useSecurityMonitoring } from '@/hooks/security/useSecurityMonitoring';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AppLayout = () => {
  const { securityStatus } = useSecurityMonitoring(30); // Check every 30 minutes

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 p-4">
          {/* Security Status Indicator */}
          {(!securityStatus.isSecure || securityStatus.anomalies.length > 0) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Security Alert</span>
                <Badge variant="outline" className="ml-auto">
                  {securityStatus.anomalies.length} issues
                </Badge>
              </div>
              <p className="text-sm text-amber-600 mt-1">
                Security monitoring has detected issues. 
                <a href="/security-audit" className="underline ml-1">
                  Review security audit →
                </a>
              </p>
            </div>
          )}
          
          {/* Regular Content */}
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
