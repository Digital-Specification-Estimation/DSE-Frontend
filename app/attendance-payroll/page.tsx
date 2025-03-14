"use client"

import { useState } from "react"
import { Search, RefreshCw, DollarSign, FileText, ChevronDown } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Types
interface Employee {
  id: number
  name: string
  avatar: string
  position: string
  assignedProject: string
  contractStartDate: string
  contractEndDate: string
  dailyRate: number
  remainingDays: number
  attendance: "Present" | "Absent" | "Late"
  daysWorked: number
  budgetBaseline: number
  plannedBudget: number
  sickDays: number
  vacationDays: number
  unpaidLeave: number
}

// Sample data
const employees: Employee[] = [
  {
    id: 1,
    name: "Courtney Henry",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Electrician",
    assignedProject: "Metro Bridge",
    contractStartDate: "Feb 28, 2018",
    contractEndDate: "Feb 28, 2018",
    dailyRate: 120,
    remainingDays: 22,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 20,
    vacationDays: 20,
    unpaidLeave: 20,
  },
  // Add more employees...
]

const trades = ["Electrician", "HR Manager", "Technician", "Construction Worker"]
const projects = ["Metro Bridge", "Mall Construction"]
const dailyRates = ["$100", "$120", "$140", "$200"]

export default function AttendancePayroll() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    trade: "",
    project: "",
    dailyRate: "",
    startDate: "",
    endDate: "",
    search: "",
  })

  // Filter employees based on selected filters
  const filteredEmployees = employees.filter((employee) => {
    if (filters.trade && employee.position !== filters.trade) return false
    if (filters.project && employee.assignedProject !== filters.project) return false
    if (filters.dailyRate && `$${employee.dailyRate}` !== filters.dailyRate) return false
    if (filters.search && !employee.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Attendance & Payroll Management</h1>

            <div className="flex gap-2">
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

          <div className="bg-white rounded-lg border">
            <Tabs defaultValue="attendance">
              <div className="border-b">
                <TabsList className="p-0 h-auto bg-transparent">
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

              {/* Search and Filter */}
              <div className="p-4 flex justify-between items-center">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search employee..."
                    className="pl-10 h-9 w-full"
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(true)} className="gap-2">
                  <ChevronDown className="h-4 w-4" />
                  Add Filter
                </Button>
              </div>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="p-0 mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-t border-b text-sm text-muted-foreground">
                        <th className="w-10 px-4 py-3 text-left">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                        </th>
                        <th className="px-4 py-3 text-left">Employee Name</th>
                        <th className="px-4 py-3 text-left">Position/Trade</th>
                        <th className="px-4 py-3 text-left">Assigned Project</th>
                        <th className="px-4 py-3 text-left">Contract Start Date</th>
                        <th className="px-4 py-3 text-left">Contract Finish Date</th>
                        <th className="px-4 py-3 text-left">Remaining Days</th>
                        <th className="px-4 py-3 text-left">Attendance</th>
                        <th className="w-10 px-4 py-3 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
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
                          <td className="px-4 py-3">{employee.position}</td>
                          <td className="px-4 py-3">{employee.assignedProject}</td>
                          <td className="px-4 py-3">{employee.contractStartDate}</td>
                          <td className="px-4 py-3">{employee.contractEndDate}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              {employee.remainingDays}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                employee.attendance === "Present"
                                  ? "bg-green-50 text-green-700"
                                  : employee.attendance === "Late"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-red-50 text-red-700"
                              }
                            >
                              {employee.attendance}
                            </Badge>
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

              {/* Payroll Tab */}
              <TabsContent value="payroll" className="p-0 mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-t border-b text-sm text-muted-foreground">
                        <th className="w-10 px-4 py-3 text-left">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                        </th>
                        <th className="px-4 py-3 text-left">Employee Name</th>
                        <th className="px-4 py-3 text-left">Daily Rate</th>
                        <th className="px-4 py-3 text-left">Days Worked</th>
                        <th className="px-4 py-3 text-left">Budget Baseline</th>
                        <th className="px-4 py-3 text-left">Planned vs Actual</th>
                        <th className="w-10 px-4 py-3 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
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
                          <td className="px-4 py-3">${employee.dailyRate}</td>
                          <td className="px-4 py-3">{employee.daysWorked}</td>
                          <td className="px-4 py-3">${employee.budgetBaseline}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>Planned: ${employee.plannedBudget}</span>
                              {employee.dailyRate * employee.daysWorked > employee.plannedBudget ? (
                                <Badge className="bg-red-50 text-red-700">
                                  +${employee.dailyRate * employee.daysWorked - employee.plannedBudget} Over Budget
                                </Badge>
                              ) : (
                                <Badge className="bg-green-50 text-green-700">Within Budget</Badge>
                              )}
                            </div>
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

              {/* Leave Tab */}
              <TabsContent value="leave" className="p-0 mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-t border-b text-sm text-muted-foreground">
                        <th className="w-10 px-4 py-3 text-left">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                        </th>
                        <th className="px-4 py-3 text-left">Employee Name</th>
                        <th className="px-4 py-3 text-left">Sick Days</th>
                        <th className="px-4 py-3 text-left">Vacation Days</th>
                        <th className="px-4 py-3 text-left">Unpaid Leave</th>
                        <th className="w-10 px-4 py-3 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
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
                          <td className="px-4 py-3">{employee.sickDays}</td>
                          <td className="px-4 py-3">{employee.vacationDays}</td>
                          <td className="px-4 py-3">{employee.unpaidLeave}</td>
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
            </Tabs>
          </div>
        </main>
      </div>

      {/* Filter Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trade</label>
              <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, trade: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, project: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Rate</label>
              <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, dailyRate: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {dailyRates.map((rate) => (
                    <SelectItem key={rate} value={rate}>
                      {rate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setShowFilters(false)}>
            Apply Filters
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

