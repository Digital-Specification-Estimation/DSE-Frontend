"use client"

import { useState } from "react"
import { Search, RefreshCw, DollarSign, FileText, ChevronDown } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Employee {
  id: number
  name: string
  avatar: string
  contractStartDate: string
  contractEndDate: string
  daysProjections: string
  dailyRate: number
  budgetSpending: string
  attendance: "Present" | "Absent"
}

export default function AttendancePayroll() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [employees] = useState<Employee[]>([
    {
      id: 1,
      name: "Courtney Henry",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "Feb 28, 2018",
      contractEndDate: "Feb 28, 2018",
      daysProjections: "1148",
      dailyRate: 120,
      budgetSpending: "$137,760",
      attendance: "Present",
    },
    {
      id: 2,
      name: "Annette Black",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "May 31, 2015",
      contractEndDate: "May 20, 2015",
      daysProjections: "8013",
      dailyRate: 120,
      budgetSpending: "$961,560",
      attendance: "Present",
    },
    {
      id: 3,
      name: "Kathryn Murphy",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "May 12, 2019",
      contractEndDate: "Nov 16, 2014",
      daysProjections: "6690",
      dailyRate: 200,
      budgetSpending: "$1,338,000",
      attendance: "Absent",
    },
    {
      id: 4,
      name: "Courtney Henry",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "Sep 5, 2013",
      contractEndDate: "May 29, 2017",
      daysProjections: "8811",
      dailyRate: 120,
      budgetSpending: "$137,760",
      attendance: "Present",
    },
    {
      id: 5,
      name: "Brooklyn Simmons",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "Jul 14, 2015",
      contractEndDate: "May 12, 2019",
      daysProjections: "5045",
      dailyRate: 200,
      budgetSpending: "$961,560",
      attendance: "Absent",
    },
    {
      id: 6,
      name: "Marvin McKinney",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "Sep 24, 2017",
      contractEndDate: "Dec 2, 2018",
      daysProjections: "8829",
      dailyRate: 140,
      budgetSpending: "$1,338,000",
      attendance: "Present",
    },
    {
      id: 7,
      name: "Jane Cooper",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "Mar 5, 2018",
      contractEndDate: "Apr 28, 2016",
      daysProjections: "1784",
      dailyRate: 100,
      budgetSpending: "$137,760",
      attendance: "Absent",
    },
    {
      id: 8,
      name: "Kristin Watson",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "Aug 2, 2013",
      contractEndDate: "Feb 29, 2012",
      daysProjections: "5948",
      dailyRate: 140,
      budgetSpending: "$961,560",
      attendance: "Present",
    },
    {
      id: 9,
      name: "Jacob Jones",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "Aug 7, 2017",
      contractEndDate: "May 31, 2015",
      daysProjections: "5826",
      dailyRate: 100,
      budgetSpending: "$1,338,000",
      attendance: "Present",
    },
    {
      id: 10,
      name: "Esther Howard",
      avatar: "/placeholder.svg?height=40&width=40",
      contractStartDate: "May 5, 2012",
      contractEndDate: "Mar 13, 2014",
      daysProjections: "6025",
      dailyRate: 140,
      budgetSpending: "$137,760",
      attendance: "Absent",
    },
  ])

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
            <h1 className="text-2xl font-bold mb-6">Attendance & Payroll Management</h1>

            <div className="bg-white rounded-lg border mb-6">
              <Tabs defaultValue="attendance">
                <div className="border-b">
                  <TabsList className="p-0 h-auto bg-transparent border-b">
                    <TabsTrigger
                      value="attendance"
                      className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      Daily Attendance
                    </TabsTrigger>
                    <TabsTrigger
                      value="payroll"
                      className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      Payroll Calculation
                    </TabsTrigger>
                    <TabsTrigger
                      value="leave"
                      className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      Leave Tracking
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="attendance" className="p-0 mt-0">
                  <div className="p-4 flex gap-4">
                    <div className="relative w-48">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="text-sm">08:00 AM</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </div>
                    </div>

                    <div className="relative w-48">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="text-sm">08:00 PM</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </div>
                    </div>

                    <div className="relative w-48">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="text-sm">All</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </div>
                    </div>

                    <div className="relative w-64 ml-auto">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search employee..." className="pl-10 h-9 w-full" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-t border-b text-sm text-muted-foreground">
                          <th className="w-10 px-4 py-3 text-left">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                          </th>
                          <th className="px-4 py-3 text-left">Employee Name</th>
                          <th className="px-4 py-3 text-left">Contract Start Date</th>
                          <th className="px-4 py-3 text-left">Contract Finish Date</th>
                          <th className="px-4 py-3 text-left">Days Projections</th>
                          <th className="px-4 py-3 text-left">Daily Rate</th>
                          <th className="px-4 py-3 text-left">Budget Spending</th>
                          <th className="px-4 py-3 text-left">Attendance</th>
                          <th className="w-10 px-4 py-3 text-left"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee) => (
                          <tr key={employee.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={employee.avatar} alt={employee.name} />
                                  <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{employee.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">{employee.contractStartDate}</td>
                            <td className="px-4 py-3">{employee.contractEndDate}</td>
                            <td className="px-4 py-3">{employee.daysProjections}</td>
                            <td className="px-4 py-3">${employee.dailyRate}</td>
                            <td className="px-4 py-3">{employee.budgetSpending}</td>
                            <td className="px-4 py-3">
                              <span className={employee.attendance === "Present" ? "present-badge" : "absent-badge"}>
                                {employee.attendance}
                              </span>
                            </td>
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

                <TabsContent value="payroll" className="p-0 mt-0">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-4">
                        <div className="relative w-48">
                          <div className="flex items-center border rounded-md px-3 py-2">
                            <span className="text-sm">22d</span>
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          </div>
                        </div>

                        <div className="relative w-48">
                          <div className="flex items-center border rounded-md px-3 py-2">
                            <span className="text-sm">$120</span>
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          </div>
                        </div>

                        <div className="relative w-48">
                          <div className="flex items-center border rounded-md px-3 py-2">
                            <span className="text-sm">Planned</span>
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          </div>
                        </div>
                      </div>

                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search employee..." className="pl-10 h-9 w-full" />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-t border-b text-sm text-muted-foreground">
                            <th className="w-10 px-4 py-3 text-left">
                              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                            </th>
                            <th className="px-4 py-3 text-left">Employee Name</th>
                            <th className="px-4 py-3 text-left">Days Worked</th>
                            <th className="px-4 py-3 text-left">Daily Rate</th>
                            <th className="px-4 py-3 text-left">Total Salary</th>
                            <th className="px-4 py-3 text-left">Planned vs Actual</th>
                            <th className="w-10 px-4 py-3 text-left"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Courtney Henry" />
                                  <AvatarFallback>CH</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">Courtney Henry</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">22</td>
                            <td className="px-4 py-3">$120</td>
                            <td className="px-4 py-3">$2,640</td>
                            <td className="px-4 py-3">
                              <div>
                                Planned: <span className="font-medium">$2,500</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Annette Black" />
                                  <AvatarFallback>AB</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">Annette Black</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">20</td>
                            <td className="px-4 py-3">$4,000</td>
                            <td className="px-4 py-3">$4,000</td>
                            <td className="px-4 py-3">
                              <div className="within-budget">Within Budget</div>
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Kathryn Murphy" />
                                  <AvatarFallback>KM</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">Kathryn Murphy</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">18</td>
                            <td className="px-4 py-3">$140</td>
                            <td className="px-4 py-3">$2,520</td>
                            <td className="px-4 py-3">
                              <div className="over-budget">+$100 Over Budget</div>
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="leave" className="p-0 mt-0">
                  <div className="p-8 text-center text-muted-foreground">
                    Leave tracking functionality will be implemented in a future update.
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                View Payroll Report
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                <FileText className="h-4 w-4" />
                Generate Payslips
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

