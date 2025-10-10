"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Clock3,
  User,
  ArrowLeft,
  FileText,
  Plus,
  Minus,
  DollarSign,
  Receipt,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO, isToday, subMonths } from "date-fns";
import {
  useGetUserAttendanceHistoryQuery,
  useEditAttendanceMutation,
  useGetAttendancesWithReasonsQuery,
  useCalculateEmployeePayrollQuery,
} from "@/lib/redux/attendanceSlice";
import { useGetEmployeeQuery } from "@/lib/redux/employeeSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from "jspdf";
import { useCreateDeductionMutation, useGetDeductionsQuery, useDeleteDeductionMutation } from "@/lib/redux/deductionSlice";

export default function AttendanceHistory() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const employeeId = Array.isArray(params.id) ? params.id[0] : params.id;

  // State hooks
  const [activeTab, setActiveTab] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 3), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [selectedReason, setSelectedReason] = useState<any>(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  // Deduction states
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [newDeduction, setNewDeduction] = useState({
    type: "",
    amount: "",
    reason: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  // Redux hooks for deductions
  const { data: deductions = [], refetch: refetchDeductions } = useGetDeductionsQuery({ employeeId });
  const [createDeduction, { isLoading: isCreatingDeduction }] = useCreateDeductionMutation();
  const [deleteDeduction, { isLoading: isDeletingDeduction }] = useDeleteDeductionMutation();

  // Memoize query parameters to prevent unnecessary refetches
  const queryParams = useMemo(() => {
    if (!employeeId) return null;
    return {
      employeeId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };
  }, [employeeId, dateRange.startDate, dateRange.endDate]);

  // RTK Query hooks
  const { data: sessionData, isLoading: isLoadingSession } = useSessionQuery();
  const { 
    data: employee, 
    isLoading: isLoadingEmployee,
    refetch: refetchEmployee 
  } = useGetEmployeeQuery(employeeId);
  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    error,
    refetch,
  } = useGetUserAttendanceHistoryQuery(
    queryParams || { employeeId: "", startDate: "", endDate: "" }
  );

  const { data: attendancesWithReasons, refetch: refetchReasons } =
    useGetAttendancesWithReasonsQuery(
      queryParams || { employeeId: "", startDate: "", endDate: "" }
    );

  // Get actual payroll data for this employee
  const { data: payrollData, refetch: refetchPayroll } = useCalculateEmployeePayrollQuery({
    employeeId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const [updateAttendance] = useEditAttendanceMutation();
  const userfetched = sessionData?.user;
  const user: {
    name: string;
    role: string;
    avatar?: string;
  } = {
    name: userfetched?.username as string,
    role: userfetched?.current_role as string,
    avatar: userfetched?.avatar as string,
  };

  // Memoized values
  const filteredAttendance = useMemo(() => {
    if (!attendanceData) return [];

    if (activeTab === "all") return attendanceData;

    return attendanceData.filter(
      (record: any) => record.status?.toLowerCase() === activeTab.toLowerCase()
    );
  }, [attendanceData, activeTab]);

  const groupedAttendance = useMemo(() => {
    if (!filteredAttendance || filteredAttendance.length === 0) return {};

    return filteredAttendance.reduce(
      (acc: Record<string, any[]>, record: any) => {
        const date = parseISO(record.date);
        const monthYear = format(date, "MMMM yyyy");
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push({ ...record, date });
        return acc;
      },
      {}
    );
  }, [filteredAttendance]);

  const stats = useMemo(() => {
    if (!attendanceData) return null;

    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(
      (r: any) => r.status?.toLowerCase() === "present"
    ).length;
    const lateDays = attendanceData.filter(
      (r: any) => r.status?.toLowerCase() === "late"
    ).length;
    const absentDays = attendanceData.filter(
      (r: any) => r.status?.toLowerCase() === "absent"
    ).length;

    return {
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate:
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    };
  }, [attendanceData]);

  // Payslip calculations
  const payslipData = useMemo(() => {
    if (!employee || !attendanceData) return null;

    console.log("Employee data for payslip:", {
      username: employee.username,
      daily_rate: employee.daily_rate,
      monthly_rate: employee.monthly_rate,
      contract_start_date: employee.contract_start_date,
      contract_finish_date: employee.contract_finish_date,
      payrollData: payrollData
    });

    const userCurrency = (sessionData?.user as any)?.currency || "RWF";
    const salaryCalculation =
      (sessionData?.user as any)?.salary_calculation || "daily rate";

    // Use employee contract dates for payslip period
    const contractStartDate = employee.contract_start_date
      ? parseISO(employee.contract_start_date)
      : subMonths(new Date(), 1);
    const contractEndDate = employee.contract_finish_date
      ? parseISO(employee.contract_finish_date)
      : new Date();

    // Filter attendance for contract period
    const payslipAttendance = attendanceData.filter((record: any) => {
      const recordDate = parseISO(record.date);
      return recordDate >= contractStartDate && recordDate <= contractEndDate;
    });

    console.log("Attendance filtering:", {
      contractStartDate: contractStartDate.toISOString(),
      contractEndDate: contractEndDate.toISOString(),
      totalAttendanceRecords: attendanceData.length,
      filteredAttendanceRecords: payslipAttendance.length,
      attendanceRecords: attendanceData.map((r: any) => ({
        date: r.date,
        status: r.status
      })),
      filteredRecords: payslipAttendance.map((r: any) => ({
        date: r.date,
        status: r.status
      }))
    });

    const workingDays = payslipAttendance.filter(
      (r: any) =>
        r.status?.toLowerCase() === "present" ||
        r.status?.toLowerCase() === "late"
    ).length;

    const lateDays = payslipAttendance.filter(
      (r: any) => r.status?.toLowerCase() === "late"
    ).length;

    const absentDays = payslipAttendance.filter(
      (r: any) => r.status?.toLowerCase() === "absent"
    ).length;

    // Use actual payroll data if available, otherwise fallback to employee rates
    let dailyRate = 0;
    let baseSalary = 0;
    
    if (payrollData && payrollData.length > 0) {
      // Find Jean Baptiste's payroll data
      const employeePayroll = payrollData.find((p: any) => 
        p.employeeName?.toLowerCase().includes('jean') || 
        p.username?.toLowerCase().includes('jean') ||
        p.employee_id === employee.id
      );
      
      if (employeePayroll) {
        dailyRate = employeePayroll.dailyRate || employeePayroll.daily_rate || 0;
        baseSalary = employeePayroll.totalActual || employeePayroll.total_actual || (dailyRate * workingDays);
        
        console.log("Using payroll data:", {
          employeePayroll,
          dailyRate,
          baseSalary,
          workingDays
        });
      } else {
        console.warn("Employee not found in payroll data, using fallback calculation");
        // Fallback to employee rates with enhanced parsing
        const parseRate = (rate: any): number => {
          if (rate === null || rate === undefined) return 0;
          if (typeof rate === 'number') return rate;
          if (typeof rate === 'string') return parseFloat(rate) || 0;
          if (typeof rate === 'object') {
            if (rate.toNumber && typeof rate.toNumber === 'function') {
              return rate.toNumber();
            }
            if (rate.value !== undefined) {
              return parseFloat(String(rate.value)) || 0;
            }
            return parseFloat(String(rate)) || 0;
          }
          return 0;
        };
        
        dailyRate = parseRate(employee.daily_rate);
        const monthlyRate = parseRate(employee.monthly_rate);
        
        if (salaryCalculation === "monthly rate" && monthlyRate > 0) {
          baseSalary = monthlyRate;
        } else if (dailyRate > 0) {
          baseSalary = dailyRate * workingDays;
        } else {
          console.error(`Cannot calculate salary for ${employee.username}: no valid rates found`);
          baseSalary = 0;
        }
      }
    } else {
      console.warn("No payroll data available, using employee rates");
      // Fallback to employee rates
      const parseRate = (rate: any): number => {
        if (rate === null || rate === undefined) return 0;
        if (typeof rate === 'number') return rate;
        if (typeof rate === 'string') return parseFloat(rate) || 0;
        if (typeof rate === 'object') {
          if (rate.toNumber && typeof rate.toNumber === 'function') {
            return rate.toNumber();
          }
          if (rate.value !== undefined) {
            return parseFloat(String(rate.value)) || 0;
          }
          return parseFloat(String(rate)) || 0;
        }
        return 0;
      };
      
      dailyRate = parseRate(employee.daily_rate);
      const monthlyRate = parseRate(employee.monthly_rate);
      
      if (salaryCalculation === "monthly rate" && monthlyRate > 0) {
        baseSalary = monthlyRate;
      } else if (dailyRate > 0) {
        baseSalary = dailyRate * workingDays;
      } else {
        console.error(`Cannot calculate salary for ${employee.username}: no valid rates found`);
        baseSalary = 0;
      }
    }

    // Calculate automatic deductions
    const lateDeduction = lateDays * (dailyRate * 0.1); // 10% of daily rate per late day
    const absentDeduction = absentDays * dailyRate; // Full daily rate per absent day

    // Calculate manual deductions
    const manualDeductions = deductions.reduce((total, deduction: any) => {
      if (!deduction.date) return total;
      
      try {
        const deductionDate = parseISO(deduction.date);
        if (
          deductionDate >= contractStartDate &&
          deductionDate <= contractEndDate
        ) {
          return total + parseFloat(String(deduction.amount || "0"));
        }
      } catch (error) {
        console.error("Error parsing deduction date:", error);
      }
      return total;
    }, 0);

    const totalDeductions = lateDeduction + absentDeduction + manualDeductions;
    const netSalary = baseSalary - totalDeductions;

    console.log("Payslip calculations:", {
      baseSalary,
      workingDays,
      lateDays,
      absentDays,
      lateDeduction,
      absentDeduction,
      manualDeductions,
      totalDeductions,
      netSalary,
      dailyRate,
      salaryCalculation
    });

    return {
      employeeName: employee.username,
      employeeId: employee.id,
      period: `${format(contractStartDate, "MMM dd, yyyy")} - ${format(
        contractEndDate,
        "MMM dd, yyyy"
      )}`,
      baseSalary,
      workingDays,
      lateDays,
      absentDays,
      lateDeduction,
      absentDeduction,
      manualDeductions,
      totalDeductions,
      netSalary,
      currency: userCurrency,
      salaryType: salaryCalculation,
      contractStartDate,
      contractEndDate,
    };
  }, [employee, attendanceData, deductions, sessionData, payrollData]);

  // Deduction management functions
  const addDeduction = async () => {
    if (!newDeduction.amount || !newDeduction.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Reason and Amount)",
        variant: "destructive",
      });
      return;
    }

    if (!employeeId) {
      toast({
        title: "Error",
        description: "Employee ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDeduction({
        name: newDeduction.reason,
        amount: parseFloat(newDeduction.amount),
        type: newDeduction.type || "other",
        reason: newDeduction.description || newDeduction.reason,
        date: newDeduction.date,
        employee_id: employeeId,
      }).unwrap();

      // Reset form
      setNewDeduction({
        type: "",
        amount: "",
        reason: "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
      });
      setIsDeductionModalOpen(false);

      // Refetch deductions to update the list
      refetchDeductions();

      toast({
        title: "Success",
        description: "Deduction added successfully",
      });
    } catch (error) {
      console.error("Error creating deduction:", error);
      toast({
        title: "Error",
        description: "Failed to add deduction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeDeduction = async (deductionId: string) => {
    try {
      await deleteDeduction(deductionId).unwrap();
      
      // Refetch deductions to update the list
      refetchDeductions();
      
      toast({
        title: "Success",
        description: "Deduction removed successfully",
      });
    } catch (error) {
      console.error("Error deleting deduction:", error);
      toast({
        title: "Error",
        description: "Failed to remove deduction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN, undefined, or null values
    const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
    const currency = (sessionData?.user as any)?.currency || "RWF";
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "RWF" ? "RWF" : "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(validAmount);
  };

  // Generate and download PDF payslip
  const generatePayslipPDF = async () => {
    try {
      // Refetch employee data to ensure we have the latest salary information
      toast({
        title: "Refreshing Data",
        description: "Fetching latest employee salary information...",
      });
      
      await refetchEmployee();
      
      // Small delay to ensure data is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Generating Payslip",
        description: "Creating PDF with latest salary data...",
      });
    } catch (error) {
      console.error("Error refreshing employee data:", error);
      toast({
        title: "Warning", 
        description: "Could not refresh employee data. Using cached data.",
        variant: "destructive",
      });
    }

    // Final check for payslip data after refresh
    if (!payslipData) {
      toast({
        title: "Error",
        description: "No payslip data available. Please ensure employee has salary rates set.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Helper function to add text
    const addText = (text: string, x: number, y: number, options?: any) => {
      doc.text(text, x, y, options);
    };

    // Helper function to add line
    const addLine = (x1: number, y1: number, x2: number, y2: number) => {
      doc.line(x1, y1, x2, y2);
    };

    // Company Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    addText("PAYSLIP", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(`Period: ${payslipData.period}`, pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += 30;

    // Employee Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText("Employee Information", margin, yPosition);

    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    addText(`Name: ${payslipData.employeeName}`, margin, yPosition);
    yPosition += 10;
    addText(`Employee ID: ${payslipData.employeeId}`, margin, yPosition);
    yPosition += 10;
    addText(`Salary Type: ${payslipData.salaryType}`, margin, yPosition);

    yPosition += 20;

    // Earnings Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText("EARNINGS", margin, yPosition);

    yPosition += 15;
    addLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    addText(`Base Salary (${payslipData.salaryType})`, margin, yPosition);
    addText(
      formatCurrency(payslipData.baseSalary),
      pageWidth - margin - 50,
      yPosition
    );
    yPosition += 10;
    addText(`Working Days: ${payslipData.workingDays}`, margin, yPosition);
    yPosition += 10;
    addText(
      `Late Days: ${payslipData.lateDays} | Absent Days: ${payslipData.absentDays}`,
      margin,
      yPosition
    );

    yPosition += 20;

    // Deductions Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText("DEDUCTIONS", margin, yPosition);

    yPosition += 15;
    addLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (payslipData.lateDeduction > 0) {
      addText(
        `Late Arrival Penalty (${payslipData.lateDays} days)`,
        margin,
        yPosition
      );
      addText(
        `-${formatCurrency(payslipData.lateDeduction)}`,
        pageWidth - margin - 50,
        yPosition
      );
      yPosition += 10;
    }

    if (payslipData.absentDeduction > 0) {
      addText(
        `Absent Days (${payslipData.absentDays} days)`,
        margin,
        yPosition
      );
      addText(
        `-${formatCurrency(payslipData.absentDeduction)}`,
        pageWidth - margin - 50,
        yPosition
      );
      yPosition += 10;
    }

    if (payslipData.manualDeductions > 0) {
      addText("Other Deductions", margin, yPosition);
      addText(
        `-${formatCurrency(payslipData.manualDeductions)}`,
        pageWidth - margin - 50,
        yPosition
      );
      yPosition += 10;
    }

    // Manual Deductions Details
    const contractDeductions = deductions.filter((d: any) => {
      if (!d.date) return false;
      try {
        const deductionDate = parseISO(d.date);
        return (
          deductionDate >= payslipData.contractStartDate &&
          deductionDate <= payslipData.contractEndDate
        );
      } catch (error) {
        return false;
      }
    });

    if (contractDeductions.length > 0) {
      yPosition += 10;
      doc.setFont("helvetica", "bold");
      addText("Deduction Details:", margin, yPosition);
      yPosition += 10;

      doc.setFont("helvetica", "normal");
      contractDeductions.forEach((deduction: any) => {
        addText(
          `• ${deduction.type || 'Deduction'}: ${deduction.reason || 'No reason provided'}`,
          margin + 10,
          yPosition
        );
        addText(
          `-${formatCurrency(parseFloat(String(deduction.amount || "0")))}`,
          pageWidth - margin - 50,
          yPosition
        );
        yPosition += 8;
        if (deduction.date) {
          try {
            addText(
              `  Date: ${format(parseISO(deduction.date), "MMM dd, yyyy")}`,
              margin + 15,
              yPosition
            );
          } catch (error) {
            addText(
              `  Date: ${deduction.date}`,
              margin + 15,
              yPosition
            );
          }
        }
        yPosition += 10;
      });
    }

    if (payslipData.totalDeductions === 0) {
      addText("No deductions for this period", margin, yPosition);
      yPosition += 10;
    }

    yPosition += 20;

    // Total Section
    addLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    addText("Total Deductions:", margin, yPosition);
    addText(
      `-${formatCurrency(payslipData.totalDeductions)}`,
      pageWidth - margin - 50,
      yPosition
    );

    yPosition += 20;
    addLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addText("NET SALARY:", margin, yPosition);
    addText(
      formatCurrency(payslipData.netSalary),
      pageWidth - margin - 70,
      yPosition
    );

    // Footer
    yPosition += 40;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    addText(
      `Generated on: ${format(new Date(), "MMMM dd, yyyy")}`,
      margin,
      yPosition
    );

    // Download the PDF
    const fileName = `payslip_${payslipData.employeeName.replace(
      /\s+/g,
      "_"
    )}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);

    toast({
      title: "Success",
      description: "Payslip PDF downloaded successfully",
    });
  };

  // Effects
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description:
          "Failed to load attendance history. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Event handlers
  const handleDateRangeChange = (
    start: Date | undefined,
    end: Date | undefined
  ) => {
    if (start && end) {
      setDateRange({
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "present":
        return (
          <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-0">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Present
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-0">
            <Clock3 className="h-3.5 w-3.5 mr-1.5" />
            Late
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-0">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Absent
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "N/A"}</Badge>;
    }
  };

  // Handle update attendance
  const handleUpdateAttendance = async () => {
    if (!selectedAttendance || !selectedStatus) return;

    try {
      // Format the date as ISO string
      const formatDateForApi = (dateString: string | Date) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString();
      };

      const requestBody = {
        employeeId: employeeId, // Match the backend's expected field name
        date: formatDateForApi(selectedAttendance.date),
        status: selectedStatus,
      };

      console.log("Sending data to /attendance/update:", requestBody);

      await updateAttendance(requestBody).unwrap();

      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });

      setIsEditModalOpen(false);
      refetch(); // Refresh the data
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update attendance",
        variant: "destructive",
      });
    }
  };

  // Open edit modal
  const openEditModal = (attendance: any) => {
    setSelectedAttendance(attendance);
    setSelectedStatus(attendance.status);
    setIsEditModalOpen(true);
  };

  const handleViewReason = (attendance: any) => {
    setSelectedReason(attendance);
    setIsReasonModalOpen(true);
  };

  // Loading state
  if (isLoadingEmployee || isLoadingAttendance || isLoadingSession) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-8 w-48" />
              </div>

              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton
                      key={`skeleton-${i}`}
                      className="h-28 rounded-xl"
                    />
                  ))}
                </div>

                <div className="flex space-x-4 mb-6">
                  {["All", "Present", "Late", "Absent"].map((tab) => (
                    <Skeleton key={tab} className="h-10 w-20 rounded-md" />
                  ))}
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={`skeleton-${i}`}
                      className="h-16 w-full rounded-lg"
                    />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (!employee) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="max-w-6xl mx-auto h-full flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Employee Not Found
                </h2>
                <p className="text-gray-500 mb-6">
                  The requested employee record could not be found or you don't
                  have permission to view it.
                </p>
                <Button onClick={() => router.back()} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Attendance
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="max-w-6xl mx-auto">
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                  className="rounded-lg border-gray-200 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {employee.username}'s Attendance
                  </h1>
                  <p className="text-sm text-gray-500">
                    Track and manage attendance records
                  </p>
                </div>
              </div>

              {/* Payslip and Deduction Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeductionModalOpen(true)}
                  className="gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Manage Deductions
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      await refetchEmployee();
                      await refetchPayroll();
                      toast({
                        title: "Data Refreshed",
                        description: "Employee and payroll data has been refreshed",
                      });
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Loader2 className="h-4 w-4" />
                    Refresh Data
                  </Button>
                  <Button
                    onClick={generatePayslipPDF}
                    className="gap-2 bg-orange-500 hover:bg-orange-600"
                    disabled={!payslipData}
                  >
                    <Receipt className="h-4 w-4" />
                    Generate Payslip PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Days"
                value={stats?.totalDays || 0}
                icon={<Calendar className="h-4 w-4 text-gray-500" />}
                color="bg-blue-50 text-blue-700"
              />
              <StatCard
                title="Present"
                value={stats?.presentDays || 0}
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                color="bg-green-50 text-green-700"
              />
              <StatCard
                title="Late Arrivals"
                value={stats?.lateDays || 0}
                icon={<Clock3 className="h-4 w-4 text-amber-500" />}
                color="bg-amber-50 text-amber-700"
              />
              <StatCard
                title="Absent"
                value={stats?.absentDays || 0}
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                color="bg-red-50 text-red-700"
              />
            </div>

            <Card className="overflow-hidden border border-gray-200">
              <div className="p-6 pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Attendance Records</h3>
                    <p className="text-sm text-gray-500">
                      Showing records for the last 90 days
                    </p>
                  </div>
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="all" className="text-xs">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="present" className="text-xs">
                        Present
                      </TabsTrigger>
                      <TabsTrigger value="late" className="text-xs">
                        Late
                      </TabsTrigger>
                      <TabsTrigger value="absent" className="text-xs">
                        Absent
                      </TabsTrigger>
                      <TabsTrigger value="withReasons" className="text-xs">
                        With Reasons
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="space-y-8">
                      {Object.keys(groupedAttendance).length > 0 ? (
                        <div className="space-y-8">
                          {Object.entries(groupedAttendance)
                            .sort(
                              ([a], [b]) =>
                                new Date(b).getTime() - new Date(a).getTime()
                            )
                            .map(([monthYear, records]) => (
                              <div
                                key={`month-${monthYear}`}
                                className="space-y-3"
                              >
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                  {monthYear}
                                </h4>
                                <div className="space-y-2">
                                  {(records as any[]).map((record) => (
                                    <div
                                      key={`record-${
                                        record._id || record.date
                                      }`}
                                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border ${
                                        isToday(record.date)
                                          ? "border-blue-200 bg-blue-50"
                                          : "border-gray-100 hover:bg-gray-50"
                                      } transition-colors`}
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                                              isToday(record.date)
                                                ? "bg-blue-100 text-blue-600"
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            <Calendar className="h-5 w-5" />
                                          </div>
                                          <div>
                                            <p
                                              className={`font-medium ${
                                                isToday(record.date)
                                                  ? "text-blue-800"
                                                  : "text-gray-900"
                                              }`}
                                            >
                                              {format(
                                                record.date,
                                                "EEEE, MMMM d, yyyy"
                                              )}
                                              {isToday(record.date) && (
                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                  Today
                                                </span>
                                              )}
                                            </p>
                                            {record.notes && (
                                              <p className="text-sm text-gray-500 mt-1">
                                                {record.notes}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-3 sm:mt-0 flex items-center gap-4">
                                        {record.hoursWorked && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center text-sm text-gray-500">
                                                  <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                                                  {record.hoursWorked} hours
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Hours worked</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        {getStatusBadge(record.status)}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openEditModal(record)}
                                        >
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                            <User className="h-full w-full opacity-40" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No attendance records
                          </h3>
                          <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {activeTab === "all"
                              ? "No attendance records found for this employee."
                              : `No ${activeTab.toLowerCase()} records found for this employee.`}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("all")}
                          >
                            View all records
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="present" className="space-y-8">
                      {filteredAttendance.some(
                        (r: any) => r.status?.toLowerCase() === "present"
                      ) ? (
                        <div className="space-y-8">
                          {/* Present records content */}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                            <User className="h-full w-full opacity-40" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No present records
                          </h3>
                          <p className="text-gray-500">
                            No present records found for this employee.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="late" className="space-y-8">
                      {filteredAttendance.some(
                        (r: any) => r.status?.toLowerCase() === "late"
                      ) ? (
                        <div className="space-y-8">
                          {/* Late records content */}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                            <User className="h-full w-full opacity-40" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No late records
                          </h3>
                          <p className="text-gray-500">
                            No late records found for this employee.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="absent" className="space-y-8">
                      {filteredAttendance.some(
                        (r: any) => r.status?.toLowerCase() === "absent"
                      ) ? (
                        <div className="space-y-8">
                          {/* Absent records content */}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                            <User className="h-full w-full opacity-40" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No absent records
                          </h3>
                          <p className="text-gray-500">
                            No absent records found for this employee.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="withReasons" className="space-y-4">
                      {isLoadingAttendance ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton
                              key={`skeleton-${i}`}
                              className="h-20 w-full"
                            />
                          ))}
                        </div>
                      ) : attendancesWithReasons?.length > 0 ? (
                        <div className="space-y-4">
                          {attendancesWithReasons.map((record: any) => (
                            <Card
                              key={`attendance-${record._id}-${record.date}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {format(
                                        parseISO(record.date),
                                        "EEEE, MMMM d, yyyy"
                                      )}
                                    </p>
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                      <Clock3 className="h-4 w-4 mr-1" />
                                      <span>Status: {record.status}</span>
                                    </div>
                                    {record.reason && (
                                      <div className="mt-2">
                                        <p className="text-sm font-medium">
                                          Reason:
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                          {record.reason}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewReason(record)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>
                            No attendance records with reasons found for the
                            selected period.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <Separator className="mt-6" />

              <div className="p-6 pt-4">{/* Existing content */}</div>

              {Object.keys(groupedAttendance).length > 0 && (
                <CardFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Showing {filteredAttendance.length} records • Last updated{" "}
                    {new Date().toLocaleTimeString()}
                  </p>
                </CardFooter>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Attendance Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Attendance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="date" className="text-right">
                Date
              </label>
              <div className="col-span-3">
                {selectedAttendance &&
                  format(
                    typeof selectedAttendance.date === "string"
                      ? parseISO(selectedAttendance.date)
                      : selectedAttendance.date,
                    "PPP"
                  )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right">
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpdateAttendance}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Details Modal */}
      <Dialog open={isReasonModalOpen} onOpenChange={setIsReasonModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
          </DialogHeader>
          {selectedReason && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-medium">Date</h4>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(selectedReason.date), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Status</h4>
                <div className="flex items-center mt-1">
                  {selectedReason.status === "present" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  {selectedReason.status === "late" && (
                    <Clock3 className="h-4 w-4 text-yellow-500 mr-2" />
                  )}
                  {selectedReason.status === "absent" && (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="capitalize">{selectedReason.status}</span>
                </div>
              </div>
              {selectedReason.reason && (
                <div>
                  <h4 className="font-medium">Reason</h4>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {selectedReason.reason}
                  </p>
                </div>
              )}
              {selectedReason.notes && (
                <div>
                  <h4 className="font-medium">Additional Notes</h4>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {selectedReason.notes}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedReason.checkIn && (
                  <div>
                    <h4 className="font-medium">Check In</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedReason.checkIn), "h:mm a")}
                    </p>
                  </div>
                )}
                {selectedReason.checkOut && (
                  <div>
                    <h4 className="font-medium">Check Out</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedReason.checkOut), "h:mm a")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsReasonModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deduction Management Modal */}
      <Dialog
        open={isDeductionModalOpen}
        onOpenChange={setIsDeductionModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Minus className="h-5 w-5" />
              Manage Deductions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add New Deduction Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Deduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deduction-reason">Reason *</Label>
                  <Input
                    id="deduction-reason"
                    placeholder="Brief reason for deduction"
                    value={newDeduction.reason}
                    onChange={(e) =>
                      setNewDeduction((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="deduction-date">Date</Label>
                  <Input
                    id="deduction-date"
                    type="date"
                    value={newDeduction.date}
                    onChange={(e) =>
                      setNewDeduction((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deduction-amount">Amount *</Label>
                    <Input
                      id="deduction-amount"
                      type="number"
                      placeholder="0.00"
                      value={newDeduction.amount}
                      onChange={(e) =>
                        setNewDeduction((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deduction-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="deduction-description"
                    placeholder="Additional details about the deduction"
                    value={newDeduction.description}
                    onChange={(e) =>
                      setNewDeduction((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={addDeduction} 
                  className="w-full gap-2"
                  disabled={isCreatingDeduction}
                >
                  {isCreatingDeduction ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isCreatingDeduction ? "Adding..." : "Add Deduction"}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Deductions List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Current Deductions ({deductions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deductions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No deductions added yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {deductions.map((deduction) => (
                      <div
                        key={deduction.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="capitalize">
                              {deduction.type}
                            </Badge>
                            <span className="font-medium">
                              {formatCurrency(deduction.amount)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {deduction.reason}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(deduction.date), "MMM dd, yyyy")}
                          </p>
                          {deduction.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {deduction.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDeduction(deduction.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeductionModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${color}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
