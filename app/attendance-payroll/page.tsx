"use client"

import React, { useState } from "react"
import { Search, RefreshCw, ChevronDown, BarChart2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  attendanceCalendar?: {
    month: string
    days: {
      day: number
      weekday: string
      status: "Present" | "Late" | "Absent"
    }[]
  }
}

// Sample data
const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Courtney Henry",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Electrician",
    assignedProject: "Metro Bridge",
    contractStartDate: "Feb 28, 2018",
    contractEndDate: "Feb 28, 2018",
    dailyRate: 120,
    remainingDays: 12,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 22,
    vacationDays: 20,
    unpaidLeave: 20,
    attendanceCalendar: {
      month: "May 2025",
      days: [
        { day: 1, weekday: "Mon", status: "Present" },
        { day: 2, weekday: "Tue", status: "Present" },
        { day: 3, weekday: "Wed", status: "Present" },
        { day: 4, weekday: "Thu", status: "Present" },
        { day: 5, weekday: "Fri", status: "Present" },
        { day: 6, weekday: "Sun", status: "Present" },
        { day: 7, weekday: "Wed", status: "Present" },
      ],
    },
  },
  {
    id: 2,
    name: "Annette Black",
    avatar: "/johndoe.jpeg",
    position: "Electrician",
    assignedProject: "Mall Construction",
    contractStartDate: "May 31, 2015",
    contractEndDate: "May 20, 2015",
    dailyRate: 120,
    remainingDays: 11,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 20,
    vacationDays: 22,
    unpaidLeave: 18,
  },
  {
    id: 3,
    name: "Kathryn Murphy",
    avatar: "/johndoe.jpeg",
    position: "HR Manager",
    assignedProject: "Metro Bridge",
    contractStartDate: "May 12, 2019",
    contractEndDate: "Nov 16, 2014",
    dailyRate: 140,
    remainingDays: 10,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 22,
  },
  {
    id: 4,
    name: "Courtney Henry",
    avatar: "/johndoe.jpeg",
    position: "Electrician",
    assignedProject: "Mall Construction",
    contractStartDate: "Sep 9, 2013",
    contractEndDate: "May 29, 2017",
    dailyRate: 120,
    remainingDays: 9,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 22,
  },
  {
    id: 5,
    name: "Brooklyn Simmons",
    avatar: "/johndoe.jpeg",
    position: "HR Manager",
    assignedProject: "Metro Bridge",
    contractStartDate: "Jul 14, 2015",
    contractEndDate: "May 12, 2019",
    dailyRate: 140,
    remainingDays: 8,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 22,
  },
  {
    id: 6,
    name: "Marvin McKinney",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "Sep 24, 2017",
    contractEndDate: "Dec 2, 2018",
    dailyRate: 120,
    remainingDays: 7,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 18,
  },
  {
    id: 7,
    name: "Jane Cooper",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Mar 6, 2018",
    contractEndDate: "Apr 28, 2016",
    dailyRate: 120,
    remainingDays: 6,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 22,
  },
  {
    id: 8,
    name: "Kristin Watson",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "Aug 2, 2013",
    contractEndDate: "Feb 29, 2012",
    dailyRate: 120,
    remainingDays: 5,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 18,
  },
  {
    id: 9,
    name: "Jacob Jones",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Aug 7, 2017",
    contractEndDate: "May 31, 2015",
    dailyRate: 120,
    remainingDays: 4,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 22,
  },
  {
    id: 10,
    name: "Esther Howard",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "May 6, 2012",
    contractEndDate: "Mar 13, 2014",
    dailyRate: 120,
    remainingDays: 3,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 18,
  },
  {
    id: 11,
    name: "Arlene McCoy",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Oct 30, 2017",
    contractEndDate: "Mar 23, 2013",
    dailyRate: 120,
    remainingDays: 2,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 18,
  },
  {
    id: 12,
    name: "Darrell Steward",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Mall Construction",
    contractStartDate: "Nov 7, 2017",
    contractEndDate: "Oct 31, 2017",
    dailyRate: 120,
    remainingDays: 1,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedBudget: 2500,
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 22,
  },
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

  const [activeTab, setActiveTab] = useState("attendance")
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    trade: "",
    project: "",
    dailyRate: "",
    startDate: "",
    endDate: "",
    search: "",
  })
  const [openAttendanceDropdown, setOpenAttendanceDropdown] = useState<number | null>(null)
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)

  // Filter employees based on selected filters
  const filteredEmployees = employees.filter((employee) => {
    if (filters.trade && employee.position !== filters.trade) return false
    if (filters.project && employee.assignedProject !== filters.project) return false
    if (filters.dailyRate && `$${employee.dailyRate}` !== filters.dailyRate) return false
    if (filters.search && !employee.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const toggleEmployeeExpansion = (employeeId: number) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null)
    } else {
      setExpandedEmployee(employeeId)
    }
  }

  const updateEmployeeAttendance = (employeeId: number, status: "Present" | "Late" | "Absent") => {
    // Update the employee's attendance status
    setEmployees((prevEmployees) =>
      prevEmployees.map((employee) => (employee.id === employeeId ? { ...employee, attendance: status } : employee)),
    )
    setOpenAttendanceDropdown(null)
  }

  return (
    <div className="flex h-screen bg-white">
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
              <Button variant="ghost" size="icon" className="rounded-full">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center gap-2 px-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
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
              <Button variant="outline" className="gap-2 flex items-center">
                <BarChart2 className="h-4 w-4" />
                View Payroll Report
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 gap-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
                Generate Payslips
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            {/* Tabs */}
            <div className="border-b">
              <div className="flex">
                <button
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "attendance" ? "border-b-2 border-primary" : ""
                  }`}
                  onClick={() => setActiveTab("attendance")}
                >
                  Attendence
                </button>
                <button
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "payroll" ? "border-b-2 border-primary" : ""
                  }`}
                  onClick={() => setActiveTab("payroll")}
                >
                  Payroll Calculation
                </button>
                <button
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "leave" ? "border-b-2 border-primary" : ""
                  }`}
                  onClick={() => setActiveTab("leave")}
                >
                  Leave Tracking
                </button>
              </div>
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
              <Button
                variant="outline"
                className="gap-2 flex items-center border-orange-500 text-orange-500"
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20v-6M6 20V10M18 20V4" />
                </svg>
                Add Filter
              </Button>
            </div>

            {/* Filter Row */}
            {showFilters && (
              <div className="px-4 pb-4 grid grid-cols-5 gap-4">
                <Select
                  value={filters.trade}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, trade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Electrician" />
                  </SelectTrigger>
                  <SelectContent>
                    {trades.map((trade) => (
                      <SelectItem key={trade} value={trade}>
                        {trade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.project}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, project: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Metro Bridge" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.dailyRate}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, dailyRate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select by Daily Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {dailyRates.map((rate) => (
                      <SelectItem key={rate} value={rate}>
                        {rate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="State Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date1">Jan 1, 2025</SelectItem>
                    <SelectItem value="date2">Feb 1, 2025</SelectItem>
                    <SelectItem value="date3">Mar 1, 2025</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Finish Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date1">Dec 31, 2025</SelectItem>
                    <SelectItem value="date2">Nov 30, 2025</SelectItem>
                    <SelectItem value="date3">Oct 31, 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="border-t border-b text-sm text-muted-foreground">
                      <th className="w-10 px-4 py-3 text-left border-r">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                      </th>
                      <th className="px-4 py-3 text-left border-r text-[10px]">Employee Name</th>
                      <th className="px-4 py-3 text-left border-r text-[10px]">Position/Trade</th>
                      <th className="px-4 py-3 text-left border-r text-[10px]">Assigned Project</th>
                      <th className="px-4 py-3 text-left border-r text-[10px]">Contract Start Date</th>
                      <th className="px-4 py-3 text-left border-r text-[10px]">Contract Finish Date</th>
                      <th className="px-4 py-3 text-left border-r text-[10px]">Remaining Days</th>
                      <th className="px-4 py-3 text-left border-r text-[10px]">Attendance</th>
                      <th className="w-10 px-4 py-3 text-center border-r"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <React.Fragment key={employee.id}>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 border-r">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                          </td>
                          <td className="px-4 py-3 border-r">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={employee.avatar} alt={employee.name} />
                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{employee.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r">{employee.position}</td>
                          <td className="px-4 py-3 border-r">{employee.assignedProject}</td>
                          <td className="px-4 py-3 border-r">{employee.contractStartDate}</td>
                          <td className="px-4 py-3 border-r">{employee.contractEndDate}</td>
                          <td className="px-4 py-3 border-r">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2 py-0.5 text-xs font-medium 
                  ${
                    employee.remainingDays > 10
                      ? "bg-green-50 text-green-700 border-green-200"
                      : employee.remainingDays > 5
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-red-50 text-red-700 border-red-200"
                  }`}
                            >
                              {employee.remainingDays < 10 ? `0${employee.remainingDays}` : employee.remainingDays}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 border-r">
                            <Popover
                              open={openAttendanceDropdown === employee.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setOpenAttendanceDropdown(employee.id)
                                } else {
                                  setOpenAttendanceDropdown(null)
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer">
                                  <Badge
                                    className={
                                      employee.attendance === "Present"
                                        ? "bg-green-50 text-green-700 border-0"
                                        : employee.attendance === "Late"
                                          ? "bg-yellow-50 text-yellow-700 border-0"
                                          : "bg-red-50 text-red-700 border-0"
                                    }
                                  >
                                    {employee.attendance}
                                  </Badge>
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <div className="p-2 space-y-2">
                                  <div className="text-sm font-medium text-muted-foreground mb-2">
                                    Attendence Status
                                  </div>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-center bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-100"
                                    onClick={() => updateEmployeeAttendance(employee.id, "Present")}
                                  >
                                    Present
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-center bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 border-orange-100"
                                    onClick={() => updateEmployeeAttendance(employee.id, "Late")}
                                  >
                                    Late
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-center bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-100"
                                    onClick={() => updateEmployeeAttendance(employee.id, "Absent")}
                                  >
                                    Absent
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="px-4 py-3 text-center border-r">
                            <Button variant="ghost" size="icon" onClick={() => toggleEmployeeExpansion(employee.id)}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-muted-foreground"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </td> 
                        </tr>
                        {expandedEmployee === employee.id && employee.attendanceCalendar && (
                          <tr className="bg-gray-50">
                            <td colSpan={10} className="px-4 py-4">
                              <div className="border rounded-md bg-white p-4">
                                <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">{employee.attendanceCalendar.month}</h3>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="m15 18-6-6 6-6" />
                                        </svg>
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="m9 18 6-6-6-6" />
                                        </svg>
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <Select defaultValue="1week">
                                      <SelectTrigger className="h-8 w-32">
                                        <SelectValue placeholder="Show" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1week">1 Week</SelectItem>
                                        <SelectItem value="2weeks">2 Weeks</SelectItem>
                                        <SelectItem value="month">Full Month</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-7 gap-4">
                                  {employee.attendanceCalendar.days.map((day, index) => (
                                    <div key={index} className="text-center">
                                      <div className="text-sm font-medium mb-1">
                                        {day.day < 10 ? `0${day.day}` : day.day}
                                      </div>
                                      <div className="text-xs text-muted-foreground mb-2">{day.weekday}</div>
                                      <div className="flex flex-col gap-1">
                                        <Badge
                                          className={
                                            day.status === "Present"
                                              ? "bg-green-50 text-green-700 border-0"
                                              : day.status === "Late"
                                                ? "bg-yellow-50 text-yellow-700 border-0"
                                                : "bg-red-50 text-red-700 border-0"
                                          }
                                        >
                                          {day.status}
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className="bg-transparent border-gray-200 text-gray-500"
                                        >
                                          late
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className="bg-transparent border-gray-200 text-gray-500"
                                        >
                                          Absent
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payroll Tab */}
            {activeTab === "payroll" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-t border-b text-sm text-muted-foreground">
                      <th className="w-10 px-4 py-3 text-left border-r">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                      </th>
                      <th className="px-4 py-3 text-left border-r">Employee Name</th>
                      <th className="px-4 py-3 text-left border-r">Daily Rate</th>
                      <th className="px-4 py-3 text-left border-r">Days Worked</th>
                      <th className="px-4 py-3 text-left border-r">Budget Baseline</th>
                      <th className="px-4 py-3 text-left border-r">Planned vs Actual</th>
                      <th className="w-10 px-4 py-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 border-r">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3 border-r">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee.avatar} alt={employee.name} />
                              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{employee.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r">${employee.dailyRate}</td>
                        <td className="px-4 py-3 border-r">{employee.daysWorked}</td>
                        <td className="px-4 py-3 border-r">${employee.budgetBaseline}</td>
                        <td className="px-4 py-3 border-r">
                          <div className="flex items-center gap-2">
                            <span>Planned: ${employee.plannedBudget}</span>
                            {employee.dailyRate * employee.daysWorked > employee.plannedBudget ? (
                              <Badge className="bg-red-50 text-red-700 border-0">
                                +${employee.dailyRate * employee.daysWorked - employee.plannedBudget} Over Budget
                              </Badge>
                            ) : (
                              <Badge className="bg-green-50 text-green-700 border-0">Within Budget</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="icon">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-muted-foreground"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Leave Tab */}
            {activeTab === "leave" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-t border-b text-sm text-muted-foreground">
                      <th className="w-10 px-4 py-3 text-left border-r">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                      </th>
                      <th className="px-4 py-3 text-left border-r">Employee Name</th>
                      <th className="px-4 py-3 text-left border-r">Sick Days</th>
                      <th className="px-4 py-3 text-left border-r">Vacation Days</th>
                      <th className="px-4 py-3 text-left border-r">Unpaid Leave</th>
                      <th className="w-10 px-4 py-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 border-r">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3 border-r">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee.avatar} alt={employee.name} />
                              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{employee.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r">{employee.sickDays}</td>
                        <td className="px-4 py-3 border-r">{employee.vacationDays}</td>
                        <td className="px-4 py-3 border-r">{employee.unpaidLeave}</td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="icon">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-muted-foreground"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

