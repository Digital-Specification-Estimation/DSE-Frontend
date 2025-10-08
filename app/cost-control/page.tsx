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
import { useCreateBOQMutation, useGetBOQByProjectQuery } from "@/lib/redux/boqSlice";
import { convertCurrency, getExchangeRate } from "@/lib/utils";

interface ConvertedAmountProps {
  amount: number;
  currency: string;
  showCurrency?: boolean;
  sessionData: any;
}

const ConvertedAmount = ({
  amount,
  currency,
  showCurrency = true,
  sessionData,
}: ConvertedAmountProps) => {
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
  }, [amount, currency, sessionData.user.companies]);

  return (
    <>
      {showCurrency
        ? `${currency} ${Number(convertedAmount).toLocaleString()}`
        : Number(convertedAmount).toLocaleString()}
    </>
  );
};

interface BOQItem {
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_rate: number;
  total: number;
  project_id: string;
  company_id: string;
}

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
  console.log("expenses", expenses);

  // BOQ state and mutations
  const [boqForm, setBoqForm] = useState<Omit<BOQItem, 'total' | 'project_id' | 'company_id'>>({ 
    item_code: '',
    description: '',
    unit: '',
    quantity: 0,
    unit_rate: 0
  });
  const [createBOQ, { isLoading: isCreatingBOQ }] = useCreateBOQMutation();
  const { data: boqItems = [], refetch: refetchBOQ } = useGetBOQByProjectQuery(
    { projectId: selectedProjectId, companyId: sessionData.user?.company_id },
    { skip: !selectedProjectId || !sessionData.user?.company_id }
  );
  console.log("boq items", boqItems );

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

  // Handle BOQ form input changes
  const handleBOQInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBoqForm(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unit_rate' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  // Handle expense form submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProjectId || !expenseForm.description || !expenseForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }
    let exchangeRate = await getExchangeRate(
        sessionData.user.currency,
        sessionData.user.companies?.[0]?.base_currency
      );

    try {
      await createExpense({
        projectId: selectedProjectId,
        companyId: sessionData.user.company_id,
        amount: (Number(expenseForm.amount) * exchangeRate).toString(),
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

  // Handle BOQ form submission
  const handleAddBOQItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !sessionData.user?.company_id) {
      toast.error("Please select a project and ensure you're logged in with a company");
      return;
    }
    let exchangeRate = await getExchangeRate(
        sessionData.user.currency,
        sessionData.user.companies?.[0]?.base_currency
      );

    try {
      await createBOQ({
        item_no:boqForm.item_code,
        description:boqForm.description,
        unit:boqForm.unit,
        quantity:boqForm.quantity.toString(),
        rate:(Number(boqForm.unit_rate) * exchangeRate).toString(),
        amount: (Number(boqForm.quantity) * Number(boqForm.unit_rate) * exchangeRate).toString(),
        project_id: selectedProjectId,
        company_id: sessionData.user.company_id,
      }).unwrap();
      
      toast.success("BOQ item added successfully");
      setBoqForm({
        item_code: '',
        description: '',
        unit: '',
        quantity: 0,
        unit_rate: 0
      });
      refetchBOQ();
    } catch (error:any) {
      console.error("Failed to add BOQ item:", error);
      toast.error(error.data.message);
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
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-slate-800">
                  Cost Control Dashboard
                </h1>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    window.location.reload();
                  }}
                  title="Refresh page"
                  className="ml-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M21.5 2v6h-6" />
                    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38" />
                  </svg>
                  <span className="sr-only">Refresh page</span>
                </Button>
              </div>
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
                    <ConvertedAmount
                      amount={costSummary?.total_revenues || 0}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                      sessionData={sessionData}
                    />
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
                    <ConvertedAmount
                      amount={costSummary?.total_expenses || 0}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                      sessionData={sessionData}
                    />
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Manual:
                    <ConvertedAmount
                      amount={costSummary?.total_expenses || 0}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                      sessionData={sessionData}
                    />
                    + Budget:
                    <ConvertedAmount
                      amount={costSummary?.project_budget || 0}
                      currency={sessionData.user.currency}
                      showCurrency={true}
                      sessionData={sessionData}
                    />
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
                              <ConvertedAmount
                                amount={costSummary?.total_boq_value || 0}
                                currency={sessionData.user.currency}
                                showCurrency={true}
                                sessionData={sessionData}
                              />
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Total Revenue
                            </p>
                            <p className="text-xl font-bold text-green-600">
                              <ConvertedAmount
                                amount={costSummary?.total_revenues || 0}
                                currency={sessionData.user.currency}
                                showCurrency={true}
                                sessionData={sessionData}
                              />
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
                              <ConvertedAmount
                                amount={costSummary?.project_budget || 0}
                                currency={sessionData.user.currency}
                                showCurrency={true}
                                sessionData={sessionData}
                              />
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
                              <ConvertedAmount
                                amount={costSummary?.total_expenses || 0}
                                currency={sessionData.user.currency}
                                showCurrency={true}
                                sessionData={sessionData}
                              />
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
                                <ConvertedAmount
                                  amount={Number(amount)}
                                  currency={sessionData.user.currency}
                                  showCurrency={true}
                                  sessionData={sessionData}
                                />
                              </p>
                            </div>
                          ))}
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
                                  <ConvertedAmount
                                    amount={Number(expense.amount)}
                                    currency={sessionData.user.currency}
                                    showCurrency={true}
                                    sessionData={sessionData}
                                  />
                                </p>
                              </div>
                            ))}
                          {expenses.length === 0 && (
                            <p className="text-slate-500 text-center py-8">
                              No manual expenses recorded yet for this project
                            </p>
                          )}
                        </div>
                        {(costSummary?.project_budget || 0) > 0 && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> This project also has 
                              {formatCurrency(
                                costSummary?.project_budget || 0
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
                                <Input
                                  id="unit"
                                  name="unit"
                                  value={boqForm.unit}
                                  onChange={handleBOQInputChange}
                                  placeholder="e.g., m³, kg, pcs"
                                  required
                                />
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
                                  value={boqForm.quantity || ''}
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
                                  value={boqForm.unit_rate || ''}
                                  onChange={handleBOQInputChange}
                                  placeholder="0.00"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Total (R)
                                </label>
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
                                  {boqItems.map((item: BOQItem, index) => (
                                    <tr key={`${item.item_no}-${index}`} className="border-b hover:bg-gray-50">
                                      <td className="p-4">{item.item_no}</td>
                                      <td className="p-4">{item.description}</td>
                                      <td className="text-right p-4">{item.quantity}</td>
                                      <td className="text-right p-4">{item.unit}</td>
                                      <td className="text-right p-4">
                                        <ConvertedAmount
                                          amount={Number(item.rate)}
                                          currency={sessionData.user.currency}
                                          showCurrency={true}
                                          sessionData={sessionData}
                                        />
                                      </td>
                                      <td className="text-right p-4 font-medium">
                                      <ConvertedAmount
                                        amount={item.quantity * item.rate}
                                        currency={sessionData.user.currency}
                                        showCurrency={true}
                                        sessionData={sessionData}
                                      />
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
                                    <SelectItem value="PERMITS">Permits</SelectItem>
                                    <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                                    <SelectItem value="UTILITIES">Utilities</SelectItem>
                                    <SelectItem value="RENT">Rent</SelectItem>
                                    <SelectItem value="OFFICE_SUPPLIES">Office Supplies</SelectItem>
                                    <SelectItem value="TRAINING">Training</SelectItem>
                                    <SelectItem value="MARKETING">Marketing</SelectItem>
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
                                    <ConvertedAmount
                                      amount={Number(expense.amount)}
                                      currency={sessionData.user.currency}
                                      showCurrency={true}
                                      sessionData={sessionData}
                                    />
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
