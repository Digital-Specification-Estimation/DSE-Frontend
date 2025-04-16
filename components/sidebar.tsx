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
  const [userData, setUserData] = useState({ username: "Guest", role: "user" });
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

  // Effect to check authentication on mount and reload
  useEffect(() => {
    // Force refetch on mount
    refetch();

    // Check if user is authenticated
    const checkAuth = () => {
      if (!Cookie.get("connect.sid")) {
        router.push("/sign-in");
      }
    };

    // Check auth on mount
    checkAuth();

    // Add event listener for page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetch, router]);

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

  const menuItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Business Setup", href: "/business-setup", icon: Home },
    { name: "Budget Planning", href: "/budget-planning", icon: Wallet },
    { name: "Employee Management", href: "/employee-management", icon: Users2 },
    { name: "Attendance & Payroll", href: "/attendance-payroll", icon: Users2 },
    { name: "Logout", href: "/", icon: LogOut, onClick: handleLogout },
  ];
  return (
    <div className="w-[280px] min-h-screen bg-[#FAFAFA] flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="px-6 py-6 flex justify-center">
        <Logo />
      </div>

      {/* User Info */}
      <div className="px-4">
        {isLoading ? (
          <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-md">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col min-w-0 flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-md border border-red-200">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-gray-900">
                Error loading user
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 p-0 h-auto"
                onClick={handleRetry}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-md relative">
            {isFetching && (
              <div className="absolute top-1 right-1">
                <RefreshCw className="h-3 w-3 text-gray-400 animate-spin" />
              </div>
            )}
            <Avatar className="h-10 w-10">
              <img
                src="johndoe.jpeg"
                alt={userData.username}
                className="h-10 w-10 rounded-full"
              />
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {userData.username}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {userData.role}
              </span>
            </div>
            <button>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        )}
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
        ©Copyright 2025
      </div>
    </div>
  );
}
