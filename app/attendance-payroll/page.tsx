"use client";

import React, { useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronDown,
  FileText,
  FileCheck,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useGetEmployeesQuery } from "@/lib/redux/employeeSlice";
import { useGetTradesQuery } from "@/lib/redux/tradePositionSlice";
import { useEditUserStatusMutation } from "@/lib/redux/attendanceSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";

// API endpoints
const API_ENDPOINTS = {
  EMPLOYEES: "/api/employees",
  ATTENDANCE: "/api/attendance",
  PAYROLL: "/api/payroll",
  LEAVE: "/api/leave",
  GENERATE_PAYSLIPS: "/api/payroll/generate-payslips",
  PAYROLL_REPORT: "/api/payroll/report",
};

const projects = ["Metro Bridge", "Mall Construction"];
const dailyRates = ["$100", "$120", "$140", "$200"];

export default function AttendancePayroll() {
  const {
    data: sessionData = { user: {} },
    isLoading: isSessionLoading,
    isError: isSessionError,
    refetch: sessionRefetch,
  } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: false,
  });
  const splitCurrencyValue = (str: string | undefined | null) => {
    if (!str) return null; // return early if str is undefined or null
    const match = str.match(/^([A-Z]+)([\d.]+)$/);
    if (!match) return null;
    return {
      currency: match[1],
      value: match[2],
    };
  };

  const currencyValue = Number(
    splitCurrencyValue(sessionData.user.currency)?.value
  );
  const currencyShort = splitCurrencyValue(sessionData.user.currency)?.currency;
  const { toast } = useToast();
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });
  const [trades, setTrades] = useState([
    "Electrician",
    "testing",
    "Technician",
    "Construction Worker",
  ]);
  const [activeTab, setActiveTab] = useState("attendance");
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMonth, setCurrentMonth] = useState("May 2025");
  const [showFilters, setShowFilters] = useState(true);
  const [openAttendanceDropdown, setOpenAttendanceDropdown] = useState<
    number | null
  >(null);
  const [isGeneratingPayslips, setIsGeneratingPayslips] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // RTK Query hook for fetching employees
  const { data: employees = [], isLoading, refetch } = useGetEmployeesQuery();
  const { data: tradesFetched, refetch: refetchTrades } = useGetTradesQuery();
  const [updateAttendance, { isLoading: isUpdatingAttendance }] =
    useEditUserStatusMutation();

  const [totalPayroll, setTotalPayroll] = useState("$25,000");
  const [summaryData, setSummaryData] = useState({
    totalEmployees: 45,
    totalDaysWorked: 365,
    totalBudgetBaseline: "$11,200.56",
    totalActualPayroll: "$6,765.12",
    dailyActualPayroll: "$500",
  });

  const [filters, setFilters] = useState({
    trade: "Electrician",
    project: "Metro Bridge",
    dailyRate: "",
    startDate: "",
    endDate: "",
  });
  const [attendancePeriod, setAttendancePeriod] = useState("1week");

  // useEffect(() => {
  // refetchTrades();
  // if (tradesFetched) {
  //   tradesFetched.map((trade: any) => {
  //     setTrades([...trades, trade.trade_name]);
  //   });
  // }
  // }, []);
  // Update employee attendance using fetch
  const updateEmployeeAttendance = async (
    employeeId: number,
    status: "Present" | "Absent" | "Late"
  ) => {
    try {
      // Use RTK Query mutation instead of fetch
      await updateAttendance({
        employeeId,
        status,
        date: getCurrentDate(),
        time: "today",
      }).unwrap();

      setOpenAttendanceDropdown(null);

      // Add refetch here to update data
      await refetch();

      toast({
        title: "Attendance Updated",
        description: `Employee attendance has been marked as ${status}.`,
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate payslips using fetch
  const handleGeneratePayslips = async () => {
    try {
      setIsGeneratingPayslips(true);

      // API call
      await fetch(API_ENDPOINTS.GENERATE_PAYSLIPS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: employees.map((e: any) => e.id) }),
      });

      setIsGeneratingPayslips(false);
      toast({
        title: "Payslips Generated",
        description:
          "Payslips have been generated successfully and are ready for download.",
      });
    } catch (error) {
      console.error("Error generating payslips:", error);
      toast({
        title: "Error",
        description: "Failed to generate payslips. Please try again.",
        variant: "destructive",
      });
      setIsGeneratingPayslips(false);
    }
  };
  console.log(employees);
  // Generate payroll report using fetch
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);

      // API call
      const response = await fetch(API_ENDPOINTS.PAYROLL_REPORT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payroll-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setIsGeneratingReport(false);
      toast({
        title: "Report Generated",
        description: "Payroll report has been generated and downloaded.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate payroll report. Please try again.",
        variant: "destructive",
      });
      setIsGeneratingReport(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  const getCurrentDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  };
  let totalBaseline = 0;
  let totalActualPayroll = 0;
  let totalDaysWorked = 0;
  let totalDailyActuallPayroll = 0;
  employees.map((employee: any) => {
    totalBaseline += Number(employee.budget_baseline);
    totalDaysWorked += Number(employee.days_worked);
    totalActualPayroll += Number(employee.totalActualPayroll);
    totalDailyActuallPayroll += Number(employee.daily_rate);
  });
  // Refresh data
  const handleRefreshData = async () => {
    try {
      toast({
        title: "Refreshing Data",
        description: "Fetching the latest data...",
      });

      await refetch();

      toast({
        title: "Data Refreshed",
        description: "The latest data has been loaded.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredEmployees = employees.filter((employee: any) => {
    if (
      searchTerm &&
      !employee.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (
      filters.trade &&
      filters.trade !== "Electrician" &&
      employee.trade_position.trade_name !== filters.trade
    )
      return false;
    if (
      filters.project &&
      filters.project !== "Metro Bridge" &&
      employee.assignedProject !== filters.project
    )
      return false;
    if (filters.dailyRate && `$${employee.dailyRate}` !== filters.dailyRate)
      return false;
    return true;
  });

  const getFilteredAttendance = (attendance, period) => {
    if (!attendance || !attendance.length) return [];

    // Use array slicing based on selected period
    switch (period) {
      case "1week":
        return attendance.slice(0, 7);
      case "2weeks":
        return attendance.slice(0, 14);
      case "month":
        return attendance;
      default:
        return attendance.slice(0, 7);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              Attendance & Payroll Management
            </h1>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2 flex items-center border-2 border-gray-300 rounded-full h-14"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
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
                  className={`px-6 py-2 text-xs font-medium transition-all duration-200 rounded-lg
                    ${
                      activeTab === tab.id
                        ? " border bg-white text-black font-semibold"
                        : "bg-gray-100 text-gray-700"
                    } 
                    ${index !== 0 ? "border border-gray-300" : ""}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-4 flex items-center gap-1">
              <div className="relative w-52">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search employee..."
                  className="pl-10 w-full h-10 rounded-full border "
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 flex items-center border-orange-500 text-orange-500 h-10 rounded-full"
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
                <RefreshCw
                  className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Filter Row */}
          {showFilters && (
            <div className="px-4 pb-4 grid grid-cols-5 gap-4">
              <Select
                value={filters.trade}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, trade: value }))
                }
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, project: value }))
                }
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, dailyRate: value }))
                }
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

              {/* <Select
                value={filters.startDate}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, startDate: value }))
                }
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, endDate: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Finish Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date1">Dec 31, 2025</SelectItem>
                  <SelectItem value="date2">Nov 30, 2025</SelectItem>
                  <SelectItem value="date3">Oct 31, 2025</SelectItem>
                </SelectContent>
              </Select> */}
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
                        <div className="text-sm text-gray-500 mb-1">
                          Total Budget Baseline
                        </div>
                        <div className="text-xl font-bold">
                          {currencyShort}
                          {(totalBaseline * currencyValue).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4 flex-1">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Actual Payroll
                        </div>
                        <div className="text-xl font-bold">
                          {currencyShort}
                          {(
                            totalActualPayroll * currencyValue
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border rounded-md">
                      <thead>
                        <tr className="border-t border-b text-[10px] text-gray-500">
                          {/* <th className="w-10 px-4 py-3 text-left border-r">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </th> */}
                          <th className="px-4 py-3 text-left border-r">
                            Employee Name
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Position/Trade
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Assigned Project
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Contract Start Date
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Contract Finish Date
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Remaining Days
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Attendance Today
                          </th>
                          <th className="w-10 px-4 py-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px]">
                        {filteredEmployees.map((employee: any) => (
                          <React.Fragment key={employee.id}>
                            <tr className="border-b hover:bg-gray-50">
                              {/* <td className="px-4 py-3 border-r">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </td> */}
                              <td className="px-4 py-3 border-r">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        employee.avatar || "/placeholder.svg"
                                      }
                                      alt={employee.username}
                                    />
                                    <AvatarFallback>
                                      {employee.username.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {employee.username}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 border-r">
                                {employee.trade_position.trade_name}
                              </td>
                              <td className="px-4 py-3 border-r">
                                {employee.trade_position.project?.project_name
                                  ? employee.trade_position.project.project_name
                                  : "no project"}
                              </td>
                              <td className="px-4 py-3 border-r">
                                {formatDate(employee.created_date)}
                              </td>
                              <td className="px-4 py-3 border-r">
                                {formatDate(employee.contract_finish_date)}
                              </td>
                              <td className="px-4 py-3 border-r">
                                <Badge
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 border-0`}
                                >
                                  {employee.remaining_days < 10
                                    ? `${employee.remaining_days}`
                                    : employee.remaining_days}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 border-r">
                                <Popover
                                  open={openAttendanceDropdown === employee.id}
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setOpenAttendanceDropdown(employee.id);
                                    } else {
                                      setOpenAttendanceDropdown(null);
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer">
                                      {employee.attendance.map(
                                        (attendance: any) => {
                                          console.log(
                                            `${formatDate(attendance.date)}` ===
                                              getCurrentDate()
                                          );
                                          if (
                                            formatDate(attendance.date) ===
                                            getCurrentDate()
                                          ) {
                                            return (
                                              <Badge
                                                key={attendance.id}
                                                className={
                                                  attendance.status ===
                                                  "present"
                                                    ? "bg-green-50 text-green-700 border-0"
                                                    : attendance.status ===
                                                      "late"
                                                    ? "bg-orange-50 text-orange-500 border-0"
                                                    : "bg-red-50 text-red-700 border-0"
                                                }
                                              >
                                                {attendance.status}
                                              </Badge>
                                            );
                                          }

                                          return null; // avoids unnecessary empty fragments
                                        }
                                      )}

                                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <div className="p-4 space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground mb-2">
                                        Attendance Dropdown
                                      </div>
                                      {!employee.attendance.some(
                                        (a: any) =>
                                          formatDate(a.date) ===
                                            getCurrentDate() &&
                                          a.status === "present"
                                      ) && (
                                        <Button
                                          variant="outline"
                                          className="w-full justify-center bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-100"
                                          onClick={() =>
                                            updateEmployeeAttendance(
                                              employee.id,
                                              "Present"
                                            )
                                          }
                                        >
                                          Present
                                        </Button>
                                      )}
                                      {!employee.attendance.some(
                                        (a: any) =>
                                          formatDate(a.date) ===
                                            getCurrentDate() &&
                                          a.status === "late"
                                      ) && (
                                        <Button
                                          variant="outline"
                                          className="w-full justify-center bg-orange-50 text-orange-500 hover:bg-orange-100 hover:text-orange-600 border-orange-100"
                                          onClick={() =>
                                            updateEmployeeAttendance(
                                              employee.id,
                                              "Late"
                                            )
                                          }
                                        >
                                          late
                                        </Button>
                                      )}
                                      {!employee.attendance.some(
                                        (a: any) =>
                                          formatDate(a.date) ===
                                            getCurrentDate() &&
                                          a.status === "absent"
                                      ) && (
                                        <Button
                                          variant="outline"
                                          className="w-full justify-center bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-100"
                                          onClick={() =>
                                            updateEmployeeAttendance(
                                              employee.id,
                                              "Absent"
                                            )
                                          }
                                        >
                                          Absent
                                        </Button>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setExpandedEmployee(
                                      employee.id === expandedEmployee
                                        ? null
                                        : employee.id
                                    )
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
                                        <h3 className="font-medium">
                                          {currentMonth}
                                        </h3>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                              toast({
                                                title: "Previous Month",
                                                description:
                                                  "Navigating to previous month",
                                              });
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
                                                description:
                                                  "Navigating to next month",
                                              });
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
                                        <Select
                                          value={attendancePeriod}
                                          onValueChange={(value) =>
                                            setAttendancePeriod(value)
                                          }
                                        >
                                          <SelectTrigger className="h-8 w-32">
                                            <SelectValue placeholder="Show" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1week">
                                              1 Week
                                            </SelectItem>
                                            <SelectItem value="2weeks">
                                              2 Weeks
                                            </SelectItem>
                                            <SelectItem value="month">
                                              Full Month
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-7 gap-4">
                                      {getFilteredAttendance(
                                        employee.attendance,
                                        attendancePeriod
                                      ).map((day: any, index: any) => (
                                        <div
                                          key={index}
                                          className="text-center"
                                        >
                                          <div className="text-sm font-medium mb-1">
                                            {day.day < 10
                                              ? `0${day.day}`
                                              : day.day}
                                          </div>
                                          <div className="text-xs text-muted-foreground mb-2">
                                            {day.weekday}
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <Badge
                                              className={
                                                day.status === "present"
                                                  ? "bg-green-50 text-green-700 border-0"
                                                  : day.status === "late"
                                                  ? "bg-yellow-50 text-yellow-700 border-0"
                                                  : "bg-red-50 text-red-700 border-0"
                                              }
                                            >
                                              {day.status}
                                            </Badge>
                                            {day.status !== "late" && (
                                              <Badge
                                                variant="outline"
                                                className="bg-transparent border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => {
                                                  updateAttendance({
                                                    employeeId: employee.id,
                                                    status: "Late",
                                                    date: day.date,
                                                  })
                                                    .unwrap()
                                                    .then(() => {
                                                      toast({
                                                        title:
                                                          "Attendance Updated",
                                                        description: `Marked as Late for ${day.day} ${currentMonth}`,
                                                      });
                                                      refetch();
                                                    })
                                                    .catch((error) => {
                                                      toast({
                                                        title: "Error",
                                                        description:
                                                          "Failed to update attendance status.",
                                                        variant: "destructive",
                                                      });
                                                    });
                                                }}
                                              >
                                                late
                                              </Badge>
                                            )}
                                            {day.status !== "absent" && (
                                              <Badge
                                                variant="outline"
                                                className="bg-transparent border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => {
                                                  updateAttendance({
                                                    employeeId: employee.id,
                                                    status: "Absent",
                                                    date: day.date,
                                                  })
                                                    .unwrap()
                                                    .then(() => {
                                                      toast({
                                                        title:
                                                          "Attendance Updated",
                                                        description: `Marked as Absent for ${day.day} ${currentMonth}`,
                                                      });
                                                      refetch();
                                                    })
                                                    .catch((error) => {
                                                      toast({
                                                        title: "Error",
                                                        description:
                                                          "Failed to update attendance status.",
                                                        variant: "destructive",
                                                      });
                                                    });
                                                }}
                                              >
                                                Absent
                                              </Badge>
                                            )}
                                            {day.status !== "present" && (
                                              <Badge
                                                variant="outline"
                                                className="bg-transparent border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => {
                                                  updateAttendance({
                                                    employeeId: employee.id,
                                                    status: "Present",
                                                    date: day.date,
                                                  })
                                                    .unwrap()
                                                    .then(() => {
                                                      toast({
                                                        title:
                                                          "Attendance Updated",
                                                        description: `Marked as Present for ${day.day} ${currentMonth}`,
                                                      });
                                                      refetch();
                                                    })
                                                    .catch((error) => {
                                                      toast({
                                                        title: "Error",
                                                        description:
                                                          "Failed to update attendance status.",
                                                        variant: "destructive",
                                                      });
                                                    });
                                                }}
                                              >
                                                Present
                                              </Badge>
                                            )}
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
                        <div className="text-sm text-gray-500 mb-1">
                          Total Employees
                        </div>
                        <div className="text-xl font-bold">
                          {employees.length}
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Days Worked
                        </div>
                        <div className="text-xl font-bold">
                          {totalDaysWorked}
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Budget Baseline
                        </div>
                        <div className="text-xl font-bold">
                          {currencyShort}
                          {(totalBaseline * currencyValue).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Actual Payroll
                        </div>
                        <div className="text-xl font-bold">
                          {currencyShort}
                          {(
                            totalActualPayroll * currencyValue
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Daily Actual Payroll
                        </div>
                        <div className="text-xl font-bold">
                          {currencyShort}
                          {(
                            totalDailyActuallPayroll * currencyValue
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payroll Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border rounded-md">
                      <thead>
                        <tr className="border-t border-b text-[10px] text-gray-500">
                          <th className="w-10 px-4 py-3 text-left border-r">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Employee Name
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Daily Rate
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Days Worked
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Budget Baseline
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Total Actual
                          </th>
                          <th className="px-4 py-3 text-left border-r">
                            Planned vs Actual
                          </th>
                          <th className="w-10 px-4 py-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {filteredEmployees.map((employee: any) => (
                          <tr
                            key={employee.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 border-r">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </td>
                            <td className="px-4 py-3 border-r">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={employee.avatar || "/placeholder.svg"}
                                    alt={employee.name}
                                  />
                                  <AvatarFallback>
                                    {employee.username.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {employee.username}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-r">
                              {currencyShort}
                              {(
                                employee.daily_rate * currencyValue
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 border-r">
                              {employee.days_worked}
                            </td>
                            <td className="px-4 py-3 border-r">
                              {currencyShort}
                              {(
                                employee.budget_baseline * currencyValue
                              )?.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 border-r">
                              {currencyShort}
                              {(
                                employee.totalActualPayroll * currencyValue
                              )?.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 border-r">
                              {employee.plannedVsActual?.includes(
                                "Over Budget"
                              ) ? (
                                <Badge className="bg-red-50 text-red-700 border-0">
                                  {employee.plannedVsActual}
                                </Badge>
                              ) : employee.plannedVsActual?.includes(
                                  "Planned"
                                ) ? (
                                <span className="text-gray-700">
                                  {employee.plannedVsActual}
                                </span>
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
                                  });
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
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left border-r">
                          Employee Name
                        </th>
                        <th className="px-4 py-3 text-left border-r">
                          Sick Days
                        </th>
                        <th className="px-4 py-3 text-left border-r">
                          Vacation Days
                        </th>
                        <th className="px-4 py-3 text-left border-r">
                          Unpaid Leave
                        </th>
                        <th className="w-10 px-4 py-3 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {filteredEmployees.map((employee: any) => (
                        <tr
                          key={employee.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 border-r">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3 border-r">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  // src={employee.avatar || "/placeholder.svg"}
                                  alt={employee.username}
                                />
                                <AvatarFallback>
                                  {employee.username.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {employee.username}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r">
                            {employee.sickDays}
                          </td>
                          <td className="px-4 py-3 border-r">
                            {employee.vacationDays}
                          </td>
                          <td className="px-4 py-3 border-r">
                            {employee.unpaidDays}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                toast({
                                  title: "Leave Management",
                                  description: `Managing leave for ${employee.username}`,
                                });
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
  );
}
