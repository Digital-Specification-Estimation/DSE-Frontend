"use client";
import { useEffect, useState } from "react";
import Cookie from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Users2,
  Wallet,
  Settings,
  LogOut,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  LayoutDashboard,
  BriefcaseBusiness,
  NotepadText,
  Calculator,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useSessionQuery, useLogoutMutation } from "@/lib/redux/authSlice";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/lib/redux/authSlice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
interface SidebarProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
}
export function Sidebar({ user }: SidebarProps) {
  const [userData, setUserData] = useState({
    username: "Guest",
    role: "user",
    current_role: "user",
  });
  const {
    data: sessionData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSessionQuery(undefined, {
    // Refetch on component mount
    refetchOnMountOrArgChange: true,
    // Refetch when window regains focus
    refetchOnFocus: true,
    // Refetch when reconnected
    refetchOnReconnect: true,
    // Skip caching to always get fresh data
    skip: false,
  });
  const [logout] = useLogoutMutation();
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  // Effect to update user data when session data changes
  useEffect(() => {
    if (sessionData && sessionData.user) {
      setUserData(sessionData.user);
    }
  }, [sessionData]);
  // console.log(sessionData);
  // Effect to check authentication on mount and reload
  // useEffect(() => {
  //   // Force refetch on mount
  //   refetch();
  //   console.log("user cookie",Cookie.get("connect.sid"));
  //   // Check if user is authenticated
  //   const checkAuth = () => {
  //     if (!Cookie.get("connect.sid")) {
  //       router.push("/sign-in");
  //     }
  //   };
  //   // Check auth on mount
  //  // checkAuth();
  //   // Add event listener for page visibility changes
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === "visible") {
  //       refetch();
  //       checkAuth();
  //     }
  //   };
  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   // Clean up
  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //   };
  // }, [refetch, router]);
  const handleLogout = async () => {
    try {
      // Call the logout mutation first
      await logout().unwrap();
      // Then clear the cookie and local state
      if (Cookie.get("connect.sid")) {
        Cookie.remove("connect.sid");
      }
      // Clear Redux state
      dispatch(clearCredentials());
      // Redirect to sign-in
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  const handleRetry = () => {
    refetch();
  };
  // Derive user permissions from session
  const userPermissions: Record<string, any> = (() => {
    const settings = (sessionData as any)?.user?.settings || [];
    const currentRole = (sessionData as any)?.user?.current_role;
    if (!currentRole || !Array.isArray(settings)) return {};
    const found = settings.find(
      (s: any) => s.role?.toLowerCase() === String(currentRole).toLowerCase()
    );
    return found || {};
  })();
  // Base menu
  const allMenuItems = [
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      required: "full_access",
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      required: null,
    },
    {
      name: "Business Setup",
      href: "/business-setup",
      icon: BriefcaseBusiness,
      required: "full_access",
    },
    {
      name: "Budget Planning",
      href: "/budget-planning",
      icon: Wallet,
      required: "view_reports",
    },
    {
      name: "Cost Control",
      href: "/cost-control",
      icon: Calculator,
      required: "view_reports",
    },
    {
      name: "Employee Management",
      href: "/employee-management",
      icon: Users2,
      required: "manage_employees",
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: NotepadText,
      required: "manage_payroll",
    },
    {
      name: "Payroll",
      href: "/payroll",
      icon: Wallet,
      required: "manage_payroll",
    },
    {
      name: "User & Role Management",
      href: "/user-management",
      icon: NotepadText,
      required: "full_access",
    },
    {
      name: "Logout",
      href: "/",
      icon: LogOut,
      onClick: handleLogout,
      required: null,
    },
  ];
  const menuItems = allMenuItems.filter((item) => {
    if (!item.required) return true;
    return userPermissions[item.required] === true;
  });
  console.log("session data user", sessionData?.user);
  return (
    <div className="w-[280px] min-h-screen bg-[#FAFAFA] flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="px-6 py-6 flex justify-center">
        <Logo />
      </div>
      {/* Menu */}
      <nav className="space-y-1 px-4 mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              pathname === item.href
                ? "bg-white text-black shadow-md border border-gray-200"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <item.icon className="h-5 w-5 text-gray-500" />
            <span className="truncate">{item.name}</span>
          </Link>
        ))}
      </nav>
      {/* Footer */}
      <div className="p-4 mt-auto text-center text-xs text-gray-500">
        &copy;Copyright 2025
      </div>
    </div>
  );
}
