"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users2, Wallet, Settings, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const isActive = (path: string) => {
    return pathname === path;
  };

  const menuItems = [
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
      name: "Budget Planning",
      href: "/budget-planning",
      icon: Wallet,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="w-[240px] min-h-screen bg-[#FAFAFA] flex flex-col border-r border-gray-200">
      <div className="px-4 py-3">
        <Logo />
      </div>

      <div className="mt-2 px-3">
        <div className="flex items-center gap-3 bg-white rounded-lg p-2.5 shadow-sm">
          <img
            className="h-10 w-10 rounded-full border border-gray-100"
            src="./johndoe.jpeg"
            alt={user.name}
          ></img>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </span>
            <span className="text-xs text-gray-500 truncate">{user.role}</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
        </div>
      </div>

      <div className="px-3 mt-6">
        <div className="mb-2">
          <p className="px-3 text-xs font-medium text-gray-500">MAIN MENU</p>
        </div>
        <nav className="space-y-0.5">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-white text-gray-900 font-medium shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-900"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 mt-auto">
        <p className="text-xs text-gray-500">©Copyright 2025</p>
      </div>
    </div>
  );
}
