"use client";

import type React from "react";
import { useState } from "react";
import { Search, Upload, Plus, User, DollarSign } from "lucide-react";
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
import DashboardHeader from "@/components/DashboardHeader";
import {
  useAddEmployeeMutation,
  useGetEmployeesQuery,
} from "@/lib/redux/employeeSlice";
export interface NewEmployee {
  username: string;
  trade_position_id?: string;
  daily_rate?: string;
  contract_finish_date?: string;
  days_projection?: number;
  budget_baseline?: string;
  company_id?: string;
}
// Sample data for trades, projects, and daily rates
const trades = [
  "Electrician",
  "HR Manager",
  "Technician",
  "Construction Worker",
];
const projects = ["Metro Bridge", "Mall Construction"];
const dailyRates = ["$100", "$120", "$140", "$200"];

export default function EmployeeManagement() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });

  // RTK Query hooks
  const { data: employees = [], isLoading, error } = useGetEmployeesQuery();
  const [addEmployee, { isLoading: isAdding }] = useAddEmployeeMutation();

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

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format currency for display
  const formatCurrency = (amount: string) => {
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
      alert("Please enter a username");
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
    } catch (error) {
      console.error("Failed to add employee:", error);
      alert("Failed to add employee. Please try again.");
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
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            {/* Filters */}
            <div className="p-4 flex gap-4 rounded-lg">
              <Select
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, trade: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Trade" />
                </SelectTrigger>
                <SelectContent>
                  {trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
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
              </Select>

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
                <div className="p-8 text-center">Loading employees...</div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  Error loading employees. Please try again.
                </div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-t border-b text-sm text-muted-foreground">
                      <th className="w-10 px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={
                            selectedEmployees.length === employees.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
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
                        Company ID
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
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={(e) =>
                              handleSelectEmployee(
                                employee.id,
                                e.target.checked
                              )
                            }
                          />
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
                          {employee.trade_position_id || "N/A"}
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
                          {employee.company_id || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right">...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
                      <SelectContent>
                        {trades.map((trade) => (
                          <SelectItem key={trade} value={trade}>
                            {trade}
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
                      Company ID
                    </label>
                    <div className="relative">
                      <input
                        id="company_id"
                        name="company_id"
                        type="text"
                        placeholder="company-123"
                        value={newEmployee.company_id}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            company_id: e.target.value,
                          })
                        }
                        className="w-full py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
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
    </div>
  );
}
