"use client"

import { useState } from "react"
import { Search, RefreshCw, DollarSign, FileText, ChevronDown, Plus } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardHeader from "@/components/DashboardHeader"

interface TradeRole {
  id: number
  role: string
  icon: string
  employees: number
  workDays: number
  plannedSalary: string
}

export default function BudgetPlanning() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [tradeRoles] = useState<TradeRole[]>([
    {
      id: 1,
      role: "Electricians",
      icon: "⚡",
      employees: 10,
      workDays: 22,
      plannedSalary: "$5,000",
    },
    {
      id: 2,
      role: "Technicians",
      icon: "🔧",
      employees: 8,
      workDays: 22,
      plannedSalary: "$3,200",
    },
    {
      id: 3,
      role: "HR & Admin",
      icon: "👨‍💼",
      employees: 4,
      workDays: 22,
      plannedSalary: "$4,000",
    },
    {
      id: 4,
      role: "Supervisors",
      icon: "👷",
      employees: 6,
      workDays: 22,
      plannedSalary: "$6,500",
    },
  ])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader/>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Budget Planning & Cost Comparison</h1>

              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export Report
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Trade
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg border mb-6">
              <Tabs defaultValue="plan">
                <div className="border-b">
                  <TabsList className="p-0 h-auto bg-transparent">
                    <TabsTrigger
                      value="plan"
                      className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      Plan Budget
                    </TabsTrigger>
                    <TabsTrigger
                      value="costs"
                      className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      Costs Trend
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="plan" className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="relative w-48">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="text-sm">This Month</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </div>
                    </div>

                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search trade..." className="pl-10 h-9 w-full" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-t border-b text-sm text-muted-foreground">
                          <th className="w-10 px-4 py-3 text-left">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                          </th>
                          <th className="px-4 py-3 text-left">SN</th>
                          <th className="px-4 py-3 text-left">Role/Trade</th>
                          <th className="px-4 py-3 text-left">Employees Number</th>
                          <th className="px-4 py-3 text-left">Work Days</th>
                          <th className="px-4 py-3 text-left">Planned Salary ($)</th>
                          <th className="w-10 px-4 py-3 text-left"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeRoles.map((role, index) => (
                          <tr key={role.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                            </td>
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                                  {role.icon}
                                </div>
                                <span className="font-medium">{role.role}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">{role.employees}</td>
                            <td className="px-4 py-3">{role.workDays}</td>
                            <td className="px-4 py-3">{role.plannedSalary}</td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="costs" className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-xl font-bold">
                        <div>Total Planned Cost</div>
                        <div>$236,788.12</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="text-xl font-bold">
                        <div>Total Actual Cost</div>
                        <div>$236,788.12</div>
                      </div>
                    </div>

                    <div className="relative w-48">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="text-sm">This Year</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </div>
                    </div>
                  </div>

                  <div className="h-80 relative mt-8">
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-muted-foreground">
                      <div>$30K</div>
                      <div>$20K</div>
                      <div>$15K</div>
                      <div className="bg-green-700 text-white px-1 rounded">Avg</div>
                      <div>$10K</div>
                      <div>$5K</div>
                      <div>0</div>
                    </div>

                    <div className="ml-12 h-full flex items-end justify-between">
                      <div className="flex flex-col items-center gap-2 w-1/4">
                        <div className="h-10 w-16 bg-gray-200 rounded-t"></div>
                        <div className="text-xs text-muted-foreground">Electricians</div>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-1/4">
                        <div className="h-24 w-16 bg-gray-200 rounded-t"></div>
                        <div className="text-xs text-muted-foreground">Technicians</div>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-1/4">
                        <div className="flex flex-col items-center">
                          <div className="h-64 w-16 bg-orange-500 rounded-t"></div>
                          <div className="h-56 w-16 bg-blue-700 rounded-t -mt-64 ml-20"></div>
                          <div className="absolute top-24 right-1/3 bg-white border rounded-md p-2 shadow-md">
                            <div className="text-sm font-medium">HR & Admin</div>
                            <div className="text-sm">
                              Actual Cost <span className="font-bold">$14,056</span>
                            </div>
                            <div className="text-xs text-green-600">+$500 over budget</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">HR & Admin</div>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-1/4">
                        <div className="h-32 w-16 bg-gray-200 rounded-t"></div>
                        <div className="text-xs text-muted-foreground">Supervisors</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

