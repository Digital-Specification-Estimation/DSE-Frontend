"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  ChevronDown,
  FileText,
  FileCheck,
  Edit,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useGetEmployeesQuery } from "@/lib/redux/employeeSlice";
import { useGetTradesQuery } from "@/lib/redux/tradePositionSlice";
import {
  useAddReasonMutation,
  useEditUserStatusMutation,
} from "@/lib/redux/attendanceSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { useGetProjectsQuery } from "@/lib/redux/projectSlice";

// API endpoints
const API_ENDPOINTS = {
  EMPLOYEES: "/api/employees",
  ATTENDANCE: "/api/attendance",
  PAYROLL: "/api/payroll",
  LEAVE: "/api/leave",
  GENERATE_PAYSLIPS: "/api/payroll/generate-payslips",
  PAYROLL_REPORT: "/api/payroll/report",
};

export default function AttendancePayroll() {
  const [permissions, setPermissions] = useState({
    approve_attendance: false,
    approve_leaves: true,
    full_access: false,
    generate_reports: null,
    id: "",
    manage_employees: null,
    manage_payroll: false,
    mark_attendance: true,
    role: "",
    view_payslip: false,
    view_reports: false,
  });
  const [newReason, setNewReason] = useState({
    employee_id: "",
    reason: "",
    date: "",
  });
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
  const [addReason, { isLoading: isAdding }] = useAddReasonMutation();
  useEffect(() => {
    if (sessionData?.user?.settings && sessionData.user.current_role) {
      const userPermission = sessionData.user.settings.find(
        (setting: any) =>
          setting.role.toLowerCase() ===
          sessionData.user.current_role.toLowerCase()
      );

      if (userPermission) {
        setPermissions(userPermission);
      }
    }
  }, [sessionData.user.settings, sessionData.user.current_role]);
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
  const [trades, setTrades] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [dailyRates, setDailyRates] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("attendance");
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMonth, setCurrentMonth] = useState("May 2025");
  const [showFilters, setShowFilters] = useState(true);
  const [showAddReason, setShowAddReason] = useState(false);
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
    trade: "",
    project: "",
    dailyRate: "",
    startDate: "",
    endDate: "",
  });
  const [attendancePeriod, setAttendancePeriod] = useState("1week");

  // Use RTK Query to fetch trades
  const { data: tradesData = [], isLoading: isLoadingTrades } =
    useGetTradesQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });
  const handleAddReason = (employee_id: string) => {
    setShowAddReason(true);
    setNewReason({ ...newReason, employee_id });
  };
  // Create a new RTK Query hook for projects
  const { data: projectsFetched = [], isLoading: isLoadingProjects } =
    useGetProjectsQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  // Add this useEffect to populate trades, projects, and daily rates
  useEffect(() => {
    if (tradesData && tradesData.length > 0) {
      const tradeNames = tradesData.map((trade: any) => trade.trade_name);
      setTrades([...new Set(tradeNames)]);
    }

    if (projectsFetched && projectsFetched.length > 0) {
      const projectNames = projectsFetched.map(
        (project: any) => project.project_name
      );
      setProjects([...new Set(projectNames)]);
    }
  }, [tradesData, projectsFetched]);

  // Add a separate useEffect for dailyRates that only runs when employees or currencyShort changes
  useEffect(() => {
    if (employees && employees.length > 0 && currencyShort) {
      try {
        const uniqueRates = [
          ...new Set(
            employees.map((employee: any) => {
              const rate = employee?.daily_rate || 0;
              return `${currencyShort || ""}${Math.round(rate)}`;
            })
          ),
        ].sort((a, b) => {
          const numA = Number.parseFloat(a.replace(/[^0-9.]/g, "")) || 0;
          const numB = Number.parseFloat(b.replace(/[^0-9.]/g, "")) || 0;
          return numA - numB;
        });

        // Only update if the rates have actually changed - deep comparison
        if (JSON.stringify(uniqueRates) !== JSON.stringify(dailyRates)) {
          setDailyRates(uniqueRates);
        }
      } catch (error) {
        console.error("Error processing daily rates:", error);
        // Fallback to empty array if there's an error
        if (dailyRates.length === 0) {
          setDailyRates([]);
        }
      }
    }
  }, [employees, currencyShort, dailyRates]);

  // Add this useEffect to calculate totals
  const totals = useMemo(() => {
    let baseline = 0;
    let actualPayroll = 0;
    let daysWorked = 0;
    let dailyActualPayroll = 0;

    employees.forEach((employee: any) => {
      baseline += Number(employee.budget_baseline || 0);
      daysWorked += Number(employee.days_worked || 0);
      actualPayroll += Number(employee.totalActualPayroll || 0);
      dailyActualPayroll += Number(employee.daily_rate || 0);
    });

    return {
      totalBaseline: baseline,
      totalActualPayroll: actualPayroll,
      totalDaysWorked: daysWorked,
      totalDailyActuallPayroll: dailyActualPayroll,
    };
  }, [employees]);

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
      if (
        permissions.approve_attendance ||
        permissions.full_access ||
        permissions.mark_attendance
      ) {
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
      } else {
        toast({
          title: "Error",
          description: "you do not have previelege to make attendance",
          variant: "destructive",
        });
      }
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
  // Function to handle payslip generation for all employees
  const handleGeneratePayslips = async () => {
    if (!employees || employees.length === 0) {
      toast({
        title: "No Employees",
        description: "There are no employees to generate payslips for.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingPayslips(true);

      toast({
        title: "Generating Payslips",
        description:
          "Please wait while we generate payslips for all employees...",
      });

      // Small delay to allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate payslip for each employee
      for (const employee of employees) {
        try {
          const doc = generateSinglePayslip(employee);
          doc.save(
            `payslip-${employee.username.replace(
              /\s+/g,
              "-"
            )}-${Date.now()}.pdf`
          );

          // Small delay between each PDF
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(
            `Error generating payslip for ${employee.username}:`,
            error
          );
          toast({
            title: `Error with ${employee.username}`,
            description: "Skipping to next employee...",
            variant: "destructive",
          });
        }
      }

      setIsGeneratingPayslips(false);

      toast({
        title: "Payslips Generated",
        description: `Successfully processed ${employees.length} employees.`,
      });
    } catch (error) {
      console.error("Error in payslip generation process:", error);

      toast({
        title: "Process Failed",
        description: "The payslip generation process encountered an error.",
        variant: "destructive",
      });

      setIsGeneratingPayslips(false);
    }
  };
  const handleAddReasonSubmit = async () => {
    try {
      console.log("newReasonObject", newReason);
      await addReason(newReason).unwrap();

      setNewReason({ employee_id: "", reason: "", date: "" });
      refetch();
      setShowAddReason(false);

      toast({
        title: "Reason adding",
        description: `Successfully added the reason to the user`,
      });
    } catch (error: any) {
      toast({
        title: "Process Failed",
        description: error.data.message,
        variant: "destructive",
      });
    }
  };

  const generateSinglePayslip = (employee: any) => {
    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
      title: `Payslip - ${employee.username}`,
      subject: "Employee Payslip",
      author: "Construction Company",
      creator: "Payroll System",
    });

    // Add company header
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text("CONSTRUCTION COMPANY", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("EMPLOYEE PAYSLIP", 105, 30, { align: "center" });

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, {
      align: "center",
    });

    // Calculate payroll values
    const daysWorked = employee.attendance?.length || 0;
    const dailyRate = Number(employee.daily_rate) || 100;
    const totalEarnings = dailyRate * daysWorked;
    const netPay = totalEarnings;

    // Format currency helper
    const formatCurrency = (value: number) =>
      `${currencyValue}${value.toFixed(2).toLocaleString()}`;

    // Employee information
    doc.setFontSize(12);
    doc.text("Employee Information", 20, 55);
    doc.setFontSize(10);
    doc.text(`Name: ${employee.username}`, 20, 65);
    doc.text(
      `Position: ${employee.trade_position?.trade_name || "N/A"}`,
      20,
      72
    );
    doc.text(`Employee ID: ${employee.id}`, 20, 79);

    // Pay period
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    doc.setFontSize(12);
    doc.text("Pay Period", 120, 55);
    doc.setFontSize(10);
    doc.text(`From: ${firstDay.toLocaleDateString()}`, 120, 65);
    doc.text(`To: ${lastDay.toLocaleDateString()}`, 120, 72);

    // Earnings table
    doc.setFontSize(12);
    doc.text("Earnings", 20, 95);
    autoTable(doc, {
      startY: 100,
      head: [["Description", "Rate", "Units", "Amount"]],
      body: [
        [
          "Regular Pay",
          formatCurrency(dailyRate * currencyValue),
          `${daysWorked} days`,
          formatCurrency(totalEarnings * currencyValue),
        ],
        [
          "Overtime",
          `${currencyShort}0.00`,
          `${currencyShort}0 hours`,
          `${currencyShort}0.00`,
        ],
        // ["Bonus", "", "", "$0.00"],
        [
          "",
          "",
          "Total Earnings",
          formatCurrency(totalEarnings * currencyValue),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66] },
    });

    // Deductions table
    // const finalY = (doc as any).lastAutoTable.finalY + 10;
    // doc.setFontSize(12);
    // doc.text("Deductions", 20, finalY);
    // autoTable(doc, {
    //   startY: finalY + 5,
    //   head: [["Description", "Amount"]],
    //   body: [
    //     ["Tax", formatCurrency(taxDeduction)],
    //     ["Insurance", formatCurrency(insuranceDeduction)],
    //     ["", formatCurrency(totalDeductions)],
    //   ],
    //   theme: "grid",
    //   headStyles: { fillColor: [66, 66, 66] },
    // });
    // Net pay section
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;
    autoTable(doc, {
      startY: finalY2,
      head: [["Net Pay", formatCurrency(netPay)]],
      body: [],
      theme: "grid",
      headStyles: {
        fillColor: [33, 33, 33],
        fontSize: 14,
        halign: "center",
      },
    });

    // Footer
    doc.setFontSize(8);
    doc.text(
      "This is a computer-generated document and does not require a signature.",
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );

    return doc;
  };
  // console.log("permissions", permissions);
  // Generate payroll report using fetch
  const handleGenerateReport = async () => {
    if (!employees || employees.length === 0) {
      toast({
        title: "No Data",
        description: "There is no employee data to generate a report.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingReport(true);

      toast({
        title: "Generating Report",
        description: "Please wait while we generate your payroll report...",
      });

      // Create a new PDF document
      const doc = new jsPDF();

      // Set document properties
      doc.setProperties({
        title: "Payroll Report",
        subject: "Monthly Payroll Summary",
        author: "Construction Company",
        creator: "Payroll System",
      });

      // Add company header
      doc.setFontSize(20);
      doc.setTextColor(33, 33, 33);
      doc.text("CONSTRUCTION COMPANY", 105, 20, { align: "center" });
      doc.setFontSize(14);
      doc.text("PAYROLL REPORT", 105, 30, { align: "center" });

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, {
        align: "center",
      });

      // Calculate totals
      let totalBudget = 0;
      let totalActual = 0;
      let totalDays = 0;
      let totalEarnings = 0;

      employees.forEach(
        (employee: {
          attendance: string | any[];
          daily_rate: any;
          budget_baseline: any;
        }) => {
          const daysWorked = employee.attendance?.length || 0;
          const dailyRate = Number(employee.daily_rate) || 0;
          totalBudget += Number(employee.budget_baseline) || 0;
          totalActual += daysWorked * dailyRate;
          totalDays += daysWorked;
          totalEarnings += daysWorked * dailyRate;
        }
      );

      // Add summary section
      doc.setFontSize(12);
      doc.text("Payroll Summary", 20, 55);

      autoTable(doc, {
        startY: 60,
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", employees.length],
          ["Total Days Worked", totalDays],
          [
            "Total Budget",
            `${currencyShort}${(totalBudget * currencyValue)
              .toFixed(2)
              .toLocaleString()}`,
          ],
          [
            "Total Actual Payroll",
            `${currencyShort}${totalActual.toFixed(2).toLocaleString()}`,
          ],
          [
            "Variance",
            `${currencyShort}${((totalBudget - totalActual) * currencyValue)
              .toFixed(2)
              .toLocaleString()}`,
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66] },
      });

      // Add employee details
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.text("Employee Details", 20, finalY);

      const employeeData = employees.map(
        (employee: {
          attendance: string | any[];
          daily_rate: any;
          username: any;
          trade_position: { trade_name: any };
        }) => {
          const daysWorked = employee.attendance?.length || 0;
          const dailyRate = Number(employee.daily_rate) || 0;
          const earnings = daysWorked * dailyRate;

          return [
            employee.username,
            employee.trade_position?.trade_name || "N/A",
            `${currencyShort}${(dailyRate * currencyValue)
              .toFixed(2)
              .toLocaleString()}`,
            daysWorked,
            `${currencyShort}${(earnings * currencyValue)
              .toFixed(2)
              .toLocaleString()}`,
          ];
        }
      );

      autoTable(doc, {
        startY: finalY + 5,
        head: [["Name", "Position", "Daily Rate", "Days Worked", "Earnings"]],
        body: employeeData,
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
        },
      });

      // Save the PDF with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      doc.save(`payroll-report_${timestamp}.pdf`);

      setIsGeneratingReport(false);
      toast({
        title: "Report Generated",
        description:
          "Payroll report has been generated and downloaded successfully.",
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

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee: any) => {
      if (!employee) return false;
      if (
        searchTerm &&
        employee.username &&
        !employee.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      if (
        filters.trade &&
        filters.trade !== "all" &&
        employee.trade_position?.trade_name !== filters.trade
      )
        return false;
      if (
        filters.project &&
        filters.project !== "all" &&
        employee.trade_position?.project?.project_name !== filters.project
      )
        return false;
      if (filters.dailyRate && filters.dailyRate !== "all") {
        const employeeRate = `${currencyShort}${Math.round(
          employee.daily_rate || 0
        )}`;
        if (employeeRate !== filters.dailyRate) return false;
      }
      return true;
    });
  }, [employees, searchTerm, filters, currencyShort]);

  // Add this after the filteredEmployees definition
  const prevFiltersRef = React.useRef(filters);
  const prevFilteredCountRef = React.useRef(filteredEmployees.length);

  // Remove this useEffect entirely as it's causing a loop
  // useEffect(() => {
  //   // Only log if filters or count actually changed
  //   if (
  //     JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters) ||
  //     prevFilteredCountRef.current !== filteredEmployees.length
  //   ) {
  //     console.log("Current filters:", filters);
  //     console.log("Filtered employees count:", filteredEmployees.length);

  //     // Update refs
  //     prevFiltersRef.current = filters;
  //     prevFilteredCountRef.current = filteredEmployees.length;
  //   }
  // }, [filters, filteredEmployees.length]);

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

  const handleResetFilters = () => {
    setFilters({
      trade: "",
      project: "",
      dailyRate: "",
      startDate: "",
      endDate: "",
    });
    setSearchTerm("");
  };

  // 4. Add defensive checks to the getFilteredAttendance function
  const getFilteredAttendance = (attendance, period) => {
    if (!attendance || !Array.isArray(attendance) || attendance.length === 0)
      return [];

    try {
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
    } catch (error) {
      console.error("Error filtering attendance:", error);
      return [];
    }
  };

  // 3. Add this useEffect cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up any pending state updates when component unmounts
      setOpenAttendanceDropdown(null);
      setExpandedEmployee(null);
    };
  }, []);

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
                  <SelectValue placeholder="Select Trade" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTrades ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading trades...</span>
                    </div>
                  ) : (
                    <>
                      <SelectItem value="all">All Trades</SelectItem>
                      {trades.map((trade) => (
                        <SelectItem key={trade} value={trade}>
                          {trade}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>

              <Select
                value={filters.project}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, project: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProjects ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading projects...</span>
                    </div>
                  ) : (
                    <>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </>
                  )}
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
                  <SelectItem value="all">All Rates</SelectItem>
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
              <Button
                variant="outline"
                className="gap-2 flex items-center border-red-500 text-red-500 h-10 rounded-full"
                onClick={handleResetFilters}
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
                  <path d="M3 3h18v18H3z"></path>
                  <path d="M15 9l-6 6m0-6l6 6"></path>
                </svg>
                Reset Filters
              </Button>
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
                          {(
                            totals.totalBaseline * currencyValue
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4 flex-1">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Actual Payroll
                        </div>
                        <div className="text-xl font-bold">
                          {currencyShort}
                          {(
                            totals.totalActualPayroll * currencyValue
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
                                      {employee?.attendance &&
                                      Array.isArray(employee.attendance)
                                        ? employee.attendance
                                            .filter(
                                              (attendance: any) =>
                                                attendance &&
                                                formatDate(attendance.date) ===
                                                  getCurrentDate()
                                            )
                                            .map((attendance: any) => (
                                              <Badge
                                                key={
                                                  attendance.id ||
                                                  Math.random().toString()
                                                }
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
                                            ))
                                        : null}
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
                                                  if (
                                                    permissions.approve_attendance ||
                                                    permissions.full_access ||
                                                    permissions.mark_attendance
                                                  ) {
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
                                                          variant:
                                                            "destructive",
                                                        });
                                                      });
                                                  } else {
                                                    toast({
                                                      title: "Error",
                                                      description:
                                                        "you do not have previelege to make attendance",
                                                      variant: "destructive",
                                                    });
                                                  }
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
                                                  if (
                                                    permissions.approve_attendance ||
                                                    permissions.full_access ||
                                                    permissions.mark_attendance
                                                  ) {
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
                                                          variant:
                                                            "destructive",
                                                        });
                                                      });
                                                  } else {
                                                    toast({
                                                      title: "Error",
                                                      description:
                                                        "you do not have previelege to make attendance",
                                                      variant: "destructive",
                                                    });
                                                  }
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
                                                  if (
                                                    permissions.approve_attendance ||
                                                    permissions.full_access ||
                                                    permissions.mark_attendance
                                                  ) {
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
                                                          variant:
                                                            "destructive",
                                                        });
                                                      });
                                                  } else {
                                                    toast({
                                                      title: "Error",
                                                      description:
                                                        "you do not have previelege to make attendance",
                                                      variant: "destructive",
                                                    });
                                                  }
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
                          {totals.totalDaysWorked}
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Budget Baseline
                        </div>
                        <div className="text-xl font-bold">
                          {currencyShort}
                          {(
                            totals.totalBaseline * currencyValue
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Actual Payroll
                        </div>
                        <div className="text-xl font-bold">
                          {currencyShort}
                          {(
                            totals.totalActualPayroll * currencyValue
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
                            totals.totalDailyActuallPayroll * currencyValue
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
                          {/* <th className="w-10 px-4 py-3 text-center"></th> */}
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {filteredEmployees.map((employee: any) => (
                          <tr
                            key={employee.id}
                            className="border-b hover:bg-gray-50"
                          >
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
                            {/* <td className="px-4 py-3 text-center">
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
                            </td> */}
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
                            <span
                              className="w-[100px] flex flex-row items-center align-middle justify-center hover:cursor-pointer"
                              onClick={() => {
                                handleAddReason(employee.id);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Add Reason
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          <Dialog open={showAddReason} onOpenChange={setShowAddReason}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
              </DialogHeader>
              {/* <form
                                  onSubmit={handleAddReasonSubmit}
                                  className="space-y-4 pt-4"
                                > */}
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label
                    htmlFor="edit-username"
                    className="text-sm font-medium"
                  >
                    reason
                  </label>
                  <div className="relative w-[300px]">
                    <Select
                      value={newReason.reason}
                      onValueChange={(value) =>
                        setNewReason({
                          ...newReason,
                          reason: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sick">sick</SelectItem>

                        <SelectItem value="vacation">vacation</SelectItem>
                        <SelectItem value="unpaid leave">
                          unpaid leave
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-contract-finish-date"
                    className="text-sm font-medium"
                  >
                    Date
                  </label>
                  <div className="relative">
                    <input
                      id="edit-date"
                      name="date"
                      type="date"
                      value={newReason.date}
                      onChange={(e) =>
                        setNewReason({
                          ...newReason,
                          date: e.target.value,
                        })
                      }
                      className="w-full py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddReason(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    // type="submit"
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={isAdding}
                    onClick={handleAddReasonSubmit}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Reason"
                    )}
                  </Button>
                </div>
                {/* </form> */}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
