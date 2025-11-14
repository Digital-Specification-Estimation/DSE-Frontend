"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  MoreVertical,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
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
  type TooltipProps,
} from "recharts";
import {
  useGetEmployeesQuery,
  useGetMonthlyStatsQuery,
} from "@/lib/redux/employeeSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetDailyAttendanceMonthlyQuery } from "@/lib/redux/attendanceSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { convertCurrency, getExchangeRate } from "@/lib/utils";
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
  console.log("convertedAmount", convertedAmount);
  return (
    <>
      {showCurrency
        ? `${currency} ${Number(convertedAmount).toLocaleString()}`
        : Number(convertedAmount).toLocaleString()}
    </>
  );
}

export default function Dashboard() {
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
  const today = new Date();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User state
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });
  const {
    data: sessionData = { user: { settings: [] } },
    isLoading: isSessionLoading,
    refetch: refetchSession,
  } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 300000, // Poll every 5 minutes
  });
  console.log("session data", sessionData);
  const {
    data: attendanceData = [],
    isLoading: isAttendanceLoading,
    refetch: refetchAttendance,
    isFetching: isAttendanceFetching,
  } = useGetDailyAttendanceMonthlyQuery(sessionData.user.company_id, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 300000, // Poll every 5 minutes
  });
  console.log("attendance data", attendanceData);
  // Redux query hooks with proper options for keeping data fresh
  const {
    data: employees = [],
    isLoading: isEmployeesLoading,
    refetch: refetchEmployees,
    isFetching: isEmployeesFetching,
  } = useGetEmployeesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 300000, // Poll every 5 minutes
  });

  let {
    data: payrollData = [],
    isLoading: isPayrollLoading,
    refetch: refetchPayroll,
    isFetching: isPayrollFetching,
  } = useGetMonthlyStatsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  console.log("payroll data", payrollData);

  // Combined loading state
  const isLoading =
    isEmployeesLoading || isPayrollLoading || isAttendanceLoading;
  const isFetching =
    isEmployeesFetching || isPayrollFetching || isAttendanceFetching;
  const handleRefreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      toast({
        title: "Refreshing Data",
        description: "Fetching the latest dashboard data...",
      });

      // Refresh all data sources concurrently
      await Promise.all([
        refetchEmployees(),
        refetchPayroll(),
        refetchAttendance(),
      ]);

      setIsRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "Dashboard has been updated with the latest data.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  }, [refetchEmployees, refetchPayroll, refetchAttendance, toast]);
  // Filters state
  const [filters, setFilters] = useState({
    trade: "",
    location: "",
    dailyRate: "",
    search: "",
  });

  // Refresh all data sources

  // Auto-refresh data when component mounts
  /**
   * Set up an interval to check if data needs refreshing.
   * This effect is used to keep the dashboard data up to date.
   * It checks every 15 minutes if the data needs to be refreshed.
   * If not already refreshing or fetching data, it calls the handleRefreshData() function.
   * The interval is cleared when the component unmounts.
   */
  useEffect(() => {
    // Initial data load is handled by the RTK Query hooks
    // This effect can be used for additional setup if needed

    // Set up an interval to check if data needs refreshing
    const intervalId = setInterval(() => {
      // Only refresh if not already refreshing or fetching
      if (!isRefreshing && !isFetching) {
        handleRefreshData();
      }
    }, 900000); // Check every 15 minutes

    return () => clearInterval(intervalId);
  }, [handleRefreshData, isRefreshing, isFetching]);

  // Set permissions based on user role

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

  const [exchangeRate, setExchangeRate] = useState(1); // Default to 1 to avoid multiplication by undefined

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (
        sessionData?.user?.currency &&
        sessionData?.user?.companies?.[0]?.base_currency
      ) {
        const rate = await getExchangeRate(
          sessionData.user.currency,
          sessionData.user.companies[0].base_currency
        );
        setExchangeRate(rate);
      }
    };

    fetchExchangeRate();
  }, [sessionData?.user?.currency, sessionData?.user?.companies]);

  payrollData = payrollData.map((item) => {
    // Convert the amount as needed (e.g., multiply by exchange rate, format, etc.)
    const convertedCost = item.cost / exchangeRate;
    const convertedPlanned = item.planned / exchangeRate;

    // Return a new object with the converted values
    return {
      ...item,
      cost: convertedCost.toFixed(4),
      planned: convertedPlanned.toFixed(4),
    };
  });

  const handleFilterChange = (type: string, value: string) => {
    // Convert "all" to empty string for filter logic
    const filterValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [type]: filterValue }));
  };

  // Custom tooltip for payroll chart
  const PayrollTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="text-sm font-medium mb-1">
            {label}, {today.getFullYear()}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Planned Cost</span>
            <span className="text-sm font-medium">
              {/* <ConvertedAmount 
                amount={payload[0].value ?? 0 } 
                currency={sessionData.user.currency}
                showCurrency={true} 
              /> */}
              {sessionData.user.currency}
              {payload[0].value ?? 0}
            </span>
            <span className="text-sm">Actual Cost</span>
            <span className="text-sm font-medium">
              {/* <ConvertedAmount 
                amount={payload[1].value ?? 0} 
                currency={sessionData.user.currency}
                showCurrency={true}
              /> */}
              {sessionData.user.currency}
              {payload[1].value ?? 0}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const shortMonth = today.toLocaleString("default", { month: "short" });

  // Custom tooltip for attendance chart
  const AttendanceTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="text-sm font-medium mb-1">
            {shortMonth}, {label}, {today.getFullYear()}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Attendance</span>
            <span className="text-sm font-medium">
              {payload[0].value?.toLocaleString()}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Redirect users whose role request is not yet approved
  if (
    sessionData?.user?.role_request_approval &&
    sessionData.user.role_request_approval !== "APPROVED"
  ) {
    if (typeof window !== "undefined") {
      window.location.href = "/pending-role";
    }
    // Return early to prevent rendering dashboard content
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p>Redirecting to pending role page...</p>
        </div>
      </div>
    );
  }

  if (isLoading || isSessionLoading) {
    return (
      <div className="flex h-screen bg-white">
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
    );
  }

  // Data processing functions
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

  const getYesterdayDate = () => {
    const today = new Date();
    const day = today.getDate() - 1;
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const processEmployeeData = () => {
    // Apply filters to employees
    const filteredEmployees = employees.filter((employee: any) => {
      // Search filter
      if (
        filters.search &&
        !employee.username?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Trade filter
      if (
        filters.trade &&
        employee.trade_position?.trade_name !== filters.trade
      ) {
        return false;
      }

      // Location filter
      if (
        filters.location &&
        employee.trade_position.location_name !== filters.location
      ) {
        return false;
      }

      // Daily rate filter
      if (filters.dailyRate) {
        const rate = Number(employee.daily_rate) || 0;
        if (filters.dailyRate === "low" && rate >= 100) {
          return false;
        }
        if (filters.dailyRate === "medium" && (rate < 100 || rate > 200)) {
          return false;
        }
        if (filters.dailyRate === "high" && rate <= 200) {
          return false;
        }
      }

      return true;
    });

    let latenessDifference = 0;
    let attendancePercentage = 0;
    let totalActualPayroll = 0;
    let presentPresentChange = 0;
    let numberOfLateYesterday = 0;
    let newHires = 0;
    let newHirePercentage = 0;
    let numberOfPresent = 0;
    let numberOfPresentYesterday = 0;
    let totalDailyActuallPayroll = 0;
    let numberOfLateArrivals = 0;
    const employeesByTrade: { [key: string]: any[] } = {};

    // Process each employee
    filteredEmployees.forEach((employee: any) => {
      // Grouping by trade
      const trade = employee.trade_position.trade_name;
      if (!employeesByTrade[trade]) {
        employeesByTrade[trade] = [];
      }
      employeesByTrade[trade].push(employee);

      // Count new hires
      if (formatDate(employee.created_date) === getCurrentDate()) {
        newHires += 1;
      }

      // Calculate payroll
      totalActualPayroll += Number(employee.totalActualPayroll) || 0;
      if (sessionData.user.salary_calculation === "monthly rate") {
        totalDailyActuallPayroll += Number(employee.monthly_rate) || 0;
      } else {
        totalDailyActuallPayroll += Number(employee.daily_rate) || 0;
      }

      // Process attendance data
      if (Array.isArray(employee.attendance)) {
        employee.attendance.forEach((attendance: any) => {
          if (formatDate(attendance.date) === getCurrentDate()) {
            if (attendance.status?.toLowerCase() === "present") {
              numberOfPresent += 1;
            }
            if (attendance.status?.toLowerCase() === "late") {
              numberOfLateArrivals += 1;
            }
          }

          if (formatDate(attendance.date) === getYesterdayDate()) {
            if (attendance.status?.toLowerCase() === "present") {
              numberOfPresentYesterday += 1;
            }
            if (attendance.status?.toLowerCase() === "late") {
              numberOfLateYesterday += 1;
            }
          }
        });
      }
    });

    // Calculate trade statistics
    const tradeStatistics: {
      [key: string]: {
        planned_budget: number;
        actual_cost: number;
        difference: number;
      };
    } = {};

    Object.entries(employeesByTrade).forEach(([trade, employeeArray]) => {
      let totalPlanned = 0;
      let totalActual = 0;

      employeeArray.forEach((employee: any) => {
        totalPlanned += Number(employee.totalPlannedBytrade) || 0;
        totalActual += Number(employee.totalActualPayroll) || 0;
      });

      const difference = totalPlanned - totalActual;

      tradeStatistics[trade] = {
        planned_budget: totalPlanned,
        actual_cost: totalActual,
        difference: difference,
      };
    });

    // Calculate statistics
    latenessDifference = numberOfLateArrivals - numberOfLateYesterday;

    // Calculate percentage change in attendance with safeguards against division by zero
    if (numberOfPresent > 0 && numberOfPresentYesterday > 0) {
      presentPresentChange =
        ((numberOfPresent - numberOfPresentYesterday) / numberOfPresent) * 100;
    } else if (numberOfPresentYesterday > 0) {
      presentPresentChange =
        ((numberOfPresent - numberOfPresentYesterday) /
          numberOfPresentYesterday) *
        100;
    } else {
      presentPresentChange = 0;
    }

    // Calculate new hire percentage with safeguard against division by zero
    newHirePercentage =
      employees.length > 0 ? (newHires / employees.length) * 100 : 0;

    // Calculate attendance percentage with safeguard against division by zero
    attendancePercentage =
      employees.length > 0 ? (numberOfPresent / employees.length) * 100 : 0;

    // Calculate payroll percentage with safeguards against division by zero and invalid results
    let payrollPercentage = 0;
    if (totalActualPayroll > 0) {
      payrollPercentage =
        ((totalActualPayroll - totalDailyActuallPayroll) / totalActualPayroll) *
        100;

      // Handle edge cases
      if (!isFinite(payrollPercentage) || isNaN(payrollPercentage)) {
        payrollPercentage = 0;
      }
    }

    return {
      employeesByTrade,
      tradeStatistics,
      latenessDifference,
      attendancePercentage,
      totalActualPayroll,
      presentPresentChange,
      newHires,
      newHirePercentage,
      numberOfPresent,
      numberOfLateArrivals,
      payrollPercentage,
    };
  };

  // Process data
  const {
    employeesByTrade,
    tradeStatistics,
    latenessDifference,
    attendancePercentage,
    totalActualPayroll,
    presentPresentChange,
    newHires,
    newHirePercentage,
    numberOfPresent,
    numberOfLateArrivals,
    payrollPercentage,
  } = processEmployeeData();
  console.log("total actual payroll", totalActualPayroll);
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 h-10 rounded-full"
              onClick={handleRefreshData}
              disabled={isRefreshing || isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isRefreshing || isFetching ? "animate-spin" : ""
                }`}
              />
              {isRefreshing || isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.trade || "all"}
                onValueChange={(value) => handleFilterChange("trade", value)}
              >
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>{filters.trade || "Trade"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  {Object.keys(employeesByTrade).map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.location || "all"}
                onValueChange={(value) => handleFilterChange("location", value)}
              >
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>{filters.location || "Location"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {Array.from(
                    new Set(
                      employees.map(
                        (emp: any) => emp.trade_position.location_name
                      )
                    )
                  )
                    .filter(Boolean)
                    .map((location: any) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.dailyRate || "all"}
                onValueChange={(value) =>
                  handleFilterChange("dailyRate", value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>{filters.dailyRate || "Daily Rate"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rates</SelectItem>
                  <SelectItem value="low">
                    Low (&lt; {sessionData.user.currency}100)
                  </SelectItem>
                  <SelectItem value="medium">
                    {sessionData.user.currency}100 - {sessionData.user.currency}
                    200
                  </SelectItem>
                  <SelectItem value="high">
                    High (&gt; {sessionData.user.currency}200)
                  </SelectItem>
                </SelectContent>
              </Select>

              {(filters.trade ||
                filters.location ||
                filters.dailyRate ||
                filters.search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      trade: "",
                      location: "",
                      dailyRate: "",
                      search: "",
                    })
                  }
                  className="text-sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Employees"
          value={employees.length}
          icon={Users}
          change={{
            value: `${newHirePercentage.toFixed(1)}%`,
            type: newHires >= 0 ? "increase" : "decrease",
            text: `+${newHires} new hires today`,
          }}
        />
        <StatCard
          title="Attendance Today"
          value={`${attendancePercentage.toFixed(1)}%`}
          icon={Clock}
          iconBackground="bg-blue-700"
          change={{
            value: `${presentPresentChange.toFixed(1)}%`,
            type: presentPresentChange >= 0 ? "increase" : "decrease",
            text: "from yesterday",
          }}
        />
        <StatCard
          title="Late Arrivals Today"
          value={numberOfLateArrivals}
          icon={Calendar}
          iconBackground="bg-red-600"
          change={{
            value: `${latenessDifference.toFixed(1)}`,
            type: latenessDifference <= 0 ? "increase" : "decrease",
            text: "from Yesterday",
          }}
        />
        <StatCard
          title="Total Actual Payroll"
          value={
            <>
              <ConvertedAmount
                amount={Number(totalActualPayroll)}
                currency={sessionData.user.currency}
                sessionData={sessionData}
              />
            </>
          }
          icon={DollarSign}
          iconBackground="bg-green-600"
          change={{
            value: `${payrollPercentage.toFixed(1)}%`,
            type: payrollPercentage >= 0 ? "increase" : "decrease",
            text: "planned vs actual change",
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Total Payroll Cost Card */}
        <div className="bg-white rounded-lg border">
          <div className="p-5">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium">Total Actual Payroll Cost</h3>
              <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm">
                <span>This Year</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-6">
              <ConvertedAmount
                amount={totalActualPayroll}
                currency={sessionData.user.currency}
                showCurrency={true}
                sessionData={sessionData}
              />
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={payrollData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  barGap={0}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#EEEEEE"
                    strokeWidth={1}
                  />
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
                    tickFormatter={(value) => {
                      return new Intl.NumberFormat("en-US", {
                        style: "decimal",
                        maximumFractionDigits: 0,
                      }).format(value);
                    }}
                    domain={[0, (dataMax) => `${Math.ceil(dataMax)}`]}
                    allowDataOverflow={false}
                    width={80}
                    tickCount={6}
                    interval={0}
                  />
                  <Tooltip
                    content={(props) => <PayrollTooltip {...props} />}
                    cursor={false}
                  />

                  <Bar
                    dataKey="planned"
                    fill="#FFA500"
                    barSize={20}
                    radius={[0, 0, 0, 0]}
                    name="Planned Cost"
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="cost"
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
              </div>
            </div>
            <div className="text-3xl font-bold mb-6">
              {attendancePercentage.toFixed(1)}%{" "}
              <span className="text-sm font-medium text-muted-foreground">
                (Today)
              </span>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={attendanceData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
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
                    content={(props) => <AttendanceTooltip {...props} />}
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
        </div>

        <div className="border-t">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-sm text-gray-500">
                  Trade/Position
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-500">
                  Planned Budget
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-500">
                  Actual Cost
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-500">
                  Difference
                </th>
                <th className="w-12 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(employeesByTrade).map(
                ([trade, employeeArray], index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={"/placeholder.svg"} alt={trade} />
                          <AvatarFallback>{trade.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{trade}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <ConvertedAmount
                        amount={tradeStatistics[trade].planned_budget}
                        currency={sessionData.user.currency}
                        sessionData={sessionData}
                      />
                    </td>
                    <td className="p-4">
                      <ConvertedAmount
                        amount={tradeStatistics[trade].actual_cost}
                        currency={sessionData.user.currency}
                        sessionData={sessionData}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center ${
                            tradeStatistics[trade].difference > 0
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          <span
                            className={`text-xs ${
                              tradeStatistics[trade].difference > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {tradeStatistics[trade].difference > 0 ? "+" : ""}
                          </span>
                        </div>
                        <ConvertedAmount
                          amount={Math.abs(tradeStatistics[trade].difference)}
                          currency={sessionData.user.currency}
                          sessionData={sessionData}
                        />
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
