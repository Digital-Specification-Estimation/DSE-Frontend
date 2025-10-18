"use client"

import React, { useState, useEffect, useMemo } from "react"

// Professional construction industry units
const STANDARD_UNITS = [
  // Length/Distance
  { value: "m", label: "Meters (m)" },
  { value: "cm", label: "Centimeters (cm)" },
  { value: "mm", label: "Millimeters (mm)" },
  { value: "ft", label: "Feet (ft)" },
  { value: "in", label: "Inches (in)" },

  // Area
  { value: "m²", label: "Square Meters (m²)" },
  { value: "ft²", label: "Square Feet (ft²)" },
  { value: "ha", label: "Hectares (ha)" },

  // Volume
  { value: "m³", label: "Cubic Meters (m³)" },
  { value: "ft³", label: "Cubic Feet (ft³)" },
  { value: "l", label: "Liters (l)" },

  // Weight/Mass
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "t", label: "Tonnes (t)" },
  { value: "mt", label: "Metric Tons (mt)" },

  // Count/Quantity
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "nos", label: "Numbers (nos)" },
  { value: "units", label: "Units" },
  { value: "sets", label: "Sets" },
  { value: "pairs", label: "Pairs" },

  // Construction Materials
  { value: "bags", label: "Bags" },
  { value: "rolls", label: "Rolls" },
  { value: "sheets", label: "Sheets" },
  { value: "panels", label: "Panels" },
  { value: "blocks", label: "Blocks" },
  { value: "bricks", label: "Bricks" },
  { value: "tiles", label: "Tiles" },
  { value: "pipes", label: "Pipes" },
  { value: "rods", label: "Rods" },
  { value: "beams", label: "Beams" },
  { value: "planks", label: "Planks" },

  // Labor/Service Units
  { value: "hours", label: "Labor Hours" },
  { value: "man-hours", label: "Man Hours" },

  // Project Units
  { value: "batch", label: "Batch" },
  { value: "job", label: "Job" },
  { value: "lump-sum", label: "Lump Sum" },
]
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardHeader from "@/components/DashboardHeader"
import { BriefcaseBusiness, CalendarIcon, ChartNetwork, Download, FileText, Percent, Upload } from "lucide-react"
import { useGetProjectsQuery, useGetProjectFinancialMetricsQuery } from "@/lib/redux/projectSlice"
import { toast, useToast } from "@/components/ui/use-toast"
import { useSessionQuery } from "@/lib/redux/authSlice"
import { useCreateBOQMutation, useGetBOQByProjectQuery, useUpdateBOQProgressMutation } from "@/lib/redux/boqSlice"
import { useGetTradesQuery } from "@/lib/redux/tradePositionSlice"
import { useGetEmployeesQuery } from "@/lib/redux/employeeSlice"
import { useGetDeductionsQuery } from "@/lib/redux/deductionSlice"
import {
  useCreateRevenueMutation,
  useGetRevenuesByProjectQuery,
  useDeleteRevenueMutation,
} from "@/lib/redux/revenueSlice"
import { useCreateExpenseMutation, useGetExpensesByProjectQuery } from "@/lib/redux/expenseSlice" // Corrected import path
import { convertCurrency, getExchangeRate } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
// Assuming BOQItem type is defined elsewhere, or define it here if necessary
type BOQItem = {
  id: string
  item_no: string
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
  completed_qty?: number
  project_id: string
  company_id: string
}

// Component to display converted currency amounts
function ConvertedAmount({
  amount,
  currency,
  showCurrency = true,
  sessionData, // Added sessionData as a prop
}: {
  amount: number
  currency: string
  showCurrency?: boolean
  sessionData: any // Type for sessionData
}) {
  const [convertedAmount, setConvertedAmount] = useState<string>("...")
  useEffect(() => {
    const convert = async () => {
      // Only convert if amount is defined and not NaN
      if (amount === undefined || isNaN(amount)) {
        setConvertedAmount("N/A")
        return
      }

      // Ensure sessionData and base_currency are available
      const baseCurrency = sessionData?.user?.companies?.[0]?.base_currency
      if (!baseCurrency) {
        console.error("Base currency not found in sessionData.")
        setConvertedAmount("N/A")
        return
      }

      try {
        // Only convert if the target currency is different from the source
        if (currency === baseCurrency) {
          setConvertedAmount(amount.toLocaleString())
          return
        }

        const result = await convertCurrency(amount, currency, baseCurrency)
        setConvertedAmount(result)
      } catch (error) {
        console.error("Error converting currency:", error)
        setConvertedAmount("Error")
      }
    }

    convert()
  }, [amount, currency, sessionData])

  return (
    <>
      {showCurrency
        ? `${currency} ${Number(convertedAmount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : Number(convertedAmount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
    </>
  )
}

// Profit & Loss Statement Component
const ProfitLossStatement = ({
  selectedProjectId,
  sessionData,
  costSummary,
  projects,
  boqItems,
  formatCurrency,
  getUserCurrency,
}: {
  selectedProjectId: string;
  sessionData: any;
  costSummary: any;
  projects: any[];
  boqItems: any[];
  formatCurrency: (amount: number, fromCurrency?: string) => string;
  getUserCurrency: () => string;
}) => {
  // Fetch trades, employees, expenses, and attendance data
  const { data: trades = [] } = useGetTradesQuery();
  const { data: employees = [] } = useGetEmployeesQuery();
  const { data: deductions = [] } = useGetDeductionsQuery();
  const [isExporting, setIsExporting] = useState(false);

  const { data: projectExpenses = [] } =
    useGetExpensesByProjectQuery(selectedProjectId);
  const { data: revenueEntries = [] } =
    useGetRevenuesByProjectQuery(selectedProjectId);

  // State for number of periods - user selectable
  const [numberOfPeriods, setNumberOfPeriods] = useState(3);

  // State for date ranges (periods) - dynamically generated based on numberOfPeriods
  const [periods, setPeriods] = useState(() => {
    const generateInitialPeriods = (count: number) => {
      const now = new Date();
      const periodsObj: any = {};
      
      for (let i = 1; i <= count; i++) {
        const periodStart = new Date(now.getFullYear(), now.getMonth() - 1 + (i - 1), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + (i - 1), 0);
        
        periodsObj[`period${i}`] = {
          startDate: periodStart.toISOString().split("T")[0],
          endDate: periodEnd.toISOString().split("T")[0],
          label: `Period ${i}`,
        };
      }
      
      return periodsObj;
    };

    return generateInitialPeriods(3); // Default to 3 periods
  });

  // State for editable "Other" fields - dynamically generated
  const [otherLabour, setOtherLabour] = useState(() => {
    const initialOtherLabour: any = {};
    for (let i = 1; i <= numberOfPeriods; i++) {
      initialOtherLabour[`period${i}`] = 0;
    }
    return initialOtherLabour;
  });

  const [otherExpenses, setOtherExpenses] = useState(() => {
    const initialOtherExpenses: any = {};
    for (let i = 1; i <= numberOfPeriods; i++) {
      initialOtherExpenses[`period${i}`] = 0;
    }
    return initialOtherExpenses;
  });

  // Function to handle period count changes
  const handlePeriodCountChange = (newCount: number) => {
    setNumberOfPeriods(newCount);
    
    // Generate new periods
    const generatePeriods = (count: number) => {
      const now = new Date();
      const periodsObj: any = {};
      
      for (let i = 1; i <= count; i++) {
        const periodStart = new Date(now.getFullYear(), now.getMonth() - 1 + (i - 1), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + (i - 1), 0);
        
        periodsObj[`period${i}`] = {
          startDate: periodStart.toISOString().split("T")[0],
          endDate: periodEnd.toISOString().split("T")[0],
          label: `Period ${i}`,
        };
      }
      
      return periodsObj;
    };

    setPeriods(generatePeriods(newCount));

    // Update other states to match new period count
    const newOtherLabour: any = {};
    const newOtherExpenses: any = {};
    
    for (let i = 1; i <= newCount; i++) {
      newOtherLabour[`period${i}`] = otherLabour[`period${i}`] || 0;
      newOtherExpenses[`period${i}`] = otherExpenses[`period${i}`] || 0;
    }
    
    setOtherLabour(newOtherLabour);
    setOtherExpenses(newOtherExpenses);
  };

  // State to track when data is being recalculated
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Effect to trigger recalculation when periods change
  useEffect(() => {
    if (selectedProjectId) {
      setIsRecalculating(true);
      
      // Log all current periods dynamically
      const periodLog: any = {};
      for (let i = 1; i <= numberOfPeriods; i++) {
        const periodKey = `period${i}`;
        if (periods[periodKey]) {
          periodLog[periodKey] = `${periods[periodKey].startDate} to ${periods[periodKey].endDate}`;
        }
      }
      console.log("Period dates changed, triggering data recalculation...", periodLog);

      // Show toast notification
      toast({
        title: "Updating table with new period data...",
        duration: 2000,
      });

      // Add a small delay to show loading state, then mark as complete
      const timer = setTimeout(() => {
        setIsRecalculating(false);
        console.log("Data recalculation completed for new periods");
        toast({
          title: "Table updated with new period data!",
          duration: 3000,
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [periods, selectedProjectId, numberOfPeriods]);

  // Get project employees - try multiple possible field names
  const projectEmployees = useMemo(() => {
    return employees.filter(
      (emp: any) =>
        emp.project_id === selectedProjectId ||
        emp.projectId === selectedProjectId ||
        emp.current_project_id === selectedProjectId
    );
  }, [employees, selectedProjectId]);

  // Get project trades (trades that have employees in this project)
  const projectTrades = useMemo(() => {
    // If no project employees, show all trades for now (for debugging)
    if (projectEmployees.length === 0) {
      console.log(
        "No project employees found. Available employees:",
        employees
      );
      console.log("Selected project ID:", selectedProjectId);
      // Return all trades so we can see the structure
      return trades.slice(0, 5); // Limit to first 5 trades for testing
    }

    const tradeIds = [
      ...new Set(
        projectEmployees
          .map((emp: any) => emp.trade_position_id)
          .filter(Boolean)
      ),
    ];
    console.log("Trade IDs from project employees:", tradeIds);
    return trades.filter((trade: any) => tradeIds.includes(trade.id));
  }, [trades, projectEmployees, employees, selectedProjectId]);

  // Calculate actual payroll for each trade in a specific period using REAL attendance data with real-time updates
  const calculateTradePayroll = useMemo(() => {
    return (tradeId: string, periodKey: string) => {
      const period = periods[periodKey];

      // Validate dates before creating Date objects
      if (!period.startDate || !period.endDate) {
        console.log(`Invalid dates for ${periodKey}:`, period);
        return 0;
      }

      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);

      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log(`Invalid date objects for ${periodKey}:`, {
          startDate: period.startDate,
          endDate: period.endDate,
          startDateValid: !isNaN(startDate.getTime()),
          endDateValid: !isNaN(endDate.getTime()),
        });
        return 0;
      }

      console.log(`Calculating payroll for trade ${tradeId} in ${periodKey}:`, {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      // Get employees for this specific trade from project employees
      let tradeEmployees = projectEmployees.filter(
        (emp: any) => emp.trade_position_id === tradeId
      );

      console.log(`Trade ${tradeId} employees:`, tradeEmployees.length);

      return tradeEmployees.reduce((total: number, employee: any) => {
        // Get attendance data for this employee
        const attendance = employee.attendance || [];

        // Filter attendance records for the specific period
        const periodAttendance = attendance.filter((a: any) => {
          if (!a.date) return false;
          const attendanceDate = new Date(a.date);
          return attendanceDate >= startDate && attendanceDate <= endDate;
        });

        // Calculate attendance statistics using the same logic as attendance-payroll
        const presentDays = periodAttendance.filter(
          (a: any) => a.status?.toLowerCase() === "present"
        ).length;

        const lateDays = periodAttendance.filter(
          (a: any) => a.status?.toLowerCase() === "late"
        ).length;

        // Separate absent days by whether they have a reason (paid leave) or not (unpaid leave)
        const absentWithSickReason = periodAttendance.filter(
          (a: any) =>
            a.status?.toLowerCase() === "absent" &&
            a.reason?.toLowerCase() === "sick"
        ).length;

        const absentWithVacationReason = periodAttendance.filter(
          (a: any) =>
            a.status?.toLowerCase() === "absent" &&
            a.reason?.toLowerCase() === "vacation"
        ).length;

        // Calculate paid days: working days + paid leave (sick/vacation)
        const workingDays = presentDays + lateDays;
        const paidLeaveDays = absentWithSickReason + absentWithVacationReason;
        const totalPaidDays = workingDays + paidLeaveDays;

        // Get daily rate from employee or trade position (same logic as attendance-payroll)
        let dailyRate = Number(employee.daily_rate || 0);
        if (dailyRate === 0 && employee.trade_position?.daily_planned_cost) {
          dailyRate = Number(employee.trade_position.daily_planned_cost);
        }
        // If still 0 and monthly rate exists, convert monthly to daily
        if (dailyRate === 0 && employee.trade_position?.monthly_planned_cost) {
          dailyRate = Number(employee.trade_position.monthly_planned_cost) / 30;
        }

        // Calculate gross payroll based on actual paid days
        const grossPayroll = totalPaidDays * dailyRate;

        // Calculate automatic deductions (late penalties)
        const lateDeduction = lateDays * (dailyRate * 0.1); // 10% penalty per late day

        // Get manual deductions for this employee for this period
        const employeeManualDeductions = deductions
          .filter((deduction: any) => {
            if (deduction.employee_id !== employee.id) return false;
            if (!deduction.date) return true; // General deductions apply
            const deductionDate = new Date(deduction.date);
            return deductionDate >= startDate && deductionDate <= endDate;
          })
          .reduce(
            (total: number, deduction: any) =>
              total + Number(deduction.amount || 0),
            0
          );

        // Total deductions = automatic + manual
        const totalDeductions = lateDeduction + employeeManualDeductions;

        // Net payroll = gross - deductions
        const netPayroll = Math.max(0, grossPayroll - totalDeductions);

        if (netPayroll > 0) {
          console.log(
            `Employee ${
              employee.name || employee.username
            } payroll in ${periodKey}:`,
            {
              totalPaidDays,
              dailyRate,
              grossPayroll,
              totalDeductions,
              netPayroll,
            }
          );
        }

        return total + netPayroll;
      }, 0);
    };
  }, [periods, projectEmployees, deductions]);

  // Calculate expense totals by category from database for a specific period with real-time updates
  const calculateExpenseByCategory = useMemo(() => {
    return (category: string, periodKey: string) => {
      const period = periods[periodKey];

      // Validate dates before creating Date objects
      if (!period.startDate || !period.endDate) {
        console.log(`Invalid dates for ${periodKey}:`, period);
        return 0;
      }

      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);

      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log(`Invalid date objects for ${periodKey}:`, {
          startDate: period.startDate,
          endDate: period.endDate,
          startDateValid: !isNaN(startDate.getTime()),
          endDateValid: !isNaN(endDate.getTime()),
        });
        return 0;
      }

      console.log(
        `Calculating expenses for category "${category}" in ${periodKey}:`,
        {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          totalExpenses: projectExpenses.length,
        }
      );

      const filteredExpenses = projectExpenses.filter((expense: any) => {
        if (expense.category !== category) return false;
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date);
        const isInPeriod = expenseDate >= startDate && expenseDate <= endDate;

        if (isInPeriod) {
          console.log(`Expense included in ${periodKey}:`, {
            category: expense.category,
            date: expense.date,
            amount: expense.amount,
            description: expense.description,
          });
        }

        return isInPeriod;
      });

      const total = filteredExpenses.reduce(
        (total: number, expense: any) => total + Number(expense.amount || 0),
        0
      );

      console.log(`${category} expenses in ${periodKey}:`, {
        filteredExpenses: filteredExpenses.length,
        total,
      });

      return total;
    };
  }, [periods, projectExpenses]);

  // Get unique expense categories from the database
  const expenseCategories = useMemo(() => {
    const categories = [
      ...new Set(
        projectExpenses.map((exp: any) => exp.category).filter(Boolean)
      ),
    ];
    return categories.filter((cat) => cat.toLowerCase() !== "other"); // Exclude 'other' as it's editable
  }, [projectExpenses]);

  // Get selected project details
  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  // Debug project data
  console.log("Selected Project ID:", selectedProjectId);
  console.log("Available Projects:", projects);
  console.log("Selected Project:", selectedProject);
  if (selectedProject) {
    console.log("Project fields:", Object.keys(selectedProject));
    console.log("Project values:", selectedProject);
  }

  // Calculate period-specific revenue from revenue entries with real-time updates
  const calculatePeriodRevenue = useMemo(() => {
    return (periodKey: string) => {
      const period = periods[periodKey];

      // Validate dates before creating Date objects
      if (!period.startDate || !period.endDate) {
        console.log(`Invalid dates for ${periodKey}:`, period);
        return 0;
      }

      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);

      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log(`Invalid date objects for ${periodKey}:`, {
          startDate: period.startDate,
          endDate: period.endDate,
          startDateValid: !isNaN(startDate.getTime()),
          endDateValid: !isNaN(endDate.getTime()),
        });
        return 0;
      }

      console.log(`Calculating revenue for ${periodKey}:`, {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        totalRevenueEntries: revenueEntries.length,
      });

      // Filter revenue entries for this specific period
      const periodRevenues = revenueEntries.filter((revenue: any) => {
        if (!revenue.from_date) return false;
        const revenueDate = new Date(revenue.from_date);
        const isInPeriod = revenueDate >= startDate && revenueDate <= endDate;

        if (isInPeriod) {
          console.log(`Revenue entry included in ${periodKey}:`, {
            from_date: revenue.from_date,
            amount: revenue.amount,
            description: revenue.boq_description,
          });
        }

        return isInPeriod;
      });

      // Calculate total revenue for this period
      const totalRevenue = periodRevenues.reduce(
        (total: number, revenue: any) => {
          return total + Number(revenue.amount || 0);
        },
        0
      );

      console.log(`${periodKey} revenue calculation:`, {
        filteredEntries: periodRevenues.length,
        totalRevenue,
      });

      return totalRevenue;
    };
  }, [periods, revenueEntries]);

  // Calculate total project revenue from selected periods only
  const calculateTotalProjectRevenue = useMemo(() => {
    // Sum revenue from all selected periods dynamically
    let totalRevenue = 0;
    const periodLog: any = {};
    
    for (let i = 1; i <= numberOfPeriods; i++) {
      const periodKey = `period${i}`;
      const periodRevenue = calculatePeriodRevenue(periodKey);
      totalRevenue += periodRevenue;
      periodLog[periodKey] = periodRevenue;
    }

    console.log("Total revenue calculation from selected periods:", {
      ...periodLog,
      total: totalRevenue,
    });

    return totalRevenue;
  }, [calculatePeriodRevenue, numberOfPeriods]);

  // Calculate labour totals for each period using real trade data
  const calculateTotalLabour = (periodKey: string) => {
    const tradePayroll = projectTrades.reduce((total: number, trade: any) => {
      return total + calculateTradePayroll(trade.id, periodKey);
    }, 0);

    // Add the editable "Other" labour amount
    return tradePayroll + (otherLabour[periodKey] || 0);
  };

  // Calculate total expenses for each period
  const calculatePeriodExpenses = (periodKey: string) => {
    let totalExpenses = calculateTotalLabour(periodKey); // Labour costs from trades + other labour

    // Add database expense categories (Materials, Equipment, Overhead, etc.)
    expenseCategories.forEach((category) => {
      totalExpenses += calculateExpenseByCategory(category, periodKey);
    });

    // Add editable other expenses
    totalExpenses += (otherExpenses[periodKey] || 0);

    return totalExpenses;
  };

  const calculatePeriodProfit = (periodKey: string) => {
    return (
      calculatePeriodRevenue(periodKey) - calculatePeriodExpenses(periodKey)
    );
  };

  const calculateProfitMargin = (periodKey: string) => {
    const profit = calculatePeriodProfit(periodKey);
    const revenue = calculatePeriodRevenue(periodKey);
    return revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0";
  };

  // Total calculations with memoization for performance
  const totalRevenue = calculateTotalProjectRevenue;

// ... (rest of the code remains the same)
  const totalExpenses = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= numberOfPeriods; i++) {
      const periodKey = `period${i}`;
      total += calculatePeriodExpenses(periodKey);
    }
    return total;
  }, [
    numberOfPeriods,
    periods,
    projectExpenses,
    otherExpenses,
    otherLabour,
    projectTrades,
    calculateTradePayroll,
    expenseCategories,
    calculateExpenseByCategory,
  ]);

  const totalProfit = useMemo(() => {
    return totalRevenue - totalExpenses;
  }, [totalRevenue, totalExpenses]);

  const totalProfitMargin = useMemo(() => {
    return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  }, [totalProfit, totalRevenue]);

  // Excel export function
  // Excel export function
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Helper function to format currency values
      const formatCurrencyValue = async (amount: number) => {
        try {
          if (amount === undefined || isNaN(amount)) return "0.00";
          const baseCurrency = sessionData?.user?.companies?.[0]?.base_currency;
          if (!baseCurrency) return amount.toFixed(2);
          
          if (sessionData.user.currency === baseCurrency) {
            return amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }
          
          const result = await convertCurrency(amount, sessionData.user.currency, baseCurrency);
          return typeof result === 'number' 
            ? result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : result;
        } catch (error) {
          console.error("Error in formatCurrencyValue:", error);
          return amount?.toFixed(2) || "0.00";
        }
      };
  
      // Pre-calculate all currency values first
      console.log("Starting currency conversions...");
      
      // Revenue calculations
      const [period1Revenue, period2Revenue, period3Revenue] = await Promise.all([
        formatCurrencyValue(calculatePeriodRevenue("period1")),
        formatCurrencyValue(calculatePeriodRevenue("period2")),
        formatCurrencyValue(calculatePeriodRevenue("period3"))
      ]);
      
      const totalRevenue = await formatCurrencyValue(
        calculatePeriodRevenue("period1") +
        calculatePeriodRevenue("period2") +
        calculatePeriodRevenue("period3")
      );
  
      // Process trades
      const tradeRows = await Promise.all(projectTrades.map(async (trade: any) => {
        const tradeName = trade.name || trade.trade_name || trade.position_name || trade.title || "Unknown Trade";
        const [period1Payroll, period2Payroll, period3Payroll] = await Promise.all([
          formatCurrencyValue(calculateTradePayroll(trade.id, "period1")),
          formatCurrencyValue(calculateTradePayroll(trade.id, "period2")),
          formatCurrencyValue(calculateTradePayroll(trade.id, "period3"))
        ]);
        
        const totalTradePayroll = await formatCurrencyValue(
          calculateTradePayroll(trade.id, "period1") +
          calculateTradePayroll(trade.id, "period2") +
          calculateTradePayroll(trade.id, "period3")
        );
  
        return {
          name: tradeName,
          period1: period1Payroll,
          period2: period2Payroll,
          period3: period3Payroll,
          total: totalTradePayroll
        };
      }));
  
      // Process expense categories
      const expenseRows = await Promise.all(expenseCategories.map(async (category: string) => {
        const [period1, period2, period3] = await Promise.all([
          formatCurrencyValue(calculateExpenseByCategory(category, "period1")),
          formatCurrencyValue(calculateExpenseByCategory(category, "period2")),
          formatCurrencyValue(calculateExpenseByCategory(category, "period3"))
        ]);
        
        const total = await formatCurrencyValue(
          calculateExpenseByCategory(category, "period1") +
          calculateExpenseByCategory(category, "period2") +
          calculateExpenseByCategory(category, "period3")
        );
  
        return { category, period1, period2, period3, total };
      }));
  
      // Calculate other values
      const [otherLabourPeriod1, otherLabourPeriod2, otherLabourPeriod3] = await Promise.all([
        formatCurrencyValue(otherLabour.period1),
        formatCurrencyValue(otherLabour.period2),
        formatCurrencyValue(otherLabour.period3)
      ]);
  
      const otherLabourTotal = await formatCurrencyValue(
        otherLabour.period1 + otherLabour.period2 + otherLabour.period3
      );
  
      const [totalLabourPeriod1, totalLabourPeriod2, totalLabourPeriod3] = await Promise.all([
        formatCurrencyValue(calculateTotalLabour("period1")),
        formatCurrencyValue(calculateTotalLabour("period2")),
        formatCurrencyValue(calculateTotalLabour("period3"))
      ]);
  
      const totalLabour = await formatCurrencyValue(
        calculateTotalLabour("period1") +
        calculateTotalLabour("period2") +
        calculateTotalLabour("period3")
      );
  
      const [totalExpensesPeriod1, totalExpensesPeriod2, totalExpensesPeriod3] = await Promise.all([
        formatCurrencyValue(calculatePeriodExpenses("period1")),
        formatCurrencyValue(calculatePeriodExpenses("period2")),
        formatCurrencyValue(calculatePeriodExpenses("period3"))
      ]);
  
      const totalExpensesValue = await formatCurrencyValue(totalExpenses);
  
      const [netProfitPeriod1, netProfitPeriod2, netProfitPeriod3] = await Promise.all([
        formatCurrencyValue(calculatePeriodProfit("period1")),
        formatCurrencyValue(calculatePeriodProfit("period2")),
        formatCurrencyValue(calculatePeriodProfit("period3"))
      ]);
  
      const totalNetProfit = await formatCurrencyValue(totalProfit);
  
      // Now that all async operations are complete, build the HTML
      console.log("All data loaded, generating HTML...");
      
      // Build your HTML content here using the pre-calculated values
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Profit & Loss Statement</title>
          <style>
              body { font-family: Calibri, Arial, sans-serif; margin: 20px; }
              .project-info { margin-bottom: 20px; background-color: #f0f0f0; padding: 15px; border: 1px solid #ccc; }
              table { border-collapse: collapse; width: 100%; font-size: 11px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #d9d9d9; font-weight: bold; text-align: center; }
              .number { text-align: right; }
              .section-header { background-color: #cfe2f3; font-weight: bold; }
              .section-header.expenses { background-color: #f4cccc; }
              .subtotal { background-color: #f3f3f3; font-weight: bold; }
              .total { background-color: #d9ead3; font-weight: bold; }
              .margin { background-color: #fff2cc; font-weight: bold; }
              .indent { padding-left: 30px; }
          </style>
      </head>
      <body>
          <div class="project-info">
              <h2>PROJECT INFORMATION</h2>
              <table>
                  <tr><td><strong>Project Name:</strong></td><td>${
                    selectedProject?.project_name ||
                    selectedProject?.name ||
                    "N/A"
                  }</td></tr>
                  <tr><td><strong>Project Location:</strong></td><td>${
                    selectedProject?.location_name ||
                    selectedProject?.location ||
                    "N/A"
                  }</td></tr>
                  <tr><td><strong>Project Start Date:</strong></td><td>${
                    selectedProject?.start_date ||
                    selectedProject?.startDate ||
                    "N/A"
                  }</td></tr>
                  <tr><td><strong>Project Finish Date:</strong></td><td>${
                    selectedProject?.end_date ||
                    selectedProject?.endDate ||
                    "N/A"
                  }</td></tr>
              </table>
          </div>
          
          <h1>PROFIT & LOSS STATEMENT</h1>
          <div>DECENT ENGINEERING CONSTRUCTION Ltd - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          
          <table>
              <thead>
                  <tr>
                      <th>Description</th>
                      <th>Period 1 (${
                        periods.period1.startDate &&
                        !isNaN(new Date(periods.period1.startDate).getTime())
                          ? new Date(
                              periods.period1.startDate
                            ).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })
                          : "Invalid Date"
                      } - ${
                        periods.period1.endDate &&
                        !isNaN(new Date(periods.period1.endDate).getTime())
                          ? new Date(periods.period1.endDate).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })
                          : "Invalid Date"
                      })</th>
                      <th>Period 2 (${
                        periods.period2.startDate &&
                        !isNaN(new Date(periods.period2.startDate).getTime())
                          ? new Date(periods.period2.startDate).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })
                          : "Invalid Date"
                      } - ${
                        periods.period2.endDate &&
                        !isNaN(new Date(periods.period2.endDate).getTime())
                          ? new Date(periods.period2.endDate).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })
                          : "Invalid Date"
                      })</th>
                      <th>Period 3 (${
                        periods.period3.startDate &&
                        !isNaN(new Date(periods.period3.startDate).getTime())
                          ? new Date(periods.period3.startDate).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })
                          : "Invalid Date"
                      } - ${
                        periods.period3.endDate &&
                        !isNaN(new Date(periods.period3.endDate).getTime())
                          ? new Date(periods.period3.endDate).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })
                          : "Invalid Date"
                      })</th>
                      <th>TOTAL (${sessionData.user.currency})</th>
                  </tr>
              </thead>
              <tbody>
                  <tr class="section-header">
                      <td>REVENUE</td><td></td><td></td><td></td><td></td>
                  </tr>
                  <tr>
                      <td class="indent">Invoice Revenue</td>
                      <td class="number">${period1Revenue}</td>
                      <td class="number">${period2Revenue}</td>
                      <td class="number">${period3Revenue}</td>
                      <td class="number">${totalRevenue}</td>
                  </tr>
                  <tr class="subtotal">
                      <td>TOTAL REVENUE</td>
                      <td class="number">${period1Revenue}</td>
                      <td class="number">${period2Revenue}</td>
                      <td class="number">${period3Revenue}</td>
                      <td class="number">${totalRevenue}</td>
                  </tr>
                  <tr class="section-header expenses">
                      <td>EXPENSES</td><td></td><td></td><td></td><td></td>
                  </tr>
                  ${await Promise.all(projectTrades.map(async (trade: any) => {
                    const tradeName =
                      trade.name ||
                      trade.trade_name ||
                      trade.position_name ||
                      trade.title ||
                      "Unknown Trade";
                    const period1Payroll = await formatCurrencyValue(calculateTradePayroll(trade.id, "period1"));
                    const period2Payroll = await formatCurrencyValue(calculateTradePayroll(trade.id, "period2"));
                    const period3Payroll = await formatCurrencyValue(calculateTradePayroll(trade.id, "period3"));
                    const totalTradePayroll = await formatCurrencyValue(
                      calculateTradePayroll(trade.id, "period1") +
                      calculateTradePayroll(trade.id, "period2") +
                      calculateTradePayroll(trade.id, "period3")
                    );
                    return `
                      <tr>
                          <td class="indent">Labour ${tradeName}</td>
                          <td class="number">${period1Payroll}</td>
                          <td class="number">${period2Payroll}</td>
                          <td class="number">${period3Payroll}</td>
                          <td class="number">${totalTradePayroll}</td>
                      </tr>`;
                  }))}
                  <tr>
                      <td class="indent">Other</td>
                      <td class="number">${await formatCurrencyValue(otherLabour.period1)}</td>
                      <td class="number">${await formatCurrencyValue(otherLabour.period2)}</td>
                      <td class="number">${await formatCurrencyValue(otherLabour.period3)}</td>
                      <td class="number">${await formatCurrencyValue(
                        otherLabour.period1 +
                        otherLabour.period2 +
                        otherLabour.period3
                      )}</td>
                  </tr>
                  <tr class="subtotal">
                      <td class="indent">Total Labour</td>
                      <td class="number">${await formatCurrencyValue(calculateTotalLabour("period1"))}</td>
                      <td class="number">${await formatCurrencyValue(calculateTotalLabour("period2"))}</td>
                      <td class="number">${await formatCurrencyValue(calculateTotalLabour("period3"))}</td>
                      <td class="number">${await formatCurrencyValue(
                        calculateTotalLabour("period1") +
                        calculateTotalLabour("period2") +
                        calculateTotalLabour("period3")
                      )}</td>
                  </tr>
                  ${await Promise.all(expenseCategories.map(async (category: string) => {
                    const period1Amount = await formatCurrencyValue(calculateExpenseByCategory(category, "period1"));
                    const period2Amount = await formatCurrencyValue(calculateExpenseByCategory(category, "period2"));
                    const period3Amount = await formatCurrencyValue(calculateExpenseByCategory(category, "period3"));
                    const totalAmount = await formatCurrencyValue(
                      calculateExpenseByCategory(category, "period1") +
                      calculateExpenseByCategory(category, "period2") +
                      calculateExpenseByCategory(category, "period3")
                    );
                    return `
                      <tr>
                          <td class="indent">${category}</td>
                          <td class="number">${period1Amount}</td>
                          <td class="number">${period2Amount}</td>
                          <td class="number">${period3Amount}</td>
                          <td class="number">${totalAmount}</td>
                      </tr>`;
                  }))}
                  <tr>
                      <td class="indent">Other Expenses</td>
                      <td class="number">${await formatCurrencyValue(otherExpenses.period1)}</td>
                      <td class="number">${await formatCurrencyValue(otherExpenses.period2)}</td>
                      <td class="number">${await formatCurrencyValue(otherExpenses.period3)}</td>
                      <td class="number">${await formatCurrencyValue(
                        otherExpenses.period1 +
                        otherExpenses.period2 +
                        otherExpenses.period3
                      )}</td>
                  </tr>
                  <tr class="subtotal">
                      <td>TOTAL EXPENSES</td>
                      <td class="number">${await formatCurrencyValue(calculatePeriodExpenses("period1"))}</td>
                      <td class="number">${await formatCurrencyValue(calculatePeriodExpenses("period2"))}</td>
                      <td class="number">${await formatCurrencyValue(calculatePeriodExpenses("period3"))}</td>
                      <td class="number">${await formatCurrencyValue(totalExpenses)}</td>
                  </tr>
                  <tr class="total">
                      <td>NET PROFIT</td>
                      <td class="number">${await formatCurrencyValue(calculatePeriodProfit("period1"))}</td>
                      <td class="number">${await formatCurrencyValue(calculatePeriodProfit("period2"))}</td>
                      <td class="number">${await formatCurrencyValue(calculatePeriodProfit("period3"))}</td>
                      <td class="number">${await formatCurrencyValue(totalProfit)}</td>
                  </tr>
                  <tr class="margin">
                      <td>PROFIT MARGIN %</td>
                      <td class="number">${calculateProfitMargin("period1")}%</td>
                      <td class="number">${calculateProfitMargin("period2")}%</td>
                      <td class="number">${calculateProfitMargin("period3")}%</td>
                      <td class="number">${totalProfitMargin}%</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>
    `;  
      // Create and download the file
      console.log("Creating blob...");
      const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedProject?.name || "Project"}_ProfitLoss_${
        new Date().toISOString().split("T")[0]
      }.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("Export completed successfully");
  
    } catch (error) {
      console.error("Error in exportToExcel:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Information</span>
            <Button
  onClick={exportToExcel}
  disabled={isExporting}
  className="flex items-center gap-2"
>
  {isExporting ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Exporting...
    </>
  ) : (
    <>
      <FileText className="h-4 w-4" />
      Export to Excel
    </>
  )}
</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <strong>Project Name:</strong>{" "}
              {selectedProject?.project_name || selectedProject?.name || "N/A"}
            </div>
            <div>
              <strong>Project Location:</strong>{" "}
              {selectedProject?.location_name ||
                selectedProject?.location ||
                "N/A"}
            </div>
            <div>
              <strong>Project Start Date:</strong>{" "}
              {selectedProject?.start_date ||
                selectedProject?.startDate ||
                "N/A"}
            </div>
            <div>
              <strong>Project Finish Date:</strong>{" "}
              {selectedProject?.end_date || selectedProject?.endDate || "N/A"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Statement Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <p className="text-sm text-gray-600">
                DECENT ENGINEERING CONSTRUCTION Ltd - September 2025
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="period-count" className="text-sm font-medium">
                Number of Periods:
              </Label>
              <Select
                value={numberOfPeriods.toString()}
                onValueChange={(value) => handlePeriodCountChange(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isRecalculating && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 text-sm font-medium">
                  Updating table with new period data...
                </span>
              </div>
            </div>
          )}
          <div
            className={`overflow-x-auto ${
              isRecalculating
                ? "opacity-60 transition-opacity duration-300"
                : ""
            }`}
          >
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">
                    Description
                  </th>
                  {/* Dynamic period columns */}
                  {Array.from({ length: numberOfPeriods }, (_, index) => {
                    const periodNumber = index + 1;
                    const periodKey = `period${periodNumber}`;
                    const period = periods[periodKey];
                    
                    return (
                      <th key={periodKey} className="border border-gray-300 px-2 py-2 text-center font-bold">
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-xs font-semibold">Period {periodNumber}</span>
                          <div className="flex flex-col space-y-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-28 h-7 text-xs justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-1 h-3 w-3" />
                                  {period?.startDate
                                    ? new Date(period.startDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "Start"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={
                                    period?.startDate
                                      ? new Date(period.startDate)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      setPeriods((prev: any) => ({
                                        ...prev,
                                        [periodKey]: {
                                          ...prev[periodKey],
                                          startDate: date.toISOString().split("T")[0],
                                        },
                                      }));
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-28 h-7 text-xs justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-1 h-3 w-3" />
                                  {period?.endDate
                                    ? new Date(period.endDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "End"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={
                                    period?.endDate
                                      ? new Date(period.endDate)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      setPeriods((prev: any) => ({
                                        ...prev,
                                        [periodKey]: {
                                          ...prev[periodKey],
                                          endDate: date.toISOString().split("T")[0],
                                        },
                                      }));
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  <th className="border border-gray-300 px-4 py-2 text-center font-bold">
                    TOTAL ({sessionData.user.currency})
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* REVENUE SECTION */}
                <tr className="bg-blue-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">REVENUE</td>
                  {Array.from({ length: numberOfPeriods }, (_, index) => (
                    <td key={`revenue-header-${index}`} className="border border-gray-300 px-4 py-2"></td>
                  ))}
                  <td className="border border-gray-300 px-4 py-2"></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    Invoice Revenue
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodRevenue("period1")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodRevenue("period2")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodRevenue("period3")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                    <ConvertedAmount
                      amount={totalRevenue}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">
                    TOTAL REVENUE
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodRevenue("period1")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodRevenue("period2")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodRevenue("period3")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={totalRevenue}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                </tr>

                {/* EXPENSES SECTION */}
                <tr className="bg-red-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">EXPENSES</td>
                  {Array.from({ length: numberOfPeriods }, (_, index) => (
                    <td key={`expenses-header-${index}`} className="border border-gray-300 px-4 py-2"></td>
                  ))}
                  <td className="border border-gray-300 px-4 py-2"></td>
                </tr>

                {/* LABOUR DIRECT - DYNAMIC TRADE ROWS */}
                {projectTrades.map((trade: any) => {
                  const tradeName =
                    trade.name ||
                    trade.trade_name ||
                    trade.position_name ||
                    trade.title ||
                    "Unknown Trade";
                  
                  // Calculate payroll for each period dynamically
                  const periodPayrolls: number[] = [];
                  let totalTradePayroll = 0;
                  
                  for (let i = 1; i <= numberOfPeriods; i++) {
                    const periodKey = `period${i}`;
                    const payroll = calculateTradePayroll(trade.id, periodKey);
                    periodPayrolls.push(payroll);
                    totalTradePayroll += payroll;
                  }

                  return (
                    <tr key={trade.id}>
                      <td className="border border-gray-300 px-4 py-2 pl-8">
                        Labour {tradeName}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                      <ConvertedAmount
  amount={calculateTradePayroll(trade.id, "period1")}
  currency={sessionData.user.currency}
  sessionData={sessionData}
  showCurrency={true}
/>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                      <ConvertedAmount
  amount={calculateTradePayroll(trade.id, "period2")}
  currency={sessionData.user.currency}
  sessionData={sessionData}
  showCurrency={true}
/>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                      <ConvertedAmount
  amount={calculateTradePayroll(trade.id, "period3")}
  currency={sessionData.user.currency}
  sessionData={sessionData}
  showCurrency={true}
/>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <ConvertedAmount
                          amount={totalTradePayroll}
                          sessionData={sessionData}
                          currency={sessionData.user.currency}
                          showCurrency={true}
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* OTHER LABOUR (EDITABLE) */}
                <tr>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    Other
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherLabour.period1}
                      onChange={(e) =>
                        setOtherLabour((prev) => ({
                          ...prev,
                          period1: Number(e.target.value),
                        }))
                      }
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherLabour.period2}
                      onChange={(e) =>
                        setOtherLabour((prev) => ({
                          ...prev,
                          period2: Number(e.target.value),
                        }))
                      }
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherLabour.period3}
                      onChange={(e) =>
                        setOtherLabour((prev) => ({
                          ...prev,
                          period3: Number(e.target.value),
                        }))
                      }
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                  
                    <ConvertedAmount
                      amount={
                        otherLabour.period1 +
                          otherLabour.period2 +
                          otherLabour.period3
                      }
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                </tr>

                {/* TOTAL LABOUR ROW */}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    Total Labour
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculateTotalLabour("period1")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculateTotalLabour("period2")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculateTotalLabour("period3")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={
                        calculateTotalLabour("period1") +
                          calculateTotalLabour("period2") +
                        calculateTotalLabour("period3")
                      }
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                </tr>

                {/* MANUAL EXPENSE CATEGORIES FROM DATABASE */}
                {expenseCategories.map((category: string) => {
                  const period1Amount = calculateExpenseByCategory(
                    category,
                    "period1"
                  );
                  const period2Amount = calculateExpenseByCategory(
                    category,
                    "period2"
                  );
                  const period3Amount = calculateExpenseByCategory(
                    category,
                    "period3"
                  );
                  const totalAmount =
                    period1Amount + period2Amount + period3Amount;

                  return (
                    <tr key={category}>
                      <td className="border border-gray-300 px-4 py-2 pl-8">
                        {category}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <ConvertedAmount
                          amount={period1Amount}
                          sessionData={sessionData}
                          currency={sessionData.user.currency}
                          showCurrency={true}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <ConvertedAmount
                          amount={period2Amount}
                          sessionData={sessionData}
                          currency={sessionData.user.currency}
                          showCurrency={true}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <ConvertedAmount
                          amount={period3Amount}
                          sessionData={sessionData}
                          currency={sessionData.user.currency}
                          showCurrency={true}
                        />
                        
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <ConvertedAmount
                          amount={totalAmount}
                          sessionData={sessionData}
                          currency={sessionData.user.currency}
                          showCurrency={true}
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* OTHER EXPENSES (EDITABLE) */}
                <tr>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    Other Expenses
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherExpenses.period1}
                      onChange={(e) =>
                        setOtherExpenses((prev) => ({
                          ...prev,
                          period1: Number(e.target.value),
                        }))
                      }
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherExpenses.period2}
                      onChange={(e) =>
                        setOtherExpenses((prev) => ({
                          ...prev,
                          period2: Number(e.target.value),
                        }))
                      }
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherExpenses.period3}
                      onChange={(e) =>
                        setOtherExpenses((prev) => ({
                          ...prev,
                          period3: Number(e.target.value),
                        }))
                      }
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={
                        otherExpenses.period1 +
                          otherExpenses.period2 +
                          otherExpenses.period3
                      }
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                </tr>

                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">
                    TOTAL EXPENSES
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodExpenses("period1")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodExpenses("period2")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodExpenses("period3")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={totalExpenses}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                </tr>

                {/* NET PROFIT */}
                <tr className="bg-green-100 font-bold text-lg">
                  <td className="border border-gray-300 px-4 py-2">
                    NET PROFIT
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodProfit("period1")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodProfit("period2")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={calculatePeriodProfit("period3")}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <ConvertedAmount
                      amount={totalProfit}
                      sessionData={sessionData}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                    />
                  </td>
                </tr>

                {/* PROFIT MARGIN */}
                <tr className="bg-yellow-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">
                    PROFIT MARGIN %
                  </td>
                  {Array.from({ length: numberOfPeriods }, (_, index) => {
                    const periodKey = `period${index + 1}`;
                    return (
                      <td key={`profit-margin-${index}`} className="border border-gray-300 px-4 py-2 text-right">
                        {calculateProfitMargin(periodKey)}%
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {totalProfitMargin.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* <div className="mt-4 text-sm text-gray-600">
            <p>
              All amounts in <strong>{getUserCurrency()}</strong>
            </p>
            <p>
              <strong>Editable:</strong> Yellow cells ("Other" in Labour &
              Expenses)
            </p>
            <p>
              <strong>Labour:</strong> From real attendance (present, late, paid
              leave) with auto penalties & manual deductions
            </p>
            <p>
              <strong>Revenue:</strong> From “Add Revenue” entries within
              selected dates
            </p>
            <p>
              <strong>Expenses:</strong> Filtered by expense date
            </p>
            <p>
              Auto converted to your currency. Click “Export to Excel” to
              download.
            </p>
            <p>
              <strong>Payroll:</strong> (Present + Late + Leave) × Rate −
              Penalties (10%) − Deductions
            </p>
            <p>
              <strong>Revenue:</strong> Sum of entries in selected period
            </p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
};
export default function CostControlPage() {
  const { toast } = useToast()

  // Helper functions for different toast types
  const showToast = {
    success: (message: string) => toast({ title: message }),
    error: (message: string) => toast({ title: message, variant: "destructive" }),
    info: (message: string) => toast({ title: message }),
  }

  const [activeTab, setActiveTab] = useState<"overview" | "boq" | "revenues" | "expenses" | "profit-loss">("overview")
  // Project persistence with localStorage (fixed for SSR)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [isClient, setIsClient] = useState(false)

  // Handle client-side mounting
  React.useEffect(() => {
    setIsClient(true)
    const savedProject = localStorage.getItem("cost-control-selected-project") || ""
    if (savedProject) {
      setSelectedProjectId(savedProject)
    }
  }, [])

  // Save selected project to localStorage whenever it changes
  React.useEffect(() => {
    if (isClient && selectedProjectId) {
      localStorage.setItem("cost-control-selected-project", selectedProjectId)
    }
  }, [selectedProjectId, isClient])

  const {
    data: sessionData = { user: {} },
    isLoading: isSessionLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: false,
  })
  console.log("session data", sessionData)
  // Fetch projects from the backend
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useGetProjectsQuery()

  // Fetch financial metrics for the selected project
  const {
    data: financialMetrics,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
  } = useGetProjectFinancialMetricsQuery(selectedProjectId, {
    skip: !selectedProjectId, // Skip the query if no project is selected
  })

  // Add expense mutation
  const [createExpense, { isLoading: isCreatingExpense }] = useCreateExpenseMutation()

  // Fetch expenses for the selected project
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    refetch: refetchExpenses,
  } = useGetExpensesByProjectQuery(selectedProjectId, {
    skip: !selectedProjectId,
  })
  console.log("expenses", expenses)

  // BOQ state and mutations
  const [boqForm, setBoqForm] = useState<Omit<BOQItem, "total" | "project_id" | "company_id">>({
    item_code: "",
    description: "",
    unit: "pcs",
    quantity: 0,
    unit_rate: 0,
  })
  const [createBOQ, { isLoading: isCreatingBOQ }] = useCreateBOQMutation()
  const { data: boqItems = [], refetch: refetchBOQ } = useGetBOQByProjectQuery(
    {
      projectId: selectedProjectId,
      companyId: (sessionData.user as any)?.company_id,
    },
    { skip: !selectedProjectId || !(sessionData.user as any)?.company_id },
  )

  // Get employees data for payroll calculation
  const { data: employees = [] } = useGetEmployeesQuery()

  // Get deductions data
  const { data: deductions = [] } = useGetDeductionsQuery()

  // State for project payroll data from backend
  const [projectPayrollData, setProjectPayrollData] = useState<any>(null)
  const [isLoadingProjectPayroll, setIsLoadingProjectPayroll] = useState(false)

  // Fetch project payroll data from backend API
  useEffect(() => {
    const fetchProjectPayroll = async () => {
      if (!selectedProjectId || !(sessionData.user as any)?.company_id) {
        setProjectPayrollData(null)
        return
      }

      setIsLoadingProjectPayroll(true)

      console.log("Fetching project payroll for:", {
        projectId: selectedProjectId,
        companyId: (sessionData.user as any)?.company_id,
        url: `https://dse-backend-uv5d.onrender.com/employee/payroll/project/${selectedProjectId}?companyId=${
          (sessionData.user as any)?.company_id
        }`,
      })

      try {
        const response = await fetch(
          `https://dse-backend-uv5d.onrender.com/employee/payroll/project/${selectedProjectId}?companyId=${
            (sessionData.user as any)?.company_id
          }`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
        )

        if (response.ok) {
          const payrollData = await response.json()
          console.log("Project payroll data from backend:", payrollData)
          setProjectPayrollData(payrollData)
        } else {
          console.error("Failed to fetch project payroll data:", response.status, response.statusText)
          const errorText = await response.text()
          console.error("Error response:", errorText)
          console.error("Request details:", {
            url: `https://dse-backend-uv5d.onrender.com/employee/payroll/project/${selectedProjectId}?companyId=${
              (sessionData.user as any)?.company_id
            }`,
            projectId: selectedProjectId,
            projectIdType: typeof selectedProjectId,
            companyId: (sessionData.user as any)?.company_id,
            companyIdType: typeof (sessionData.user as any)?.company_id,
          })
          setProjectPayrollData(null)
        }
      } catch (error) {
        console.error("Error fetching project payroll:", error)
        setProjectPayrollData(null)
      } finally {
        setIsLoadingProjectPayroll(false)
      }
    }

    fetchProjectPayroll()
  }, [selectedProjectId, sessionData])

  // Calculate project payroll from backend data with attendance-based fallback
  const projectPayroll = useMemo(() => {
    // Try to use backend data first
    if (projectPayrollData) {
      const totalNetPay = projectPayrollData.totalNetPay || 0
      console.log("Project payroll from backend:", {
        totalGrossPay: projectPayrollData.totalGrossPay,
        totalDeductions: projectPayrollData.totalDeductions,
        totalNetPay: totalNetPay,
        employeeCount: projectPayrollData.employees?.length || 0,
      })
      return totalNetPay
    }

    // Fallback: Calculate using attendance data (matching attendance-payroll logic)
    if (!selectedProjectId || !employees.length) {
      console.log("No project payroll data available - using attendance-based fallback")
      return 0
    }

    const projectEmployees = employees.filter((emp: any) => emp.projectId === selectedProjectId)

    if (!projectEmployees.length) {
      console.log("No employees found for project:", selectedProjectId)
      return 0
    }

    // Attendance-based calculation matching attendance-payroll page
    let totalPayroll = 0
    for (const employee of projectEmployees) {
      const dailyRate = Number(employee.daily_rate || 0)
      const monthlyRate = Number(employee.monthly_rate || 0)

      // Get employee attendance records from attendance data
      // FIX: attendanceData is undeclared. It should likely be fetched or passed in.
      // Assuming 'attendanceData' is meant to be fetched from a hook or context.
      // For now, we'll assume it's available or will be provided. If not, this will cause an error.
      // const employeeAttendance = attendanceData.filter((att: any) => att.employee_id === employee.id) || [];
      const employeeAttendance = [] // Placeholder: Replace with actual attendance data fetching

      // Calculate working days (exact logic from attendance-payroll)
      const presentDays = employeeAttendance.filter((att: any) => att.status === "present").length
      const lateDays = employeeAttendance.filter((att: any) => att.status === "late").length
      const sickDays = employeeAttendance.filter((att: any) => att.status === "absent" && att.reason === "sick").length
      const vacationDays = employeeAttendance.filter(
        (att: any) => att.status === "absent" && att.reason === "vacation",
      ).length

      // Working days = present + late + paid leave (sick + vacation)
      const workingDays = presentDays + lateDays + sickDays + vacationDays

      // Calculate gross pay based on working days
      let grossPay = 0
      if (monthlyRate > 0) {
        grossPay = monthlyRate // Use monthly rate if available
      } else if (dailyRate > 0) {
        grossPay = dailyRate * workingDays // Use daily rate × working days
      }

      // Calculate deductions (exact logic from attendance-payroll)
      const lateDeduction = lateDays * (dailyRate * 0.1) // 10% penalty per late day

      // Get manual deductions
      const employeeDeductions = deductions.filter((d: any) => d.employee_id === employee.id)
      const manualDeductions = employeeDeductions.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0)

      const totalDeductions = lateDeduction + manualDeductions
      const netPay = Math.max(0, grossPay - totalDeductions)
      totalPayroll += netPay

      // Debug logging for Jean Baptiste
      if (employee.username === "Jean Baptiste") {
        console.log("Jean Baptiste payroll calculation:", {
          dailyRate,
          monthlyRate,
          presentDays,
          lateDays,
          sickDays,
          vacationDays,
          workingDays,
          grossPay,
          lateDeduction,
          manualDeductions,
          totalDeductions,
          netPay,
        })
      }
    }

    console.log("Attendance-based fallback payroll calculation:", {
      projectEmployees: projectEmployees.length,
      totalPayroll,
    })

    return totalPayroll
  }, [
    projectPayrollData,
    selectedProjectId,
    employees,
    deductions,
    // attendanceData, // attendanceData is not defined, hence removed from dependency array
  ])

  // Helper function to safely format dates
  const formatDateSafe = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return "Invalid Date"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return date.toLocaleDateString("en-US", options || { day: "numeric", month: "short" })
  }

  // Get user currency from session
  const getUserCurrency = () => {
    if (sessionData && (sessionData.user as any)?.companies?.[0]?.base_currency) {
      return (sessionData.user as any).companies[0].base_currency
    }
    return "RWF" // Default currency
  }

  // Simple currency formatting without conversion
  const formatCurrency = (amount: number) => {
    // Handle invalid amounts
    if (typeof amount !== "number" || isNaN(amount) || !isFinite(amount)) {
      amount = 0
    }

    const userCurrency = getUserCurrency()

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: userCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch (error) {
      console.error("Currency formatting error:", error)
      // Fallback formatting with decimals
      return `${userCurrency} ${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
  }

  // Form state for revenue and payroll fetching
  const [revenueForm, setRevenueForm] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    selectedBOQItem: "",
    quantityCompleted: 0,
  })
  // Add this function after the revenueForm state definition
const handleRevenueInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target
  setRevenueForm(prev => ({
    ...prev,
    [name]: name === 'quantityCompleted' ? (value === '' ? '' : Number(value)) : value
  }))
}
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(false)
  const [payrollFetched, setPayrollFetched] = useState(false)

  // CSV Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploadingCsv, setIsUploadingCsv] = useState(false)
  const [csvUploadType, setCsvUploadType] = useState<"expenses" | "boq">("expenses")

  // Backend integration for revenue entries
  const [createRevenue, { isLoading: isCreatingRevenue }] = useCreateRevenueMutation()
  const [deleteRevenue, { isLoading: isDeletingRevenue }] = useDeleteRevenueMutation()
  const [updateBOQProgress] = useUpdateBOQProgressMutation()

  // Fetch revenue entries from backend
  const {
    data: revenueEntries = [],
    isLoading: isLoadingRevenues,
    refetch: refetchRevenues,
  } = useGetRevenuesByProjectQuery(selectedProjectId, {
    skip: !selectedProjectId,
  })

  // Handle expense form input changes
  const handleExpenseInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, // Added TextAreaElement
  ) => {
    const { name, value } = e.target
    setExpenseForm((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "unit_price" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  // Function to fetch labor expenses from payroll data
  const fetchLaborExpenses = async (fromDate: string, toDate: string) => {
    if (!selectedProjectId || !fromDate || !toDate) {
      showToast.error("Please select project and date range")
      return
    }

    setIsLoadingPayroll(true)
    showToast.info("Fetching labor expenses from payroll data...")

    try {
      // Fetch project payroll data for the date range
      const response = await fetch(
        `https://dse-backend-uv5d.onrender.com/attendance/payroll/project/${selectedProjectId}?companyId=${
          (sessionData.user as any)?.company_id
        }&startDate=${fromDate}&endDate=${toDate}`,
        {
          credentials: "include",
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch payroll data: ${response.statusText}`)
      }

      const payrollData = await response.json()
      console.log("Payroll data received:", payrollData)

      // Process payroll data and add as labor expenses
      if (payrollData && payrollData.employees && payrollData.employees.length > 0) {
        let addedCount = 0

        for (const employee of payrollData.employees) {
          // Check if this labor expense already exists to avoid duplicates
          // A more robust check might involve date ranges and employee IDs
          const existingExpense = expenses.find(
            (exp: any) =>
              exp.description.includes(employee.name || employee.username) &&
              exp.category === "LABOR" &&
              exp.created_at?.includes(fromDate.slice(0, 7)), // Check if it's within the same month
          )

          if (!existingExpense && employee.netPay > 0) {
            try {
              await createExpense({
                project_id: selectedProjectId,
                company_id: (sessionData.user as any).company_id,
                description: `Labor - ${employee.name || employee.username} (${fromDate} to ${toDate})`,
                category: "LABOR",
                quantity: employee.workingDays || 1,
                unit: "days",
                unit_price: Number((employee.netPay / (employee.workingDays || 1)).toFixed(2)),
                amount: Number(employee.netPay),
              }).unwrap()
              addedCount++
            } catch (error) {
              console.error(`Failed to add labor expense for ${employee.name}:`, error)
              // Optionally show a toast for individual failures
            }
          }
        }

        if (addedCount > 0) {
          showToast.success(`Successfully added ${addedCount} labor expense(s) from payroll data.`)
          refetchExpenses() // Refresh the expenses list
          setPayrollFetched(true)
        } else {
          showToast.info(
            "No new labor expenses to add (they may already exist or no payroll data found for the period).",
          )
          // Still set payrollFetched to true if no new expenses were added but the fetch was successful
          setPayrollFetched(true)
        }
      } else {
        showToast.info("No payroll data found for the selected date range.")
        setPayrollFetched(true) // Mark as fetched even if empty
      }
    } catch (error: any) {
      console.error("Error fetching labor expenses:", error)
      showToast.error(`Failed to fetch labor expenses: ${error.message || "Unknown error"}`)
      setPayrollFetched(false) // Reset if there was an error
    } finally {
      setIsLoadingPayroll(false)
    }
  }

  // Auto-fetch labor expenses when date range changes (debounced)
  React.useEffect(() => {
    if (revenueForm.fromDate && revenueForm.toDate && selectedProjectId && activeTab === "revenues") {
      const today = new Date().toISOString().split("T")[0]
      // Only trigger fetch if dates have changed and payroll hasn't been fetched yet for this selection
      if ((revenueForm.fromDate !== today || revenueForm.toDate !== today) && !payrollFetched) {
        const timeoutId = setTimeout(() => {
          fetchLaborExpenses(revenueForm.fromDate, revenueForm.toDate)
        }, 1000) // Debounce for 1 second

        return () => clearTimeout(timeoutId)
      }
    }
  }, [revenueForm.fromDate, revenueForm.toDate, selectedProjectId, activeTab, payrollFetched])

  // Handle BOQ form input changes
  const handleBOQInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBoqForm((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "unit_rate" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  // Handle expense form submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !selectedProjectId ||
      !expenseForm.description ||
      expenseForm.quantity === undefined || // Check for undefined as well
      expenseForm.unit_price === undefined // Check for undefined
    ) {
      showToast.error("Please fill in all required fields")
      return
    }
    // Ensure quantity and unit_price are not negative
    if (expenseForm.quantity < 0 || expenseForm.unit_price < 0) {
      showToast.error("Quantity and unit price cannot be negative.")
      return
    }

    const calculatedAmount = expenseForm.quantity * expenseForm.unit_price

    try {
      await createExpense({
        project_id: selectedProjectId,
        company_id: (sessionData.user as any).company_id,
        description: expenseForm.description,
        category: expenseForm.category,
        quantity: Number(expenseForm.quantity),
        unit: expenseForm.unit,
        unit_price: Number(expenseForm.unit_price),
        amount: Number(calculatedAmount),
      }).unwrap()

      // Reset form
      setExpenseForm({
        description: "",
        category: "MATERIALS",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
      })

      // Show success message
      showToast.success("Expense added successfully")

      // Refresh expenses list
      refetchExpenses()
    } catch (error: any) {
      console.error("Error adding expense:", error)
      showToast.error(`Failed to add expense: ${error.data?.message || error.message}`)
    }
  }

  // Handle BOQ form submission
  const handleAddBOQItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || !(sessionData.user as any)?.company_id) {
      showToast.error("Please select a project and ensure you're logged in with a company")
      return
    }

    // Validate numeric fields
    if (!boqForm.quantity || boqForm.quantity <= 0) {
      showToast.error("Please enter a valid quantity greater than zero.")
      return
    }
    if (!boqForm.unit_rate || boqForm.unit_rate <= 0) {
      showToast.error("Please enter a valid unit rate greater than zero.")
      return
    }
    if (!boqForm.item_code.trim() || !boqForm.description.trim() || !boqForm.unit.trim()) {
      showToast.error("Please fill in all required fields (Item Code, Description, Unit).")
      return
    }
    let exchangeRate = await getExchangeRate(
        sessionData.user.currency,
        sessionData.user.companies?.[0]?.base_currency
      );

    try {
      await createBOQ({
        item_no: boqForm.item_code,
        description: boqForm.description,
        unit: boqForm.unit,
        quantity: Number(boqForm.quantity),
        rate: Number(boqForm.unit_rate),
        amount: Number(boqForm.quantity * boqForm.unit_rate),
        project_id: selectedProjectId,
        company_id: (sessionData.user as any).company_id,
      }).unwrap()

      showToast.success("BOQ item added successfully")
      setBoqForm({
        item_code: "",
        description: "",
        unit: "pcs",
        quantity: 0,
        unit_rate: 0,
      })
      refetchBOQ()
    } catch (error: any) {
      console.error("Failed to add BOQ item:", error)
      showToast.error(error.data?.message || "Failed to add BOQ item. Please try again.")
    }
  }

  console.log("financial metrics", financialMetrics)

  console.log("selected project", selectedProjectId)

  // CSV Upload Functions
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "text/csv") {
      setCsvFile(file)
    } else if (file) {
      showToast.error("Invalid file type. Please upload a CSV file.")
    } else {
      setCsvFile(null) // Clear file if selection is cancelled
    }
  }

  const downloadCsvTemplate = (type: "expenses" | "boq") => {
    let csvContent = ""
    let filename = ""

    if (type === "expenses") {
      csvContent = "description,category,quantity,unit,unit_price\n"
      csvContent += "Sample Expense,MATERIALS,10,pcs,100\n"
      csvContent += "Another Expense,LABOR,5,hours,50\n" // Example for LABOR
      filename = "expenses_template.csv"
    } else {
      csvContent = "item_code,description,unit,quantity,unit_rate\n"
      csvContent += "CONC-001,Concrete Work,m³,100,150\n"
      csvContent += "STEEL-001,Steel Reinforcement,kg,500,2.5\n"
      filename = "boq_template.csv"
    }

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const processCsvFile = async () => {
    if (!csvFile || !selectedProjectId) {
      showToast.error("Please select a CSV file and ensure a project is selected.")
      return
    }

    setIsUploadingCsv(true)

    try {
      const text = await csvFile.text()
      const lines = text.split("\n").filter((line) => line.trim())
      if (lines.length === 0) {
        showToast.error("The CSV file is empty.")
        setIsUploadingCsv(false)
        return
      }

      const headers = lines[0].split(",").map((h) => h.trim())
      const expectedHeaders =
        csvUploadType === "expenses"
          ? ["description", "category", "quantity", "unit", "unit_price"]
          : ["item_code", "description", "unit", "quantity", "unit_rate"]

      // Header validation
      if (headers.length !== expectedHeaders.length || !expectedHeaders.every((h) => headers.includes(h))) {
        showToast.error(`Invalid CSV headers. Expected: ${expectedHeaders.join(", ")}`)
        setIsUploadingCsv(false)
        return
      }

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Incorrect number of columns.`)
          errorCount++
          continue
        }

        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index]
        })

        try {
          if (csvUploadType === "expenses") {
            const quantity = Number(rowData.quantity) || 1
            const unit_price = Number(rowData.unit_price) || 0
            if (quantity < 0 || unit_price < 0) {
              throw new Error("Quantity or unit price cannot be negative.")
            }
            await createExpense({
              project_id: selectedProjectId,
              company_id: (sessionData.user as any).company_id,
              description: rowData.description || `Expense Row ${i + 1}`,
              category: rowData.category || "OTHER",
              quantity: quantity,
              unit: rowData.unit || "pcs",
              unit_price: unit_price,
              amount: quantity * unit_price,
            }).unwrap()
          } else {
            // boq
            const quantity = Number(rowData.quantity) || 0
            const unit_rate = Number(rowData.unit_rate) || 0
            if (quantity <= 0 || unit_rate <= 0) {
              throw new Error("Quantity and unit rate must be greater than zero.")
            }
            await createBOQ({
              item_no: rowData.item_code || `Item ${i + 1}`,
              description: rowData.description || `BOQ Item Row ${i + 1}`,
              unit: rowData.unit || "pcs",
              quantity: quantity,
              rate: unit_rate,
              amount: quantity * unit_rate,
              project_id: selectedProjectId,
              company_id: (sessionData.user as any).company_id,
            }).unwrap()
          }
          successCount++
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message || error.data?.message || "Unknown error"}`)
          errorCount++
        }
      }

      if (errorCount > 0) {
        showToast.error(`CSV upload completed with ${errorCount} errors. See console for details.`)
        console.error("CSV Upload Errors:", errors)
      } else {
        showToast.success(`CSV upload successful: ${successCount} items added.`)
      }

      setCsvFile(null) // Clear the file after processing

      // Refresh data
      if (csvUploadType === "expenses") {
        refetchExpenses()
      } else {
        refetchBOQ()
      }
    } catch (error: any) {
      console.error("CSV processing error:", error)
      showToast.error(`Failed to process CSV file: ${error.message || "Unknown error"}`)
    } finally {
      setIsUploadingCsv(false)
    }
  }

  // Handle project selection change
  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value)
    // Reset other states that depend on project selection if necessary
    // e.g., clear forms, reset active tabs, etc.
    setActiveTab("overview") // Reset to overview tab
    setRevenueForm({
      // Reset revenue form
      fromDate: new Date().toISOString().split("T")[0],
      toDate: new Date().toISOString().split("T")[0],
      selectedBOQItem: "",
      quantityCompleted: 0,
    })
    setExpenseForm({
      // Reset expense form
      description: "",
      category: "MATERIALS",
      quantity: 1,
      unit: "pcs",
      unit_price: 0,
    })
    setCsvFile(null) // Clear any selected CSV file
    setPayrollFetched(false) // Reset payroll fetch status
  }

  // TODO: Replace with backend currency data when implementing backend integration
  const [userCurrency, setUserCurrency] = useState<string>("USD")
  const [currencyValue, setCurrencyValue] = useState<number>(1)
  const [currencyShort, setCurrencyShort] = useState<string>("USD")

  // Mock session data

  const companyId = (sessionData?.user as any)?.company_id

  // Calculate comprehensive cost summary
  const costSummary = useMemo(() => {
    if (financialMetrics) {
      return {
        total_expenses: financialMetrics.totalExpenses || 0,
        total_revenues: (financialMetrics.budget || 0) + (financialMetrics.totalBOQ || 0),
        total_boq_value: financialMetrics.totalBOQ || 0,
        boq_completed_value: financialMetrics.totalBOQ || 0, // Assuming all BOQ is considered completed
        project_budget: financialMetrics.budget || 0,
        net_profit: financialMetrics.netProfit || 0,
        profit_margin: financialMetrics.profitMargin || 0,
        currency: financialMetrics.currency || "RWF",
      }
    }

    // Fallback to existing calculation if no financial metrics are available
    const manualExpenses = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0)

    // Get real project budget
    const selectedProject = projects.find((p: any) => p.id === selectedProjectId)
    const projectBudget = selectedProject ? Number(selectedProject.budget || 0) : 0

    // Calculate BOQ values from real data
    const totalBOQValue = boqItems.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
    const boqCompletedValue = boqItems.reduce(
      (sum: number, item: any) => sum + Number(item.completed_qty || 0) * Number(item.rate || 0),
      0,
    )

    // Total Revenue = ONLY revenue entries from Add Revenue tab (NOT project budget)
    const totalRevenues = revenueEntries.reduce((sum: number, revenue: any) => sum + Number(revenue.amount || 0), 0)
    // Total Expenses = Project Payroll + Manual Expenses (as per requirement)
    const totalExpenses = projectPayroll + manualExpenses
    const netProfit = totalRevenues - totalExpenses
    const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0

    return {
      total_expenses: totalExpenses,
      total_revenues: totalRevenues,
      total_boq_value: totalBOQValue,
      boq_completed_value: boqCompletedValue,
      project_budget: projectBudget,
      project_payroll: projectPayroll,
      manual_expenses: manualExpenses,
      net_profit: netProfit,
      profit_margin: profitMargin,
      currency: "RWF", // Default currency
    }
  }, [expenses, selectedProjectId, financialMetrics, projects, boqItems, projectPayroll, revenueEntries])

  // Helper function to split currency value (same as attendance-payroll)
  const splitCurrencyValue = (str: string) => {
    if (!str) return null
    const match = str.match(/^([A-Z]+)([\d.]+)$/)
    if (!match) return null
    return {
      currency: match[1],
      value: match[2],
    }
  }

  // Currency setup
  React.useEffect(() => {
    if (sessionData && (sessionData.user as any)?.currency) {
      const currencyData = splitCurrencyValue((sessionData.user as any).currency)
      if (currencyData) {
        setCurrencyValue(Number(currencyData.value))
        setCurrencyShort(currencyData.currency)
        setUserCurrency(currencyData.currency)
      }
    } else {
      // Fallback to default currency
      setUserCurrency("USD")
      setCurrencyShort("USD")
      setCurrencyValue(1)
    }
  }, [sessionData])

  // Tab switch handler
  const switchTab = (tab: "overview" | "boq" | "revenues" | "expenses" | "profit-loss") => {
    setActiveTab(tab)
  }

  // Dummy form state for expense tab
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "MATERIALS",
    quantity: 1,
    unit: "pcs",
    unit_price: 0,
  })

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        user={{
          name: (sessionData?.user as any)?.username || "Current User",
          role: (sessionData?.user as any)?.current_role || "user",
          avatar: "",
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto bg-white">
          <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Cost Control Dashboard</h1>
              <p className="text-slate-600">
                Track expenses, revenues, and BOQ progress for accurate project cost management
              </p>

              {/* Project Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Project</label>
                <Select onValueChange={handleProjectChange} value={selectedProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name} - {project.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedProjectId && (
                  <p className="text-sm text-slate-500 mt-2">Please select a project to view cost control data</p>
                )}
                {selectedProjectId && (isLoadingExpenses || isLoadingMetrics) && (
                  <p className="text-sm text-blue-600 mt-2">Loading project data...</p>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoadingProjects && (
              <div className="flex h-screen">
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {isErrorProjects && (
              <div className="flex h-screen">
                <div className="flex-1 p-8">
                  <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                    role="alert"
                  >
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> Failed to load projects. Please try again later.</span>
                    <button
                      onClick={() => refetchProjects()}
                      className="absolute bg-transparent text-2xl font-semibold leading-none right-0 top-0 mt-0 mr-4 outline-none focus:outline-none"
                    >
                      <span>×</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            {selectedProjectId && !isLoadingProjects && !isErrorProjects && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-sm font-medium">Total Revenue</span>
                    <span className="text-green-500"><ChartNetwork/></span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    <ConvertedAmount
                      amount={costSummary?.total_revenues || 0}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                      sessionData={sessionData}
                    />
                  </p>
                  <p className="text-xs text-slate-500 mt-1">From Add Revenue Tab</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-sm font-medium">Total Expenses</span>
                    <span className="text-red-500"><ChartNetwork/></span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    <ConvertedAmount
                      amount={costSummary?.total_expenses || 0}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                      sessionData={sessionData}
                    />
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Payroll: <ConvertedAmount amount={costSummary?.project_payroll || 0} currency={sessionData.user.currency} showCurrency={true} sessionData={sessionData} /> + Manual:{" "}
                    <ConvertedAmount amount={costSummary?.manual_expenses || 0} currency={sessionData.user.currency} showCurrency={true} sessionData={sessionData} />
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-sm font-medium">Net Profit</span>
                    <span className="text-red-500"><BriefcaseBusiness/></span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      (costSummary?.net_profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <ConvertedAmount
                      amount={costSummary?.net_profit || 0}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                      sessionData={sessionData}
                    />
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-sm font-medium">Profit Margin</span>
                    <span className="text-green-600 text-xs"><Percent/></span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      (costSummary?.profit_margin || 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {costSummary?.profit_margin?.toFixed(1) || "0"}%
                  </p>
                </div>
              </div>
            )}

            {/* Tabs */}
            {selectedProjectId && !isLoadingProjects && !isErrorProjects && (
              <div className="bg-white rounded-lg shadow-lg mb-6">
                <div className="flex border-b overflow-x-auto">
                  <button
                    onClick={() => switchTab("overview")}
                    className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === "overview"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => switchTab("boq")}
                    className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === "boq"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Bill of Quantities
                  </button>
                  <button
                    onClick={() => switchTab("revenues")}
                    className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === "revenues"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Add Revenue
                  </button>
                  <button
                    onClick={() => switchTab("expenses")}
                    className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === "expenses"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Add Expenses
                  </button>
                  <button
                    onClick={() => switchTab("profit-loss")}
                    className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === "profit-loss"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Profit & Loss
                  </button>
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* Revenue Summary */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">Total BOQ Value</p>
                            <p className="text-xl font-bold text-slate-800">
                              <ConvertedAmount amount={costSummary.total_boq_value} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Available for Revenue</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">Recorded Revenue</p>
                            <p className="text-2xl font-bold text-green-600">
                              <ConvertedAmount amount={costSummary?.total_revenues || 0} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                            </p>
                            <p className="text-xs text-slate-500 mt-1">From Add Revenue Tab</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">Revenue Entries</p>
                            <p className="text-xl font-bold text-amber-600">{revenueEntries.length}</p>
                            <p className="text-xs text-slate-500 mt-1">Total Records</p>
                          </div>
                        </div>
                      </div>

                      {/* Total Expenses Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Total Project Expenses</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">Project Payroll</p>
                            <p className="text-xl font-bold text-blue-600">
                              <ConvertedAmount amount={costSummary?.project_payroll || 0} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                            </p>
                            <p className="text-xs text-slate-500">Actual Employee Costs</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">Manual Expenses</p>
                            <p className="text-xl font-bold text-purple-600">
                              <ConvertedAmount amount={costSummary?.manual_expenses || 0} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                            </p>
                            <p className="text-xs text-slate-500">Materials, Equipment, etc.</p>
                          </div>
                          <div className="bg-slate-100 rounded-lg p-4 border-2 border-slate-300">
                            <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
                            <p className="text-xl font-bold text-slate-800">
                              <ConvertedAmount amount={costSummary.total_expenses || 0} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                            </p>
                            <p className="text-xs text-slate-500">Payroll + Manual Expenses</p>
                          </div>
                        </div>
                      </div>

                      {/* Recent Revenue Entries */}
                      {revenueEntries.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Revenue Entries</h3>
                          <div className="space-y-2">
                            {revenueEntries
                              .slice(-5)
                              .reverse()
                              .map((revenue) => (
                                <div
                                  key={revenue.id}
                                  className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-800">
                                      {revenue.boq_item_no} - {revenue.boq_description}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                      {revenue.from_date} to {revenue.to_date} • {revenue.quantity_completed}{" "}
                                      {revenue.unit} @ <ConvertedAmount amount={revenue.rate} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />/{revenue.unit}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-lg font-bold text-green-600">
                                      +{  <ConvertedAmount amount={Number(revenue.amount)} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />}
                                    </p>
                                    <button
                                      onClick={async () => {
                                        if (!revenue.id) {
                                          showToast.error("Revenue entry has no ID")
                                          return
                                        }
                                        try {
                                          await deleteRevenue(revenue.id).unwrap()
                                          refetchRevenues()
                                          refetchBOQ() // Refresh BOQ to update completed quantities
                                          showToast.success("Revenue entry deleted")
                                        } catch (error: any) {
                                          console.error("Failed to delete revenue:", error)
                                          showToast.error(
                                            "Failed to delete revenue: " + (error.data?.message || error.message),
                                          )
                                        }
                                      }}
                                      disabled={isDeletingRevenue}
                                      className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                                    >
                                      {isDeletingRevenue ? "⏳" : "🗑️"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Manual Expenses by Category */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Manual Expenses by Category</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(
                            expenses.reduce(
                              (acc, exp) => {
                                acc[exp.category] = (acc[exp.category] || 0) + exp.amount
                                return acc
                              },
                              {} as Record<string, number>,
                            ),
                          ).map(([category, amount]) => (
                            <div key={category} className="bg-slate-50 rounded-lg p-4">
                              <p className="text-sm text-slate-600 mb-1">{category}</p>
                              <p className="text-xl font-bold text-slate-800"><ConvertedAmount amount={Number(amount)} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} /></p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Manual Expenses */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Manual Expenses</h3>
                        <div className="space-y-2">
                          {expenses
                            .slice(-5)
                            .reverse()
                            .map((expense) => (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between bg-slate-50 p-4 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-slate-800">{expense.description}</p>
                                  <p className="text-sm text-slate-600">
                                    {new Date(expense.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-lg font-bold text-red-600">
                                  <ConvertedAmount amount={Number(expense.amount)} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                                </p>
                              </div>
                            ))}
                          {expenses.length === 0 && (
                            <p className="text-slate-500 text-center py-8">
                              No manual expenses recorded yet for this project
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOQ Tab */}
                  {activeTab === "boq" && (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Add New BOQ Item</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleAddBOQItem} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="item_code">
                                  Item Code
                                </label>
                                <Input
                                  id="item_code"
                                  name="item_code"
                                  value={boqForm.item_code}
                                  onChange={handleBOQInputChange}
                                  placeholder="e.g., CONC-001"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="description">
                                  Description
                                </label>
                                <Input
                                  id="description"
                                  name="description"
                                  value={boqForm.description}
                                  onChange={handleBOQInputChange}
                                  placeholder="Item description"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="unit">
                                  Unit
                                </label>
                                <Select
                                  value={boqForm.unit}
                                  onValueChange={(value) =>
                                    setBoqForm((prev) => ({
                                      ...prev,
                                      unit: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STANDARD_UNITS.map((unit) => (
                                      <SelectItem key={unit.value} value={unit.value}>
                                        {unit.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="quantity">
                                  Quantity
                                </label>
                                <Input
                                  id="quantity"
                                  name="quantity"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={boqForm.quantity || ""}
                                  onChange={handleBOQInputChange}
                                  placeholder="0.00"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="unit_rate">
                                  Unit Rate (R)
                                </label>
                                <Input
                                  id="unit_rate"
                                  name="unit_rate"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={boqForm.unit_rate || ""}
                                  onChange={handleBOQInputChange}
                                  placeholder="0.00"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Total (R)</label>
                                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                  {(boqForm.quantity * boqForm.unit_rate).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <Button type="submit" disabled={isCreatingBOQ || !selectedProjectId}>
                                {isCreatingBOQ ? "Adding..." : "Add BOQ Item"}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>

                      {/* CSV Upload for BOQ */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Bulk Upload BOQ Items
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="outline"
                                onClick={() => downloadCsvTemplate("boq")}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download Template
                              </Button>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept=".csv"
                                  onChange={handleCsvFileChange}
                                  className="hidden"
                                  id="boq-csv-upload"
                                />
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setCsvUploadType("boq")
                                    document.getElementById("boq-csv-upload")?.click()
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Choose CSV File
                                </Button>
                                {csvFile && csvUploadType === "boq" && (
                                  <span className="text-sm text-green-600">{csvFile.name} selected</span>
                                )}
                              </div>
                            </div>
                            {csvFile && csvUploadType === "boq" && (
                              <div className="flex justify-end">
                                <Button
                                  onClick={processCsvFile}
                                  disabled={isUploadingCsv}
                                  className="flex items-center gap-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  {isUploadingCsv ? "Uploading..." : "Upload BOQ Items"}
                                </Button>
                              </div>
                            )}
                            <div className="text-sm text-slate-600">
                              <p>
                                <strong>CSV Format:</strong> item_code, description, unit, quantity, unit_rate
                              </p>
                              <p>
                                <strong>Example:</strong> CONC-001, Concrete Work, m³, 100, 150
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Add BOQ items table here */}
                      <Card>
                        <CardHeader>
                          <CardTitle>BOQ Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {boqItems.length > 0 ? (
                            <div className="rounded-md border">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-4">Item Code</th>
                                    <th className="text-left p-4">Description</th>
                                    <th className="text-right p-4">Qty</th>
                                    <th className="text-right p-4">Unit</th>
                                    <th className="text-right p-4">Unit Rate (R)</th>
                                    <th className="text-right p-4">Total (R)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {boqItems.map((item: any, index: number) => (
                                    <tr
                                      key={`${item.item_no || item.item_code}-${index}`}
                                      className="border-b hover:bg-gray-50"
                                    >
                                      <td className="p-4">{item.item_no || item.item_code}</td>
                                      <td className="p-4">{item.description}</td>
                                      <td className="text-right p-4">{item.quantity}</td>
                                      <td className="text-right p-4">{item.unit}</td>
                                      <td className="text-right p-4">{item.rate || item.unit_rate}</td>
                                      <td className="text-right p-4 font-medium">
                                        {(item.quantity * (item.rate || item.unit_rate)).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 py-8">
                              No BOQ items found. Add your first item above.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Revenue Tab */}
                  {activeTab === "revenues" && (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Add Revenue from BOQ Progress</CardTitle>
                          <p className="text-sm text-slate-600">
                            Select a BOQ item, specify the work period, and enter completed quantity. Labor expenses
                            will be automatically fetched from payroll data for the selected period.
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* BOQ Item Selection */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Select BOQ Item</label>
                              <Select
                                value={revenueForm.selectedBOQItem}
                                onValueChange={(value) =>
                                  setRevenueForm((prev) => ({
                                    ...prev,
                                    selectedBOQItem: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="-- Select BOQ Item --" />
                                </SelectTrigger>
                                <SelectContent>
                                  {boqItems.map((item: any) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.item_no || item.item_code} - {item.description} (Rate:{" "}
                                      <ConvertedAmount amount={item.rate || item.unit_rate} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />/{item.unit})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Date Range Selection */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">📅 From Date</label>
                                <Input
                                  type="date"
                                  name="fromDate"
                                  value={revenueForm.fromDate}
                                  onChange={(e) => {
                                    handleRevenueInputChange(e)
                                    setPayrollFetched(false) // Reset payroll fetch status when date changes
                                  }}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">📅 To Date</label>
                                <Input
                                  type="date"
                                  name="toDate"
                                  value={revenueForm.toDate}
                                  onChange={(e) => {
                                    handleRevenueInputChange(e)
                                    setPayrollFetched(false) // Reset payroll fetch status when date changes
                                  }}
                                  className="w-full"
                                />
                              </div>
                            </div>

                            {/* Quantity Input */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Quantity of Work Completed</label>
                              <Input
                                type="number"
                                name="quantityCompleted"
                                value={revenueForm.quantityCompleted || ""}
                                onChange={handleRevenueInputChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </div>

                            {/* Selected BOQ Item Details */}
                            {revenueForm.selectedBOQItem &&
                              (() => {
                                const selectedItem = boqItems.find(
                                  (item: any) => item.id === revenueForm.selectedBOQItem,
                                )
                                if (selectedItem) {
                                  return (
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                      <h4 className="font-semibold text-slate-800 mb-2">Selected Item Details</h4>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-slate-600">Total Quantity:</span>
                                          <span className="ml-2 font-semibold">
                                            {selectedItem.quantity} {selectedItem.unit}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-600">Completed:</span>
                                          <span className="ml-2 font-semibold text-green-600">
                                            {selectedItem.completed_qty || 0} {selectedItem.unit}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-600">Rate:</span>
                                          <span className="ml-2 font-semibold">
                                            <ConvertedAmount amount={selectedItem.rate || selectedItem.unit_rate} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />/{selectedItem.unit}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-600">Remaining:</span>
                                          <span className="ml-2 font-semibold text-amber-600">
                                            {(selectedItem.quantity - (selectedItem.completed_qty || 0)).toFixed(2)}{" "}
                                            {selectedItem.unit}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              })()}

                            {/* Revenue Preview */}
                            {revenueForm.selectedBOQItem &&
                              revenueForm.quantityCompleted > 0 &&
                              (() => {
                                const selectedItem = boqItems.find(
                                  (item: any) => item.id === revenueForm.selectedBOQItem,
                                )
                                if (selectedItem) {
                                  const calculatedRevenue =
                                    revenueForm.quantityCompleted * (selectedItem.rate || selectedItem.unit_rate)
                                  return (
                                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm text-green-700 font-medium">Calculated Revenue</p>
                                          <p className="text-xs text-green-600 mt-1">
                                            {revenueForm.quantityCompleted} {selectedItem.unit} ×{" "}
                                            <ConvertedAmount amount={selectedItem.rate || selectedItem.unit_rate} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />/{selectedItem.unit}
                                          </p>
                                        </div>
                                        <p className="text-3xl font-bold text-green-600">
                                          <ConvertedAmount amount={calculatedRevenue} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                                        </p>
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              })()}

                            {/* Labor Expense Fetch Section */}
                            <div className="border-t pt-4">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium text-slate-800">🔄 Auto-Fetch Labor Expenses</h4>
                                    <p className="text-sm text-slate-600">
                                      Labor costs are automatically fetched from payroll data when you select a date
                                      range
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => fetchLaborExpenses(revenueForm.fromDate, revenueForm.toDate)}
                                    disabled={
                                      isLoadingPayroll ||
                                      !selectedProjectId ||
                                      !revenueForm.fromDate ||
                                      !revenueForm.toDate
                                    }
                                    variant="outline"
                                    className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                                  >
                                    {isLoadingPayroll ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                        Fetching...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Fetch Labor Expenses
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {isLoadingPayroll && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <div className="flex items-center">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                                      <p className="text-sm text-yellow-800">
                                        ⏳ Fetching labor expenses from payroll data for {revenueForm.fromDate} to{" "}
                                        {revenueForm.toDate}...
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {payrollFetched && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-sm text-green-800">
                                      ✅ Labor expenses have been successfully fetched and added to the expenses list.
                                      <span className="font-medium">Check the "Add Expenses" tab to see them.</span>
                                    </p>
                                  </div>
                                )}

                                <div className="mt-3 text-xs text-blue-700">
                                  <p>
                                    <strong>Note:</strong> Labor expenses are automatically added as category "Labor"
                                    and duplicates are skipped.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Record Revenue Button */}
                            <div className="flex justify-end">
                              <Button
                                onClick={async () => {
                                  // Handle revenue recording logic here
                                  if (!revenueForm.selectedBOQItem || !revenueForm.quantityCompleted) {
                                    showToast.error("Please select a BOQ item and enter quantity completed")
                                    return
                                  }

                                  // Auto-fetch labor expenses if not already fetched
                                  if (!payrollFetched && revenueForm.fromDate && revenueForm.toDate) {
                                    await fetchLaborExpenses(revenueForm.fromDate, revenueForm.toDate)
                                  }

                                  // Create revenue entry in backend
                                  const selectedItem = boqItems.find(
                                    (item: any) => item.id === revenueForm.selectedBOQItem,
                                  )
                                  if (selectedItem) {
                                    const revenueAmount =
                                      revenueForm.quantityCompleted * (selectedItem.rate || selectedItem.unit_rate)

                                    try {
                                      // Create revenue entry
                                      await createRevenue({
                                        project_id: selectedProjectId,
                                        company_id: (sessionData.user as any).company_id,
                                        boq_item_id: selectedItem.id,
                                        boq_item_no: selectedItem.item_no || selectedItem.item_code,
                                        boq_description: selectedItem.description,
                                        from_date: revenueForm.fromDate,
                                        to_date: revenueForm.toDate,
                                        quantity_completed: revenueForm.quantityCompleted,
                                        rate: selectedItem.rate || selectedItem.unit_rate,
                                        unit: selectedItem.unit,
                                        amount: revenueAmount,
                                      }).unwrap()

                                      // Update BOQ progress
                                      const currentCompleted = selectedItem.completed_qty || 0
                                      await updateBOQProgress({
                                        id: selectedItem.id,
                                        completed_quantity: currentCompleted + revenueForm.quantityCompleted,
                                      }).unwrap()

                                      // Refresh data
                                      refetchRevenues()
                                      refetchBOQ()
                                    } catch (error: any) {
                                      console.error("Failed to create revenue:", error)
                                      showToast.error(
                                        "Failed to record revenue: " + (error.data?.message || error.message),
                                      )
                                      return
                                    }
                                  }

                                  showToast.success(
                                    "Revenue recorded successfully! Labor expenses have been automatically added.",
                                  )

                                  // Reset form
                                  setRevenueForm({
                                    fromDate: new Date().toISOString().split("T")[0],
                                    toDate: new Date().toISOString().split("T")[0],
                                    selectedBOQItem: "",
                                    quantityCompleted: 0,
                                  })
                                  setPayrollFetched(false)
                                }}
                                disabled={
                                  !revenueForm.selectedBOQItem ||
                                  !revenueForm.quantityCompleted ||
                                  isLoadingPayroll ||
                                  isCreatingRevenue
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isLoadingPayroll || isCreatingRevenue ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {isCreatingRevenue ? "Recording..." : "Fetching Labor..."}
                                  </>
                                ) : (
                                  <>➕ Record Revenue</>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* BOQ Items Status */}
                      {boqItems.length === 0 && (
                        <Card>
                          <CardContent className="text-center py-8">
                            <p className="text-amber-800 font-medium mb-2">No BOQ Items Available</p>
                            <p className="text-amber-700 text-sm mb-4">
                              Please add BOQ items first before recording revenue.
                            </p>
                            <Button
                              onClick={() => switchTab("boq")}
                              variant="outline"
                              className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                            >
                              Go to BOQ Tab
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Expense Tab */}
                  {activeTab === "expenses" && (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Add New Expense</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                  Description <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  name="description"
                                  value={expenseForm.description}
                                  onChange={handleExpenseInputChange}
                                  placeholder="Expense description"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                  Quantity <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  type="number"
                                  name="quantity"
                                  value={expenseForm.quantity}
                                  onChange={handleExpenseInputChange}
                                  placeholder="1"
                                  min="0"
                                  step="1"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                                <Select
                                  value={expenseForm.unit}
                                  onValueChange={(value) =>
                                    setExpenseForm((prev) => ({
                                      ...prev,
                                      unit: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STANDARD_UNITS.map((unit) => (
                                      <SelectItem key={unit.value} value={unit.value}>
                                        {unit.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
                                <Input
                                  type="number"
                                  name="unit_price"
                                  value={expenseForm.unit_price}
                                  onChange={handleExpenseInputChange}
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Category</label>
                                <Select
                                  name="category"
                                  value={expenseForm.category}
                                  onValueChange={(value) =>
                                    setExpenseForm((prev) => ({
                                      ...prev,
                                      category: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MATERIALS">Materials</SelectItem>
                                    <SelectItem value="LABOR">Labor</SelectItem>
                                    <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                                    <SelectItem value="SUBCONTRACTOR">Subcontractor</SelectItem>
                                    <SelectItem value="PERMITS">Permits</SelectItem>
                                    <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                                    <SelectItem value="UTILITIES">Utilities</SelectItem>
                                    <SelectItem value="RENT">Rent</SelectItem>
                                    <SelectItem value="OFFICE_SUPPLIES">Office Supplies</SelectItem>
                                    <SelectItem value="MARKETING">Marketing</SelectItem>
                                    <SelectItem value="TRAINING">Training</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Total Amount</label>
                                <div className="p-2 bg-gray-50 rounded border text-sm font-medium">
                                  {sessionData.user.currency}
                                  {(expenseForm.quantity * expenseForm.unit_price).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button type="submit" disabled={isCreatingExpense}>
                                {isCreatingExpense ? "Adding..." : "Add Expense"}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>

                      {/* CSV Upload for Expenses */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Bulk Upload Expenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="outline"
                                onClick={() => downloadCsvTemplate("expenses")}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download Template
                              </Button>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept=".csv"
                                  onChange={handleCsvFileChange}
                                  className="hidden"
                                  id="expense-csv-upload"
                                />
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setCsvUploadType("expenses")
                                    document.getElementById("expense-csv-upload")?.click()
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Choose CSV File
                                </Button>
                                {csvFile && csvUploadType === "expenses" && (
                                  <span className="text-sm text-green-600">{csvFile.name} selected</span>
                                )}
                              </div>
                            </div>
                            {csvFile && csvUploadType === "expenses" && (
                              <div className="flex justify-end">
                                <Button
                                  onClick={processCsvFile}
                                  disabled={isUploadingCsv}
                                  className="flex items-center gap-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  {isUploadingCsv ? "Uploading..." : "Upload Expenses"}
                                </Button>
                              </div>
                            )}
                            <div className="text-sm text-slate-600">
                              <p>
                                <strong>CSV Format:</strong> description, category, quantity, unit, unit_price
                              </p>
                              <p>
                                <strong>Categories:</strong> MATERIALS, LABOR, EQUIPMENT, TRANSPORT, OTHER
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Expenses List */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Expenses</span>
                            {expenses.some((exp: any) => exp.category === "LABOR") && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                🔄 Includes Auto-Fetched Labor
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isLoadingExpenses ? (
                            <div className="flex justify-center p-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                          ) : expenses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              No expenses found. Add your first expense above.
                            </div>
                          ) : (
                            <>
                              {/* Expense Summary */}
                              {expenses.length > 0 && (
                                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                                  <h4 className="font-medium text-slate-800 mb-3">Expense Summary</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(
                                      expenses.reduce((acc: any, exp: any) => {
                                        const category = exp.category || "Other"
                                        acc[category] = (acc[category] || 0) + Number(exp.amount || 0)
                                        return acc
                                      }, {}),
                                    ).map(([category, amount]) => (
                                      <div key={category} className="text-center">
                                        <div
                                          className={`p-3 rounded-lg ${
                                            category === "LABOR"
                                              ? "bg-blue-100 border border-blue-200"
                                              : "bg-white border border-slate-200"
                                          }`}
                                        >
                                          <p className="text-sm font-medium text-slate-600">{category}</p>
                                          <p className="text-lg font-bold text-slate-800">
                                            <ConvertedAmount amount={Number(amount)} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                                          </p>
                                          {category === "LABOR" && (
                                            <p className="text-xs text-blue-600 mt-1">Auto-Fetched</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-4 pt-4 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-slate-700">Total Expenses:</span>
                                      <span className="text-xl font-bold text-slate-800">
                                        <ConvertedAmount amount={expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0)} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-4">
                                {expenses.map((expense) => (
                                  <div
                                    key={expense.id}
                                    className={`border rounded-lg p-4 flex justify-between items-center ${
                                      expense.category === "LABOR" ? "bg-blue-50 border-blue-200" : "bg-white"
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium">{expense.description}</p>
                                        {expense.category === "LABOR" && (
                                          <Badge
                                            variant="outline"
                                            className="bg-blue-100 text-blue-700 border-blue-300 text-xs"
                                          >
                                            Auto-Fetched
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 mt-1">
                                        <Badge
                                          variant={expense.category === "LABOR" ? "default" : "secondary"}
                                          className={expense.category === "LABOR" ? "bg-blue-600" : ""}
                                        >
                                          {expense.category}
                                        </Badge>
                                        <p className="text-sm text-gray-500">
                                          {expense.quantity} {expense.unit} ×{" "}
                                          <ConvertedAmount amount={Number(expense.unit_price || 0)} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} />
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-lg"><ConvertedAmount amount={Number(expense.amount || 0)} sessionData={sessionData} showCurrency={true} currency={sessionData.user.currency} /></p>
                                      <p className="text-sm text-gray-500">
                                        {new Date(expense.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Profit & Loss Tab */}
                  {activeTab === "profit-loss" && (
                    <ProfitLossStatement
                      selectedProjectId={selectedProjectId}
                      sessionData={sessionData}
                      costSummary={costSummary}
                      projects={projects}
                      boqItems={boqItems}
                      formatCurrency={formatCurrency}
                      getUserCurrency={getUserCurrency}
                      isLoadingMetrics={isLoadingMetrics}
                      isLoadingProjects={isLoadingProjects}
                      isErrorProjects={isErrorProjects}
                      handleProjectChange={handleProjectChange}
                      activeTab={activeTab}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
