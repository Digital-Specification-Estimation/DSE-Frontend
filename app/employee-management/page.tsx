"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Search,
  Upload,
  Plus,
  User,
  DollarSign,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardHeader from "@/components/DashboardHeader";
import {
  useAddEmployeeMutation,
  useGetEmployeesQuery,
  useEditEmployeeMutation,
  useDeleteEmployeeMutation,
} from "@/lib/redux/employeeSlice";
import { employeeSlice } from "@/lib/redux/employeeSlice";
import { useToast } from "@/hooks/use-toast";

export interface NewEmployee {
  username: string;
  trade_position_id?: string;
  daily_rate?: string;
  contract_finish_date?: string;
  days_projection?: number;
  budget_baseline?: string;
  company_id?: string;
}

// Sample data for projects and daily rates
const projects = ["Metro Bridge", "Mall Construction"];
const dailyRates = ["$100", "$120", "$140", "$200"];

export default function EmployeeManagement() {
  const { toast } = useToast();
  const [trades, setTrades] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  // State for edit and delete modals
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showDeleteEmployee, setShowDeleteEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  useEffect(() => {
    // Define the async function inside useEffect
    const getTrades = async () => {
      setIsLoadingTrades(true);
      try {
        const response = await fetch(
          "http://localhost:4000/trade-position/trades"
        );
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setTrades(data);
        setTradesError(null);
      } catch (error) {
        console.error("Failed to fetch trades:", error);
        setTradesError("Failed to load trades. Please refresh the page.");
      } finally {
        setIsLoadingTrades(false);
      }
    };

    const getCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const response = await fetch("http://localhost:4000/company/companies");
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setCompanies(data);
        setCompaniesError(null);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        setCompaniesError("Failed to load companies. Please refresh the page.");
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    getTrades();
    getCompanies();

    // Set up an interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      getTrades();
      getCompanies();
    }, 5 * 60 * 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  console.log(trades, companies);
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });

  // RTK Query hooks
  const {
    data: employees = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetEmployeesQuery(undefined, {
    pollingInterval: 60000, // Auto-refresh every 60 seconds
    refetchOnFocus: true, // Refetch when the browser window regains focus
    refetchOnReconnect: true, // Refetch when internet connection is restored
  });
  console.log(employees);
  const [addEmployee, { isLoading: isAdding }] = useAddEmployeeMutation({
    // Optimistic update to immediately show the new employee
    onQueryStarted: async (newEmployeeData, { dispatch, queryFulfilled }) => {
      // Optimistic update - add temporary employee to the list
      const patchResult = dispatch(
        employeeSlice.util.updateQueryData(
          "getEmployees",
          undefined,
          (draft) => {
            draft.push({
              id: "temp-" + Date.now(),
              username: newEmployeeData.username,
              trade_position: { trade_name: "Loading..." },
              daily_rate: newEmployeeData.daily_rate || "0",
              contract_finish_date: newEmployeeData.contract_finish_date || "",
              days_projection: newEmployeeData.days_projection || 0,
              budget_baseline: newEmployeeData.budget_baseline || "0",
              company: { company_name: "Loading..." },
              // Add other required fields with placeholder values
            });
          }
        )
      );

      try {
        // Wait for the actual API response
        await queryFulfilled;
      } catch {
        // If the mutation fails, undo the optimistic update
        patchResult.undo();
      }
    },
  });

  // Add update and delete mutations
  const [updateEmployee, { isLoading: isUpdating }] = useEditEmployeeMutation();
  const [deleteEmployee, { isLoading: isDeleting }] =
    useDeleteEmployeeMutation();

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    trade: "",
    project: "",
    dailyRate: "",
    search: "",
  });

  const [newEmployee, setNewEmployee] = useState({
    username: "",
    trade_position_id: "",
    daily_rate: "",
    contract_finish_date: "",
    days_projection: "",
    budget_baseline: "",
    company_id: "",
  });

  // State for edited employee
  const [editedEmployee, setEditedEmployee] = useState({
    id: "",
    username: "",
    trade_position_id: "",
    daily_rate: "",
    contract_finish_date: "",
    days_projection: "",
    budget_baseline: "",
    company_id: "",
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format date for input fields
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Format currency for display
  const formatCurrency = (amount: any) => {
    if (!amount) return "$0";
    return `$${Number.parseFloat(amount).toFixed(2)}`;
  };

  // Filter employees based on selected filters
  const filteredEmployees = employees.filter((employee: any) => {
    if (filters.trade && employee.trade_position_id !== filters.trade)
      return false;
    // Note: We don't have project in the current model, so skipping that filter
    if (
      filters.dailyRate &&
      formatCurrency(employee.daily_rate) !== filters.dailyRate
    )
      return false;
    if (
      filters.search &&
      !employee.username.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    setSelectedEmployees(checked ? employees.map((e: any) => e.id) : []);
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    setSelectedEmployees((prev) =>
      checked ? [...prev, id] : prev.filter((employeeId) => employeeId !== id)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!newEmployee.username) {
      toast({
        title: "Validation Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a new employee object formatted for the API
      const employeeToAdd: NewEmployee = {
        username: newEmployee.username,
        trade_position_id: newEmployee.trade_position_id || undefined,
        daily_rate: newEmployee.daily_rate || undefined,
        contract_finish_date: newEmployee.contract_finish_date
          ? new Date(newEmployee.contract_finish_date).toISOString()
          : undefined,
        days_projection: newEmployee.days_projection
          ? Number.parseInt(newEmployee.days_projection)
          : undefined,
        budget_baseline: newEmployee.budget_baseline || undefined,
        company_id: newEmployee.company_id || undefined,
      };

      // Send the data using RTK Query mutation
      await addEmployee(employeeToAdd).unwrap();

      // Reset form and close
      setNewEmployee({
        username: "",
        trade_position_id: "",
        daily_rate: "",
        contract_finish_date: "",
        days_projection: "",
        budget_baseline: "",
        company_id: "",
      });

      setShowAddEmployee(false);

      // Show success notification
      toast({
        title: "Success",
        description: "Employee added successfully!",
      });
    } catch (error) {
      console.error("Failed to add employee:", error);
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle edit employee
  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setEditedEmployee({
      id: employee.id,
      username: employee.username,
      trade_position_id: employee.trade_position_id,
      daily_rate: employee.daily_rate,
      contract_finish_date: formatDateForInput(employee.contract_finish_date),
      days_projection: employee.days_projection?.toString() || "",
      budget_baseline: employee.budget_baseline,
      company_id: employee.company_id,
    });
    setShowEditEmployee(true);
  };

  // Handle delete employee
  const handleDeleteEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setShowDeleteEmployee(true);
  };

  // Handle update employee submission
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!editedEmployee.username) {
      toast({
        title: "Validation Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create an updated employee object formatted for the API
      const employeeToUpdate: any = {
        id: editedEmployee.id,
        username: editedEmployee.username,
        trade_position_id: editedEmployee.trade_position_id || undefined,
        daily_rate: editedEmployee.daily_rate || undefined,
        contract_finish_date: editedEmployee.contract_finish_date
          ? new Date(editedEmployee.contract_finish_date).toISOString()
          : undefined,
        days_projection: editedEmployee.days_projection
          ? Number.parseInt(editedEmployee.days_projection)
          : undefined,
        budget_baseline: editedEmployee.budget_baseline || undefined,
        company_id: editedEmployee.company_id || undefined,
      };

      // Send the data using RTK Query mutation
      await updateEmployee(employeeToUpdate).unwrap();

      // Close the edit modal
      setShowEditEmployee(false);

      // Refetch the employees to get the updated data
      refetch();

      // Show success notification
      toast({
        title: "Success",
        description: "Employee updated successfully!",
      });
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast({
        title: "Error",
        description: "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete employee confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;

    try {
      // Send the delete request using RTK Query mutation
      await deleteEmployee(selectedEmployee.id).unwrap();

      // Close the delete modal
      setShowDeleteEmployee(false);

      // Refetch the employees to get the updated data
      refetch();

      // Show success notification
      toast({
        title: "Success",
        description: "Employee deleted successfully!",
      });
    } catch (error) {
      console.error("Failed to delete employee:", error);
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Employee Management</h1>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 h-12 rounded-full">
                <Upload className="h-4 w-4" />
                Upload CSV
              </Button>
              <Button
                onClick={() => setShowAddEmployee(true)}
                className="bg-orange-400 hover:bg-orange-500 gap-2 h-12 rounded-full"
              >
                <Plus className="h-4 w-4" />
                Add New Employee
              </Button>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="gap-2 h-12 rounded-full"
                disabled={isFetching}
              >
                {isFetching ? (
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : (
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
                    className="h-4 w-4"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                )}
                Refresh
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            {/* Filters */}
            <div className="p-4 flex gap-4 rounded-lg">
              {/* <Select
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, trade: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Trade" />
                </SelectTrigger>
                {isLoadingTrades && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Loading trades...
                  </div>
                )}
                {tradesError && (
                  <div className="text-xs text-red-500 mt-1">{tradesError}</div>
                )}
                <SelectContent>
                  {trades.map((trade: any) => (
                    <SelectItem key={trade.id} value={trade.trade_name}>
                      {trade.trade_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, project: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, dailyRate: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Daily Rate" />
                </SelectTrigger>
                <SelectContent>
                  {dailyRates.map((rate) => (
                    <SelectItem key={rate} value={rate}>
                      {rate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}

              <div className="relative w-64 ml-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground " />
                <Input
                  type="search"
                  placeholder="Search username..."
                  className="pl-10 h-9 w-full rounded-full"
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full mb-4"></div>
                  <p>Loading employees...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <p className="mb-2">Error loading employees.</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Try Again
                  </Button>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No employees found matching your filters.</p>
                  {filters.trade ||
                  filters.project ||
                  filters.dailyRate ||
                  filters.search ? (
                    <Button
                      variant="link"
                      onClick={() =>
                        setFilters({
                          trade: "",
                          project: "",
                          dailyRate: "",
                          search: "",
                        })
                      }
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-t border-b text-sm text-muted-foreground">
                      <th className="w-10 px-4 py-3 text-left">
                        {/* <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={
                            selectedEmployees.length === employees.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        /> */}
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        Username
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        Trade Position
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        Daily Rate
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        Contract Finish Date
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        Days Projection
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        Budget Baseline
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        Company
                      </th>
                      <th className="w-10 px-4 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px]">
                    {filteredEmployees.map((employee: any) => (
                      <tr
                        key={employee.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          {/* <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={(e) =>
                              handleSelectEmployee(
                                employee.id,
                                e.target.checked
                              )
                            }
                          /> */}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {employee.username.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {employee.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {employee.trade_position?.trade_name || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(employee.daily_rate)}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(employee.contract_finish_date)}
                        </td>
                        <td className="px-4 py-3">
                          {employee.days_projection || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(employee.budget_baseline || "0")}
                        </td>
                        <td className="px-4 py-3">
                          {employee.company?.company_name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditEmployee(employee)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteEmployee(employee)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {isFetching && !isLoading && (
            <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2 border z-10">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm">Refreshing data...</span>
            </div>
          )}
        </main>
      </div>

      {/* Add Employee Sheet */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white w-full max-w-md h-full overflow-y-auto"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Employee</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddEmployee(false)}
                >
                  &times;
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Employee details</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="johndoe"
                        value={newEmployee.username}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            username: e.target.value,
                          })
                        }
                        className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="trade_position_id"
                      className="text-sm font-medium"
                    >
                      Trade Position
                    </label>
                    <Select
                      onValueChange={(value) =>
                        setNewEmployee({
                          ...newEmployee,
                          trade_position_id: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Trade Position" />
                      </SelectTrigger>
                      {isLoadingTrades && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Loading trades...
                        </div>
                      )}
                      {tradesError && (
                        <div className="text-xs text-red-500 mt-1">
                          {tradesError}
                        </div>
                      )}
                      <SelectContent>
                        {trades.map((trade: any) => (
                          <SelectItem key={trade.id} value={trade.id}>
                            {trade.trade_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="daily_rate" className="text-sm font-medium">
                      Daily Rate
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="daily_rate"
                        name="daily_rate"
                        type="text"
                        placeholder="100.00"
                        value={newEmployee.daily_rate}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            daily_rate: e.target.value,
                          })
                        }
                        className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="contract_finish_date"
                      className="text-sm font-medium"
                    >
                      Contract Finish Date
                    </label>
                    <div className="relative">
                      <input
                        id="contract_finish_date"
                        name="contract_finish_date"
                        type="date"
                        value={newEmployee.contract_finish_date}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            contract_finish_date: e.target.value,
                          })
                        }
                        className="w-full py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="days_projection"
                      className="text-sm font-medium"
                    >
                      Days Projection
                    </label>
                    <div className="relative">
                      <input
                        id="days_projection"
                        name="days_projection"
                        type="number"
                        placeholder="30"
                        value={newEmployee.days_projection}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            days_projection: e.target.value,
                          })
                        }
                        className="w-full py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="budget_baseline"
                      className="text-sm font-medium"
                    >
                      Budget Baseline
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="budget_baseline"
                        name="budget_baseline"
                        type="text"
                        placeholder="1000.00"
                        value={newEmployee.budget_baseline}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            budget_baseline: e.target.value,
                          })
                        }
                        className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="company_id" className="text-sm font-medium">
                      Company
                    </label>
                    <Select
                      onValueChange={(value) =>
                        setNewEmployee({
                          ...newEmployee,
                          company_id: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      {isLoadingCompanies && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Loading companies...
                        </div>
                      )}
                      {companiesError && (
                        <div className="text-xs text-red-500 mt-1">
                          {companiesError}
                        </div>
                      )}
                      <SelectContent>
                        {companies.map((company: any) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-sm">
                    Want to upload multiple employees? Use{" "}
                    <a href="#" className="text-primary underline">
                      CSV instead
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 mt-auto">
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isAdding}
              >
                {isAdding ? "Adding..." : "Add Employee"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Employee Dialog */}
      <Dialog open={showEditEmployee} onOpenChange={setShowEditEmployee}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="edit-username" className="text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="edit-username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  value={editedEmployee.username}
                  onChange={(e) =>
                    setEditedEmployee({
                      ...editedEmployee,
                      username: e.target.value,
                    })
                  }
                  className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-trade-position"
                className="text-sm font-medium"
              >
                Trade Position
              </label>
              <Select
                value={editedEmployee.trade_position_id}
                onValueChange={(value) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    trade_position_id: value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Trade Position" />
                </SelectTrigger>
                <SelectContent>
                  {trades.map((trade: any) => (
                    <SelectItem key={trade.id} value={trade.id}>
                      {trade.trade_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-daily-rate" className="text-sm font-medium">
                Daily Rate
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="edit-daily-rate"
                  name="daily_rate"
                  type="text"
                  placeholder="100.00"
                  value={editedEmployee.daily_rate}
                  onChange={(e) =>
                    setEditedEmployee({
                      ...editedEmployee,
                      daily_rate: e.target.value,
                    })
                  }
                  className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-contract-finish-date"
                className="text-sm font-medium"
              >
                Contract Finish Date
              </label>
              <div className="relative">
                <input
                  id="edit-contract-finish-date"
                  name="contract_finish_date"
                  type="date"
                  value={editedEmployee.contract_finish_date}
                  onChange={(e) =>
                    setEditedEmployee({
                      ...editedEmployee,
                      contract_finish_date: e.target.value,
                    })
                  }
                  className="w-full py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-days-projection"
                className="text-sm font-medium"
              >
                Days Projection
              </label>
              <div className="relative">
                <input
                  id="edit-days-projection"
                  name="days_projection"
                  type="number"
                  placeholder="30"
                  value={editedEmployee.days_projection}
                  onChange={(e) =>
                    setEditedEmployee({
                      ...editedEmployee,
                      days_projection: e.target.value,
                    })
                  }
                  className="w-full py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-budget-baseline"
                className="text-sm font-medium"
              >
                Budget Baseline
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="edit-budget-baseline"
                  name="budget_baseline"
                  type="text"
                  placeholder="1000.00"
                  value={editedEmployee.budget_baseline}
                  onChange={(e) =>
                    setEditedEmployee({
                      ...editedEmployee,
                      budget_baseline: e.target.value,
                    })
                  }
                  className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-company" className="text-sm font-medium">
                Company
              </label>
              <Select
                value={editedEmployee.company_id}
                onValueChange={(value) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    company_id: value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditEmployee(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Employee"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Dialog */}
      <Dialog open={showDeleteEmployee} onOpenChange={setShowDeleteEmployee}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p>
              Are you sure you want to delete the employee "
              {selectedEmployee?.username}"?
            </p>
            <p className="text-sm text-gray-500">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteEmployee(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
