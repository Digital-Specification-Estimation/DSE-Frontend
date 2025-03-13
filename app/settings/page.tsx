"use client"

import { useState } from "react"
import { Search, RefreshCw, DollarSign, User, Lock, Bell, Globe, CreditCard, Shield, HelpCircle } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Settings() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search" className="pl-10 h-9 w-full" />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button className="bg-blue-700 hover:bg-blue-800 text-white rounded-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Payroll $25,000
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 bg-white rounded-lg border p-4">
                <nav className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <User className="h-5 w-5" />
                    <span>Account</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Lock className="h-5 w-5" />
                    <span>Password</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Globe className="h-5 w-5" />
                    <span>Language</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <CreditCard className="h-5 w-5" />
                    <span>Billing</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Shield className="h-5 w-5" />
                    <span>Security</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <HelpCircle className="h-5 w-5" />
                    <span>Help & Support</span>
                  </Button>
                </nav>
              </div>

              <div className="col-span-2 bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-4">Account Settings</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </label>
                    <Input id="name" defaultValue="Kristin Watson" className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input id="email" type="email" defaultValue="kristin.watson@example.com" className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">
                      Company Name
                    </label>
                    <Input id="company" defaultValue="Digital Specification Estimation" className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <Input id="role" defaultValue="Administrator" className="w-full" />
                  </div>

                  <div className="pt-4">
                    <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

