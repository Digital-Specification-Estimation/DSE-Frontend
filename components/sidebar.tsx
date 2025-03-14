"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Users2, Wallet, Settings, List, UserCheck, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";

interface SidebarProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/settings") {
      router.push("/settings"); // Redirect to settings instead of dashboard after login
    }
  }, [pathname, router]);

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "Business Setup",
      href: "/business-setup",
      icon: Home,
    },
    {
      name: "Budget Planning",
      href: "/budget-planning",
      icon: Wallet,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Employee Management",
      href: "/employee-management",
      icon: Users2,
    },
    {
      name: "Attendance & Payroll",
      href: "/attendance-payroll",
      icon: Users2,
    },
  ];

  return (
    <div className="w-[280px] min-h-screen bg-[#FAFAFA] flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="px-6 py-6 flex justify-center">
        <Logo />
      </div>

      {/* User Info */}
      <div className="px-4">
        <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-md">
          <Avatar className="h-10 w-10">
            <img src="johndoe.jpeg" alt={user.name} className="h-10 w-10 rounded-full" />
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
            <span className="text-xs text-gray-500 truncate">{user.role}</span>
          </div>
          <button>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-6">
        <p className="px-3 text-xs font-medium text-gray-500">MAIN MENU</p>
      </div>

      <nav className="space-y-1 px-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              isActive(item.href)
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
      <div className="p-4 mt-auto">
        <p className="text-xs text-gray-500 text-center">©Copyright 2025</p>
      </div>
    </div>
  );
}
