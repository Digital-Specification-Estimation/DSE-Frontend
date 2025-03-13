"use client"

import { useState } from "react"
import { Search, RefreshCw, Users, Clock, Calendar, DollarSign } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Dashboard() {
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
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Employees"
                value="120"
                icon={Users}
                change={{ value: "2.5%", type: "increase", text: "from last month" }}
              />
              <StatCard
                title="Attendance Today"
                value="92%"
                icon={Clock}
                iconBackground="bg-blue-700"
                change={{ value: "3.2%", type: "increase", text: "from yesterday" }}
              />
              <StatCard
                title="Late Arrivals"
                value="08"
                icon={Calendar}
                iconBackground="bg-red-600"
                change={{ value: "1", type: "decrease", text: "from last week" }}
              />
              <StatCard
                title="Total Payroll"
                value="$25,000"
                icon={DollarSign}
                iconBackground="bg-green-600"
                change={{ value: "2.5%", type: "increase", text: "planned" }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Total Payroll Cost</h3>
                  <div className="text-sm bg-gray-100 px-2 py-1 rounded">This Year</div>
                </div>
                <div className="text-2xl font-bold mb-6">$236,788.12</div>
                <div className="h-40 flex items-end justify-between">
                  {/* Placeholder for chart */}
                  <div className="w-1/12 h-10 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-16 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-24 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-12 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-20 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-28 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-32 bg-orange-500 rounded-t"></div>
                  <div className="w-1/12 h-36 bg-blue-700 rounded-t"></div>
                  <div className="w-1/12 h-8 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-14 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-18 bg-gray-200 rounded-t"></div>
                  <div className="w-1/12 h-22 bg-gray-200 rounded-t"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Total Attendance</h3>
                  <div className="text-sm bg-gray-100 px-2 py-1 rounded">This Month</div>
                </div>
                <div className="text-2xl font-bold mb-6">98%</div>
                <div className="h-40 relative">
                  {/* Placeholder for line chart */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gray-200"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center" style={{ top: "25%" }}>
                    <div className="w-full h-px bg-gray-200"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center" style={{ top: "50%" }}>
                    <div className="w-full h-px bg-gray-200"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center" style={{ top: "75%" }}>
                    <div className="w-full h-px bg-gray-200"></div>
                  </div>

                  <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <path
                      d="M0,50 C20,40 40,60 60,50 C80,40 100,60 120,50 C140,40 160,60 180,30 C200,20 220,40 240,30 C260,20 280,40 300,30"
                      fill="none"
                      stroke="#1d4ed8"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20</span>
                  <span>25</span>
                  <span>30</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-medium">Budget vs Actual Report</h3>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                  <div className="w-1/4">Trade/Position</div>
                  <div className="w-1/4">Planned Budget</div>
                  <div className="w-1/4">Actual Cost</div>
                  <div className="w-1/4">Difference</div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="w-1/4 flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                        👷
                      </div>
                      <span className="font-medium">Construction Workers</span>
                    </div>
                    <div className="w-1/4">$5,000</div>
                    <div className="w-1/4">$5,500</div>
                    <div className="w-1/4 text-green-600">+$500</div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="w-1/4 flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                        ⚡
                      </div>
                      <span className="font-medium">Electricians</span>
                    </div>
                    <div className="w-1/4">$4,200</div>
                    <div className="w-1/4">$4,100</div>
                    <div className="w-1/4 text-red-600">-$100</div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="w-1/4 flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                        💻
                      </div>
                      <span className="font-medium">IT Staff</span>
                    </div>
                    <div className="w-1/4">$6,000</div>
                    <div className="w-1/4">$6,500</div>
                    <div className="w-1/4 text-green-600">+$500</div>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div className="w-1/4 flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                        👨‍💼
                      </div>
                      <span className="font-medium">Admin Staff</span>
                    </div>
                    <div className="w-1/4">$3,800</div>
                    <div className="w-1/4">$3,700</div>
                    <div className="w-1/4 text-red-600">-$100</div>
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

