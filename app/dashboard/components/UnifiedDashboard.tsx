"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useSessionQuery } from "@/lib/redux/authSlice";

// Import all dashboard components
import MainDashboard from "./MainDashboard";
import BusinessSetup from "./BusinessSetup";
import BudgetPlanning from "./BudgetPlanning";
import EmployeeManagement from "./EmployeeManagement";
import AttendancePayroll from "./AttendancePayroll";
import UserManagement from "./UserManagement";
import Settings from "./Settings";

interface UnifiedDashboardProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export default function UnifiedDashboard({ user }: UnifiedDashboardProps) {
  const [currentView, setCurrentView] = useState("dashboard");
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: sessionData = { user: { settings: [] } },
    isLoading: isSessionLoading,
  } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 300000,
  });

  // Get user permissions
  const getUserPermissions = () => {
    if (sessionData?.user?.settings && sessionData.user.current_role) {
      const userPermission = sessionData.user.settings.find(
        (setting: any) =>
          setting.role.toLowerCase() ===
          sessionData.user.current_role.toLowerCase()
      );
      return userPermission || {};
    }
    return {};
  };

  const userPermissions = getUserPermissions();

  // Determine current view based on pathname
  useEffect(() => {
    const path = pathname.split('/').pop() || 'dashboard';
    setCurrentView(path);
  }, [pathname]);

  // Handle navigation
  const handleNavigation = (view: string) => {
    setCurrentView(view);
    router.push(`/dashboard?view=${view}`);
  };

  // Render the appropriate component based on current view
  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <MainDashboard userPermissions={userPermissions} sessionData={sessionData} />;
      case "business-setup":
        if (userPermissions.full_access) {
          return <BusinessSetup userPermissions={userPermissions} sessionData={sessionData} />;
        }
        return <div className="p-6 text-center">Access denied. You don't have permission to view this section.</div>;
      case "budget-planning":
        if (userPermissions.view_reports) {
          return <BudgetPlanning userPermissions={userPermissions} sessionData={sessionData} />;
        }
        return <div className="p-6 text-center">Access denied. You don't have permission to view this section.</div>;
      case "employee-management":
        if (userPermissions.manage_employees) {
          return <EmployeeManagement userPermissions={userPermissions} sessionData={sessionData} />;
        }
        return <div className="p-6 text-center">Access denied. You don't have permission to view this section.</div>;
      case "attendance-payroll":
        if (userPermissions.manage_payroll) {
          return <AttendancePayroll userPermissions={userPermissions} sessionData={sessionData} />;
        }
        return <div className="p-6 text-center">Access denied. You don't have permission to view this section.</div>;
      case "user-management":
        if (userPermissions.full_access) {
          return <UserManagement userPermissions={userPermissions} sessionData={sessionData} />;
        }
        return <div className="p-6 text-center">Access denied. You don't have permission to view this section.</div>;
      case "settings":
        return <Settings userPermissions={userPermissions} sessionData={sessionData} />;
      default:
        return <MainDashboard userPermissions={userPermissions} sessionData={sessionData} />;
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="text-sm text-gray-500">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

