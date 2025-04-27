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
  ArrowUpRight,
  ArrowDownRight,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Sector,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type to include lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

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
  console.log("permissions", permissions);

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
  const [projects, setProjects] = useState<any[]>([]);
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
  const [activePieIndex, setActivePieIndex] = useState(0);

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
    plannedSalary: 0,
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
          : "daily_planned_cost"]: (
          Number(newTrade.plannedSalary) / currencyValue
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
          : "daily_planned_cost"]: Number(
          Number(editTrade.plannedSalary) / currencyValue
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
            ? trade.monthly_planned_cost
              ? trade.monthly_planned_cost * currencyValue
              : 0
            : trade.daily_planned_cost
            ? trade.daily_planned_cost * currencyValue
            : 0,
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
  const exportProjectReport = async (project: any) => {
    try {
      setIsExporting(true);

      // Validate project data
      if (!project) {
        throw new Error("No project data available");
      }

      const doc = new jsPDF();

      // Add title and project info with proper null checks
      doc.setFontSize(18);
      doc.setTextColor(33, 37, 41);
      doc.text(
        `Project Report: ${project.project_name || "Unnamed Project"}`,
        14,
        20
      );

      doc.setFontSize(12);
      doc.setTextColor(73, 80, 87);
      doc.text(
        `Budget: ${currencyShort}${
          (project.budget * currencyValue
            ? project.budget * currencyValue
            : 0
          ).toLocaleString() || "0"
        }`,
        14,
        30
      );
      doc.text(`Start Date: ${project.start_date || "Not specified"}`, 14, 40);
      doc.text(`Status: ${project.status || "Active"}`, 14, 50);

      // Add trades table if they exist
      if (project.trade_positions?.length > 0) {
        const tableData = project.trade_positions.map(
          (trade: any, index: number) => [
            index + 1,
            trade.trade_name || "Unnamed Trade",
            trade.employees?.length || 0,
            trade.work_days || "N/A",
            `${currencyShort}${(
              trade.daily_planned_cost * currencyValue || 0
            ).toLocaleString()}`,
            `${currencyShort}${(
              (trade.daily_planned_cost * currencyValue || 0) *
              (trade.work_days || 0)
            ).toLocaleString()}`,
          ]
        );

        autoTable(doc, {
          startY: 60,
          head: [
            [
              "SN",
              "Trade",
              "Employees",
              "Work Days",
              "Daily Rate",
              "Total Cost",
            ],
          ],
          body: tableData,
          theme: "grid",
          headStyles: {
            fillColor: [241, 101, 41],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          margin: { top: 60 },
          styles: {
            cellPadding: 4,
            fontSize: 10,
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 },
          },
        });

        // Calculate totals
        const totalPlanned = project.trade_positions.reduce(
          (sum: number, trade: any) =>
            sum + (trade.daily_planned_cost || 0) * (trade.work_days || 0),
          0
        );

        const totalEmployees = project.trade_positions.reduce(
          (sum: number, trade: any) => sum + (trade.employees?.length || 0),
          0
        );

        // Add summary section
        doc.setFontSize(14);
        doc.setTextColor(33, 37, 41);
        doc.text("Project Summary", 14, doc.lastAutoTable.finalY + 15);

        doc.setFontSize(12);
        doc.setTextColor(73, 80, 87);
        doc.text(
          `Total Trades: ${project.trade_positions.length}`,
          14,
          doc.lastAutoTable.finalY + 25
        );
        doc.text(
          `Total Employees: ${totalEmployees}`,
          14,
          doc.lastAutoTable.finalY + 35
        );
        doc.text(
          `Total Planned Cost: ${currencyShort}${(
            totalPlanned * currencyValue
          ).toLocaleString()}`,
          14,
          doc.lastAutoTable.finalY + 45
        );

        // Add budget comparison
        const budgetValue = project.budget ? Number(project.budget) : 0;
        const budgetPercentage =
          budgetValue > 0 ? (totalPlanned / budgetValue) * 100 : 0;
        doc.text(
          `Budget Utilization: ${budgetPercentage.toFixed(1)}%`,
          14,
          doc.lastAutoTable.finalY + 55
        );

        // Add visual indicator
        doc.setFillColor(241, 101, 41);
        doc.rect(14, doc.lastAutoTable.finalY + 60, budgetPercentage, 5, "F");
        doc.rect(14, doc.lastAutoTable.finalY + 60, 100, 5, "S");
      } else {
        doc.setFontSize(12);
        doc.text("No trades assigned to this project", 14, 60);
      }

      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(108, 117, 125);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        14,
        doc.internal.pageSize.height - 10
      );

      // Save the PDF
      doc.save(
        `${(project.project_name || "project").replace(
          /[^a-z0-9]/gi,
          "_"
        )}_Report.pdf`
      );
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAllProjectsReport = async () => {
    try {
      setIsExporting(true);

      // Validate data
      if (!fetchedData || fetchedData.length === 0) {
        throw new Error("No projects data available");
      }

      const doc = new jsPDF();
      let yPosition = 20;

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(33, 37, 41);
      doc.text("All Projects Budget Report", 14, yPosition);
      yPosition += 10;

      // Add summary
      doc.setFontSize(12);
      doc.setTextColor(73, 80, 87);
      doc.text(
        `Report Date: ${new Date().toLocaleDateString()}`,
        14,
        yPosition
      );
      yPosition += 10;
      doc.text(`Total Projects: ${fetchedData.length}`, 14, yPosition);
      yPosition += 15;

      // Add each project's details
      fetchedData.forEach((project: any, index: number) => {
        // Add new page if needed
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Project header
        doc.setFontSize(14);
        doc.setTextColor(33, 37, 41);
        doc.text(
          `${index + 1}. ${project.project_name || "Unnamed Project"}`,
          14,
          yPosition
        );
        yPosition += 10;

        // Project details
        doc.setFontSize(12);
        doc.setTextColor(73, 80, 87);
        doc.text(
          `Budget: ${currencyShort}${
            (project.budget * currencyValue
              ? project.budget * currencyValue
              : 0
            ).toLocaleString() || "0"
          }`,
          14,
          yPosition
        );
        doc.text(`Status: ${project.status || "Active"}`, 100, yPosition);
        yPosition += 10;

        // Add trades table if they exist
        if (project.trade_positions?.length > 0) {
          const tableData = project.trade_positions.map((trade: any) => [
            trade.trade_name || "Unnamed Trade",
            trade.employees?.length || 0,
            trade.work_days || "N/A",
            `${currencyShort}${(
              trade.daily_planned_cost * currencyValue || 0
            ).toLocaleString()}`,
            `${currencyShort}${(
              (trade.daily_planned_cost * currencyValue || 0) *
              (trade.work_days || 0)
            ).toLocaleString()}`,
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [
              ["Trade", "Employees", "Work Days", "Daily Rate", "Total Cost"],
            ],
            body: tableData,
            theme: "grid",
            headStyles: {
              fillColor: [13, 110, 253],
              textColor: [255, 255, 255],
              fontStyle: "bold",
            },
            margin: { top: yPosition },
            styles: {
              cellPadding: 3,
              fontSize: 9,
              valign: "middle",
            },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 20 },
              2: { cellWidth: 20 },
              3: { cellWidth: 25 },
              4: { cellWidth: 30 },
            },
          });

          yPosition = doc.lastAutoTable.finalY + 10;

          // Calculate project totals
          const totalPlanned = project.trade_positions.reduce(
            (sum: number, trade: any) =>
              sum + (trade.daily_planned_cost || 0) * (trade.work_days || 0),
            0
          );

          doc.setFontSize(11);
          doc.setTextColor(33, 37, 41);
          doc.text(
            `Total Planned Cost: ${currencyShort}${(
              totalPlanned * currencyValue
            ).toLocaleString()}`,
            14,
            yPosition
          );
          doc.text(
            `Budget Utilization: ${(project.budget
              ? (totalPlanned / Number(project.budget)) * 100
              : 0
            ).toFixed(1)}%`,
            100,
            yPosition
          );
          yPosition += 15;
        } else {
          doc.setFontSize(11);
          doc.text("No trades assigned", 14, yPosition);
          yPosition += 20;
        }

        // Add separator
        doc.setDrawColor(222, 226, 230);
        doc.line(14, yPosition, doc.internal.pageSize.width - 14, yPosition);
        yPosition += 10;
      });

      // Add summary statistics
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text("Summary Statistics", 14, yPosition);
      yPosition += 15;

      const totalBudget = fetchedData.reduce(
        (sum: number, project: any) => sum + (Number(project.budget) || 0),
        0
      );
      const totalPlannedCost = fetchedData.reduce(
        (sum: number, project: any) => {
          return (
            sum +
            (project.trade_positions?.reduce(
              (tradeSum: number, trade: any) =>
                tradeSum +
                (trade.daily_planned_cost || 0) * (trade.work_days || 0),
              0
            ) || 0)
          );
        },
        0
      );

      doc.setFontSize(12);
      doc.text(
        `Total Budget Across Projects: ${currencyShort}${(
          totalBudget * currencyValue
        ).toLocaleString()}`,
        14,
        yPosition
      );
      yPosition += 10;
      doc.text(
        `Total Planned Costs: ${currencyShort}${(
          totalPlannedCost * currencyValue
        ).toLocaleString()}`,
        14,
        yPosition
      );
      yPosition += 10;
      doc.text(
        `Overall Budget Utilization: ${(totalBudget > 0
          ? (totalPlannedCost / totalBudget) * 100
          : 0
        ).toFixed(1)}%`,
        14,
        yPosition
      );
      yPosition += 20;

      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(108, 117, 125);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        14,
        doc.internal.pageSize.height - 10
      );

      // Save the PDF
      doc.save("All_Projects_Report.pdf");

      toast({
        title: "Export Successful",
        description: "All projects report has been generated",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) => {
    if (!searchTerm) return true;

    if (project.project_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
    console.log("Search term updated:", value);
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

  // Format trend data for line chart
  const generateTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    return months.map((month, index) => {
      // Create realistic looking trend data based on the actual data
      const baseValue = total_planned_cost / 6;
      const randomFactor = 0.8 + Math.random() * 0.4; // Between 0.8 and 1.2
      const plannedValue = baseValue * randomFactor;

      // Actual costs should follow trends but with more variation
      const actualFactor = 0.7 + Math.random() * 0.6; // Between 0.7 and 1.3
      const actualValue = baseValue * actualFactor;

      return {
        name: month,
        planned: Math.round(plannedValue * currencyValue),
        actual: Math.round(actualValue * currencyValue),
      };
    });
  };

  // Prepare data for Pie chart
  const preparePieData = () => {
    if (!tradesFetched || tradesFetched.length === 0) {
      return [];
    }

    return tradesFetched.map((trade: any) => ({
      name: trade.trade_name,
      value: (trade.planned_costs || 0) * currencyValue,
      actualValue: (trade.actual_cost || 0) * currencyValue,
    }));
  };

  // Active shape for pie chart
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={8}
          textAnchor="middle"
          fill={fill}
          className="text-base font-medium"
        >
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
          className="text-xs"
        >
          {`${currencyShort}${value.toLocaleString()}`}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#999"
          className="text-xs"
        >
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  // Custom tooltip formatter
  const customTooltipFormatter = (value: number, name: string) => {
    return [`${currencyShort}${value.toLocaleString()}`, name];
  };

  const trendData = generateTrendData();
  const pieData = preparePieData();

  // Budget status calculation
  const budgetStatus =
    total_actual_cost <= total_planned_cost ? "under" : "over";
  const budgetDifference =
    Math.abs(total_actual_cost - total_planned_cost) * currencyValue;
  const budgetPercentage =
    total_planned_cost > 0
      ? Math.round(
          (Math.abs(total_actual_cost - total_planned_cost) /
            total_planned_cost) *
            100
        )
      : 0;

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

  // Get colors for pie chart
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
  ];

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
              {(permissions.full_access || permissions.generate_reports) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 h-12 rounded-full"
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
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={exportAllProjectsReport}
                      disabled={!fetchedData || fetchedData.length === 0}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export All Projects
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (fetchedData && fetchedData.length > 0) {
                          exportProjectReport(fetchedData[0]);
                        }
                      }}
                      disabled={!fetchedData || fetchedData.length === 0}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export Current Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
                <div className="relative">
                  <Select
                    defaultValue="This Month"
                    onValueChange={handleTimeFilterChange}
                  >
                    <SelectTrigger className="w-[180px] bg-white h-9">
                      <SelectValue placeholder="Time Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="This Month">This Month</SelectItem>
                      <SelectItem value="Last Month">Last Month</SelectItem>
                      <SelectItem value="This Quarter">This Quarter</SelectItem>
                      <SelectItem value="This Year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                fetchedData
                  .filter((project: any) => {
                    if (!searchTerm) return true;

                    // Search in project name
                    if (
                      project.project_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                      return true;

                    // Search in trade positions
                    if (
                      project.trade_positions &&
                      project.trade_positions.length > 0
                    ) {
                      return project.trade_positions.some((trade: any) =>
                        trade.trade_name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      );
                    }

                    return false;
                  })
                  .map((project: any) => {
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
                              {currencyShort}
                              {project.budget * currencyValue
                                ? project.budget * currencyValue
                                : " "}
                            </span>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportProjectReport(project);
                              }}
                              disabled={isExporting}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Export
                            </Button>
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
                                    Planned Salary ({currencyShort})
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
                                        <td className="px-4 py-3">
                                          {index + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                              <Input
                                                type="search"
                                                placeholder="Search project..."
                                              />
                                              <AvatarImage
                                                src={
                                                  trade.avatar ||
                                                  "/placeholder.svg" ||
                                                  "/placeholder.svg" ||
                                                  "/placeholder.svg" ||
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
                                          {currencyShort}
                                          {sessionData.user
                                            .salary_calculation ===
                                          "monthly rate"
                                            ? `${(
                                                (trade.monthly_planned_cost
                                                  ? trade.monthly_planned_cost
                                                  : 0) * currencyValue
                                              ).toLocaleString()}/month`
                                            : `${(
                                                (trade.daily_planned_cost
                                                  ? trade.daily_planned_cost
                                                  : 0) * currencyValue
                                              ).toLocaleString()}/day`}
                                        </td>
                                        <td className="px-4 py-3">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                              >
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
              ) : searchTerm ? (
                <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
                  No projects found matching "{searchTerm}". Try a different
                  search term.
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
                  No projects found.
                </div>
              )}
            </TabsContent>

            {/* Costs Trend Tab */}
            <TabsContent value="costs" className="p-0 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Planned Budget
                    </CardTitle>
                    <CardDescription>Total planned costs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {currencyShort}
                      {(total_planned_cost * currencyValue).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      For {timeFilter}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Actual Costs
                    </CardTitle>
                    <CardDescription>Total expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {currencyShort}
                      {(total_actual_cost * currencyValue).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {budgetStatus === "under" ? (
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {budgetPercentage}% under budget
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-red-600">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {budgetPercentage}% over budget
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Budget Balance
                    </CardTitle>
                    <CardDescription>Remaining budget</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {currencyShort}
                      {budgetStatus === "under"
                        ? budgetDifference.toLocaleString()
                        : (0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {budgetStatus === "under"
                        ? "Available to spend"
                        : "Budget limit exceeded"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white rounded-lg border p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium mb-1">Cost Comparison</h3>
                    <p className="text-sm text-muted-foreground">
                      Budget vs. Actual costs by trade position
                    </p>
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
                        {fetchedData &&
                          fetchedData.map((project: any) => (
                            <SelectItem
                              key={project.id}
                              value={project.id.toString()}
                            >
                              {project.project_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-[500px]">
                  <ChartContainer
                    config={{
                      planned: {
                        label: "Planned Budget",
                        color: "hsl(22, 100%, 60%)",
                      },
                      actual: {
                        label: "Actual Cost",
                        color: "hsl(220, 83%, 60%)",
                      },
                    }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={
                          tradesFetched && tradesFetched.length > 0
                            ? tradesFetched.map((trade: any) => ({
                                name: trade.trade_name,
                                planned: Math.abs(
                                  (trade.planned_costs || 0) * currencyValue
                                ),
                                actual: Math.abs(
                                  (trade.actual_cost || 0) * currencyValue
                                ),
                              }))
                            : []
                        }
                        margin={{ top: 20, right: 30, left: 30, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-15}
                          textAnchor="end"
                          interval={0}
                          height={60}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            `${currencyShort}${value.toLocaleString()}`
                          }
                          domain={[0, "auto"]}
                        />
                        <Tooltip
                          formatter={customTooltipFormatter}
                          contentStyle={{
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          iconSize={10}
                        />
                        <Bar
                          dataKey="planned"
                          fill="var(--color-planned)"
                          barSize={20}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="actual"
                          fill="var(--color-actual)"
                          barSize={20}
                          radius={[4, 4, 0, 0]}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Budget vs Actual Report */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-medium mb-4">Budget vs Actual Report</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-t border-b text-sm text-muted-foreground">
                          <th className="px-4 py-3 text-left">
                            Trade/Position
                          </th>
                          <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                              Planned Budget ({currencyShort}
                              {(
                                total_planned_cost * currencyValue
                              ).toLocaleString()}
                              )
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-blue-700"></div>
                              Actual Cost ({currencyShort}
                              {(
                                total_actual_cost * currencyValue
                              ).toLocaleString()}
                              )
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left">Difference</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradesFetched && tradesFetched.length > 0 ? (
                          tradesFetched.map((data: any) => {
                            const difference =
                              (data.actual_cost * currencyValue || 0) -
                              (data.planned_costs * currencyValue || 0);
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
                                  {currencyShort}
                                  {(
                                    data.planned_costs * currencyValue || 0
                                  ).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  {currencyShort}
                                  {(
                                    data.actual_cost * currencyValue || 0
                                  ).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  {difference > 0 ? (
                                    <Badge className="bg-red-50 text-red-700">
                                      +{currencyShort}
                                      {difference.toLocaleString()}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-50 text-green-700">
                                      -{currencyShort}
                                      {Math.abs(difference).toLocaleString()}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {difference > 0 ? (
                                    <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                                      <ArrowUpRight className="w-3 h-3 mr-1" />
                                      Over budget
                                    </span>
                                  ) : (
                                    <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                                      <ArrowDownRight className="w-3 h-3 mr-1" />
                                      Under budget
                                    </span>
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
                      <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-700">
                        {currencyShort}
                      </p>{" "}
                      <Input
                        type="number"
                        className="pl-[40px]"
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
                      <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-700">
                        {currencyShort}
                      </p>{" "}
                      <Input
                        type="number"
                        className="pl-[40px]"
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
