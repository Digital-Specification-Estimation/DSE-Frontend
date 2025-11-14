"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  DollarSign,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { useToast } from "@/hooks/use-toast";
import { useGetEmployeesQuery } from "@/lib/redux/employeeSlice";
import { useGetTradesQuery } from "@/lib/redux/tradePositionSlice";
import { useGetProjectsQuery } from "@/lib/redux/projectSlice";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { convertCurrency } from "@/lib/utils";
import { useGetDeductionsQuery } from "@/lib/redux/deductionSlice";
import { jsPDF } from "jspdf";
import { FileText } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface PayrollRecord {
  id: string;
  employeeName: string;
  position: string;
  period: string;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  status: "Paid" | "Pending" | "Processing";
  paymentDate: string;
}

interface EmployeePayroll {
  id: string;
  username: string;
  daily_rate: number;
  days_worked: number;
  budget_baseline: number;
  totalActualPayroll: number;
  plannedVsActual: string;
}
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
          (sessionData.user as any)?.companies?.[0]?.base_currency || "USD"
        );
        setConvertedAmount(result.toString());
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
export default function PayrollPage() {
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
  const { data: deductions = [] } = useGetDeductionsQuery();

  const { toast } = useToast();

  // Extract currency information
  const currencyShort =
    (sessionData?.user as any)?.companies?.[0]?.base_currency || "USD";
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    trade: "all",
    project: "all",
    status: "all",
    dailyRate: "all",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);

  const [payrollSummary, setPayrollSummary] = useState({
    totalEmployees: 0,
    totalDaysWorked: 0,
    totalBaseline: 0,
    totalActualPayroll: 0,
    totalDailyActuallPayroll: 0,
  });

  const { data: employees = [], isLoading: isLoadingEmployees } =
    useGetEmployeesQuery();
  const { data: trades = [], isLoading: isLoadingTrades } = useGetTradesQuery();
  const { data: projects = [], isLoading: isLoadingProjects } =
    useGetProjectsQuery();
  const { totals, enhancedEmployees } = useMemo(() => {
    let baseline = 0;
    let actualPayroll = 0;
    let daysWorked = 0;
    let dailyActualPayroll = 0;
    const enhanced = [];

    for (const employee of employees) {
      baseline += Number(employee.budget_baseline || 0);

      // Calculate attendance data
      const attendance = employee.attendance || [];
      const presentDays = attendance.filter(
        (a: any) => a.status?.toLowerCase() === "present"
      ).length;
      const lateDays = attendance.filter(
        (a: any) => a.status?.toLowerCase() === "late"
      ).length;

      // Separate absent days by whether they have a reason (paid leave) or not (unpaid leave)
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
      ).length;

      // Calculate paid days: working days + paid leave (sick/vacation)
      const workingDays = presentDays + lateDays;
      const paidLeaveDays = absentWithSickReason + absentWithVacationReason;
      const employeeWorkingDays = workingDays + paidLeaveDays;

      // Total absent days for display purposes
      const totalAbsentDays =
        absentWithoutReason + absentWithSickReason + absentWithVacationReason;

      // Debug logging for first employee
      if (employees.indexOf(employee) === 0) {
        console.log("Employee:", employee.username);
        console.log("Attendance records:", attendance);
        console.log("Present days:", presentDays);
        console.log("Late days:", lateDays);
        console.log("Absent without reason (unpaid):", absentWithoutReason);
        console.log("Absent with sick reason (paid):", absentWithSickReason);
        console.log(
          "Absent with vacation reason (paid):",
          absentWithVacationReason
        );
        console.log("Paid leave days:", paidLeaveDays);
        console.log("Total working days:", employeeWorkingDays);
        console.log("Employee daily rate:", employee.daily_rate);
        console.log("Trade position:", employee.trade_position);
      }

      daysWorked += employeeWorkingDays;

      // Calculate actual payroll based on working days
      // Get daily rate from employee or trade position
      let dailyRate = Number(employee.daily_rate || 0);
      if (dailyRate === 0 && employee.trade_position?.daily_planned_cost) {
        dailyRate = Number(employee.trade_position.daily_planned_cost);
      }
      // If still 0 and monthly rate exists, convert monthly to daily
      if (dailyRate === 0 && employee.trade_position?.monthly_planned_cost) {
        dailyRate = Number(employee.trade_position.monthly_planned_cost) / 30;
      }

      const employeeActualPayroll = employeeWorkingDays * dailyRate;

      // Debug logging for first employee (continued)
      if (employees.indexOf(employee) === 0) {
        console.log("Calculated daily rate:", dailyRate);
        console.log("Employee actual payroll:", employeeActualPayroll);
      }

      // Calculate automatic deductions (only late penalties, no absent deductions)
      const lateDeduction = lateDays * (dailyRate * 0.1); // 10% penalty per late day

      // Get manual deductions for this employee
      const employeeManualDeductions = deductions
        .filter((deduction: any) => deduction.employee_id === employee.id)
        .reduce(
          (total: number, deduction: any) =>
            total + Number(deduction.amount || 0),
          0
        );

      // Total deductions = automatic + manual
      const totalDeductions = lateDeduction + employeeManualDeductions;

      // Note: Absent days are unpaid leave (0 pay), not deductions
      const netPayroll = employeeActualPayroll - totalDeductions;

      actualPayroll += employeeActualPayroll; // Use GROSS payroll for totals

      // Calculate daily actual payroll: only for employees present or on paid leave today
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const todayAttendance = attendance.find((a: any) => {
        const attendanceDate = new Date(a.date).toISOString().split("T")[0];
        return attendanceDate === today;
      });

      if (todayAttendance) {
        const status = todayAttendance.status?.toLowerCase();
        const reason = todayAttendance.reason?.toLowerCase();

        // Include in daily payroll if present, late, or absent with paid reason (sick/vacation)
        const isPaidToday =
          status === "present" ||
          status === "late" ||
          (status === "absent" && (reason === "sick" || reason === "vacation"));

        if (isPaidToday) {
          // Calculate today's specific deductions
          const todayManualDeductions = deductions
            .filter((deduction: any) => {
              if (deduction.employee_id !== employee.id) return false;
              // Include deductions dated today, or deductions without specific dates (general deductions)
              if (!deduction.date) return true; // General deductions apply daily
              const deductionDate = new Date(deduction.date)
                .toISOString()
                .split("T")[0];
              return deductionDate === today;
            })
            .reduce(
              (total: number, deduction: any) =>
                total + Number(deduction.amount || 0),
              0
            );

          // Daily calculation: today's rate minus today's specific deductions and late penalty
          const todayLateDeduction = status === "late" ? dailyRate * 0.1 : 0;
          const dailyNetPayroll =
            dailyRate - todayLateDeduction - todayManualDeductions;
          dailyActualPayroll += Math.max(0, dailyNetPayroll);
        }
      }

      // Calculate planned vs actual percentage
      const budgetBaseline = Number(employee.budget_baseline || 0);
      const plannedVsActualPercentage =
        budgetBaseline > 0
          ? ((employeeActualPayroll / budgetBaseline) * 100).toFixed(1) + "%"
          : "0%";

      // Create enhanced employee object with calculated values
      enhanced.push({
        ...employee,
        days_worked: employeeWorkingDays,
        totalActualPayroll: employeeActualPayroll, // GROSS payroll (before deductions)
        totalDeductions: totalDeductions, // Total deductions amount
        netPayroll: netPayroll, // Net payroll (after deductions)
        plannedVsActual: plannedVsActualPercentage, // Percentage of actual vs budget
        // Add attendance breakdown for table display
        sickDays: absentWithSickReason,
        vacationDays: absentWithVacationReason,
        unpaidDays: absentWithoutReason,
        presentDays: presentDays,
        lateDays: lateDays,
        totalAbsentDays: totalAbsentDays,
      });
    }

    return {
      totals: {
        totalBaseline: baseline,
        totalActualPayroll: actualPayroll,
        totalDaysWorked: daysWorked,
        totalDailyActuallPayroll: dailyActualPayroll,
      },
      enhancedEmployees: enhanced,
    };
  }, [employees]);
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
  }, [enhancedEmployees, searchTerm, filters]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredEmployees.slice(startIndex, endIndex);

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const totalEmployees = employees.length;
        const totalDaysWorked = employees.reduce(
          (sum: number, emp: any) => sum + (emp.days_worked || 0),
          0
        );
        const totalBaseline = employees.reduce(
          (sum: number, emp: any) => sum + (emp.budget_baseline || 0),
          0
        );
        const totalActualPayroll = employees.reduce(
          (sum: number, emp: any) => sum + (emp.totalActualPayroll || 0),
          0
        );
        const totalDailyActuallPayroll = employees.reduce(
          (sum: number, emp: any) => sum + (emp.daily_rate || 0),
          0
        );

        setPayrollSummary({
          totalEmployees,
          totalDaysWorked,
          totalBaseline,
          totalActualPayroll,
          totalDailyActuallPayroll,
        });

        const mockData: PayrollRecord[] = employees.map((emp: any) => ({
          id: emp.id,
          employeeName: emp.username,
          position: emp.trade_position?.trade_name || "N/A",
          period: format(new Date(), "MMMM yyyy"),
          baseSalary: emp.daily_rate * emp.days_worked || 0,
          overtime: 0,
          bonuses: 0,
          deductions: 0,
          netPay: emp.totalActualPayroll || 0,
          status: "Paid",
          paymentDate: format(new Date(), "yyyy-MM-dd"),
        }));

        setPayrollData(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching payroll data:", error);
        toast({
          title: "Error",
          description: "Failed to load payroll data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchPayrollData();
  }, [toast, employees]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: sessionData?.user?.companies?.[0]?.base_currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredData = payrollData.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filters.status === "all" ||
      record.status.toLowerCase() === filters.status.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGeneratePayrollReport = async () => {
    try {
      setIsGeneratingReport(true);

      toast({
        title: "Generating Payroll Report",
        description:
          "Please wait while we generate your detailed payroll report...",
      });

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Helper function to add text and return new y position
      const addText = (text: string, x: number, y: number, options?: any) => {
        doc.text(text, x, y, options);
        return y + 7;
      };

      // Add header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      yPosition = addText(
        `Payroll Report - ${new Date().toLocaleDateString()}`,
        margin,
        yPosition
      );

      // Add company info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPosition = addText(
        `Company: ${sessionData?.user?.companies?.[0]?.name || "N/A"}`,
        margin,
        yPosition + 10
      );
      yPosition = addText(
        `Generated on: ${new Date().toLocaleString()}`,
        margin,
        yPosition
      );

      // Add summary section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      yPosition = addText("Payroll Summary", margin, yPosition + 15);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Add summary data
      yPosition = addText(
        `Total Employees: ${enhancedEmployees.length}`,
        margin,
        yPosition + 5
      );
      yPosition = addText(
        `Total Days Worked: ${totals.totalDaysWorked}`,
        margin,
        yPosition
      );
      yPosition = addText(
        `Total Budget Baseline: ${formatCurrency(totals.totalBaseline)}`,
        margin,
        yPosition
      );
      yPosition = addText(
        `Total Actual Payroll: ${formatCurrency(totals.totalActualPayroll)}`,
        margin,
        yPosition
      );
      yPosition = addText(
        `Daily Actual Payroll: ${formatCurrency(
          totals.totalDailyActuallPayroll
        )}`,
        margin,
        yPosition
      );

      // Add detailed payroll table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      yPosition = addText("Payroll Details", margin, yPosition + 15);

      // Table headers
      const headers = [
        "Employee",
        "Daily Rate",
        "Days Worked",
        "Budget Baseline",
        "Total Actual",
      ];

      const columnWidths = [50, 30, 30, 40, 40];
      let xPosition = margin;

      // Draw table headers
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });

      // Draw table rows
      doc.setFont("helvetica", "normal");
      yPosition += 7;

      enhancedEmployees.forEach((employee: any) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }

        xPosition = margin;
        const rowData = [
          employee.username || "N/A",
          formatCurrency(employee.daily_rate || 0),
          employee.days_worked?.toString() || "0",
          formatCurrency(employee.budget_baseline || 0),
          formatCurrency(employee.totalActualPayroll || 0),
        ];

        rowData.forEach((cell, index) => {
          doc.text(cell, xPosition, yPosition);
          xPosition += columnWidths[index];
        });

        yPosition += 7;
      });

      // Add footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Generated by ${sessionData?.user?.name || "System"}`,
        margin,
        290
      );
      doc.text("Confidential", pageWidth - margin - 30, 290);

      // Save the PDF
      doc.save(`payroll-report-${new Date().toISOString().split("T")[0]}.pdf`);

      toast({
        title: "Report Generated",
        description: "The payroll report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating payroll report:", error);
      toast({
        title: "Error",
        description: "Failed to generate the payroll report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };
  const totalPayroll = payrollData.reduce(
    (sum, record) => sum + record.netPay,
    0
  );
  const paidCount = payrollData.filter(
    (record) => record.status === "Paid"
  ).length;
  const pendingCount = payrollData.filter(
    (record) => record.status === "Pending"
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }
  console.log("payrollData", payrollData);
  return (
    <div className="flex-1 overflow-auto pt-[20px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Payroll Management</h1>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employees..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <div>
                  <Label>Trade</Label>
                  <Select
                    value={filters.trade}
                    onValueChange={(value) =>
                      setFilters({ ...filters, trade: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trades</SelectItem>
                      {trades.map((trade) => (
                        <SelectItem
                          key={trade.trade_name}
                          value={trade.trade_name}
                        >
                          {trade.trade_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project</Label>
                  <Select
                    value={filters.project}
                    onValueChange={(value) =>
                      setFilters({ ...filters, project: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.project_name}
                          value={project.project_name}
                        >
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Daily Rate</Label>
                  <Select
                    value={filters.dailyRate}
                    onValueChange={(value) =>
                      setFilters({ ...filters, dailyRate: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rate range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rates</SelectItem>
                      <SelectItem value="0-100">$0 - $100</SelectItem>
                      <SelectItem value="100-300">$100 - $300</SelectItem>
                      <SelectItem value="300-500">$300 - $500</SelectItem>
                      <SelectItem value="500+">$500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setFilters({
                      trade: "all",
                      project: "all",
                      status: "all",
                      dailyRate: "all",
                    })
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={handleGeneratePayrollReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            {isGeneratingReport ? "Generating..." : "View Payroll Report"}
          </Button>
        </div>
      </div>
      <main className=" space-y-6">
        <div className=" pb-4">
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Total Employees</div>
              <div className="text-xl font-bold">
                {enhancedEmployees.length}
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">
                Total Days Worked
              </div>
              <div className="text-xl font-bold">{totals.totalDaysWorked}</div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">
                Total Budget Baseline
              </div>
              <div className="text-xl font-bold">
                {
                  <ConvertedAmount
                    amount={totals.totalBaseline}
                    currency={(sessionData.user as any)?.currency || "USD"}
                    sessionData={sessionData}
                  />
                }
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">
                Total Actual Payroll
              </div>
              <div className="text-xl font-bold">
                {
                  <ConvertedAmount
                    amount={totals.totalActualPayroll}
                    currency={(sessionData.user as any)?.currency || "USD"}
                    sessionData={sessionData}
                  />
                }
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">
                Daily Actual Payroll
              </div>
              <div className="text-xl font-bold">
                {
                  <ConvertedAmount
                    amount={totals.totalDailyActuallPayroll}
                    currency={(sessionData.user as any)?.currency || "USD"}
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
              <tr className="border-t border-b text-[14px] text-gray-500">
                <th className="px-4 py-3 text-left border-r">Employee Name</th>
                <th className="px-4 py-3 text-left border-r">Daily Rate</th>
                <th className="px-4 py-3 text-left border-r">Days Worked</th>
                <th className="px-4 py-3 text-left border-r">
                  Budget Baseline
                </th>
                <th className="px-4 py-3 text-left border-r">
                  Total Actual Payroll
                </th>
                <th className="px-4 py-3 text-left border-r text-red-600">
                  Deductions
                </th>
                <th className="px-4 py-3 text-left border-r">
                  Planned vs Actual
                </th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {currentItems.map((employee: any) => (
                <tr key={employee.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 border-r">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{employee.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r">
                    {
                      <ConvertedAmount
                        amount={employee.daily_rate}
                        currency={(sessionData.user as any)?.currency || "USD"}
                        sessionData={sessionData}
                      />
                    }
                  </td>
                  <td className="px-4 py-3 border-r">{employee.days_worked}</td>
                  <td className="px-4 py-3 border-r">
                    {
                      <ConvertedAmount
                        amount={employee.budget_baseline}
                        currency={(sessionData.user as any)?.currency || "USD"}
                        sessionData={sessionData}
                      />
                    }
                  </td>
                  <td className="px-4 py-3 border-r">
                    {
                      <ConvertedAmount
                        amount={employee.totalActualPayroll}
                        currency={(sessionData.user as any)?.currency || "USD"}
                        sessionData={sessionData}
                      />
                    }
                  </td>
                  <td className="px-4 py-3 border-r text-red-600 font-medium">
                    {
                      <ConvertedAmount
                        amount={employee.totalDeductions || 0}
                        currency={(sessionData.user as any)?.currency || "USD"}
                        sessionData={sessionData}
                      />
                    }
                  </td>
                  <td className="px-4 py-3 border-r">
                    <Badge
                      className={
                        parseFloat(employee.plannedVsActual) > 100
                          ? "bg-red-50 text-red-700 border-0"
                          : parseFloat(employee.plannedVsActual) >= 90
                          ? "bg-green-50 text-green-700 border-0"
                          : "bg-yellow-50 text-yellow-700 border-0"
                      }
                    >
                      {employee.plannedVsActual}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className={`h-8 w-8 p-0 ${
                        currentPage === pageNum
                          ? "bg-orange-500 hover:bg-orange-600"
                          : ""
                      }`}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(totalPages)}
                >
                  {totalPages}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
