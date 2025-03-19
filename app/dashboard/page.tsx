"use client"

import { useState, useEffect } from "react"
import { Search, Users, Clock, Calendar, DollarSign, ChevronDown, MoreVertical, Loader2, RefreshCw } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import DashboardHeader from "@/components/DashboardHeader"
import { useToast } from "@/hooks/use-toast"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@radix-ui/react-select"

export default function Dashboard() {
  const { toast } = useToast()

  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 120,
    attendanceToday: "92%",
    lateArrivals: 8,
    totalPayroll: "$25,000",
    employeeChange: "2.5%",
    attendanceChange: "3.2%",
    lateArrivalsChange: "1",
    payrollChange: "2.5%",
  })

  // Payroll data for the bar chart
  const [payrollData, setPayrollData] = useState([
    { month: "Jan", cost: 5000, planned: 5000 },
    { month: "Feb", cost: 6000, planned: 6000 },
    { month: "Mar", cost: 7000, planned: 7000 },
    { month: "Apr", cost: 8000, planned: 8000 },
    { month: "May", cost: 14000, planned: 14056, highlight: true },
    { month: "Jun", cost: 9000, planned: 9000 },
    { month: "Jul", cost: 10000, planned: 10000 },
    { month: "Aug", cost: 11000, planned: 11000 },
    { month: "Sep", cost: 12000, planned: 12000 },
    { month: "Oct", cost: 13000, planned: 13000 },
    { month: "Nov", cost: 14000, planned: 14000 },
    { month: "Dec", cost: 15000, planned: 15000 },
  ])

  // Attendance data for the line chart - matching the exact pattern in the image
  const [attendanceData, setAttendanceData] = useState([
    { day: 1, attendance: 10 },
    { day: 2, attendance: 35 },
    { day: 3, attendance: 40 },
    { day: 4, attendance: 25 },
    { day: 5, attendance: 35 },
    { day: 6, attendance: 30 },
    { day: 7, attendance: 60 },
    { day: 8, attendance: 45 },
    { day: 9, attendance: 55 },
    { day: 10, attendance: 95, highlight: true },
    { day: 11, attendance: 45 },
    { day: 12, attendance: 50 },
    { day: 13, attendance: 45 },
    { day: 14, attendance: 50 },
    { day: 15, attendance: 48 },
    { day: 16, attendance: 48 },
    { day: 17, attendance: 48 },
    { day: 18, attendance: 65 },
    { day: 19, attendance: 60 },
    { day: 20, attendance: 65 },
    { day: 21, attendance: 65 },
    { day: 22, attendance: 65 },
    { day: 23, attendance: 45 },
    { day: 24, attendance: 65 },
    { day: 25, attendance: 65 },
    { day: 26, attendance: 40 },
    { day: 27, attendance: 70 },
    { day: 28, attendance: 75 },
    { day: 29, attendance: 35 },
    { day: 30, attendance: 35 },
  ])

  const [employeeData, setEmployeeData] = useState([
    {
      id: 1,
      position: "Construction Workers",
      plannedBudget: "$5,000",
      actualCost: "$5,500",
      difference: "$500",
      icon: "👷",
    },
    {
      id: 2,
      position: "Electricians",
      plannedBudget: "$4,200",
      actualCost: "$4,100",
      difference: "-$100",
      icon: "⚡",
    },
    {
      id: 3,
      position: "IT Staff",
      plannedBudget: "$6,000",
      actualCost: "$6,500",
      difference: "$500",
      icon: "💻",
    },
    {
      id: 4,
      position: "Admin Staff",
      plannedBudget: "$3,800",
      actualCost: "$3,700",
      difference: "-$100",
      icon: "👨‍💼",
    },
  ])

  type Trade = {
    id: number
    name: string
    location: string
    dailyRate: number
    icon: string
  }

  const trades: Trade[] = [
    { id: 1, name: "Electricians", location: "Main Office", dailyRate: 120, icon: "⚡" },
    { id: 2, name: "Technicians", location: "Site A", dailyRate: 100, icon: "🔧" },
    { id: 3, name: "HR & Admin", location: "Site B", dailyRate: 90, icon: "👨‍💼" },
    { id: 4, name: "Supervisors", location: "Site C", dailyRate: 120, icon: "👷" },
  ]

  const [filters, setFilters] = useState({
    trade: "",
    location: "",
    dailyRate: "",
    search: "",
  })

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // In a real implementation, this would be:
        // const response = await fetch('/api/dashboard');
        // const data = await response.json();
        // setDashboardData(data.summary);
        // setPayrollData(data.payrollData);
        // setAttendanceData(data.attendanceData);
        // setEmployeeData(data.employeeData);

        setIsLoading(false)
        toast({
          title: "Dashboard Loaded",
          description: "Dashboard data has been loaded successfully.",
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true)
      toast({
        title: "Refreshing Data",
        description: "Fetching the latest dashboard data...",
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, this would fetch fresh data from the API
      setIsRefreshing(false)
      toast({
        title: "Data Refreshed",
        description: "Dashboard has been updated with the latest data.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      })
      setIsRefreshing(false)
    }
  }

  const handleFilterChange = (type: string, value: string) => {
    setFilters((prev) => ({ ...prev, [type]: value }))
  }

  // Custom tooltip for payroll chart
  const PayrollTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: any
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="text-sm font-medium mb-1">May, 2025</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Planned Cost</span>
            <span className="text-sm font-medium">${payload[0].value.toLocaleString()}</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for attendance chart
  const AttendanceTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: any
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="text-sm font-medium mb-1">May10, 2025</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Attendance</span>
            <span className="text-sm font-medium">95%</span>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm text-gray-500">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>

              <div className="flex gap-2">
                <Select onValueChange={(value) => handleFilterChange("trade", value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select by Trade" />
                  </SelectTrigger>
                  <SelectContent>
                    {trades.map((trade) => (
                      <SelectItem key={trade.id} value={trade.name}>
                        {trade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => handleFilterChange("location", value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select by location" />
                  </SelectTrigger>
                  <SelectContent>
                    {trades.map((trade) => (
                      <SelectItem key={trade.id} value={trade.location}>
                        {trade.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="gap-2 h-10 rounded-full"
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Employees"
                value={dashboardData.totalEmployees.toString()}
                icon={Users}
                change={{
                  value: dashboardData.employeeChange,
                  type: "increase",
                  text: "+5 new hires",
                }}
              />
              <StatCard
                title="Attendance Today"
                value={dashboardData.attendanceToday}
                icon={Clock}
                iconBackground="bg-blue-700"
                change={{
                  value: dashboardData.attendanceChange,
                  type: "increase",
                  text: "from yesterday",
                }}
              />
              <StatCard
                title="Late Arrivals"
                value={dashboardData.lateArrivals.toString().padStart(2, "0")}
                icon={Calendar}
                iconBackground="bg-red-600"
                change={{
                  value: dashboardData.lateArrivalsChange,
                  type: "decrease",
                  text: "from last week",
                }}
              />
              <StatCard
                title="Total Payroll"
                value={dashboardData.totalPayroll}
                icon={DollarSign}
                iconBackground="bg-green-600"
                change={{ value: dashboardData.payrollChange, type: "increase", text: "planned" }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Total Payroll Cost Card */}
              <div className="bg-white rounded-lg border">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium">Total Payroll Cost</h3>
                    <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm">
                      <span>This Year</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-6">$236,788.12</div>
                </div>

                <div className="px-5 pb-5">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payrollData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} barGap={0}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEEE" strokeWidth={1} />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#888888" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#888888" }}
                          tickFormatter={(value) => `$${value / 1000}K`}
                          ticks={[0, 5000, 10000, 15000]}
                        />
                        <ReferenceLine
                          y={8000}
                          stroke="#FFA500"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                          isFront={true}
                          label={false}
                        />
                        <Tooltip
                          content={<PayrollTooltip active={undefined} payload={undefined} label={undefined} />}
                          cursor={false}
                        />
                        <Bar
                          dataKey={(entry) => (entry.highlight ? 0 : entry.planned)}
                          fill="#EEEEEE"
                          barSize={20}
                          radius={[0, 0, 0, 0]}
                          name="Other Months"
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey={(entry) => (entry.highlight ? entry.planned : 0)}
                          fill="#FFA500"
                          barSize={20}
                          radius={[0, 0, 0, 0]}
                          name="Planned Cost"
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey={(entry) => (entry.highlight ? entry.cost : 0)}
                          fill="#1D4ED8"
                          barSize={20}
                          radius={[0, 0, 0, 0]}
                          name="Actual Cost"
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Total Attendance Card */}
              <div className="bg-white rounded-lg border">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium">Total Attendance</h3>
                    <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm">
                      <span>This Month</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-6">98%</div>
                </div>

                <div className="px-5 pb-5">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={true}
                          horizontal={true}
                          stroke="#EEEEEE"
                          strokeWidth={1}
                        />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#888888" }}
                          ticks={[1, 30]}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#888888" }}
                          tickFormatter={(value) => `${value}%`}
                          ticks={[0, 10, 30, 50, 70, 100]}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          content={<AttendanceTooltip active={undefined} payload={undefined} label={undefined} />}
                          cursor={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="attendance"
                          stroke="#1D4ED8"
                          strokeWidth={2}
                          dot={{ r: 4, fill: "#1D4ED8", strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: "#1D4ED8", strokeWidth: 0 }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget vs Actual Report */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 flex justify-between items-center">
                <h3 className="font-medium">Budget vs Actual Report</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search trade/position..."
                      className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M2 4H14M2 8H14M2 12H14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="border-t">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="w-12 p-4">
                        <Checkbox
                          onChange={() => {
                            toast({
                              title: "Select All",
                              description: "All items have been selected",
                            })
                          }}
                        />
                      </th>
                      <th className="text-left p-4 font-medium text-sm text-gray-500">Trade/Position</th>
                      <th className="text-left p-4 font-medium text-sm text-gray-500">Planned Budget</th>
                      <th className="text-left p-4 font-medium text-sm text-gray-500">Actual Cost</th>
                      <th className="text-left p-4 font-medium text-sm text-gray-500">Difference</th>
                      <th className="w-12 p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeData.map((employee) => (
                      <tr key={employee.id} className="border-b">
                        <td className="p-4">
                          <Checkbox
                            onChange={() => {
                              toast({
                                title: "Item Selected",
                                description: `${employee.position} has been selected`,
                              })
                            }}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm">{employee.icon}</span>
                            </div>
                            <span className="font-medium">{employee.position}</span>
                          </div>
                        </td>
                        <td className="p-4">{employee.plannedBudget}</td>
                        <td className="p-4">{employee.actualCost}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center ${
                                Number.parseFloat(employee.difference.replace(/[^0-9.-]+/g, "")) > 0
                                  ? "bg-green-100"
                                  : "bg-red-100"
                              }`}
                            >
                              <span
                                className={`text-xs ${
                                  Number.parseFloat(employee.difference.replace(/[^0-9.-]+/g, "")) > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Number.parseFloat(employee.difference.replace(/[^0-9.-]+/g, "")) > 0 ? "+" : ""}
                              </span>
                            </div>
                            <span
                              className={`${
                                Number.parseFloat(employee.difference.replace(/[^0-9.-]+/g, "")) > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {employee.difference}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              toast({
                                title: "View Details",
                                description: `Viewing details for ${employee.position}`,
                              })
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

