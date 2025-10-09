"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, RefreshCw, FileText, FileCheck, Edit } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  useGetDeductionsQuery,
  useCreateDeductionMutation,
} from "@/lib/redux/deductionSlice";
import { convertCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

// API endpoints
const API_ENDPOINTS = {
  EMPLOYEES: "/api/employees",
  ATTENDANCE: "/api/attendance",
  PAYROLL: "/api/payroll",
  LEAVE: "/api/leave",
  GENERATE_PAYSLIPS: "/api/payroll/generate-payslips",
  PAYROLL_REPORT: "/api/payroll/report",
};
function ConvertedAmount({
  amount,
  currency,
  showCurrency = true,
  sessionData,
}: {
  amount: number;
  currency: string;
  showCurrency?: boolean;
  sessionData: any;
}) {
  const [convertedAmount, setConvertedAmount] = useState<string>("...");

  useEffect(() => {
    const convert = async () => {
      try {
        const result = await convertCurrency(
          amount,
          currency,
          sessionData.user.companies[0].base_currency
        );
        setConvertedAmount(result);
      } catch (error) {
        console.error("Error converting currency:", error);
        setConvertedAmount("Error");
      }
    };

    if (amount !== undefined) {
      convert();
    }
  }, [amount, currency]);
  return (
    <>
      {showCurrency
        ? `${currency} ${Number(convertedAmount).toLocaleString()}`
        : Number(convertedAmount).toLocaleString()}
    </>
  );
}
export default function AttendancePayroll() {
  const [permissions, setPermissions] = useState({
    approve_attendance: false,
    approve_leaves: false,
    full_access: false,
    generate_reports: false,
    id: "",
    manage_employees: false,
    manage_payroll: false,
    mark_attendance: false,
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

  // Fetch manual deductions for the company
  const { data: deductions = [] } = useGetDeductionsQuery();
  // Deduction mutation
  const [createDeduction, { isLoading: isCreatingDeduction }] =
    useCreateDeductionMutation();

  const [addReason, { isLoading: isAdding }] = useAddReasonMutation();
  useEffect(() => {
    if (sessionData?.user?.settings && sessionData.user.current_role) {
      const userPermission = sessionData.user.settings.find(
        (setting: any) =>
          setting.company_id === sessionData.user.company_id &&
          setting.role === sessionData.user.current_role
      );

      if (userPermission) {
        setPermissions(userPermission);
      }
    }
  }, [sessionData.user.settings, sessionData.user.current_role]);

  const splitCurrencyValue = (str: string | undefined | null) => {
    if (!str) return null;
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

  // Updated filters state to include remainingDays
  const [filters, setFilters] = useState({
    trade: "",
    project: "",
    dailyRate: "",
    startDate: "",
    endDate: "",
    remainingDays: "",
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
      setTrades([...new Set(tradeNames)] as string[]);
    }

    if (projectsFetched && projectsFetched.length > 0) {
      const projectNames = projectsFetched.map(
        (project: any) => project.project_name
      );
      setProjects([...new Set(projectNames)] as string[]);
    }
  }, [tradesData, projectsFetched]);

  // Calculate attendance data only (no payroll calculations)
  const { enhancedEmployees } = useMemo(() => {
    const enhanced = [];

    for (const employee of employees) {
      // Calculate attendance data
      const attendance = employee.attendance || [];
      const presentDays = attendance.filter(
        (a: any) => a.status?.toLowerCase() === "present"
      ).length;
      const lateDays = attendance.filter(
        (a: any) => a.status?.toLowerCase() === "late"
      ).length;

      // Separate absent days by whether they have a reason
      const absentWithoutReason = attendance.filter(
        (a: any) =>
          a.status?.toLowerCase() === "absent" &&
          (!a.reason || a.reason.trim() === "")
      ).length;

      const absentWithSickReason = attendance.filter(
        (a: any) =>
          a.status?.toLowerCase() === "absent" &&
          a.reason?.toLowerCase() === "sick"
      ).length;

      const absentWithVacationReason = attendance.filter(
        (a: any) =>
          a.status?.toLowerCase() === "absent" &&
          a.reason?.toLowerCase() === "vacation"
      );

      const workingDays = presentDays + lateDays;
      const paidLeaveDays = absentWithSickReason + absentWithVacationReason;
      const employeeWorkingDays = workingDays + paidLeaveDays;
      const totalAbsentDays =
        absentWithoutReason + absentWithSickReason + absentWithVacationReason;

      enhanced.push({
        ...employee,
        days_worked: employeeWorkingDays,
        sickDays: absentWithSickReason,
        vacationDays: absentWithVacationReason,
        unpaidDays: absentWithoutReason,
        presentDays: presentDays,
        lateDays: lateDays,
        totalAbsentDays: totalAbsentDays,
      });
    }

    return {
      enhancedEmployees: enhanced,
    };
  }, [employees, deductions]);

  // Update employee attendance using fetch
  const updateEmployeeAttendance = async (
    employeeId: number,
    status: "Present" | "Absent" | "Late"
  ) => {
    try {
      if (
        permissions.full_access ||
        permissions.approve_attendance ||
        permissions.mark_attendance
      ) {
        await updateAttendance({
          employeeId,
          status,
          date: getCurrentDate(),
          time: "today",
        }).unwrap();
        setOpenAttendanceDropdown(null);
        await refetch();

        toast({
          title: "Attendance Updated",
          description: `Employee attendance has been marked as ${status}.`,
        });
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have permission to update attendance.",
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

  const handleAddReasonSubmit = async () => {
    try {
      await addReason(newReason).unwrap();

      setNewReason({ employee_id: "", reason: "", date: "" });
      refetch();
      setShowAddReason(false);

      toast({
        title: "Reason Added",
        title: "Reason Added",
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

  const handleGenerateReport = async () => {
    if (
      !permissions.full_access &&
      !permissions.generate_reports &&
      !permissions.view_reports
    ) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to generate reports.",
        variant: "destructive",
      });
      return;
    }

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
        title: "Generating Comprehensive Report",
        description:
          "Please wait while we generate your detailed payroll report with real-time data...",
      });

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Helper functions
      const addText = (text: string, x: number, y: number, options?: any) => {
        doc.text(text, x, y, options);
      };

      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > doc.internal.pageSize.height - 20) {
          doc.addPage();
          yPosition = 30;
          return true;
        }
        return false;
      };

      // Document properties
      doc.setProperties({
        title: "Comprehensive Payroll Report",
        subject: "Detailed Company Payroll Analysis",
        author:
          (sessionData?.user as any)?.companies?.[0]?.name ||
          "Construction Company",
        creator: "DSE Payroll System",
      });

      // Header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(33, 33, 33);
      addText(
        (sessionData?.user as any)?.companies?.[0]?.name ||
          "CONSTRUCTION COMPANY",
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      yPosition += 15;
      doc.setFontSize(18);
      addText("COMPREHENSIVE PAYROLL REPORT", pageWidth / 2, yPosition, {
        align: "center",
      });

      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      addText(
        `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      yPosition += 5;
      addText(
        `Report Period: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      yPosition += 20;

      // Calculate comprehensive statistics
      let totalEmployees = employees.length;
      let totalBudget = 0;
      let totalActual = 0;
      let totalDays = 0;
      let totalPresentDays = 0;
      let totalLateDays = 0;
      let totalAbsentDays = 0;
      let totalEarnings = 0;
      let totalDeductions = 0;

      // Group by trades and projects
      const tradeStats = new Map();
      const projectStats = new Map();

      employees.forEach((employee: any) => {
        const daysWorked =
          employee.attendance?.filter(
            (a: any) => a.status === "present" || a.status === "late"
          ).length || 0;
        const presentDays =
          employee.attendance?.filter((a: any) => a.status === "present")
            .length || 0;
        const lateDays =
          employee.attendance?.filter((a: any) => a.status === "late").length ||
          0;
        const absentDays =
          employee.attendance?.filter((a: any) => a.status === "absent")
            .length || 0;

        const dailyRate = Number(employee.daily_rate) || 0;
        const monthlyRate = Number(employee.monthly_rate) || 0;
        const budgetBaseline = Number(employee.budget_baseline) || 0;

        // Calculate earnings based on salary calculation preference
        const salaryCalculation =
          (sessionData?.user as any)?.salary_calculation || "daily rate";

        totalBudget += budgetBaseline;
        totalDays += employee.attendance?.length || 0;
        totalPresentDays += presentDays;
        totalLateDays += lateDays;
        totalAbsentDays += absentDays;

        // Trade statistics
        const tradeName = employee.trade_position?.trade_name || "Unassigned";
        if (!tradeStats.has(tradeName)) {
          tradeStats.set(tradeName, {
            employees: 0,
            totalEarnings: 0,
            totalDays: 0,
            avgDailyRate: 0,
            totalRates: 0,
          });
        }
        const tradeData = tradeStats.get(tradeName);
        tradeData.employees += 1;
        tradeData.totalDays += daysWorked;
        tradeData.totalRates += dailyRate;
        tradeData.avgDailyRate = tradeData.totalRates / tradeData.employees;
      });

      // Executive Summary
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("EXECUTIVE SUMMARY", margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const summaryData = [
        ["Total Employees", totalEmployees.toString()],
        ["Total Working Days", totalPresentDays.toString()],
        ["Total Late Days", totalLateDays.toString()],
        ["Total Absent Days", totalAbsentDays.toString()],
        [
          "Attendance Rate",
          `${
            totalDays > 0
              ? ((totalPresentDays / totalDays) * 100).toFixed(1)
              : 0
          }%`,
        ],
        [
          "Total Budget Allocated",
          `${currencyShort} ${(totalBudget * currencyValue).toLocaleString()}`,
        ],
        [
          "Total Actual Payroll",
          `${currencyShort} ${(totalActual * currencyValue).toLocaleString()}`,
        ],
        [
          "Total Deductions",
          `${currencyShort} ${(
            totalDeductions * currencyValue
          ).toLocaleString()}`,
        ],
        [
          "Net Payroll",
          `${currencyShort} ${(
            (totalActual - totalDeductions) *
            currencyValue
          ).toLocaleString()}`,
        ],
        [
          "Budget Variance",
          `${currencyShort} ${(
            (totalBudget - totalActual) *
            currencyValue
          ).toLocaleString()}`,
        ],
        [
          "Cost per Working Day",
          `${currencyShort} ${
            totalPresentDays > 0
              ? (
                  (totalActual / totalPresentDays) *
                  currencyValue
                ).toLocaleString()
              : 0
          }`,
        ],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [52, 152, 219], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
      checkPageBreak(60);

      // Trade Analysis
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("TRADE ANALYSIS", margin, yPosition);
      yPosition += 15;

      const tradeData = Array.from(tradeStats.entries()).map(
        ([trade, stats]: [string, any]) => [
          trade,
          stats.employees.toString(),
          `${currencyShort} ${(
            stats.avgDailyRate * currencyValue
          ).toLocaleString()}`,
          stats.totalDays.toString(),
          `${currencyShort} ${(
            stats.totalEarnings * currencyValue
          ).toLocaleString()}`,
          `${currencyShort} ${
            stats.totalDays > 0
              ? (
                  (stats.totalEarnings / stats.totalDays) *
                  currencyValue
                ).toLocaleString()
              : 0
          }`,
        ]
      );

      autoTable(doc, {
        startY: yPosition,
        head: [
          [
            "Trade",
            "Employees",
            "Avg Daily Rate",
            "Total Days",
            "Total Earnings",
            "Cost/Day",
          ],
        ],
        body: tradeData,
        theme: "grid",
        headStyles: { fillColor: [46, 125, 50], textColor: 255 },
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
      checkPageBreak(60);

      // Detailed Employee Report
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("DETAILED EMPLOYEE REPORT", margin, yPosition);
      yPosition += 15;

      const employeeData = employees.map((employee: any) => {
        const presentDays =
          employee.attendance?.filter((a: any) => a.status === "present")
            .length || 0;
        const lateDays =
          employee.attendance?.filter((a: any) => a.status === "late").length ||
          0;
        const absentDays =
          employee.attendance?.filter((a: any) => a.status === "absent")
            .length || 0;
        const daysWorked = presentDays + lateDays;

        const dailyRate = Number(employee.daily_rate) || 0;
        const salaryCalculation =
          (sessionData?.user as any)?.salary_calculation || "daily rate";

        let grossEarnings = 0;
        if (salaryCalculation === "monthly rate") {
          grossEarnings = Number(employee.monthly_rate) || 0;
        } else {
          grossEarnings = daysWorked * dailyRate;
        }

        const lateDeduction = lateDays * (dailyRate * 0.1); // 10% penalty per late day
        const absentDeduction = absentDays * dailyRate; // Full daily rate per absent day

        // Get manual deductions for this employee
        const employeeManualDeductions = deductions
          .filter((deduction: any) => deduction.employee_id === employee.id)
          .reduce(
            (total: number, deduction: any) =>
              total + Number(deduction.amount || 0),
            0
          );

        const employeeDeductions =
          lateDeduction + absentDeduction + employeeManualDeductions;

        const attendanceRate =
          (employee.attendance?.length || 0) > 0
            ? (
                (presentDays / (employee.attendance?.length || 1)) *
                100
              ).toFixed(1)
            : "0";

        return [
          employee.username || "N/A",
          employee.trade_position?.trade_name || "N/A",
          `${presentDays}/${lateDays}/${absentDays}`,
          `${attendanceRate}%`,
          `${currencyShort} ${(dailyRate * currencyValue).toLocaleString()}`,
          `${currencyShort} ${(
            grossEarnings * currencyValue
          ).toLocaleString()}`,
          `${currencyShort} ${(
            employeeDeductions * currencyValue
          ).toLocaleString()}`,
          `${currencyShort} ${
            (grossEarnings - employeeDeductions) * currencyValue
          }.toLocaleString()}`,
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [
          [
            "Employee",
            "Trade",
            "P/L/A Days",
            "Attendance %",
            "Daily Rate",
            "Gross Pay",
            "Deductions",
            "Net Pay",
          ],
        ],
        body: employeeData,
        theme: "grid",
        headStyles: { fillColor: [156, 39, 176], textColor: 255 },
        styles: { fontSize: 7 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 18 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 22 },
          6: { cellWidth: 20 },
          7: { cellWidth: 22 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
      checkPageBreak(40);

      // Performance Metrics
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("PERFORMANCE METRICS", margin, yPosition);
      yPosition += 15;

      const performanceData = [
        [
          "Average Daily Cost per Employee",
          `${currencyShort} ${
            totalEmployees > 0
              ? (
                  (totalActual / totalEmployees) *
                  currencyValue
                ).toLocaleString()
              : 0
          }`,
        ],
        [
          "Cost Efficiency (Actual vs Budget)",
          `${
            totalBudget > 0
              ? (((totalBudget - totalActual) / totalBudget) * 100).toFixed(1)
              : 0
          }%`,
        ],
        [
          "Productivity Rate",
          `${
            totalDays > 0
              ? ((totalPresentDays / totalDays) * 100).toFixed(1)
              : 0
          }%`,
        ],
        [
          "Late Arrival Rate",
          `${
            totalDays > 0 ? ((totalLateDays / totalDays) * 100).toFixed(1) : 0
          }%`,
        ],
        [
          "Absenteeism Rate",
          `${
            totalDays > 0 ? ((totalAbsentDays / totalDays) * 100).toFixed(1) : 0
          }%`,
        ],
        [
          "Average Deduction per Employee",
          `${currencyShort} ${
            totalEmployees > 0
              ? (
                  (totalDeductions / totalEmployees) *
                  currencyValue
                ).toLocaleString()
              : 0
          }`,
        ],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [["Performance Indicator", "Value"]],
        body: performanceData,
        theme: "grid",
        headStyles: { fillColor: [255, 152, 0], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });

      // Footer
      yPosition = doc.internal.pageSize.height - 30;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      addText(
        `Report generated by DSE Payroll System | ${new Date().toLocaleString()}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      addText(
        `Company: ${
          (sessionData?.user as any)?.companies?.[0]?.name ||
          "Construction Company"
        }`,
        pageWidth / 2,
        yPosition + 8,
        { align: "center" }
      );

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      doc.save(`comprehensive-payroll-report_${timestamp}.pdf`);

      setIsGeneratingReport(false);
      toast({
        title: "Comprehensive Report Generated",
        description:
          "Detailed payroll report with real-time data has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description:
          "Failed to generate comprehensive payroll report. Please try again.",
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
    return enhancedEmployees.filter((employee: any) => {
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
        employee.project?.project_name !== filters.project
      )
        return false;
      if (filters.dailyRate && filters.dailyRate !== "all") {
        const employeeRate = `${currencyShort}${Math.round(
          employee.daily_rate || 0
        )}`;
        if (employeeRate !== filters.dailyRate) return false;
      }
      if (filters.remainingDays && filters.remainingDays !== "all") {
        const days = Number(employee.remaining_days) || 0;
        if (filters.remainingDays === "few" && (days > 10 || days < 0))
          return false;
        if (filters.remainingDays === "moderate" && (days <= 10 || days > 30))
          return false;
        if (filters.remainingDays === "many" && days <= 30) return false;
      }
      return true;
    });
  }, [enhancedEmployees, searchTerm, filters, currencyShort]);

  const prevFiltersRef = React.useRef(filters);
  const prevFilteredCountRef = React.useRef(filteredEmployees.length);

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
      remainingDays: "",
    });
    setSearchTerm("");
  };

  const getFilteredAttendance = (
    attendance: string | any[],
    period: string
  ) => {
    if (!attendance || !Array.isArray(attendance) || attendance.length === 0)
      return [];

    try {
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

  useEffect(() => {
    return () => {
      setOpenAttendanceDropdown(null);
      setExpandedEmployee(null);
    };
  }, []);

  const router = useRouter();
  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              Attendance & Payroll Management
            </h1>

            <div className="flex gap-2">
              {(permissions.full_access ||
                permissions.generate_reports ||
                permissions.view_reports) && (
                <Button
                  variant="outline"
                  className="gap-2 flex items-center border-2 border-gray-300 rounded-full h-14 bg-transparent"
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
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border flex justify-between items-center h-20 mb-5 pl-2">
            <div className="flex h-10 items-center rounded-lg ">
              {[
                { id: "attendance", label: "Attendance" },
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
                className="gap-2 flex items-center border-orange-500 text-orange-500 h-10 rounded-full bg-transparent"
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

          {showFilters && (
            <div className="px-4 pb-4">
              <div className="text-sm text-gray-500 mb-2">
                Filter employees by trade, project, daily rate, or remaining
                contract days
              </div>
              <div className="grid grid-cols-5 gap-4">
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
                  value={filters.remainingDays}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, remainingDays: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select by Remaining Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    <SelectItem value="few">Few (0-10 days)</SelectItem>
                    <SelectItem value="moderate">
                      Moderate (11-30 days)
                    </SelectItem>
                    <SelectItem value="many">Many (31+ days)</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="gap-2 flex items-center border-red-500 text-red-500 h-10 rounded-full bg-transparent"
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
              {activeTab === "attendance" && (
                <>
                  <div className="px-4 pb-4">
                    <div className="flex gap-4 mb-4">
                      <div className="bg-white border rounded-lg p-4 flex-1">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Budget Baseline
                        </div>
                        <div className="text-xl font-bold">
                          {
                            <ConvertedAmount
                              amount={0}
                              currency={sessionData.user.currency}
                              sessionData={sessionData}
                            />
                          }
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4 flex-1">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Actual Payroll
                        </div>
                        <div className="text-xl font-bold">
                          {
                            <ConvertedAmount
                              amount={0}
                              currency={sessionData.user.currency}
                              sessionData={sessionData}
                            />
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border rounded-md">
                      <thead>
                        <tr className="border-t border-b text-[12px] text-gray-500">
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
                          {(permissions.full_access ||
                            permissions.approve_attendance ||
                            permissions.mark_attendance) && (
                            <th className="px-4 py-3 text-left border-r">
                              Attendance Today
                            </th>
                          )}
                          <th className="w-fit px-4 py-3 text-center">
                            Attendance History
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-[14px]">
                        {filteredEmployees.map((employee: any) => (
                          <React.Fragment key={employee.id}>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 border-r">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {employee.username}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 border-r">
                                {employee.trade_position.trade_name}
                              </td>
                              <td className="px-4 py-3 border-r">
                                {employee.project?.project_name ||
                                  "No Project Assigned"}
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
                              {(permissions.full_access ||
                                permissions.approve_attendance ||
                                permissions.mark_attendance) && (
                                <td className="px-4 py-3 border-r">
                                  <Popover
                                    open={
                                      openAttendanceDropdown === employee.id
                                    }
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setOpenAttendanceDropdown(employee.id);
                                      } else {
                                        setOpenAttendanceDropdown(null);
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-8 bg-transparent"
                                      >
                                        Mark Attendance
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <div className="p-4 space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground mb-2">
                                          Mark Attendance
                                        </div>
                                        {!employee.attendance?.some(
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
                                        {!employee.attendance?.some(
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
                                            Late
                                          </Button>
                                        )}
                                        {!employee.attendance?.some(
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
                              )}
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/attendance-history/${employee.id}`
                                    )
                                  }
                                  className="text-sm"
                                >
                                  View History
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
                                              <path d="m15 18-6-6 6-6"></path>
                                              <path d="m15 18-6-6 6-6"></path>
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
                                              <path d="m9 18 6-6-6-6"></path>
                                              <path d="m9 18 6-6-6-6"></path>
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
                                                  ? "bg-orange-50 text-orange-500 border-0"
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
                                                    permissions.full_access ||
                                                    permissions.approve_attendance ||
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
                                                        "You do not have privilege to mark attendance",
                                                      variant: "destructive",
                                                    });
                                                  }
                                                }}
                                              >
                                                Late
                                              </Badge>
                                            )}
                                            {day.status !== "absent" && (
                                              <Badge
                                                variant="outline"
                                                className="bg-transparent border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => {
                                                  if (
                                                    permissions.full_access ||
                                                    permissions.approve_attendance ||
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
                                                        "You do not have privilege to mark attendance",
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
                                                    permissions.full_access ||
                                                    permissions.approve_attendance ||
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
                                                        "You do not have privilege to mark attendance",
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

              {activeTab === "leave" && (
                <div className="overflow-x-auto">
                  <table className="w-full border rounded-lg">
                    <thead>
                      <tr className="border-t border-b text-[14px] text-gray-500">
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
                        <th className="w-10 px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px]">
                      {filteredEmployees.map((employee: any) => (
                        <tr
                          key={employee.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 border-r">
                            <div className="flex items-center gap-2">
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
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 bg-transparent"
                              onClick={() => {
                                handleAddReason(employee.id);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Add Reason
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
          <Dialog open={showAddReason} onOpenChange={setShowAddReason}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label
                    htmlFor="edit-username"
                    className="text-sm font-medium"
                  >
                    Reason
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
                        <SelectItem value="sick">Sick</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="unpaid leave">
                          Unpaid Leave
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
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
