"use client"

import React, { useState, useEffect } from "react"
import { Search, RefreshCw, ChevronDown, FileText, FileCheck } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import DashboardHeader from "@/components/DashboardHeader"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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
  plannedVsActual?: string
  sickDays: number
  vacationDays: number
  unpaidLeave: number
  totalActual?: number
}

// API endpoints
const API_ENDPOINTS = {
  EMPLOYEES: "/api/employees",
  ATTENDANCE: "/api/attendance",
  PAYROLL: "/api/payroll",
  LEAVE: "/api/leave",
  GENERATE_PAYSLIPS: "/api/payroll/generate-payslips",
  PAYROLL_REPORT: "/api/payroll/report",
}

// Sample data
const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Courtney Henry",
    avatar: "/johndoe.jpeg",
    position: "Electrician",
    assignedProject: "Metro Bridge",
    contractStartDate: "Feb 28, 2018",
    contractEndDate: "Feb 28, 2018",
    dailyRate: 120,
    remainingDays: 1,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 137760,
    plannedVsActual: "Planned: $2,500",
    sickDays: 22,
    vacationDays: 20,
    unpaidLeave: 20,
    totalActual: 2200,
  },
  {
    id: 2,
    name: "Annette Black",
    avatar: "/johndoe.jpeg",
    position: "Electrician",
    assignedProject: "Mall Construction",
    contractStartDate: "May 31, 2015",
    contractEndDate: "May 20, 2015",
    dailyRate: 200,
    remainingDays: 2,
    attendance: "Present",
    daysWorked: 20,
    budgetBaseline: 4000,
    plannedVsActual: "Within Budget",
    sickDays: 20,
    vacationDays: 22,
    unpaidLeave: 18,
    totalActual: 4000,
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
    remainingDays: 3,
    attendance: "Present",
    daysWorked: 18,
    budgetBaseline: 2520,
    plannedVsActual: "+$300 Over Budget",
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 22,
    totalActual: 2520,
  },
  {
    id: 4,
    name: "Courtney Henry",
    avatar: "/johndoe.jpeg",
    position: "Electrician",
    assignedProject: "Mall Construction",
    contractStartDate: "Sep 9, 2013",
    contractEndDate: "May 29, 2017",
    dailyRate: 100,
    remainingDays: 4,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 2200,
    plannedVsActual: "Within Budget",
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 22,
    totalActual: 2200,
  },
  {
    id: 5,
    name: "Brooklyn Simmons",
    avatar: "/johndoe.jpeg",
    position: "HR Manager",
    assignedProject: "Metro Bridge",
    contractStartDate: "Jul 14, 2015",
    contractEndDate: "May 12, 2019",
    dailyRate: 100,
    remainingDays: 5,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 2640,
    plannedVsActual: "Planned: $2,500",
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 22,
    totalActual: 4000,
  },
  {
    id: 6,
    name: "Marvin McKinney",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "Sep 24, 2017",
    contractEndDate: "Dec 2, 2018",
    dailyRate: 140,
    remainingDays: 6,
    attendance: "Present",
    daysWorked: 18,
    budgetBaseline: 4000,
    plannedVsActual: "Within Budget",
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 18,
    totalActual: 2520,
  },
  {
    id: 7,
    name: "Jane Cooper",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Mar 6, 2018",
    contractEndDate: "Apr 28, 2016",
    dailyRate: 100,
    remainingDays: 7,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 2520,
    plannedVsActual: "+$300 Over Budget",
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 22,
    totalActual: 2200,
  },
  {
    id: 8,
    name: "Kristin Watson",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "Aug 2, 2013",
    contractEndDate: "Feb 29, 2012",
    dailyRate: 140,
    remainingDays: 8,
    attendance: "Present",
    daysWorked: 18,
    budgetBaseline: 2200,
    plannedVsActual: "Within Budget",
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 18,
    totalActual: 2640,
  },
  {
    id: 9,
    name: "Jacob Jones",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Aug 7, 2017",
    contractEndDate: "May 31, 2015",
    dailyRate: 100,
    remainingDays: 9,
    attendance: "Present",
    daysWorked: 18,
    budgetBaseline: 2640,
    plannedVsActual: "Planned: $2,500",
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 22,
    totalActual: 4000,
  },
  {
    id: 10,
    name: "Esther Howard",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "May 6, 2012",
    contractEndDate: "Mar 13, 2014",
    dailyRate: 140,
    remainingDays: 10,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 4000,
    plannedVsActual: "Within Budget",
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 18,
    totalActual: 2520,
  },
  {
    id: 11,
    name: "Arlene McCoy",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Oct 30, 2017",
    contractEndDate: "Mar 23, 2013",
    dailyRate: 100,
    remainingDays: 11,
    attendance: "Present",
    daysWorked: 18,
    budgetBaseline: 2520,
    plannedVsActual: "+$300 Over Budget",
    sickDays: 18,
    vacationDays: 18,
    unpaidLeave: 18,
    totalActual: 2640,
  },
  {
    id: 12,
    name: "Darrell Steward",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Mall Construction",
    contractStartDate: "Nov 7, 2017",
    contractEndDate: "Oct 31, 2017",
    dailyRate: 100,
    remainingDays: 12,
    attendance: "Present",
    daysWorked: 22,
    budgetBaseline: 2520,
    plannedVsActual: "Within Budget",
    sickDays: 22,
    vacationDays: 22,
    unpaidLeave: 22,
    totalActual: 2520,
  },
]

const trades = ["Electrician", "HR Manager", "Technician", "Construction Worker"]
const projects = ["Metro Bridge", "Mall Construction"]
const dailyRates = ["$100", "$120", "$140", "$200"]

export default function AttendancePayroll() {
  const { toast } = useToast()
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [activeTab, setActiveTab] = useState("attendance")
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentMonth, setCurrentMonth] = useState("May 2025")
  const [showFilters, setShowFilters] = useState(true)
  const [openAttendanceDropdown, setOpenAttendanceDropdown] = useState<number | null>(null)
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPayslips, setIsGeneratingPayslips] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [totalPayroll, setTotalPayroll] = useState("$25,000")
  const [summaryData, setSummaryData] = useState({
    totalEmployees: 45,
    totalDaysWorked: 365,
    totalBudgetBaseline: "$11,200.56",
    totalActualPayroll: "$6,765.12",
    dailyActualPayroll: "$500",
  })

  const [filters, setFilters] = useState({
    trade: "Electrician",
    project: "Metro Bridge",
    dailyRate: "",
    startDate: "",
    endDate: "",
  })

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        // Simulating API call
        // In a real implementation, this would be:
        // const response = await fetch(API_ENDPOINTS.EMPLOYEES);
        // const data = await response.json();
        // setEmployees(data);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setEmployees(initialEmployees)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching employees:", error)
        toast({
          title: "Error",
          description: "Failed to fetch employees data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [toast])

  // Update employee attendance
  const updateEmployeeAttendance = async (employeeId: number, status: "Present" | "Absent" | "Late") => {
    try {
      // Simulating API call
      // In a real implementation, this would be:
      // await fetch(`${API_ENDPOINTS.ATTENDANCE}/${employeeId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status }),
      // });

      // Update local state
      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) => (employee.id === employeeId ? { ...employee, attendance: status } : employee)),
      )

      setOpenAttendanceDropdown(null)

      toast({
        title: "Attendance Updated",
        description: `Employee attendance has been marked as ${status}.`,
      })
    } catch (error) {
      console.error("Error updating attendance:", error)
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Generate payslips
  const handleGeneratePayslips = async () => {
    try {
      setIsGeneratingPayslips(true)
      // Simulating API call
      // In a real implementation, this would be:
      // await fetch(API_ENDPOINTS.GENERATE_PAYSLIPS, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ employeeIds: employees.map(e => e.id) }),
      // });

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsGeneratingPayslips(false)
      toast({
        title: "Payslips Generated",
        description: "Payslips have been generated successfully and are ready for download.",
      })
    } catch (error) {
      console.error("Error generating payslips:", error)
      toast({
        title: "Error",
        description: "Failed to generate payslips. Please try again.",
        variant: "destructive",
      })
      setIsGeneratingPayslips(false)
    }
  }

  // Generate payroll report
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true)
      // Simulating API call
      // In a real implementation, this would be:
      // const response = await fetch(API_ENDPOINTS.PAYROLL_REPORT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ filters }),
      // });
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = 'payroll-report.pdf';
      // document.body.appendChild(a);
      // a.click();
      // a.remove();

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsGeneratingReport(false)
      toast({
        title: "Report Generated",
        description: "Payroll report has been generated and downloaded.",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate payroll report. Please try again.",
        variant: "destructive",
      })
      setIsGeneratingReport(false)
    }
  }

  // Refresh data
  const handleRefreshData = async () => {
    try {
      setIsLoading(true)
      toast({
        title: "Refreshing Data",
        description: "Fetching the latest data...",
      })

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, this would fetch fresh data from the API
      setIsLoading(false)
      toast({
        title: "Data Refreshed",
        description: "The latest data has been loaded.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    if (searchTerm && !employee.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filters.trade && filters.trade !== "Electrician" && employee.position !== filters.trade) return false
    if (filters.project && filters.project !== "Metro Bridge" && employee.assignedProject !== filters.project)
      return false
    if (filters.dailyRate && `$${employee.dailyRate}` !== filters.dailyRate) return false
    return true
  })

  // Calendar days for the expanded employee view
  const calendarDays = [
    { day: 1, weekday: "Mon", status: "Present" },
    { day: 2, weekday: "Tue", status: "Present" },
    { day: 3, weekday: "Wed", status: "Present" },
    { day: 4, weekday: "Thu", status: "Present" },
    { day: 5, weekday: "Fri", status: "Present" },
    { day: 6, weekday: "Sun", status: "Present" },
    { day: 7, weekday: "Wed", status: "Present" },
  ]

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Attendance & Payroll Management</h1>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2 flex items-center border-2 border-gray-300 rounded-full h-14"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-5 w-5" />}
                {isGeneratingReport ? "Generating..." : "View Payroll Report"}
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 gap-2 flex items-center h-14 rounded-full"
                onClick={handleGeneratePayslips}
                disabled={isGeneratingPayslips}
              >
                {isGeneratingPayslips ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="h-5 w-5" />
                )}
                {isGeneratingPayslips ? "Generating..." : "Generate Payslips"}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border flex justify-between items-center h-20 mb-5 pl-2">
            {/* Tabs */}
            <div className="flex h-10 items-center rounded-lg ">
              {[
                { id: "attendance", label: "Attendance" },
                { id: "payroll", label: "Payroll Calculation" },
                { id: "leave", label: "Leave Tracking" },
              ].map((tab, index) => (
                <button
                  key={tab.id}
                  className={`px-6 py-2 text-sm font-medium transition-all duration-200 rounded-lg
                    ${activeTab === tab.id ? " border bg-white text-black font-semibold" : "bg-gray-100 text-gray-700"} 
                    ${index !== 0 ? "border border-gray-300" : ""}`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    toast({
                      title: `${tab.label} Tab`,
                      description: `Switched to ${tab.label} view`,
                    })
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-4 flex items-center gap-2">
              <div className="relative w-64 ">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search employee..."
                  className="pl-10 w-full h-14 rounded-full border "
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 flex items-center border-orange-500 text-orange-500 h-14 rounded-full"
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
                {showFilters ? "Hide Filters" : "Add Filter"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-14 w-14 flex items-center justify-center"
                onClick={handleRefreshData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
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

              <Select
                value={filters.startDate}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, startDate: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date1">Jan 1, 2025</SelectItem>
                  <SelectItem value="date2">Feb 1, 2025</SelectItem>
                  <SelectItem value="date3">Mar 1, 2025</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.endDate}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, endDate: value }))}
              >
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

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-sm text-gray-500">Loading data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Attendance Tab */}
              {activeTab === "attendance" && (
                <>
                  {/* Summary Cards */}
                  <div className="px-4 pb-4">
                    <div className="flex gap-4 mb-4">
                      <div className="bg-white border rounded-lg p-4 flex-1">
                        <div className="text-sm text-gray-500 mb-1">Total Budget Baseline</div>
                        <div className="text-xl font-bold">{summaryData.totalBudgetBaseline}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4 flex-1">
                        <div className="text-sm text-gray-500 mb-1">Total Actual Payroll</div>
                        <div className="text-xl font-bold">{summaryData.totalActualPayroll}</div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border rounded-md">
                      <thead>
                        <tr className="border-t border-b text-[10px] text-gray-500">
                          <th className="w-10 px-4 py-3 text-left border-r">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                          </th>
                          <th className="px-4 py-3 text-left border-r">Employee Name</th>
                          <th className="px-4 py-3 text-left border-r">Position/Trade</th>
                          <th className="px-4 py-3 text-left border-r">Assigned Project</th>
                          <th className="px-4 py-3 text-left border-r">Contract Start Date</th>
                          <th className="px-4 py-3 text-left border-r">Contract Finish Date</th>
                          <th className="px-4 py-3 text-left border-r">Remaining Days</th>
                          <th className="px-4 py-3 text-left border-r">Attendance</th>
                          <th className="w-10 px-4 py-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px]">
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
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 border-0`}
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
                                              ? "bg-orange-50 text-orange-500 border-0"
                                              : "bg-red-50 text-red-700 border-0"
                                        }
                                      >
                                        {employee.attendance === "Late" ? "late" : employee.attendance}
                                      </Badge>
                                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <div className="p-4 space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground mb-2">
                                        Attendance Dropdown
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
                                        className="w-full justify-center bg-orange-50 text-orange-500 hover:bg-orange-100 hover:text-orange-600 border-orange-100"
                                        onClick={() => updateEmployeeAttendance(employee.id, "Late")}
                                      >
                                        late
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
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setExpandedEmployee(employee.id === expandedEmployee ? null : employee.id)
                                  }
                                >
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
                            {expandedEmployee === employee.id && (
                              <tr className="bg-gray-50">
                                <td colSpan={9} className="px-4 py-4">
                                  <div className="border rounded-md bg-white p-4">
                                    <div className="flex justify-between items-center mb-4">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-medium">{currentMonth}</h3>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                              toast({
                                                title: "Previous Month",
                                                description: "Navigating to previous month",
                                              })
                                            }}
                                          >
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
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                              toast({
                                                title: "Next Month",
                                                description: "Navigating to next month",
                                              })
                                            }}
                                          >
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
                                      {calendarDays.map((day, index) => (
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
                                              className="bg-transparent border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100"
                                              onClick={() => {
                                                toast({
                                                  title: "Attendance Updated",
                                                  description: `Marked as Late for ${day.day} ${currentMonth}`,
                                                })
                                              }}
                                            >
                                              late
                                            </Badge>
                                            <Badge
                                              variant="outline"
                                              className="bg-transparent border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100"
                                              onClick={() => {
                                                toast({
                                                  title: "Attendance Updated",
                                                  description: `Marked as Absent for ${day.day} ${currentMonth}`,
                                                })
                                              }}
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
                </>
              )}

              {/* Payroll Tab */}
              {activeTab === "payroll" && (
                <>
                  {/* Summary Cards */}
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Total Employees</div>
                        <div className="text-xl font-bold">{summaryData.totalEmployees}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Total Days Worked</div>
                        <div className="text-xl font-bold">{summaryData.totalDaysWorked}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Total Budget Baseline</div>
                        <div className="text-xl font-bold">{summaryData.totalBudgetBaseline}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Total Actual Payroll</div>
                        <div className="text-xl font-bold">{summaryData.totalActualPayroll}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Daily Actual Payroll</div>
                        <div className="text-xl font-bold">{summaryData.dailyActualPayroll}</div>
                      </div>
                    </div>
                  </div>

                  {/* Payroll Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border rounded-md">
                      <thead>
                        <tr className="border-t border-b text-[10px] text-gray-500">
                          <th className="w-10 px-4 py-3 text-left border-r">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                          </th>
                          <th className="px-4 py-3 text-left border-r">Employee Name</th>
                          <th className="px-4 py-3 text-left border-r">Daily Rate</th>
                          <th className="px-4 py-3 text-left border-r">Days Worked</th>
                          <th className="px-4 py-3 text-left border-r">Budget Baseline</th>
                          <th className="px-4 py-3 text-left border-r">Total Actual</th>
                          <th className="px-4 py-3 text-left border-r">Planned vs Actual</th>
                          <th className="w-10 px-4 py-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
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
                            <td className="px-4 py-3 border-r">${employee.budgetBaseline.toLocaleString()}</td>
                            <td className="px-4 py-3 border-r">${employee.totalActual?.toLocaleString()}</td>
                            <td className="px-4 py-3 border-r">
                              {employee.plannedVsActual?.includes("Over Budget") ? (
                                <Badge className="bg-red-50 text-red-700 border-0">{employee.plannedVsActual}</Badge>
                              ) : employee.plannedVsActual?.includes("Planned") ? (
                                <span className="text-gray-700">{employee.plannedVsActual}</span>
                              ) : (
                                <Badge className="bg-green-50 text-green-700 border-0">
                                  {employee.plannedVsActual}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  toast({
                                    title: "Employee Details",
                                    description: `Viewing details for ${employee.name}`,
                                  })
                                }}
                              >
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
                </>
              )}

              {/* Leave Tab */}
              {activeTab === "leave" && (
                <div className="overflow-x-auto">
                  <table className="w-full border rounded-lg">
                    <thead>
                      <tr className="border-t border-b text-[10px] text-gray-500">
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
                    <tbody className="text-xs">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                toast({
                                  title: "Leave Management",
                                  description: `Managing leave for ${employee.name}`,
                                })
                              }}
                            >
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
            </>
          )}
        </main>
      </div>
    </div>
  )
}

