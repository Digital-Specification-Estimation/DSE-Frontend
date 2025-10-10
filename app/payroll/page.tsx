"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, DollarSign, Download, Filter, MoreHorizontal, Plus, Search, Upload, Users } from "lucide-react";
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
  status: 'Paid' | 'Pending' | 'Processing';
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filters, setFilters] = useState({
    trade: "all",
    project: "all",
    dailyRate: "all",
    remainingDays: "all",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  
  const [payrollSummary, setPayrollSummary] = useState({
    totalEmployees: 0,
    totalDaysWorked: 0,
    totalBaseline: 0,
    totalActualPayroll: 0,
    totalDailyActuallPayroll: 0
  });
  
  const { data: employees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const { data: trades = [], isLoading: isLoadingTrades } = useGetTradesQuery();
    const { data: projects = [], isLoading: isLoadingProjects } = useGetProjectsQuery();
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
    
          actualPayroll += netPayroll;
    
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
    
          // Create enhanced employee object with calculated values
          enhanced.push({
            ...employee,
            days_worked: employeeWorkingDays,
            totalActualPayroll: netPayroll,
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
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const totalEmployees = employees.length;
        const totalDaysWorked = employees.reduce((sum: number, emp: any) => sum + (emp.days_worked || 0), 0);
        const totalBaseline = employees.reduce((sum: number, emp: any) => sum + (emp.budget_baseline || 0), 0);
        const totalActualPayroll = employees.reduce((sum: number, emp: any) => sum + (emp.totalActualPayroll || 0), 0);
        const totalDailyActuallPayroll = employees.reduce((sum: number, emp: any) => sum + (emp.daily_rate || 0), 0);
        
        setPayrollSummary({
          totalEmployees,
          totalDaysWorked,
          totalBaseline,
          totalActualPayroll,
          totalDailyActuallPayroll
        });
        
        const mockData: PayrollRecord[] = employees.map((emp: any) => ({
          id: emp.id,
          employeeName: emp.username,
          position: emp.trade_position?.trade_name || 'N/A',
          period: format(new Date(), 'MMMM yyyy'),
          baseSalary: emp.daily_rate * emp.days_worked || 0,
          overtime: 0,
          bonuses: 0,
          deductions: 0,
          netPay: emp.totalActualPayroll || 0,
          status: 'Paid',
          paymentDate: format(new Date(), 'yyyy-MM-dd')
        }));
        
        setPayrollData(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching payroll data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payroll data',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    fetchPayrollData();
  }, [toast, employees]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: sessionData?.user?.companies?.[0]?.base_currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredData = payrollData.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const totalPayroll = payrollData.reduce((sum, record) => sum + record.netPay, 0);
  const paidCount = payrollData.filter(record => record.status === 'Paid').length;
  const pendingCount = payrollData.filter(record => record.status === 'Pending').length;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={sessionData?.user} />
        <div className="flex-1 overflow-auto">
          <DashboardHeader title="Payroll Management" />
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }
    console.log("payrollData", payrollData);
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={sessionData?.user} />
      <div className="flex-1 overflow-auto">
        <DashboardHeader title="Payroll Management" />
        <main className="p-6 space-y-6">
          <div className="px-4 pb-4">
            <div className="grid grid-cols-5 gap-4 mb-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">
                  Total Employees
                </div>
                <div className="text-xl font-bold">
                  {enhancedEmployees.length}
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
                  {
                    <ConvertedAmount
                      amount={totals.totalBaseline}
                      currency={sessionData.user.currency}
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
                      currency={sessionData.user.currency}
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
                <tr className="border-t border-b text-[14px] text-gray-500">
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
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {currentItems.map((employee: any) => (
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
                      {
                        <ConvertedAmount
                          amount={employee.daily_rate}
                          currency={sessionData.user.currency}
                          sessionData={sessionData}
                        />
                      }
                    </td>
                    <td className="px-4 py-3 border-r">
                      {employee.days_worked}
                    </td>
                    <td className="px-4 py-3 border-r">
                      {
                        <ConvertedAmount
                          amount={employee.budget_baseline}
                          currency={sessionData.user.currency}
                          sessionData={sessionData}
                        />
                      }
                    </td>
                    <td className="px-4 py-3 border-r">
                      {
                        <ConvertedAmount
                          amount={employee.totalActualPayroll}
                          currency={sessionData.user.currency}
                          sessionData={sessionData}
                        />
                      }
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
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
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
                  <ChevronsLeft className="h-4 w-4" />
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
                  // Calculate page numbers to show (current page in the middle when possible)
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
                
                {/* Show ellipsis if there are more pages */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                
                {/* Show last page if not already visible */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    className={`h-8 w-8 p-0 ${currentPage === totalPages ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    onClick={() => goToPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage >= totalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
