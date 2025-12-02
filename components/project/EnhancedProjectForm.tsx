"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Minus,
  Users,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetLocationsQuery } from "@/lib/redux/locationSlice";
import {
  useGetTradesQuery,
  useAssignTradeToProjectMutation,
} from "@/lib/redux/tradePositionSlice";
import { useGetEmployeesQuery } from "@/lib/redux/employeeSlice";
import {
  useAddProjectMutation,
  useUpdateProjectMutation,
} from "@/lib/redux/projectSlice";
import { useUpdateEmployeesProjectMutation } from "@/lib/redux/employeeSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { convertCurrency, getExchangeRate } from "@/lib/utils";

export interface ProjectFormData {
  id?: string;
  project_name: string;
  location_name: string;
  budget: number;
  start_date: string;
  end_date: string;
  selectedTrades: TradeAssignment[];
}

export interface TradeAssignment {
  tradeId: string;
  tradeName: string;
  selectedEmployees: EmployeeSelection[];
  employeeCount?: number;
  selectionMode: "specific" | "count";
}

export interface EmployeeSelection {
  employeeId: string;
  employeeName: string;
  dailyRate: number;
  monthlyRate: number;
  isSelected: boolean;
}

interface EnhancedProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject?: any;
  mode: "create" | "edit";
}

export default function EnhancedProjectForm({
  isOpen,
  onClose,
  onSuccess,
  editingProject,
  mode,
}: EnhancedProjectFormProps) {
  const { toast } = useToast();

  // API hooks
  const { data: sessionData } = useSessionQuery();
  const { data: locations = [], isLoading: locationsLoading } =
    useGetLocationsQuery();
  const { data: trades = [], isLoading: tradesLoading } = useGetTradesQuery();
  const {
    data: employees = [],
    isLoading: employeesLoading,
    refetch: refetchEmployees,
  } = useGetEmployeesQuery();
  const [addProject, { isLoading: isAdding }] = useAddProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [updateEmployeesProject] = useUpdateEmployeesProjectMutation();
  const [assignTradeToProject] = useAssignTradeToProjectMutation();

  // Get user currency and salary calculation preferences
  const userCurrency = (sessionData?.user as any)?.currency || "RWF";
  const salaryCalculation =
    (sessionData?.user as any)?.salary_calculation || "daily rate";

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: "",
    location_name: "",
    budget: 0,
    start_date: "",
    end_date: "",
    selectedTrades: [],
  });

  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [showTradeSelection, setShowTradeSelection] = useState(false);

  // Helper function to get the correct rate based on user preference
  const getEmployeeRate = (employee: any) => {
    if (salaryCalculation === "monthly rate") {
      return employee.monthly_rate || 0;
    }
    return employee.daily_rate || 0;
  };

  // Helper function to format currency display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: userCurrency === "RWF" ? "RWF" : "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Initialize form data when editing
  useEffect(() => {
    if (mode === "edit" && editingProject) {
      const tradeIds =
        editingProject.trade_positions?.map((tp: any) => tp.id) || [];

      setFormData({
        id: editingProject.id,
        project_name: editingProject.project_name || "",
        location_name: editingProject.location_name || "",
        budget: editingProject.budget || 0,
        start_date: editingProject.start_date && !isNaN(new Date(editingProject.start_date).getTime())
          ? new Date(editingProject.start_date).toISOString().split("T")[0]
          : "",
        end_date: editingProject.end_date && !isNaN(new Date(editingProject.end_date).getTime())
          ? new Date(editingProject.end_date).toISOString().split("T")[0]
          : "",
        selectedTrades:
          editingProject.trade_positions?.map((tp: any) => ({
            tradeId: tp.id,
            tradeName: tp.trade_name,
            selectedEmployees:
              tp.employees?.map((emp: any) => ({
                employeeId: emp.id,
                employeeName: emp.username,
                dailyRate: emp.daily_rate || 0,
                monthlyRate: emp.monthly_rate || 0,
                isSelected: true,
              })) || [],
            selectionMode: "specific" as const,
          })) || [],
      });

      // Automatically expand all existing trades to show employees
      setExpandedTrades(new Set(tradeIds));
    } else {
      // Reset form for create mode
      setFormData({
        project_name: "",
        location_name: "",
        budget: 0,
        start_date: "",
        end_date: "",
        selectedTrades: [],
      });
      setExpandedTrades(new Set());
    }
  }, [mode, editingProject, isOpen]);

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTradeToProject = (tradeId: string) => {
    const trade = trades.find((t: any) => t.id === tradeId);
    if (!trade) {
      console.warn(`Trade with ID ${tradeId} not found`);
      return;
    }

    // Get ALL employees that belong to this specific trade
    const tradeEmployees = employees.filter(
      (emp: any) => emp.trade_position_id === tradeId
    );

    console.log(
      `Adding trade "${trade.trade_name}" with ${tradeEmployees.length} employees:`,
      tradeEmployees
    );

    const newTradeAssignment: TradeAssignment = {
      tradeId: trade.id,
      tradeName: trade.trade_name,
      selectedEmployees: tradeEmployees.map((emp: any) => ({
        employeeId: emp.id,
        employeeName:
          emp.username || emp.name || `Employee ${emp.id.slice(0, 8)}`,
        dailyRate: emp.daily_rate || 0,
        monthlyRate: emp.monthly_rate || 0,
        isSelected: false,
      })),
      selectionMode: "specific",
    };

    // Validate that we have employees for this trade
    if (tradeEmployees.length === 0) {
      toast({
        title: "No Employees Found",
        description: `No employees are assigned to the "${trade.trade_name}" trade. Please assign employees to this trade first.`,
        variant: "destructive",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      selectedTrades: [...prev.selectedTrades, newTradeAssignment],
    }));

    // Automatically expand the trade to show all employees immediately
    setExpandedTrades((prev) => new Set([...prev, tradeId]));

    toast({
      title: "Trade Added",
      description: `${trade.trade_name} added with ${tradeEmployees.length} employees available for selection.`,
    });
  };

  const removeTradeFromProject = (tradeId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTrades: prev.selectedTrades.filter((t) => t.tradeId !== tradeId),
    }));
    setExpandedTrades((prev) => {
      const newSet = new Set(prev);
      newSet.delete(tradeId);
      return newSet;
    });
  };

  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTrades((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const updateTradeAssignment = (
    tradeId: string,
    updates: Partial<TradeAssignment>
  ) => {
    setFormData((prev) => ({
      ...prev,
      selectedTrades: prev.selectedTrades.map((trade) =>
        trade.tradeId === tradeId ? { ...trade, ...updates } : trade
      ),
    }));
  };

  const toggleEmployeeSelection = (tradeId: string, employeeId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTrades: prev.selectedTrades.map((trade) =>
        trade.tradeId === tradeId
          ? {
              ...trade,
              selectedEmployees: trade.selectedEmployees.map((emp) =>
                emp.employeeId === employeeId
                  ? { ...emp, isSelected: !emp.isSelected }
                  : emp
              ),
            }
          : trade
      ),
    }));
  };

  const getAvailableTrades = () => {
    const selectedTradeIds = formData.selectedTrades.map((t) => t.tradeId);
    return trades.filter((trade: any) => !selectedTradeIds.includes(trade.id));
  };

  const validateForm = () => {
    if (!formData.project_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.location_name) {
      toast({
        title: "Validation Error",
        description: "Location is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Validation Error",
        description: "Start and end dates are required.",
        variant: "destructive",
      });
      return false;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Prepare basic project data (without trade assignments)
      const projectData = {
        project_name: formData.project_name,
        location_name: formData.location_name,
        budget: formData.budget.toString(), // Convert to string for Decimal type
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      let createdProject;

      if (mode === "edit") {
        // For edit mode, update the project
        createdProject = await updateProject({
          ...projectData,
          id: formData.id,
        }).unwrap();

        toast({
          title: "Project Updated",
          description: `${formData.project_name} has been updated successfully.`,
        });
      } else {
        // For create mode, create the project first
        createdProject = await addProject(projectData).unwrap();

        toast({
          title: "Project Created",
          description: `${formData.project_name} has been created successfully.`,
        });
      }

      // Now handle trade and employee assignments if there are any selected trades
      if (formData.selectedTrades.length > 0 && createdProject?.id) {
        console.log(
          "Project created successfully, proceeding with trade and employee assignments"
        );
        console.log("Created project ID:", createdProject.id);
        console.log("Selected trades count:", formData.selectedTrades.length);

        // First assign trades to the project
        await handleTradeAssignments(createdProject.id);

        // Then assign employees to the project
        await handleEmployeeAssignments(createdProject.id);
      } else {
        console.log("No trades selected or project creation failed");
        console.log("Selected trades:", formData.selectedTrades.length);
        console.log("Created project ID:", createdProject?.id);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving project:", error);

      // More detailed error handling
      let errorMessage = `Failed to ${mode} project. Please try again.`;

      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 500) {
        errorMessage =
          "Server error occurred. Please check your input data and try again.";
      } else if (error?.status === 400) {
        errorMessage =
          "Invalid data provided. Please check all fields and try again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleTradeAssignments = async (projectId: string) => {
    try {
      console.log("Starting trade assignments for project:", projectId);
      console.log("Selected trades:", formData.selectedTrades);

      // Assign each selected trade to the project
      for (const trade of formData.selectedTrades) {
        console.log(
          "Assigning trade to project:",
          trade.tradeName,
          "ID:",
          trade.tradeId
        );

        await assignTradeToProject({
          projectId: projectId,
          tradePositionId: trade.tradeId,
        }).unwrap();

        console.log("Successfully assigned trade:", trade.tradeName);
      }

      console.log("All trades assigned successfully");
    } catch (error: any) {
      console.error("Error assigning trades:", error);
      console.error("Trade assignment error details:", {
        status: error?.status,
        data: error?.data,
        message: error?.message,
      });

      toast({
        title: "Warning",
        description:
          "Project created but failed to assign some trades. You can assign them manually later.",
        variant: "destructive",
      });
    }
  };

  const handleEmployeeAssignments = async (projectId: string) => {
    try {
      console.log("Starting employee assignments for project:", projectId);
      console.log("Selected trades:", formData.selectedTrades);

      // Collect all employee IDs that need to be assigned to this project
      const allEmployeeIds: string[] = [];

      for (const trade of formData.selectedTrades) {
        console.log(
          "Processing trade:",
          trade.tradeName,
          "Mode:",
          trade.selectionMode
        );
        console.log("Trade data:", JSON.stringify(trade, null, 2));

        if (trade.selectionMode === "specific") {
          // Add specifically selected employees
          console.log("Selected employees data:", trade.selectedEmployees);
          const selectedIds = trade.selectedEmployees
            .filter((emp) => {
              console.log(
                "Checking employee:",
                emp,
                "isSelected:",
                emp.isSelected
              );
              return emp.isSelected;
            })
            .map((emp) => {
              console.log("Mapping employee ID:", emp.employeeId);
              return emp.employeeId;
            });
          console.log("Specific selection - Employee IDs:", selectedIds);
          allEmployeeIds.push(...selectedIds);
        } else if (trade.selectionMode === "count" && trade.employeeCount) {
          // Get the first N employees from this trade (unassigned ones)
          console.log("All employees data:", employees.length);
          console.log("Looking for trade ID:", trade.tradeId);
          console.log(
            "Available employees before filtering:",
            employees.map((emp) => ({
              id: emp.id,
              username: emp.username,
              trade_position_id: emp.trade_position_id,
              projectId: emp.projectId,
            }))
          );

          const tradeEmployees = employees.filter((emp: any) => {
            const matches =
              emp.trade_position_id === trade.tradeId && !emp.projectId;
            console.log(
              `Employee ${emp.username}: trade_id=${emp.trade_position_id}, target=${trade.tradeId}, projectId=${emp.projectId}, matches=${matches}`
            );
            return matches;
          });
          console.log(
            "Available employees for trade:",
            tradeEmployees.map((emp) => ({
              id: emp.id,
              username: emp.username,
            }))
          );

          if (tradeEmployees.length < trade.employeeCount) {
            toast({
              title: "Warning",
              description: `Only ${tradeEmployees.length} unassigned employees available in ${trade.tradeName}, but ${trade.employeeCount} requested.`,
              variant: "destructive",
            });
          }

          const selectedIds = tradeEmployees
            .slice(0, trade.employeeCount)
            .map((emp: any) => emp.id);
          console.log(
            "Count selection - Available employees:",
            tradeEmployees.length,
            "Requested:",
            trade.employeeCount,
            "Selected IDs:",
            selectedIds
          );
          allEmployeeIds.push(...selectedIds);
        }
      }

      // Assign all selected employees to the project using the bulk update endpoint
      console.log("Total employee IDs to assign:", allEmployeeIds);
      console.log("Project ID for assignment:", projectId);

      if (allEmployeeIds.length > 0) {
        console.log("Calling updateEmployeesProject with:", {
          employeeIds: allEmployeeIds,
          projectId,
        });

        const result = await updateEmployeesProject({
          employeeIds: allEmployeeIds,
          projectId: projectId,
        }).unwrap();

        console.log("Employee assignment result:", result);

        // Refetch employees to verify assignments
        await refetchEmployees();
        console.log("Employee data refreshed after assignment");

        // Verify assignments by checking updated employee data
        const updatedEmployees = await refetchEmployees();
        const assignedEmployees = updatedEmployees.data?.filter(
          (emp: any) =>
            allEmployeeIds.includes(emp.id) && emp.projectId === projectId
        );
        console.log(
          "Verified assigned employees:",
          assignedEmployees?.length,
          "out of",
          allEmployeeIds.length
        );

        toast({
          title: "Employees Assigned",
          description: `Successfully assigned ${allEmployeeIds.length} employees to the project.`,
        });
      } else {
        console.log("No employees to assign");
        toast({
          title: "No Employees Selected",
          description:
            "Project created successfully, but no employees were selected for assignment.",
        });
      }
    } catch (error: any) {
      console.error("Error assigning employees:", error);
      console.error("Error details:", {
        status: error?.status,
        data: error?.data,
        message: error?.message,
      });

      let errorMessage =
        "Project created but failed to assign some employees. You can assign them manually later.";
      if (error?.data?.message) {
        errorMessage += ` Error: ${error.data.message}`;
      } else if (error?.message) {
        errorMessage += ` Error: ${error.message}`;
      }

      toast({
        title: "Warning",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "edit" ? "Edit Project" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto pr-4">
          <div className="space-y-6 pb-4">
            {/* Basic Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project_name">Project Name</Label>
                    <Input
                      id="project_name"
                      placeholder="Enter project name"
                      value={formData.project_name}
                      onChange={(e) =>
                        handleInputChange("project_name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={formData.location_name}
                      onValueChange={(value) =>
                        handleInputChange("location_name", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location: any) => (
                          <SelectItem
                            key={location.id}
                            value={location.location_name}
                          >
                            {location.location_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (USD)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0"
                      value={formData.budget}
                      onChange={(e) =>
                        handleInputChange(
                          "budget",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        handleInputChange("start_date", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        handleInputChange("end_date", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade Assignment Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Trade Assignments</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {formData.selectedTrades.length} trades selected
                    </Badge>
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {formData.selectedTrades.reduce((total, trade) => {
                        if (trade.selectionMode === "count") {
                          return total + (trade.employeeCount || 0);
                        }
                        return (
                          total +
                          trade.selectedEmployees.filter(
                            (emp) => emp.isSelected
                          ).length
                        );
                      }, 0)}{" "}
                      employees
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Trade Button */}
                {getAvailableTrades().length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={addTradeToProject}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select trade to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTrades().map((trade: any) => (
                          <SelectItem key={trade.id} value={trade.id}>
                            {trade.trade_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTradeSelection(!showTradeSelection)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Trade
                    </Button>
                  </div>
                )}

                {/* Selected Trades */}
                <div className="space-y-3">
                  {formData.selectedTrades.map((trade) => (
                    <Card
                      key={trade.tradeId}
                      className="border-l-4 border-l-orange-500"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleTradeExpansion(trade.tradeId)
                              }
                            >
                              {expandedTrades.has(trade.tradeId) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                            <h4 className="font-medium">{trade.tradeName}</h4>
                            <Badge variant="secondary">
                              {trade.selectionMode === "specific"
                                ? `${
                                    trade.selectedEmployees.filter(
                                      (emp) => emp.isSelected
                                    ).length
                                  } selected`
                                : `${trade.employeeCount || 0} employees`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={trade.selectionMode}
                              onValueChange={(mode: "specific" | "count") =>
                                updateTradeAssignment(trade.tradeId, {
                                  selectionMode: mode,
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="specific">
                                  Select Specific
                                </SelectItem>
                                <SelectItem value="count">Set Count</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeTradeFromProject(trade.tradeId)
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedTrades.has(trade.tradeId) && (
                        <CardContent className="pt-0">
                          {trade.selectionMode === "count" ? (
                            <div className="space-y-2">
                              <Label>Number of Employees</Label>
                              <Input
                                type="number"
                                min="0"
                                max={trade.selectedEmployees.length}
                                value={trade.employeeCount || 0}
                                onChange={(e) =>
                                  updateTradeAssignment(trade.tradeId, {
                                    employeeCount:
                                      parseInt(e.target.value) || 0,
                                  })
                                }
                                placeholder="Enter number of employees"
                              />
                              <p className="text-sm text-gray-500">
                                Available employees in this trade:{" "}
                                {trade.selectedEmployees.length}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>
                                  Select Employees (
                                  {trade.selectedEmployees.length} available)
                                </Label>
                                {trade.selectedEmployees.length > 0 && (
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Select all employees in this trade
                                        updateTradeAssignment(trade.tradeId, {
                                          selectedEmployees:
                                            trade.selectedEmployees.map(
                                              (emp) => ({
                                                ...emp,
                                                isSelected: true,
                                              })
                                            ),
                                        });
                                      }}
                                    >
                                      Select All
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Deselect all employees in this trade
                                        updateTradeAssignment(trade.tradeId, {
                                          selectedEmployees:
                                            trade.selectedEmployees.map(
                                              (emp) => ({
                                                ...emp,
                                                isSelected: false,
                                              })
                                            ),
                                        });
                                      }}
                                    >
                                      Clear All
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
                                {trade.selectedEmployees.map((employee) => (
                                  <div
                                    key={employee.employeeId}
                                    className={`flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                                      employee.isSelected
                                        ? "border-orange-300 bg-orange-50"
                                        : "border-gray-200"
                                    }`}
                                  >
                                    <Checkbox
                                      checked={employee.isSelected}
                                      onCheckedChange={() =>
                                        toggleEmployeeSelection(
                                          trade.tradeId,
                                          employee.employeeId
                                        )
                                      }
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {employee.employeeName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        ID: {employee.employeeId.slice(0, 8)}...
                                        •{" "}
                                        {formatCurrency(
                                          salaryCalculation === "monthly rate"
                                            ? employee.monthlyRate
                                            : employee.dailyRate
                                        )}
                                        /
                                        {salaryCalculation === "monthly rate"
                                          ? "month"
                                          : "day"}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {trade.selectedEmployees.length === 0 && (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="font-medium">
                                    No employees available in this trade
                                  </p>
                                  <p className="text-xs">
                                    Please assign employees to this trade first
                                    in Employee Management
                                  </p>
                                </div>
                              )}

                              {trade.selectedEmployees.length > 0 && (
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                  <strong>Selected:</strong>{" "}
                                  {
                                    trade.selectedEmployees.filter(
                                      (emp) => emp.isSelected
                                    ).length
                                  }{" "}
                                  of {trade.selectedEmployees.length} employees
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {formData.selectedTrades.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No trades selected yet</p>
                    <p className="text-sm">
                      Add trades to assign employees to this project
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer Actions - Always visible */}
        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isAdding || isUpdating}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isAdding || isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : mode === "edit" ? (
                "Update Project"
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
