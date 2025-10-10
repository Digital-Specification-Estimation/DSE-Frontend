"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  FileText,
  FileCheck,
  Edit,
  Calendar,
  Users,
  AlertTriangle,
  Loader2,
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DashboardHeader from "@/components/DashboardHeader";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useToast } from "@/hooks/use-toast";
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
    if (
      (sessionData?.user as any)?.settings &&
      (sessionData.user as any).current_role
    ) {
      const userPermission = (sessionData.user as any).settings.find(
        (setting: any) =>
          setting.company_id === (sessionData.user as any).company_id &&
          setting.role === (sessionData.user as any).current_role
      );

      if (userPermission) {
        setPermissions(userPermission);
      }
    }
  }, [
    (sessionData.user as any)?.settings,
    (sessionData.user as any)?.current_role,
  ]);

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
    splitCurrencyValue((sessionData.user as any)?.currency)?.value
  );
  const currencyShort = splitCurrencyValue(
    (sessionData.user as any)?.currency
  )?.currency;
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
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);
  const [selectedBulkDate, setSelectedBulkDate] = useState<Date>(new Date());
  const [isMarkingAllPresent, setIsMarkingAllPresent] = useState(false);
  const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState<
    "Present" | "Absent"
  >("Present");
  const [showIndividualDateModal, setShowIndividualDateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedIndividualDate, setSelectedIndividualDate] = useState<Date>(
    new Date()
  );
  const [pendingAttendanceAction, setPendingAttendanceAction] = useState<{
    employee: any;
    status: string;
    date: Date;
  } | null>(null);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState<any>(null);

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
        // For today's attendance, use 'today' time parameter
        const attendanceData = {
          employeeId,
          status,
          date: getCurrentDate(), // Current date in MM/DD/YYYY format
          time: "today", // This tells backend to use today's date range
        };

        console.log("Sending today attendance data:", attendanceData);
        await updateAttendance(attendanceData).unwrap();
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

  // Get valid date range for employee based on project dates
  const getValidDateRange = (employee: any) => {
    const project = employee.project;
    console.log(
      `Getting date range for ${employee.username}, project:`,
      project
    );

    if (!project) {
      // If no project, allow a wide date range (past year to next year)
      const today = new Date();
      const pastYear = new Date(today.getFullYear() - 1, 0, 1);
      const nextYear = new Date(today.getFullYear() + 1, 11, 31);
      console.log(
        `No project for ${
          employee.username
        }, using wide range: ${pastYear.toDateString()} to ${nextYear.toDateString()}`
      );
      return { from: pastYear, to: nextYear };
    }

    const projectStart = project.start_date
      ? new Date(project.start_date)
      : new Date(new Date().getFullYear(), 0, 1); // Start of current year if no start date
    const projectEnd = project.end_date
      ? new Date(project.end_date)
      : new Date(new Date().getFullYear(), 11, 31); // End of current year if no end date

    console.log(
      `Project dates for ${
        employee.username
      }: ${projectStart.toDateString()} to ${projectEnd.toDateString()}`
    );
    return { from: projectStart, to: projectEnd };
  };

  // Check if date is within valid range
  const isDateValid = (date: Date, employee: any) => {
    const { from, to } = getValidDateRange(employee);
    const isValid = date >= from && date <= to;
    console.log(
      `Date validation for ${
        employee.username
      }: ${date.toDateString()} between ${from.toDateString()} and ${to.toDateString()} = ${isValid}`
    );
    return isValid;
  };

  // Check if employee has attendance for specific date
  const hasAttendanceForDate = (employee: any, date: Date) => {
    return employee.attendance?.find((a: any) => {
      const attendanceDate = new Date(a.date);
      return attendanceDate.toDateString() === date.toDateString();
    });
  };

  // Mark all employees as present
  const handleMarkAllPresent = async () => {
    setBulkAttendanceStatus("Present");
    await handleBulkAttendanceMarking("Present");
  };

  // Mark all employees as absent
  const handleMarkAllAbsent = async () => {
    setBulkAttendanceStatus("Absent");
    await handleBulkAttendanceMarking("Absent");
  };

  // Mark all employees with selected status for selected date
  const handleBulkAttendanceMarking = async (status?: string) => {
    const attendanceStatus = status || bulkAttendanceStatus;
    if (
      !permissions.full_access &&
      !permissions.approve_attendance &&
      !permissions.mark_attendance
    ) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to mark attendance.",
        variant: "destructive",
      });
      return;
    }

    if (!filteredEmployees.length) {
      toast({
        title: "No Employees",
        description: "No employees available to mark as present.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsMarkingAllPresent(true);

      toast({
        title: `Marking All ${attendanceStatus}`,
        description: `Marking ${
          filteredEmployees.length
        } employees as ${attendanceStatus.toLowerCase()} for ${selectedBulkDate.toLocaleDateString()}...`,
      });

      // Format date for backend (MM/DD/YYYY format expected by backend)
      const selectedDateString = `${
        selectedBulkDate.getMonth() + 1
      }/${selectedBulkDate.getDate()}/${selectedBulkDate.getFullYear()}`;

      let successCount = 0;
      let skippedCount = 0;
      let failedEmployees: string[] = [];

      // Mark each employee as present for the selected date
      console.log("Processing employees:", filteredEmployees.length);
      console.log("Selected date:", selectedBulkDate);

      for (const employee of filteredEmployees) {
        try {
          console.log(
            `Processing employee: ${employee.username}, Project:`,
            employee.project
          );

          // Check if date is valid for this employee's project
          const dateValid = isDateValid(selectedBulkDate, employee);
          console.log(`Date valid for ${employee.username}:`, dateValid);

          if (!dateValid) {
            console.log(`Skipping ${employee.username} - invalid date`);
            skippedCount++;
            continue;
          }

          // Format the attendance data properly for backend
          // Use ISO date format for better parsing
          const attendanceData = {
            employeeId: employee.id,
            status: attendanceStatus,
            date: selectedBulkDate.toISOString(), // ISO format for better date parsing
            time: "bulk_mark", // Use specific time identifier
          };

          // Validate data before sending
          if (!validateAttendanceData(attendanceData)) {
            console.error(
              "Invalid attendance data for employee:",
              employee.username
            );
            failedEmployees.push(employee.username);
            continue;
          }

          console.log("Sending attendance data:", attendanceData);
          console.log("Status being sent:", attendanceStatus);
          const result = await updateAttendance(attendanceData).unwrap();
          console.log("Backend response:", result);
          successCount++;
        } catch (error) {
          console.error(
            `Failed to mark ${
              employee.username
            } as ${attendanceStatus.toLowerCase()}:`,
            error
          );
          failedEmployees.push(employee.username);
        }
      }

      await refetch();
      setShowMarkAllModal(false);
      setIsMarkingAllPresent(false);

      // Show results
      let message = `Successfully marked ${successCount} employees as ${attendanceStatus.toLowerCase()}.`;
      if (skippedCount > 0) {
        message += ` ${skippedCount} employees were skipped (already marked or invalid date).`;
      }
      if (failedEmployees.length > 0) {
        message += ` ${failedEmployees.length} failed: ${failedEmployees.join(
          ", "
        )}.`;
      }

      toast({
        title: successCount > 0 ? "Success" : "No Changes Made",
        description: message,
        variant: failedEmployees.length > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Error marking all present:", error);
      toast({
        title: "Error",
        description:
          "Failed to mark all employees as present. Please try again.",
        variant: "destructive",
      });
      setIsMarkingAllPresent(false);
    }
  };

  // Handle individual attendance marking with date selection
  const handleIndividualAttendanceMark = (employee: any, status: string) => {
    setSelectedEmployee(employee);
    setPendingAttendanceAction({
      employee,
      status,
      date: selectedIndividualDate,
    });
    setShowIndividualDateModal(true);
  };

  // Confirm individual attendance marking
  const confirmIndividualAttendance = async () => {
    if (!pendingAttendanceAction) return;

    const { employee, status, date } = pendingAttendanceAction;

    // Check if date is valid for this employee's project
    if (!isDateValid(date, employee)) {
      toast({
        title: "Invalid Date",
        description:
          "Selected date is outside the employee's project date range.",
        variant: "destructive",
      });
      return;
    }

    // Check if employee already has attendance for this date
    const existing = hasAttendanceForDate(employee, date);
    if (existing) {
      setExistingAttendance(existing);
      setShowEditConfirmation(true);
      setShowIndividualDateModal(false);
      return;
    }

    // Mark attendance
    await markAttendanceForDate(employee, status, date);
    setShowIndividualDateModal(false);
    setPendingAttendanceAction(null);
  };

  // Validate attendance data before sending to backend
  const validateAttendanceData = (data: any) => {
    const required = ["employeeId", "status", "date", "time"];
    const missing = required.filter((field) => !data[field]);

    if (missing.length > 0) {
      console.error("Missing required fields:", missing);
      return false;
    }

    // Validate status values
    const validStatuses = ["Present", "Absent", "Late"];
    if (!validStatuses.includes(data.status)) {
      console.error("Invalid status:", data.status);
      return false;
    }

    // Validate employeeId is not empty
    if (!data.employeeId || data.employeeId.trim() === "") {
      console.error("Invalid employeeId:", data.employeeId);
      return false;
    }

    return true;
  };

  // Mark attendance for specific date
  const markAttendanceForDate = async (
    employee: any,
    status: string,
    date: Date
  ) => {
    try {
      // Format date for backend (MM/DD/YYYY format expected by backend)
      const dateString = `${
        date.getMonth() + 1
      }/${date.getDate()}/${date.getFullYear()}`;

      const attendanceData = {
        employeeId: employee.id,
        status: status,
        date: date.toISOString(), // Use ISO format for better date parsing
        time: "manual_mark", // Use specific time identifier
      };

      // Validate data before sending
      if (!validateAttendanceData(attendanceData)) {
        toast({
          title: "Invalid Data",
          description: "Invalid attendance data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Sending individual attendance data:", attendanceData);
      await updateAttendance(attendanceData).unwrap();

      await refetch();

      toast({
        title: "Attendance Updated",
        description: `${
          employee.username
        } has been marked as ${status} for ${date.toLocaleDateString()}.`,
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

  // Handle edit confirmation
  const handleEditConfirmation = async () => {
    if (!pendingAttendanceAction) return;

    const { employee, status, date } = pendingAttendanceAction;
    await markAttendanceForDate(employee, status, date);

    setShowEditConfirmation(false);
    setPendingAttendanceAction(null);
    setExistingAttendance(null);
  };

  const handleAddReasonSubmit = async () => {
    try {
      await addReason(newReason).unwrap();

      setNewReason({ employee_id: "", reason: "", date: "" });
      refetch();
      setShowAddReason(false);

      toast({
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
        title: "Generating Attendance Report",
        description:
          "Please wait while we generate your detailed attendance report...",
      });

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Helper functions
      const addText = (text: string, x: number, y: number, options?: any) => {
        doc.text(text, x, y, options);
        return y + 7;
      };

      // Add header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      yPosition = addText(
        `Attendance Report - ${new Date().toLocaleDateString()}`,
        margin,
        yPosition
      );

      // Add company info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPosition = addText(
        `Company: ${sessionData?.user?.companies?.[0]?.name || 'N/A'}`,
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
      yPosition = addText("Attendance Summary", margin, yPosition + 15);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Calculate attendance summary
      const totalEmployees = employees.length;
      const presentCount = employees.filter(e => e.attendance_status === 'present').length;
      const absentCount = employees.filter(e => e.attendance_status === 'absent').length;
      const leaveCount = employees.filter(e => e.attendance_status === 'on_leave').length;
      const attendanceRate = totalEmployees > 0 ? (presentCount / totalEmployees * 100).toFixed(1) : 0;

      yPosition = addText(
        `Total Employees: ${totalEmployees}`,
        margin,
        yPosition + 5
      );
      yPosition = addText(
        `Present: ${presentCount} (${attendanceRate}% attendance rate)`,
        margin,
        yPosition
      );
      yPosition = addText(
        `Absent: ${absentCount}`,
        margin,
        yPosition
      );
      yPosition = addText(
        `On Leave: ${leaveCount}`,
        margin,
        yPosition
      );

      // Add detailed attendance table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      yPosition = addText("Attendance Details", margin, yPosition + 15);

      // Table headers
      const headers = [
        "Employee",
        "Position",
        "Status",
        "Days Worked",
        "Last Updated"
      ];
      
      const columnWidths = [60, 40, 30, 30, 30];
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
      
      employees.forEach(employee => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        xPosition = margin;
        const rowData = [
          employee.username || 'N/A',
          employee.trade_position?.trade_name || 'N/A',
          employee.attendance_status?.charAt(0).toUpperCase() + employee.attendance_status?.slice(1) || 'N/A',
          employee.days_worked?.toString() || '0',
          employee.updated_at ? new Date(employee.updated_at).toLocaleDateString() : 'N/A'
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
        `Generated by ${sessionData?.user?.name || 'System'}`,
        margin,
        290
      );
      doc.text("Confidential", pageWidth - margin - 30, 290);

      // Save the PDF
      doc.save(`attendance-report-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Report Generated",
        description: "The attendance report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate the attendance report. Please try again.",
        variant: "destructive",
      });
    } finally {
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

  // Pagination for attendance
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination for leave tracking
  const [leaveCurrentPage, setLeaveCurrentPage] = useState(1);
  const [leaveItemsPerPage, setLeaveItemsPerPage] = useState(10);

  // Calculate pagination for attendance
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredEmployees.slice(startIndex, endIndex);

  // Calculate pagination for leave tracking
  const totalLeaveItems = filteredEmployees.length;
  const totalLeavePages = Math.ceil(totalLeaveItems / leaveItemsPerPage);
  const leaveStartIndex = (leaveCurrentPage - 1) * leaveItemsPerPage;
  const leaveEndIndex = Math.min(leaveStartIndex + leaveItemsPerPage, totalLeaveItems);
  const currentLeaveItems = filteredEmployees.slice(leaveStartIndex, leaveEndIndex);

  // Handle page change for attendance
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Handle items per page change for attendance
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Handle page change for leave tracking
  const goToLeavePage = (page: number) => {
    setLeaveCurrentPage(Math.max(1, Math.min(page, totalLeavePages)));
  };

  // Handle items per page change for leave tracking
  const handleLeaveItemsPerPageChange = (value: string) => {
    setLeaveItemsPerPage(Number(value));
    setLeaveCurrentPage(1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setLeaveCurrentPage(1);
  }, [filters, searchTerm, activeTab]);

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
                  {isGeneratingReport ? "Generating..." : "View Attendance Report"}
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
                              <div className="flex items-center justify-between">
                                <span>Mark Attendance</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-xs h-7 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                  onClick={() => {
                                    setBulkAttendanceStatus("Present");
                                    setShowMarkAllModal(true);
                                  }}
                                >
                                  <Users className="h-3 w-3" />
                                  Mark Bulk Attendance
                                </Button>
                              </div>
                            </th>
                          )}
                          <th className="w-fit px-4 py-3 text-center">
                            Attendance History
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-[14px]">
                        {currentItems.map((employee: any) => (
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
                                        <Button
                                          variant="outline"
                                          className="w-full justify-center bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-100"
                                          onClick={() =>
                                            handleIndividualAttendanceMark(
                                              employee,
                                              "Present"
                                            )
                                          }
                                        >
                                          Present
                                        </Button>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-center bg-orange-50 text-orange-500 hover:bg-orange-100 hover:text-orange-600 border-orange-100"
                                          onClick={() =>
                                            handleIndividualAttendanceMark(
                                              employee,
                                              "Late"
                                            )
                                          }
                                        >
                                          Late
                                        </Button>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-center bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-100"
                                          onClick={() =>
                                            handleIndividualAttendanceMark(
                                              employee,
                                              "Absent"
                                            )
                                          }
                                        >
                                          Absent
                                        </Button>
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
                                                          title: "Attendance Updated",
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
                                                          title: "Attendance Updated",
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
                                                          title: "Attendance Updated",
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
                    {totalPages > 0 && (
                      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border rounded-b-md">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                            <span className="font-medium">{endIndex}</span> of{' '}
                            <span className="font-medium">{totalItems}</span> employees
                          </p>
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={handleItemsPerPageChange}
                          >
                            <SelectTrigger className="h-8 w-[70px]">
                              <SelectValue placeholder={itemsPerPage} />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 10, 20, 50, 100].map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-700">per page</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                          >
                            <span className="sr-only">Go to first page</span>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <span className="sr-only">Go to previous page</span>
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
                                  className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
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
                            className="h-8 w-8 p-0"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                          >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                          >
                            <span className="sr-only">Go to last page</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
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
                      {currentLeaveItems.map((employee: any) => (
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
                  {totalLeavePages > 0 && (
                    <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border rounded-b-md">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{leaveStartIndex + 1}</span> to{' '}
                          <span className="font-medium">{leaveEndIndex}</span> of{' '}
                          <span className="font-medium">{totalLeaveItems}</span> employees
                        </p>
                        <Select
                          value={leaveItemsPerPage.toString()}
                          onValueChange={handleLeaveItemsPerPageChange}
                        >
                          <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={leaveItemsPerPage} />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 20, 50, 100].map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-700">per page</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => goToLeavePage(1)}
                          disabled={leaveCurrentPage === 1}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => goToLeavePage(leaveCurrentPage - 1)}
                          disabled={leaveCurrentPage === 1}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, totalLeavePages) }, (_, i) => {
                          let pageNum;
                          if (totalLeavePages <= 5) {
                            pageNum = i + 1;
                          } else if (leaveCurrentPage <= 3) {
                            pageNum = i + 1;
                          } else if (leaveCurrentPage >= totalLeavePages - 2) {
                            pageNum = totalLeavePages - 4 + i;
                          } else {
                            pageNum = leaveCurrentPage - 2 + i;
                          }
                          
                          if (pageNum > 0 && pageNum <= totalLeavePages) {
                            return (
                              <Button
                                key={pageNum}
                                variant={leaveCurrentPage === pageNum ? "default" : "outline"}
                                className={`h-8 w-8 p-0 ${leaveCurrentPage === pageNum ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                                onClick={() => goToLeavePage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                          return null;
                        })}
                        
                        {totalLeavePages > 5 && leaveCurrentPage < totalLeavePages - 2 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        
                        {totalLeavePages > 5 && leaveCurrentPage < totalLeavePages - 2 && (
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => goToLeavePage(totalLeavePages)}
                          >
                            {totalLeavePages}
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => goToLeavePage(leaveCurrentPage + 1)}
                          disabled={leaveCurrentPage === totalLeavePages || totalLeavePages === 0}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => goToLeavePage(totalLeavePages)}
                          disabled={leaveCurrentPage === totalLeavePages || totalLeavePages === 0}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
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

          {/* Mark All Present Modal */}
          <Dialog open={showMarkAllModal} onOpenChange={setShowMarkAllModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Mark All Employees Attendance
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Attendance Status
                  </label>
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isMarkingAllPresent}
                      onClick={handleMarkAllPresent}
                    >
                      {isMarkingAllPresent &&
                      bulkAttendanceStatus === "Present" ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Marking Present...
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Mark All Present
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={isMarkingAllPresent}
                      onClick={handleMarkAllAbsent}
                    >
                      {isMarkingAllPresent &&
                      bulkAttendanceStatus === "Absent" ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Marking Absent...
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Mark All Absent
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedBulkDate
                          ? selectedBulkDate.toLocaleDateString()
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedBulkDate}
                        onSelect={(date) => date && setSelectedBulkDate(date)}
                        disabled={(date) => {
                          // Disable dates that are invalid for most employees
                          const validEmployeesForDate =
                            filteredEmployees.filter((emp) =>
                              isDateValid(date, emp)
                            );
                          return validEmployeesForDate.length === 0;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    bulkAttendanceStatus === "Present"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div
                    className={`text-sm ${
                      bulkAttendanceStatus === "Present"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    <strong>Action:</strong> Mark {filteredEmployees.length}{" "}
                    employees as {bulkAttendanceStatus.toLowerCase()} for{" "}
                    {selectedBulkDate.toLocaleDateString()}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      bulkAttendanceStatus === "Present"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    Only employees with valid project dates and no existing
                    attendance will be marked.
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      bulkAttendanceStatus === "Present"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    Valid employees:{" "}
                    {
                      filteredEmployees.filter((emp) =>
                        isDateValid(selectedBulkDate, emp)
                      ).length
                    }{" "}
                    out of {filteredEmployees.length}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Individual Date Selection Modal */}
          <Dialog
            open={showIndividualDateModal}
            onOpenChange={setShowIndividualDateModal}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Select Date for {selectedEmployee?.username}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedIndividualDate
                          ? selectedIndividualDate.toLocaleDateString()
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedIndividualDate}
                        onSelect={(date) =>
                          date && setSelectedIndividualDate(date)
                        }
                        disabled={(date) => {
                          if (!selectedEmployee) return true;
                          return !isDateValid(date, selectedEmployee);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedEmployee && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-800">
                      <strong>Action:</strong> Mark {selectedEmployee.username}{" "}
                      as {pendingAttendanceAction?.status} for{" "}
                      {selectedIndividualDate.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Project:{" "}
                      {selectedEmployee.project?.project_name ||
                        "No Project Assigned"}
                    </div>
                    {selectedEmployee.project && (
                      <div className="text-xs text-green-600">
                        Valid dates:{" "}
                        {new Date(
                          selectedEmployee.project.start_date || new Date()
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          selectedEmployee.project.end_date || new Date()
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowIndividualDateModal(false);
                    setPendingAttendanceAction(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={confirmIndividualAttendance}
                  disabled={
                    !selectedEmployee ||
                    !isDateValid(selectedIndividualDate, selectedEmployee)
                  }
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Confirm Attendance
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Confirmation Modal */}
          <AlertDialog
            open={showEditConfirmation}
            onOpenChange={setShowEditConfirmation}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Attendance Already Exists
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedEmployee?.username} already has attendance marked as
                  "{existingAttendance?.status}" for{" "}
                  {pendingAttendanceAction?.date.toLocaleDateString()}.
                  <br />
                  <br />
                  Do you want to update it to "{pendingAttendanceAction?.status}
                  "?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setShowEditConfirmation(false);
                    setPendingAttendanceAction(null);
                    setExistingAttendance(null);
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleEditConfirmation}>
                  Update Attendance
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
}
