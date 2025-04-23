"use client";

import { useState, useEffect } from "react";
const today = new Date();
import {
  Search,
  Users,
  Clock,
  Calendar,
  DollarSign,
  ChevronDown,
  MoreVertical,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  ReferenceLine,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { useSessionQuery } from "@/lib/redux/authSlice";
import {
  useGetEmployeesQuery,
  useGetMonthlyStatsQuery,
} from "@/lib/redux/employeeSlice";
import { useGetTradesQuery } from "@/lib/redux/tradePositionSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetDailyAttendanceMonthlyQuery } from "@/lib/redux/attendanceSlice";

export default function Dashboard() {
  // const { data: tradesFetched } = useGetTradesQuery()
  // console.log(tradesFetched)
  const {
    data: employees = [],
    isLoading: isLoading2,
    refetch,
  } = useGetEmployeesQuery();
  const { toast } = useToast();

  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 120,
    attendanceToday: "92%",
    lateArrivals: 8,
    totalPayroll: "$25,000",
    employeeChange: "2.5%",
    attendanceChange: "3.2%",
    lateArrivalsChange: "1",
    payrollChange: "2.5%",
  });

  const { data: payrollData } = useGetMonthlyStatsQuery();
  // console.log(payrollData);

  const { data: attendanceData } = useGetDailyAttendanceMonthlyQuery();

  type Trade = {
    id: number;
    name: string;
    location: string;
    dailyRate: number;
    icon: string;
  };

  const trades: Trade[] = [
    {
      id: 1,
      name: "Electricians",
      location: "Main Office",
      dailyRate: 120,
      icon: "⚡",
    },
    {
      id: 2,
      name: "Technicians",
      location: "Site A",
      dailyRate: 100,
      icon: "🔧",
    },
    {
      id: 3,
      name: "HR & Admin",
      location: "Site B",
      dailyRate: 90,
      icon: "👨‍💼",
    },
    {
      id: 4,
      name: "Supervisors",
      location: "Site C",
      dailyRate: 120,
      icon: "👷",
    },
  ];

  const [filters, setFilters] = useState({
    trade: "",
    location: "",
    dailyRate: "",
    search: "",
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // In a real implementation, this would be:
        // const response = await fetch('/api/dashboard');
        // const data = await response.json();
        // setDashboardData(data.summary);
        // setPayrollData(data.payrollData);
        // setAttendanceData(data.attendanceData);
        // setEmployeeData(data.employeeData);

        setIsLoading(false);
        // toast({
        //   title: "Dashboard Loaded",
        //   description: "Dashboard data has been loaded successfully.",
        // });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      toast({
        title: "Refreshing Data",
        description: "Fetching the latest dashboard data...",
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation, this would fetch fresh data from the API
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
  };

  const handleFilterChange = (type: string, value: string) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
  };

  // Custom tooltip for payroll chart
  const PayrollTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="text-sm font-medium mb-1">
            {label},{today.getFullYear()}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Planned Cost</span>
            <span className="text-sm font-medium">
              ${payload[0].value.toLocaleString()}
            </span>
            <span className="text-sm">Actual Cost</span>
            <span className="text-sm font-medium">
              ${payload[1].value.toLocaleString()}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };
  const shortMonth = today.toLocaleString("default", { month: "short" });
  console.log(shortMonth); // e.g., "Apr"

  // Custom tooltip for attendance chart
  const AttendanceTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="text-sm font-medium mb-1">
            {shortMonth},{label},{today.getFullYear()}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Attendance</span>
            <span className="text-sm font-medium">
              {" "}
              {payload[0].value.toLocaleString()}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

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
    );
  }
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
  const employeesByTrade: { [key: string]: any[] } = {};

  employees.map((employee: any) => {
    // Grouping by trade
    const trade = employee.trade_position.trade_name;
    if (!employeesByTrade[trade]) {
      employeesByTrade[trade] = [];
    }
    employeesByTrade[trade].push(employee);

    // Other logic
    if (formatDate(employee.created_date) === getCurrentDate()) {
      newHires += 1;
    }

    totalActualPayroll += Number(employee.totalActualPayroll);
    totalDailyActuallPayroll += Number(employee.daily_rate);

    employee.attendance.map((attendance: any) => {
      if (formatDate(attendance.date) === getCurrentDate()) {
        if (
          attendance.status === "present" ||
          attendance.status === "Present"
        ) {
          numberOfPresent += 1;
        }
        if (attendance.status === "late" || attendance.status === "Late") {
          numberOfLateArrivals += 1;
        }
      }
      console.log(
        "date check",
        formatDate(attendance.date) === getYesterdayDate(),
        "date",
        formatDate(attendance.date)
      );
      if (formatDate(attendance.date) === getYesterdayDate()) {
        if (
          attendance.status === "present" ||
          attendance.status === "Present"
        ) {
          numberOfPresentYesterday += 1;
        }
        console.log("number of present yesterday", numberOfPresentYesterday);
        if (attendance.status === "late" || attendance.status === "Late") {
          numberOfLateYesterday += 1;
        }
      }
    });
  });
  // console.log(employeesByTrade);
  let tradeStatistics: {
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
      console.log(employee);
      totalPlanned += Number(employee.totalPlannedBytrade);
      totalActual += Number(employee.totalActualPayroll);
    });

    const difference = totalPlanned - totalActual;

    tradeStatistics[trade] = {
      planned_budget: totalPlanned,
      actual_cost: totalActual,
      difference: difference,
    };
  });
  // console.log(tradeStatistics);
  latenessDifference = numberOfLateArrivals - numberOfLateYesterday;
  presentPresentChange =
    ((numberOfPresent - numberOfPresentYesterday) / numberOfPresent) * 100;
  if (numberOfPresent === 0) {
    presentPresentChange =
      ((numberOfPresent - numberOfPresentYesterday) /
        numberOfPresentYesterday) *
      100;
  }

  newHirePercentage = Number((newHires / employees.length) * 100);
  attendancePercentage = Number((numberOfPresent / employees.length) * 100);
  let payrollPercentage =
    ((totalActualPayroll - totalDailyActuallPayroll) / totalActualPayroll) *
    100;

  if (payrollPercentage === -Infinity) {
    payrollPercentage = 0;
  }
  if (payrollPercentage === Infinity) {
    payrollPercentage = 0;
  }
  if (Number.isNaN(presentPresentChange)) {
    presentPresentChange = 0;
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
                {/* <Select
                  onValueChange={(value) => handleFilterChange("trade", value)}
                >
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
                <Select
                  onValueChange={(value) =>
                    handleFilterChange("location", value)
                  }
                >
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
                </Select> */}
                <Button
                  variant="outline"
                  className="gap-2 h-10 rounded-full"
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Employees"
                value={employees.length}
                icon={Users}
                change={{
                  value: `${newHirePercentage}%`,
                  type: newHires >= 0 ? "increase" : "decrease",
                  text: `+${newHires} new hires today`,
                }}
              />
              <StatCard
                title="Attendance Today"
                value={`%${attendancePercentage.toString()}`}
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
                  value: `${latenessDifference}`,
                  type: latenessDifference >= 0 ? "increase" : "decrease",
                  text: "from Yesterday",
                }}
              />
              <StatCard
                title="Total Actual Payroll"
                value={`$${totalActualPayroll.toLocaleString()}`}
                icon={DollarSign}
                iconBackground="bg-green-600"
                change={{
                  value: `${payrollPercentage.toFixed(1)}`,
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
                      {/* <ChevronDown className="h-4 w-4" /> */}
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-6">
                    ${totalActualPayroll.toLocaleString()}
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
                          tickFormatter={(value) => `$${value / 1000}K`}
                          ticks={[0, 250, 500, 750, 1000]}
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
                        tickFormatter={(value) => `$${value / 1000}K`}
                        ticks={[0, 250, 500, 750, 1000]}
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

              {/* Total Attendance Card */}
              <div className="bg-white rounded-lg border">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium">Total Attendance</h3>
                    <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm">
                      <span>This Month</span>
                      {/* <ChevronDown className="h-4 w-4" /> */}
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-6">
                    {attendancePercentage}%{" "}
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
                {/* <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search trade/position..."
                      className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {}}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 4H14M2 8H14M2 12H14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div> */}
              </div>

              <div className="border-t">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {/* <th className="w-12 p-4">
                        <Checkbox
                          onChange={() => {
                            toast({
                              title: "Select All",
                              description: "All items have been selected",
                            });
                          }}
                        />
                      </th> */}
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
                      (
                        [trade, employeeArray]: [
                          trade: any,
                          employeeArray: any
                        ],
                        index
                      ) => (
                        <tr key={index} className="border-b">
                          {/* <td className="p-4">
                            <Checkbox
                              onChange={() => {
                                toast({
                                  title: "Item Selected",
                                  description: `${trade} has been selected`,
                                });
                              }}
                            />
                          </td> */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={trade.avatar} alt={trade} />
                                <AvatarFallback>
                                  {trade.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{trade}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            $
                            {tradeStatistics[
                              trade
                            ].planned_budget.toLocaleString()}
                          </td>
                          <td className="p-4">
                            {" "}
                            $
                            {tradeStatistics[
                              trade
                            ].actual_cost.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <div
                                className={`h-5 w-5 rounded-full flex items-center justify-center ${
                                  Number.parseFloat(
                                    tradeStatistics[trade].difference
                                      .toString()
                                      .replace(/[^0-9.-]+/g, "")
                                  ) > 0
                                    ? "bg-green-100"
                                    : "bg-red-100"
                                }`}
                              >
                                <span
                                  className={`text-xs ${
                                    Number.parseFloat(
                                      tradeStatistics[trade].difference
                                        .toLocaleString()
                                        .toString()
                                        .replace(/[^0-9.-]+/g, "")
                                    ) > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {Number.parseFloat(
                                    tradeStatistics[trade].difference
                                      .toLocaleString()
                                      .toString()
                                      .replace(/[^0-9.-]+/g, "")
                                  ) > 0
                                    ? "+"
                                    : ""}
                                </span>
                              </div>
                              <span
                                className={`${
                                  Number.parseFloat(
                                    tradeStatistics[trade].difference
                                      .toLocaleString()
                                      .toString()
                                      .replace(/[^0-9.-]+/g, "")
                                  ) > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {tradeStatistics[trade].difference.toString()}
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
                                  description: `Viewing details for ${trade}`,
                                });
                              }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
