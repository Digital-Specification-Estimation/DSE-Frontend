"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  FileText,
  ChevronDown,
  Plus,
  ChevronUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetProjectsQuery } from "@/lib/redux/projectSlice";
import {
  useEditTradeMutation,
  useGetTradesQuery,
  useUnassignTradeProjectIdMutation,
} from "@/lib/redux/tradePositionSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";

// Define types for better type safety
interface Trade {
  id: number;
  role: string;
  icon: string;
  employeesNumber: number;
  workDays: number;
  plannedSalary: number;
  actualCost?: number;
}

interface Project {
  id: number;
  name: string;
  budget: number;
  trades: Trade[];
  isExpanded?: boolean;
}

export default function BudgetPlanning() {
  // Enhanced refetching configuration for session data
  const {
    data: sessionData = { user: {} },
    isLoading: isSessionLoading,
    isError,
    error,
    refetch: refetchSession,
  } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 60000, // Poll every minute to keep session data fresh
    skip: false,
  });

  // Improved refetching for trades and projects
  const {
    data: tradesFetched = [],
    refetch: refetchTrades,
    isFetching: isTradesFetching,
  } = useGetTradesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const {
    data: fetchedData = [],
    refetch: refetchProjects,
    isFetching: isProjectsFetching,
  } = useGetProjectsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const [unassignProject] = useUnassignTradeProjectIdMutation();
  const [updateTrade, { isLoading: isUpdating }] = useEditTradeMutation();
  const { toast } = useToast();

  // State management
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });

  const [activeTab, setActiveTab] = useState("plan");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showEditTrade, setShowEditTrade] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("This Month");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]);

  const chartRef = useRef<HTMLDivElement>(null);

  // Form state for adding and editing trades
  const [newTrade, setNewTrade] = useState({
    id: "",
    workDays: "22",
    plannedSalary: "",
    projectId: "",
  });

  const [editTrade, setEditTrade] = useState({
    id: 0,
    role: "",
    employeesNumber: "",
    workDays: "",
    plannedSalary: "",
  });

  // Use effect for refetch coordination
  useEffect(() => {
    // Refetch all data when the component mounts
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        // Parallel refetching for better performance
        await Promise.all([
          refetchSession(),
          refetchTrades(),
          refetchProjects(),
        ]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching budget data:", error);
        toast({
          title: "Error",
          description: "Failed to load budget data. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchAllData();

    // Set up an interval to periodically refetch all data
    const intervalId = setInterval(() => {
      Promise.all([refetchSession(), refetchTrades(), refetchProjects()]).catch(
        (error) => {
          console.error("Error in periodic data refresh:", error);
        }
      );
    }, 60000); // Refresh all data every minute

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refetchSession, refetchTrades, refetchProjects, toast]);

  // Add a new useEffect to handle derived data updates
  useEffect(() => {
    // This effect runs whenever tradesFetched or fetchedData changes
    // It ensures that derived calculations are updated without requiring a reload

    // Recalculate totals when trade data changes
    let newTotalPlannedCost = 0;
    let newTotalActualCost = 0;

    if (tradesFetched && tradesFetched.length > 0) {
      tradesFetched.forEach((trade: any) => {
        newTotalActualCost += trade.actual_cost || 0;
        newTotalPlannedCost += trade.planned_costs || 0;
      });
    }

    // Update Y-axis scale for charts when data changes
    const newYAxisLabels = calculateYAxisScale(tradesFetched);

    // No need to set state here as the component will re-render with the new calculations
    // when tradesFetched changes

    // Log updates for debugging
    console.log("Data dependencies updated:", {
      tradesCount: tradesFetched?.length || 0,
      projectsCount: fetchedData?.length || 0,
      totalPlannedCost: newTotalPlannedCost,
      totalActualCost: newTotalActualCost,
    });
  }, [tradesFetched, fetchedData]);

  // Add visibility change event listener to refetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // User has switched back to this tab, refresh data
        Promise.all([
          refetchSession(),
          refetchTrades(),
          refetchProjects(),
        ]).catch((error) => {
          console.error("Error refreshing data on visibility change:", error);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetchSession, refetchTrades, refetchProjects]);

  // Handle adding a trade with improved error handling
  const handleAddTrade = async () => {
    try {
      if (
        !newTrade.id ||
        !newTrade.workDays ||
        !newTrade.plannedSalary ||
        !newTrade.projectId
      ) {
        toast({
          title: "Validation Error",
          description: "All fields are required.",
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);

      // Prepare the trade data
      const tradeData = {
        id: newTrade.id,
        projectId: newTrade.projectId,
        work_days: Number.parseInt(newTrade.workDays),
        [sessionData.user.salary_calculation === "monthly rate"
          ? "monthly_planned_cost"
          : "daily_planned_cost"]: Number.parseFloat(
          newTrade.plannedSalary
        ).toString(),
      };

      // Optimistically update UI before the API call completes
      // This is a simplified example - in a real app, you'd update the Redux store
      // or use a more sophisticated state management approach

      // Make the actual API call
      await updateTrade(tradeData).unwrap();

      // Reset form
      setNewTrade({
        id: "",
        workDays: "22",
        plannedSalary: "",
        projectId: "",
      });

      // Enhanced refetching with retry logic
      const refetchWithRetry = async (retries = 3) => {
        try {
          // Use Promise.all to ensure all data is fetched in parallel
          await Promise.all([refetchTrades(), refetchProjects()]);
        } catch (error) {
          if (retries > 0) {
            console.log(`Retrying refetch, ${retries} attempts left`);
            setTimeout(() => refetchWithRetry(retries - 1), 1000);
          } else {
            throw error;
          }
        }
      };

      await refetchWithRetry();

      setShowAddTrade(false);
      setIsSaving(false);

      toast({
        title: "Trade Updated",
        description: `Trade has been added successfully.`,
      });
    } catch (error) {
      console.error("Error adding trade:", error);
      toast({
        title: "Error",
        description: "Failed to add trade. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);

      // Try to recover by refreshing data
      Promise.all([refetchTrades(), refetchProjects()]).catch((err) => {
        console.error("Error refreshing data after failed add:", err);
      });
    }
  };

  // Handle editing a trade with improved error handling
  const handleEditTrade = async () => {
    try {
      if (
        !editTrade.role ||
        !editTrade.employeesNumber ||
        !editTrade.workDays ||
        !editTrade.plannedSalary
      ) {
        toast({
          title: "Validation Error",
          description: "All fields are required.",
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);

      await updateTrade({
        id: editTrade.id,
        work_days: Number.parseInt(editTrade.workDays),
        [sessionData.user.salary_calculation === "monthly rate"
          ? "monthly_planned_cost"
          : "daily_planned_cost"]: Number.parseFloat(
          editTrade.plannedSalary
        ).toString(),
      }).unwrap();

      // Enhanced refetching with retry logic
      const refetchWithRetry = async (retries = 3) => {
        try {
          await Promise.all([refetchTrades(), refetchProjects()]);
        } catch (error) {
          if (retries > 0) {
            console.log(`Retrying refetch, ${retries} attempts left`);
            setTimeout(() => refetchWithRetry(retries - 1), 1000);
          } else {
            throw error;
          }
        }
      };

      await refetchWithRetry();

      setShowEditTrade(false);
      setIsSaving(false);

      toast({
        title: "Trade Updated",
        description: `${editTrade.role} has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating trade:", error);
      toast({
        title: "Error",
        description: "Failed to update trade. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);

      // Try to recover by refreshing data
      Promise.all([refetchTrades(), refetchProjects()]).catch((err) => {
        console.error("Error refreshing data after failed update:", err);
      });
    }
  };

  // Handle trade actions (edit/delete) with improved error handling
  const handleTradeAction = async (
    action: string,
    trade: any,
    projectId: number
  ) => {
    if (action === "edit") {
      setEditTrade({
        id: trade.id,
        role: trade.trade_name,
        employeesNumber: trade.employees.length.toString(),
        workDays: trade.work_days ? trade.work_days.toString() : "22",
        plannedSalary:
          sessionData.user.salary_calculation === "monthly rate"
            ? trade.monthly_planned_cost.toString()
            : trade.daily_planned_cost.toString(),
      });
      setSelectedTrade(trade);
      setShowEditTrade(true);
      toast({
        title: "Edit Trade",
        description: `Editing ${trade.trade_name}.`,
      });
    } else if (action === "delete") {
      try {
        await unassignProject(trade.id).unwrap();

        // Enhanced refetching with retry logic
        const refetchWithRetry = async (retries = 3) => {
          try {
            await Promise.all([refetchTrades(), refetchProjects()]);
          } catch (error) {
            if (retries > 0) {
              console.log(`Retrying refetch, ${retries} attempts left`);
              setTimeout(() => refetchWithRetry(retries - 1), 1000);
            } else {
              throw error;
            }
          }
        };

        await refetchWithRetry();

        toast({
          title: "Trade Deleted",
          description: `${trade.trade_name} has been deleted successfully.`,
        });
      } catch (error) {
        console.error("Error deleting trade:", error);
        toast({
          title: "Error",
          description: "Failed to delete trade. Please try again.",
          variant: "destructive",
        });

        // Try to recover by refreshing data
        Promise.all([refetchTrades(), refetchProjects()]).catch((err) => {
          console.error("Error refreshing data after failed delete:", err);
        });
      }
    }
  };

  // Toggle project expansion
  const toggleProjectExpansion = (projectId: number) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  // Get icon for role
  const getIconForRole = (role: string) => {
    switch (role) {
      case "Electricians":
        return "⚡";
      case "Technicians":
        return "🔧";
      case "HR & Admin":
        return "👨‍💼";
      case "Supervisors":
        return "👷";
      default:
        return "👤";
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) => {
    if (!searchTerm) return true;

    if (project.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return true;

    return project.trades.some((trade) =>
      trade.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate Y axis scale for chart
  const calculateYAxisScale = (data: any[]) => {
    if (!data || data.length === 0) return [0, 10000, 20000, 30000];

    const maxValue = Math.max(
      ...data.map((t: any) =>
        Math.max(t.planned_costs || 0, t.actual_cost || 0)
      )
    );

    const steps = 5;
    const stepValue = maxValue / steps;
    const yAxisValues = Array.from({ length: steps + 1 }, (_, i) =>
      Math.round(stepValue * i)
    );
    return yAxisValues;
  };

  // Handle exporting report
  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsExporting(false);
      toast({
        title: "Report Exported",
        description: "Budget report has been exported successfully.",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Error",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
      setIsExporting(false);
    }
  };

  // Handle time filter change
  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    toast({
      title: "Time Filter Changed",
      description: `Viewing data for ${value}.`,
    });
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Calculate totals
  let total_planned_cost = 0;
  let total_actual_cost = 0;
  if (tradesFetched && tradesFetched.length > 0) {
    tradesFetched.forEach((trade: any) => {
      total_actual_cost += trade.actual_cost || 0;
      total_planned_cost += trade.planned_costs || 0;
    });
  }

  const yAxisLabels = calculateYAxisScale(tradesFetched);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm text-gray-500">Loading budget data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display refreshing indicator when fetching
  const isRefreshing = isTradesFetching || isProjectsFetching;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                Budget Planning & Cost Comparison
              </h1>
              {isRefreshing && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Refreshing data...</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2 h-12 rounded-full"
                onClick={handleExportReport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Export Report
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowAddTrade(true);
                }}
                className="bg-orange-400 hover:bg-orange-500 gap-2 h-12 rounded-full"
              >
                <Plus className="h-4 w-4" />
                Add New Trade
              </Button>
            </div>
          </div>

          <Tabs
            defaultValue="plan"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className="border-b mb-6">
              <TabsList className="p-0 h-auto bg-transparent">
                <TabsTrigger
                  value="plan"
                  className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Plan Budget
                </TabsTrigger>
                <TabsTrigger
                  value="costs"
                  className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Costs Trend
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Plan Budget Tab */}
            <TabsContent value="plan" className="p-0 mt-0">
              <div className="flex justify-between items-center mb-4">
                <div className="relative">{/* Time filter select */}</div>

                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search project..."
                    className="pl-10 h-9 w-full"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>

              {/* Projects list */}
              {fetchedData && fetchedData.length > 0 ? (
                fetchedData.map((project: any) => {
                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg border mb-4"
                    >
                      <div
                        className="flex items-center p-4 cursor-pointer"
                        onClick={() => {
                          setExpandedProjectIds((prev) =>
                            prev.includes(project.id)
                              ? prev.filter((id) => id !== project.id)
                              : [...prev, project.id]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center text-white">
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3 9L12 5L21 9M3 9V17L12 21M3 9L12 13M12 21L21 17V9M12 21V13M21 9L12 13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <span className="font-medium">
                            {project.project_name}
                          </span>
                          <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full">
                            ${project.budget}
                          </span>
                        </div>
                        <div className="ml-auto">
                          {expandedProjectIds.includes(project.id) ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {project && expandedProjectIds.includes(project.id) && (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-t border-b text-sm text-muted-foreground">
                                <th className="px-4 py-3 text-left">SN</th>
                                <th className="px-4 py-3 text-left">
                                  Role/Trade
                                </th>
                                <th className="px-4 py-3 text-left">
                                  Employees Number
                                </th>
                                <th className="px-4 py-3 text-left">
                                  Work Days
                                </th>
                                <th className="px-4 py-3 text-left">
                                  Planned Salary ($)
                                </th>
                                <th className="w-10 px-4 py-3 text-left"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {project.trade_positions &&
                              project.trade_positions.length !== 0 ? (
                                project.trade_positions.map(
                                  (trade: any, index: any) => (
                                    <tr
                                      key={trade.id}
                                      className="border-b hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-3">{index + 1}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage
                                              src={
                                                trade.avatar ||
                                                "/placeholder.svg" ||
                                                "/placeholder.svg"
                                              }
                                              alt={trade.trade_name}
                                            />
                                            <AvatarFallback>
                                              {trade.trade_name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium">
                                            {trade.trade_name}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        {trade.employees &&
                                          trade.employees.length}
                                      </td>
                                      <td className="px-4 py-3">
                                        {trade.work_days
                                          ? trade.work_days
                                          : "unspecified"}
                                      </td>
                                      <td className="px-4 py-3">
                                        $
                                        {sessionData.user.salary_calculation ===
                                        "monthly rate"
                                          ? `${
                                              trade.monthly_planned_cost
                                                ? trade.monthly_planned_cost
                                                : 0
                                            }/month`
                                          : `${trade.daily_planned_cost}/day`}
                                      </td>
                                      <td className="px-4 py-3">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleTradeAction(
                                                  "edit",
                                                  trade,
                                                  project.id
                                                )
                                              }
                                            >
                                              <Edit className="h-4 w-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleTradeAction(
                                                  "delete",
                                                  trade,
                                                  project.id
                                                )
                                              }
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </td>
                                    </tr>
                                  )
                                )
                              ) : (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="px-4 py-3 text-center"
                                  >
                                    No Trade found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
                  No projects found matching your search criteria.
                </div>
              )}
            </TabsContent>

            {/* Costs Trend Tab */}
            <TabsContent value="costs" className="p-0 mt-0">
              <div className="bg-white rounded-lg border p-6">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium">
                          Total Planned Cost
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-700"></div>
                        <span className="text-sm font-medium">
                          Total Actual Cost
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-3xl font-bold">
                        ${total_planned_cost.toLocaleString()}
                      </div>
                      <div className="text-3xl font-bold">
                        ${total_actual_cost.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Select
                      defaultValue="all"
                      onValueChange={(value) => {
                        toast({
                          title: "Project Filter Changed",
                          description:
                            value === "all"
                              ? "Viewing all projects."
                              : `Viewing ${value} project.`,
                        });
                      }}
                    >
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project) => (
                          <SelectItem
                            key={project.id}
                            value={project.id.toString()}
                          >
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-80 relative mb-8" ref={chartRef}>
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-gray-500">
                    {[...yAxisLabels].reverse().map((value, index) => (
                      <div key={index}>${value.toFixed(0)}</div>
                    ))}
                  </div>

                  <div className="ml-12 h-full flex items-end justify-between">
                    {tradesFetched && tradesFetched.length > 0 ? (
                      tradesFetched.map((trade: any, index: number) => {
                        const maxValue = Math.max(
                          ...tradesFetched.map((t: any) =>
                            Math.max(t.planned_costs || 0, t.actual_cost || 0)
                          )
                        );

                        const maxHeight = 289;
                        const plannedHeight = maxValue
                          ? ((trade.planned_costs || 0) / maxValue) * maxHeight
                          : 0;
                        const actualHeight = maxValue
                          ? ((trade.actual_cost || 0) / maxValue) * maxHeight
                          : 0;

                        const showTooltip = trade.trade_name === "HR & Admin";

                        const difference =
                          (trade.actual_cost || 0) - (trade.planned_costs || 0);

                        return (
                          <div
                            key={trade.id}
                            className="flex flex-col items-center gap-2 group"
                            style={{ width: `${100 / tradesFetched.length}%` }}
                          >
                            <div className="relative flex items-end justify-center w-full gap-1">
                              <div
                                className="w-20 bg-orange-500 transition-all duration-500 ease-in-out cursor-pointer"
                                style={{ height: `${plannedHeight}px` }}
                                onMouseEnter={(e) => {
                                  const tooltip =
                                    e.currentTarget.nextElementSibling
                                      ?.nextElementSibling;
                                  if (tooltip) {
                                    tooltip.classList.remove("opacity-0");
                                    tooltip.classList.add("opacity-100");
                                  }
                                }}
                              ></div>

                              <div
                                className="w-20 bg-blue-700 transition-all duration-500 ease-in-out cursor-pointer"
                                style={{ height: `${actualHeight}px` }}
                                onMouseEnter={(e) => {
                                  const tooltip =
                                    e.currentTarget.nextElementSibling;
                                  if (tooltip) {
                                    tooltip.classList.remove("opacity-0");
                                    tooltip.classList.add("opacity-100");
                                  }
                                }}
                              ></div>

                              <div
                                className={`absolute top-0 right-0 bg-white border rounded-md p-2 shadow-md transition-opacity duration-200 
                                ${
                                  showTooltip
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                }`}
                                style={{
                                  transform: "translateY(-100%)",
                                  right: showTooltip ? "0" : "50%",
                                  zIndex: 20,
                                }}
                                onMouseLeave={(e) => {
                                  if (!showTooltip) {
                                    e.currentTarget.classList.remove(
                                      "opacity-100"
                                    );
                                    e.currentTarget.classList.add("opacity-0");
                                  }
                                }}
                              >
                                <div className="text-sm font-medium">
                                  {trade.trade_name}
                                </div>
                                <div className="text-sm">
                                  Planned Cost{" "}
                                  <span className="font-bold">
                                    $
                                    {(
                                      trade.planned_costs || 0
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  Actual Cost{" "}
                                  <span className="font-bold">
                                    ${(trade.actual_cost || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div
                                  className={`text-xs ${
                                    difference > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {difference > 0 ? "+" : ""}$
                                  {difference.toLocaleString()}{" "}
                                  {difference > 0
                                    ? "over budget"
                                    : "under budget"}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {trade.trade_name}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full flex items-center justify-center h-60 text-gray-500">
                        No trade data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Budget vs Actual Report */}
                <div>
                  <h3 className="font-medium mb-4">Budget vs Actual Report</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-t border-b text-sm text-muted-foreground">
                        <th className="px-4 py-3 text-left">Trade/Position</th>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                            Planned Budget ($
                            {total_planned_cost.toLocaleString()})
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-700"></div>
                            Actual Cost (${total_actual_cost.toLocaleString()})
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left">Difference</th>
                        <th className="w-10 px-4 py-3 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradesFetched && tradesFetched.length > 0 ? (
                        tradesFetched.map((data: any) => {
                          const difference =
                            (data.actual_cost || 0) - (data.planned_costs || 0);
                          return (
                            <tr
                              key={data.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={data.avatar || "/placeholder.svg"}
                                      alt={data.trade_name}
                                    />
                                    <AvatarFallback>
                                      {data.trade_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {data.trade_name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                ${(data.planned_costs || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                ${(data.actual_cost || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                {difference > 0 ? (
                                  <Badge className="bg-red-50 text-red-700">
                                    +${difference.toLocaleString()}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-50 text-green-700">
                                    -${Math.abs(difference).toLocaleString()}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center">
                            No trade data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add Trade Sheet */}
      <Sheet open={showAddTrade} onOpenChange={setShowAddTrade}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Adding New Trade</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">Trade details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Position/Trade
                    </label>
                    <Select
                      onValueChange={(value) =>
                        setNewTrade({ ...newTrade, id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {tradesFetched &&
                          tradesFetched.map((trade: any) => (
                            <SelectItem value={trade.id} key={trade.id}>
                              {trade.trade_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Project
                    </label>
                    <Select
                      onValueChange={(value) =>
                        setNewTrade({ ...newTrade, projectId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {fetchedData &&
                          fetchedData.map((project: any) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.project_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Days</label>
                    <Input
                      type="number"
                      value={newTrade.workDays}
                      onChange={(e) =>
                        setNewTrade({ ...newTrade, workDays: e.target.value })
                      }
                      placeholder="22"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Planned Salary{" "}
                      {sessionData.user.salary_calculation === "monthly rate"
                        ? "(Monthly)"
                        : "(Daily)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">
                        $
                      </span>
                      <Input
                        type="number"
                        className="pl-7"
                        value={newTrade.plannedSalary}
                        onChange={(e) =>
                          setNewTrade({
                            ...newTrade,
                            plannedSalary: e.target.value,
                          })
                        }
                        placeholder="5,000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={handleAddTrade}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Now"
            )}
          </Button>
        </SheetContent>
      </Sheet>

      {/* Edit Trade Sheet */}
      <Sheet open={showEditTrade} onOpenChange={setShowEditTrade}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Position/Trade</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">
                  Position/Trade details
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Days</label>
                    <Input
                      type="number"
                      value={editTrade.workDays}
                      onChange={(e) =>
                        setEditTrade({ ...editTrade, workDays: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Planned Salary{" "}
                      {sessionData.user.salary_calculation === "monthly rate"
                        ? "(Monthly)"
                        : "(Daily)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">
                        $
                      </span>
                      <Input
                        type="number"
                        className="pl-7"
                        value={editTrade.plannedSalary}
                        onChange={(e) =>
                          setEditTrade({
                            ...editTrade,
                            plannedSalary: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={handleEditTrade}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Apply Edits"
            )}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
