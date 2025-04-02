"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Users2,
  Wallet,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useSessionQuery, useLogoutMutation } from "@/lib/redux/authSlice";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/lib/redux/authSlice";

interface SidebarProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [data, setData] = useState({ user: { username: "Guest" } });
  const { data: sessionData } = useSessionQuery();
  const [logout] = useLogoutMutation();
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (sessionData) {
      setData(sessionData);
    }
  }, [sessionData]);

  const handleLogout = async () => {
    try {
      logout().unwrap();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const menuItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Business Setup", href: "/business-setup", icon: Home },
    { name: "Budget Planning", href: "/budget-planning", icon: Wallet },
    { name: "Employee Management", href: "/employee-management", icon: Users2 },
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
        <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-md">
          <Avatar className="h-10 w-10">
            <img
              src="johndoe.jpeg"
              alt={data.user.username}
              className="h-10 w-10 rounded-full"
            />
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {data.user.username}
            </span>
            <span className="text-xs text-gray-500 truncate">{user.role}</span>
          </div>
          <button>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
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
