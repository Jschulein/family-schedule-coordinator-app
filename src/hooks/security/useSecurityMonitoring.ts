
/**
 * Hook for ongoing security monitoring and alerts
 */
import { useState, useEffect, useCallback } from 'react';
import { runQuickSecurityCheck } from '@/tests/security/runSecurityTests';
import { securityPerformanceMonitor } from '@/utils/security/performanceMonitor';
import { toast } from '@/components/ui/use-toast';

export interface SecurityStatus {
  isSecure: boolean;
  lastCheck: Date | null;
  anomalies: string[];
  isChecking: boolean;
}

export const useSecurityMonitoring = (intervalMinutes: number = 30) => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    isSecure: true,
    lastCheck: null,
    anomalies: [],
    isChecking: false
  });

  const runSecurityCheck = useCallback(async () => {
    setSecurityStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      const isSecure = await runQuickSecurityCheck();
      const anomalies = securityPerformanceMonitor.detectAnomalies();
      
      setSecurityStatus({
        isSecure,
        lastCheck: new Date(),
        anomalies,
        isChecking: false
      });
      
      // Alert on security issues
      if (!isSecure) {
        toast({
          title: "Security Alert",
          description: "Critical security issues detected. Please review immediately.",
          variant: "destructive"
        });
      } else if (anomalies.length > 0) {
        toast({
          title: "Performance Alert", 
          description: `${anomalies.length} performance anomalies detected.`,
          variant: "destructive"
        });
      }
      
      return { isSecure, anomalies };
    } catch (error) {
      setSecurityStatus(prev => ({ 
        ...prev, 
        isChecking: false,
        isSecure: false 
      }));
      
      toast({
        title: "Security Check Failed",
        description: "Unable to verify security status.",
        variant: "destructive"
      });
      
      return { isSecure: false, anomalies: [] };
    }
  }, []);

  // Set up periodic monitoring
  useEffect(() => {
    // Run initial check
    runSecurityCheck();
    
    // Set up interval
    const interval = setInterval(runSecurityCheck, intervalMinutes * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [runSecurityCheck, intervalMinutes]);

  return {
    securityStatus,
    runSecurityCheck
  };
};
