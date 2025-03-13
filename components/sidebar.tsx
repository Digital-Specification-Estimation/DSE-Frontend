"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, ClipboardList, PieChart, Settings, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"

interface SidebarProps {
  user: {
    name: string
    role: string
    avatar?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
    },
    {
      name: "Employee Management",
      href: "/employee-management",
      icon: Users,
    },
    {
      name: "Attendance & Payroll",
      href: "/attendance-payroll",
      icon: ClipboardList,
    },
    {
      name: "Budget Planning",
      href: "/budget-planning",
      icon: PieChart,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 h-screen border-r bg-white flex flex-col">
      <div className="p-4 border-b">
        <Logo />
      </div>

      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={user.avatar || "/placeholder.svg?height=40&width=40"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.role}</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
        </div>
      </div>

      <div className="py-4 flex-1">
        <div className="px-4 mb-2">
          <p className="text-xs font-medium text-muted-foreground">MAIN MENU</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 text-sm ${
                isActive(item.href) ? "bg-gray-100 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 mt-auto">
        <p className="text-xs text-muted-foreground">©Copyright 2025</p>
      </div>
    </div>
  )
}

