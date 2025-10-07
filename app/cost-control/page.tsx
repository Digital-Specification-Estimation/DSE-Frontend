"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Edit,
  Plus,
  Upload,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useGetProjectsQuery, useGetProjectFinancialMetricsQuery } from "@/lib/redux/projectSlice";
import { useCreateExpenseMutation, useGetExpensesByProjectQuery } from "@/lib/redux/expenseSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";

const CostControlPage = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "boq" | "revenues" | "expenses"
  >("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
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
    });
  console.log("session data", sessionData);
  // Fetch projects from the backend
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useGetProjectsQuery();

  // Fetch financial metrics for the selected project
  const { 
    data: financialMetrics, 
    isLoading: isLoadingMetrics, 
    isError: isErrorMetrics 
  } = useGetProjectFinancialMetricsQuery(selectedProjectId, {
    skip: !selectedProjectId, // Skip the query if no project is selected
  });

  // Add expense mutation
  const [createExpense, { isLoading: isCreatingExpense }] = useCreateExpenseMutation();
  
  // Fetch expenses for the selected project
  const { 
    data: expenses = [], 
    isLoading: isLoadingExpenses,
    refetch: refetchExpenses 
  } = useGetExpensesByProjectQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });

  // Form state for new expense
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "MATERIALS",
  });

  // Handle expense form input changes
  const handleExpenseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value
    }));
  };

  // Handle expense form submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProjectId || !expenseForm.description || !expenseForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createExpense({
        projectId: selectedProjectId,
        companyId,
        amount:expenseForm.amount.toString(),
        category: expenseForm.category,
        description: expenseForm.description,
      }).unwrap();
      
      // Reset form
      setExpenseForm({
        description: "",
        amount: "",
        category: "MATERIALS",
      });
      
      // Show success message
      toast.success("Expense added successfully");
      
      // Refresh expenses list
      refetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense. Please try again.");
    }
  };

  console.log("financial metrics", financialMetrics)

  console.log("selected project", selectedProjectId);
  // Handle project selection change
  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    // You can add additional logic here when project changes
  };

  // TODO: Replace with backend currency data when implementing backend integration
  const [userCurrency, setUserCurrency] = useState<string>("USD");
  const [currencyValue, setCurrencyValue] = useState<number>(1);
  const [currencyShort, setCurrencyShort] = useState<string>("USD");

  // Mock session data

  const companyId = sessionData?.user?.company_id;

  // Project payroll calculation
  const projectPayroll = useMemo(() => {
    if (!selectedProjectId) return 0;
    return 45000 * 0.3; // Assume 30% of total payroll for selected project
  }, [selectedProjectId]);

  // Calculate comprehensive cost summary
  const costSummary = useMemo(() => {
    if (financialMetrics) {
      return {
        total_expenses: financialMetrics.totalExpenses || 0,
        total_revenues: financialMetrics.totalBOQ + financialMetrics.budget || 0,
        total_boq_value: financialMetrics.totalBOQ || 0,
        boq_completed_value: financialMetrics.totalBOQ || 0, // Assuming all BOQ is considered completed
        project_budget: financialMetrics.budget || 0,
        net_profit: financialMetrics.netProfit || 0,
        profit_margin: financialMetrics.profitMargin || 0,
        currency: financialMetrics.currency || 'RWF',
      };
    }

    // Fallback to existing calculation if no financial metrics are available
    const manualExpenses = expenses.reduce(
      (sum: number, expense: any) => sum + Number(expense.amount || 0),
      0
    );
    const projectBudget = selectedProjectId
      ? Number(500000) // Mock budget
      : 0;
    const boqCompletedValue = 125000; // Mock BOQ completed value
    const totalBOQValue = 500000; // Mock total BOQ value

    const totalRevenues = projectBudget + boqCompletedValue;
    const totalExpenses = projectPayroll + manualExpenses;
    const netProfit = totalRevenues - totalExpenses;
    const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;

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
      currency: 'RWF', // Default currency
    };
  }, [expenses, selectedProjectId, financialMetrics]);

  // TODO: Replace with actual currency conversion when implementing backend integration
  // Simple currency formatting for frontend-only version
  const formatCurrency = (amount: number) => {
    const currencySymbol = costSummary.currency || 'RWF';
    return `${currencySymbol} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper function to split currency value (same as attendance-payroll)
  const splitCurrencyValue = (str: string) => {
    if (!str) return null;
    const match = str.match(/^([A-Z]+)([\d.]+)$/);
    if (!match) return null;
    return {
      currency: match[1],
      value: match[2],
    };
  };

  // Currency setup
  React.useEffect(() => {
    if (sessionData && (sessionData.user as any)?.currency) {
      const currencyData = splitCurrencyValue(
        (sessionData.user as any).currency
      );
      if (currencyData) {
        setCurrencyValue(Number(currencyData.value));
        setCurrencyShort(currencyData.currency);
        setUserCurrency(currencyData.currency);
      }
    } else {
      // Fallback to default currency
      setUserCurrency("USD");
      setCurrencyShort("USD");
      setCurrencyValue(1);
    }
  }, [sessionData]);

  // Tab switch handler
  const switchTab = (tab: "overview" | "boq" | "revenues" | "expenses") => {
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={{
        name: sessionData?.user?.username || "Current User",
        role: sessionData?.user?.current_role || "user",
        avatar: "",
      }} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto bg-white">
          <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Cost Control Dashboard
              </h1>
              <p className="text-slate-600">
                Track expenses, revenues, and BOQ progress for accurate project
                cost management
              </p>

              {/* Project Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Project
                </label>
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
                  <p className="text-sm text-slate-500 mt-2">
                    Please select a project to view cost control data
                  </p>
                )}
                {selectedProjectId &&
                  (isLoadingExpenses || isLoadingMetrics) && (
                    <p className="text-sm text-blue-600 mt-2">
                      Loading project data...
                    </p>
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
                  <DashboardHeader
                    title="Cost Control"
                    description="Manage project costs, BOQ, and financials"
                  />
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
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
                    <span className="text-slate-600 text-sm font-medium">
                      Total Revenue
                    </span>
                    <span className="text-green-500">📈</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(costSummary?.total_revenues || 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    From BOQ progress
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-sm font-medium">
                      Total Expenses
                    </span>
                    <span className="text-red-500">📉</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      (costSummary?.total_expenses || 0) +
                      (costSummary?.budget_from_planning || 0)
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Manual: {formatCurrency(costSummary?.total_expenses || 0)}{" "}
                    + Budget: {formatCurrency(costSummary?.project_budget || 0)}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-sm font-medium">
                      Net Profit
                    </span>
                    <span>💰</span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      (costSummary?.net_profit || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(costSummary?.net_profit || 0)}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-sm font-medium">
                      Profit Margin
                    </span>
                    <span className="text-slate-400 text-xs">%</span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      (costSummary?.profit_margin || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
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
                    Add Expense
                  </button>
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* BOQ Summary */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                          BOQ Progress Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Total BOQ Value
                            </p>
                            <p className="text-xl font-bold text-slate-800">
                              {formatCurrency(
                                costSummary.total_boq_value
                              )}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Total Revenue
                            </p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(
                                costSummary.total_revenues + costSummary.total_boq_value
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Total Expenses Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                          Total Project Expenses
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-orange-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Budget Planning
                            </p>
                            <p className="text-xl font-bold text-orange-600">
                              {formatCurrency(
                                costSummary?.project_budget
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              From Budget System
                            </p>
                          </div>
                          <div className="bg-slate-100 rounded-lg p-4 border-2 border-slate-300">
                            <p className="text-sm text-slate-600 mb-1">
                              Total Expenses
                            </p>
                            <p className="text-xl font-bold text-slate-800">
                              {formatCurrency(
                                costSummary.total_expenses
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              Combined Total
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Manual Expenses by Category */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                          Manual Expenses by Category
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(
                            expenses.reduce((acc, exp) => {
                              acc[exp.category] =
                                (acc[exp.category] || 0) + exp.amount;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([category, amount]) => (
                            <div
                              key={category}
                              className="bg-slate-50 rounded-lg p-4"
                            >
                              <p className="text-sm text-slate-600 mb-1">
                                {category}
                              </p>
                              <p className="text-xl font-bold text-slate-800">
                                {formatCurrency(amount)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Revenues */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                          Recent Revenue Entries
                        </h3>
                        <div className="space-y-2">
                          {/* Add revenues here */}
                        </div>
                      </div>

                      {/* Recent Manual Expenses */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                          Recent Manual Expenses
                        </h3>
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
                                  <p className="font-medium text-slate-800">
                                    {expense.description}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {new Date(expense.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-lg font-bold text-red-600">
                                  -{formatCurrency(expense.amount)}
                                </p>
                              </div>
                            ))}
                          {expenses.length === 0 && (
                            <p className="text-slate-500 text-center py-8">
                              No manual expenses recorded yet for this project
                            </p>
                          )}
                        </div>
                        {(costSummary?.budget_from_planning || 0) > 0 && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> This project also has $
                              {formatCurrency(
                                costSummary?.budget_from_planning || 0
                              )}
                              in planned expenses from the Budget Planning
                              system, which are included in the total expenses
                              above.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BOQ Tab */}
                  {activeTab === "boq" && (
                    <div className="space-y-6">
                      {/* BOQ Items List */}
                      <div className="border-t pt-6">
                        <h3 className="font-semibold text-slate-800 mb-4 text-lg">
                          BOQ Items
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-3 py-3 text-left font-semibold">
                                  Item
                                </th>
                                <th className="px-3 py-3 text-left font-semibold">
                                  Description
                                </th>
                                <th className="px-3 py-3 text-center font-semibold">
                                  Unit
                                </th>
                                <th className="px-3 py-3 text-right font-semibold">
                                  Total Qty
                                </th>
                                <th className="px-3 py-3 text-right font-semibold">
                                  Rate
                                </th>
                                <th className="px-3 py-3 text-right font-semibold">
                                  Amount
                                </th>
                                <th className="px-3 py-3 text-right font-semibold">
                                  Completed
                                </th>
                                <th className="px-3 py-3 text-right font-semibold">
                                  %
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Add BOQ items here */}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold">
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-3 py-3 text-right text-lg"
                                >
                                  Total:
                                </td>
                                <td className="px-3 py-3 text-right text-lg">
                                  {/* Add total amount here */}
                                </td>
                                <td
                                  colSpan={2}
                                  className="px-3 py-3 text-right text-green-600 text-lg"
                                >
                                  Earned: {/* Add earned amount here */}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revenue Tab */}
                  {activeTab === "revenues" && (
                    <div className="space-y-4">
                      {/* Add revenue form here */}
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
                                  Amount <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  type="number"
                                  name="amount"
                                  value={expenseForm.amount}
                                  onChange={handleExpenseInputChange}
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                  Category
                                </label>
                                <Select
                                  name="category"
                                  value={expenseForm.category}
                                  onValueChange={(value) =>
                                    setExpenseForm(prev => ({ ...prev, category: value }))
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
                                    <SelectItem value="OTHER">Other</SelectItem>
                                  </SelectContent>
                                </Select>
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

                      {/* Expenses List */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Expenses</CardTitle>
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
                            <div className="space-y-4">
                              {expenses.map((expense) => (
                                <div key={expense.id} className="border rounded-lg p-4 flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{expense.description}</p>
                                    <p className="text-sm text-gray-500">{expense.category}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: userCurrency,
                                      }).format(Number(expense.amount))}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(expense.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CostControlPage;
