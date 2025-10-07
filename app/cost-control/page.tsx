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

const CostControlPage = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "boq" | "revenues" | "expenses"
  >("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
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

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: 0,
  });

  const [boqForm, setBOQForm] = useState({
    item_no: "",
    description: "",
    unit: "M",
    quantity: "",
    rate: "",
  });

  const [revenueForm, setRevenueForm] = useState({
    boq_item_id: "",
    from_date: new Date().toISOString().split("T")[0],
    to_date: new Date().toISOString().split("T")[0],
    quantity_done: "",
  });

  // Mock session data
  const sessionData = {
    user: {
      id: "mock-user-id",
      username: "Mock User",
      company_id: "mock-company-id",
      current_role: "admin",
      currency: "USD1",
    },
  };
  const companyId = sessionData?.user?.company_id;

  // expenses mock data
  const [expenses, setExpenses] = useState([
    {
      id: "1",
      date: "2024-10-01",
      category: "Materials",
      description: "Cement and Steel",
      quantity: 100,
      unit: "Bags",
      unit_price: 25,
      amount: 2500,
    },
    {
      id: "2",
      date: "2024-10-02",
      category: "Labor",
      description: "Construction Workers",
      quantity: 8,
      unit: "Hours",
      unit_price: 15,
      amount: 120,
    },
    {
      id: "3",
      date: "2024-10-03",
      category: "Equipment",
      description: "Crane Rental",
      quantity: 1,
      unit: "Day",
      unit_price: 500,
      amount: 500,
    },
  ]);

  const payrollData = {
    summary: { totalNetPay: 45000 },
  };

  const boqSummary = {
    completed_value: 125000,
    total_value: 500000,
  };

  // boq mock data
  const [boqItems, setBOQItems] = useState([
    {
      id: "1",
      item_no: "001",
      description: "Foundation Work",
      unit: "M3",
      quantity: 100,
      rate: 150,
      amount: 15000,
      completed_qty: 75,
    },
    {
      id: "2",
      item_no: "002",
      description: "Wall Construction",
      unit: "M2",
      quantity: 500,
      rate: 80,
      amount: 40000,
      completed_qty: 300,
    },
    {
      id: "3",
      item_no: "003",
      description: "Roofing",
      unit: "M2",
      quantity: 200,
      rate: 120,
      amount: 24000,
      completed_qty: 0,
    },
  ]);

  // Loading states for UI (set to false since we're using mock data)
  const expensesLoading = false;
  const boqLoading = false;
  const boqItemsLoading = false;

  // Selected project
  const selectedProject = projects?.find((p: any) => p.id === selectedProjectId);
  
  // Project payroll calculation
  const projectPayroll = useMemo(() => {
    if (!selectedProjectId) return 0;
    return payrollData.summary.totalNetPay * 0.3; // Assume 30% of total payroll for selected project
  }, [selectedProjectId, payrollData]);

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
      ? Number(selectedProject?.budget || 0)
      : 0;
    const boqCompletedValue = boqSummary?.completed_value || 0;
    const totalBOQValue = boqSummary?.total_value || 0;

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
  }, [expenses, selectedProject, boqSummary, projectPayroll, financialMetrics]);

  const revenues: any[] = [];
  const revenuesLoading = false;
  const summaryLoading = false;

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

  // Local types for frontend-only cost control
  interface BOQItem {
    id: string;
    project_id: string;
    item_no: string;
    description: string;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
    completed_qty: number;
  }

  interface ProjectExpense {
    id: string;
    project_id: string;
    date: string;
    category: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    amount: number;
  }

  interface ProjectRevenue {
    id: string;
    project_id: string;
    boq_item_id: string;
    from_date: string;
    to_date: string;
    quantity_done: number;
    rate: number;
    amount: number;
  }

  interface CostSummary {
    total_expenses: number;
    total_revenues: number;
    total_boq_value: number;
    net_profit: number;
    profit_margin: number;
    budget_from_planning: number;
  }

  // Mock mutation handlers
  const createBOQItem = async (data: any) => {
    console.log("Mock createBOQItem:", data);
    return { data: { id: "mock-id" } };
  };

  const createRevenue = async (data: any) => {
    console.log("Mock createRevenue:", data);
    return { data: { id: "mock-id" } };
  };

  const bulkUploadBOQ = async (data: any) => {
    console.log("Mock bulkUploadBOQ:", data);
    return { data: { success: true } };
  };

  const bulkUploadExpenses = async (data: any) => {
    console.log("Mock bulkUploadExpenses:", data);
    return { data: { success: true } };
  };

  // TODO: Replace with actual backend API call when implementing backend integration
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    const amount = parseFloat(expenseForm.amount.toString());
    if (
      isNaN(amount) ||
      amount <= 0
    ) {
      toast.error("Please enter valid amount");
      return;
    }

    try {
      // Mock expense creation - replace with actual API call
      const newExpense = {
        id: Date.now().toString(),
        ...expenseForm,
        project_id: selectedProjectId,
        amount: amount
      };

      setExpenses((prev) => [...prev, newExpense]);
      toast.success("Expense added successfully");

      setExpenseForm({
        description: "",
        amount: 0
      });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    }
  };

  // TODO: Replace with actual backend API call when implementing backend integration
  const handleAddBOQItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    const quantity = parseFloat(boqForm.quantity);
    const rate = parseFloat(boqForm.rate);
    if (isNaN(quantity) || isNaN(rate) || quantity <= 0 || rate <= 0) {
      toast.error("Please enter valid quantity and rate");
      return;
    }

    try {
      // Mock BOQ item creation - replace with actual API call
      const newBOQItem = {
        id: Date.now().toString(),
        ...boqForm,
        project_id: selectedProjectId,
        quantity,
        rate,
        amount: quantity * rate,
        completed_qty: 0,
      };

      setBOQItems((prev) => [...prev, newBOQItem]);
      toast.success("BOQ item added successfully");
      setBOQForm({
        item_no: "",
        description: "",
        unit: "M",
        quantity: "",
        rate: "",
      });
    } catch (error) {
      console.error("Error adding BOQ item:", error);
      toast.error("Failed to add BOQ item");
    }
  };

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    const quantityDone = parseFloat(revenueForm.quantity_done);
    if (isNaN(quantityDone) || quantityDone <= 0) {
      toast.error("Please enter a valid quantity done");
      return;
    }

    if (!revenueForm.boq_item_id) {
      toast.error("Please select a BOQ item");
      return;
    }

    try {
      await createRevenue({
        ...revenueForm,
        project_id: selectedProjectId,
        quantity_done: quantityDone,
      });
      toast.success("Revenue recorded successfully");
      setRevenueForm({
        boq_item_id: "",
        from_date: new Date().toISOString().split("T")[0],
        to_date: new Date().toISOString().split("T")[0],
        quantity_done: "",
      });
    } catch (error) {
      console.error("Error adding revenue:", error);
      toast.error("Failed to record revenue");
    }
  };

  const calculateExpenseAmount = () => {
    const quantity = parseFloat(expenseForm.quantity) || 0;
    const unitPrice = parseFloat(expenseForm.unit_price) || 0;
    return quantity * unitPrice;
  };

  // File upload handlers
  const handleBOQFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) {
      toast.error("Please select a project and a valid CSV file");
      return;
    }

    try {
      await bulkUploadBOQ({ projectId: selectedProjectId, file });
      toast.success("BOQ items uploaded successfully");
    } catch (error) {
      console.error("Error uploading BOQ file:", error);
      toast.error("Failed to upload BOQ file");
    }
  };

  const handleExpenseFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) {
      toast.error("Please select a project and a valid CSV file");
      return;
    }

    try {
      await bulkUploadExpenses({ projectId: selectedProjectId, file });
      toast.success("Expenses uploaded successfully");
    } catch (error) {
      console.error("Error uploading expense file:", error);
      toast.error("Failed to upload expense file");
    }
  };

  const units = [
    { value: "M", label: "Meter (M)" },
    { value: "M2", label: "Square Meter (M2)" },
    { value: "M3", label: "Cubic Meter (M3)" },
    { value: "KG", label: "Kilogram (KG)" },
    { value: "TON", label: "Ton" },
    { value: "NO", label: "Number (NO)" },
    { value: "LS", label: "Lump Sum (LS)" },
    { value: "HR", label: "Hour (HR)" },
    { value: "DAY", label: "Day" },
    { value: "LOAD", label: "Load" },
  ];

  const categories = [
    "Materials",
    "Labor",
    "Equipment",
    "Transportation",
    "Permits",
    "Other",
  ];

  // User data for sidebar from session
  const user = {
    name: sessionData?.user?.username || "Current User",
    role: sessionData?.user?.current_role || "user",
    avatar: "",
  };

  // Tab switch handler
  const switchTab = (tab: "overview" | "boq" | "revenues" | "expenses") => {
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} />

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
                  (expensesLoading || boqLoading || summaryLoading) && (
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
                      {boqItems.length > 0 && (
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
                      )}

                      {/* Total Expenses Breakdown */}
                      {(expenses.length > 0 ||
                        (costSummary?.project_budget || 0) > 0) && (
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
                      )}

                      {/* Manual Expenses by Category */}
                      {expenses.length > 0 && (
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
                      )}

                      {/* Recent Revenues */}
                      {revenues.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            Recent Revenue Entries
                          </h3>
                          <div className="space-y-2">
                            {revenues
                              .slice(-5)
                              .reverse()
                              .map((revenue) => (
                                <div
                                  key={revenue.id}
                                  className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-800">
                                      BOQ Item Revenue
                                    </p>
                                    <p className="text-sm text-slate-600">
                                      {revenue.from_date} to {revenue.to_date} •{" "}
                                      {revenue.quantity_done} units
                                    </p>
                                  </div>
                                  <p className="text-lg font-bold text-green-600">
                                    +{formatCurrency(revenue.amount)}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

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
                                    {expense.date} • {expense.category} •{" "}
                                    {expense.quantity} {expense.unit} @ $
                                    {expense.unit_price.toFixed(2)}/
                                    {expense.unit}
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
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📤</span>
                            <h3 className="font-semibold text-slate-800 text-lg">
                              Upload BOQ from CSV
                            </h3>
                          </div>
                          <button className="text-sm bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors font-medium">
                            📥 Download Sample
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          CSV format: Item No, Description, Unit, Quantity, Rate
                        </p>
                        <div className="bg-white rounded-lg p-3 mb-4 text-xs font-mono text-slate-600 border border-blue-200">
                          <div className="font-semibold text-blue-700 mb-1">
                            Example CSV content:
                          </div>
                          <div>Item No,Description,Unit,Quantity,Rate</div>
                          <div>1.1,Concrete foundation work,M3,50,120.00</div>
                          <div>1.2,Steel reinforcement,TON,5,850.00</div>
                        </div>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleBOQFileUpload}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
                        />
                      </div>

                      {/* Manual BOQ Entry Form */}
                      <div className="border-t pt-6">
                        <h3 className="font-semibold text-slate-800 mb-4 text-lg">
                          Add BOQ Item Manually
                        </h3>
                        <form onSubmit={handleAddBOQItem} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Item No.
                              </label>
                              <input
                                type="text"
                                value={boqForm.item_no}
                                onChange={(e) =>
                                  setBOQForm({
                                    ...boqForm,
                                    item_no: e.target.value,
                                  })
                                }
                                placeholder="e.g., 1.1"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Unit
                              </label>
                              <select
                                value={boqForm.unit}
                                onChange={(e) =>
                                  setBOQForm({
                                    ...boqForm,
                                    unit: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                {units.map((unit) => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Description
                              </label>
                              <input
                                type="text"
                                value={boqForm.description}
                                onChange={(e) =>
                                  setBOQForm({
                                    ...boqForm,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="e.g., Concrete foundation work"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Total Quantity
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={boqForm.quantity}
                                onChange={(e) =>
                                  setBOQForm({
                                    ...boqForm,
                                    quantity: e.target.value,
                                  })
                                }
                                placeholder="0.00"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Rate ($)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={boqForm.rate}
                                onChange={(e) =>
                                  setBOQForm({
                                    ...boqForm,
                                    rate: e.target.value,
                                  })
                                }
                                placeholder="0.00"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Add BOQ Item
                          </button>
                        </form>
                      </div>

                      {/* BOQ Items List */}
                      {boqItems.length > 0 && (
                        <div className="border-t pt-6">
                          <h3 className="font-semibold text-slate-800 mb-4 text-lg">
                            BOQ Items ({boqItems.length})
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
                                {boqItems.map((item) => {
                                  const pct =
                                    item.quantity > 0
                                      ? (item.completed_qty / item.quantity) *
                                        100
                                      : 0;
                                  const color =
                                    pct >= 100
                                      ? "text-green-600"
                                      : pct >= 50
                                      ? "text-amber-600"
                                      : "text-slate-600";
                                  return (
                                    <tr
                                      key={item.id}
                                      className="border-b hover:bg-slate-50"
                                    >
                                      <td className="px-3 py-3 font-medium">
                                        {item.item_no}
                                      </td>
                                      <td className="px-3 py-3">
                                        {item.description}
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        {item.unit}
                                      </td>
                                      <td className="px-3 py-3 text-right">
                                        {item.quantity}
                                      </td>
                                      <td className="px-3 py-3 text-right">
                                        {formatCurrency(item.rate)}
                                      </td>
                                      <td className="px-3 py-3 text-right font-semibold">
                                        {formatCurrency(item.amount)}
                                      </td>
                                      <td className="px-3 py-3 text-right font-bold text-green-600">
                                        {item.completed_qty.toFixed(2)}
                                      </td>
                                      <td
                                        className={`px-3 py-3 text-right font-semibold ${color}`}
                                      >
                                        {pct.toFixed(0)}%
                                      </td>
                                    </tr>
                                  );
                                })}
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
                                    {formatCurrency(
                                      boqItems.reduce(
                                        (sum, item) => sum + item.amount,
                                        0
                                      )
                                    )}
                                  </td>
                                  <td
                                    colSpan={2}
                                    className="px-3 py-3 text-right text-green-600 text-lg"
                                  >
                                    Earned: {formatCurrency(
                                      revenues.reduce(
                                        (sum, r) => sum + r.amount,
                                        0
                                      )
                                    )}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Revenue Tab */}
                  {activeTab === "revenues" && (
                    <div className="space-y-4">
                      {boqItems.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                          <p className="text-amber-800 font-medium mb-2">
                            No BOQ Items Available
                          </p>
                          <p className="text-amber-700 text-sm">
                            Please add BOQ items first before recording revenue.
                          </p>
                          <button
                            onClick={() => setActiveTab("boq")}
                            className="mt-4 bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                          >
                            Go to BOQ Tab
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-blue-800 text-sm">
                              <strong>Instructions:</strong> Select a BOQ item,
                              specify the work period, and enter the quantity
                              completed. Revenue will be calculated
                              automatically based on the BOQ rate.
                            </p>
                          </div>
                          <form
                            onSubmit={handleAddRevenue}
                            className="space-y-4"
                          >
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Select BOQ Item
                              </label>
                              <select
                                value={revenueForm.boq_item_id}
                                onChange={(e) =>
                                  setRevenueForm({
                                    ...revenueForm,
                                    boq_item_id: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                              >
                                <option value="">-- Select BOQ Item --</option>
                                {boqItems.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.item_no} - {item.description} (Rate: $
                                    {formatCurrency(item.rate)}/{item.unit})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  📅 From Date
                                </label>
                                <input
                                  type="date"
                                  value={revenueForm.from_date}
                                  onChange={(e) =>
                                    setRevenueForm({
                                      ...revenueForm,
                                      from_date: e.target.value,
                                    })
                                  }
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  📅 To Date
                                </label>
                                <input
                                  type="date"
                                  value={revenueForm.to_date}
                                  onChange={(e) =>
                                    setRevenueForm({
                                      ...revenueForm,
                                      to_date: e.target.value,
                                    })
                                  }
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Quantity of Work Done
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={revenueForm.quantity_done}
                                onChange={(e) =>
                                  setRevenueForm({
                                    ...revenueForm,
                                    quantity_done: e.target.value,
                                  })
                                }
                                placeholder="0.00"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                              />
                            </div>
                            {revenueForm.boq_item_id &&
                              revenueForm.quantity_done && (
                                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm text-green-700 font-medium">
                                        Calculated Revenue
                                      </p>
                                      <p className="text-xs text-green-600 mt-1">
                                        {revenueForm.quantity_done} units × $
                                        {formatCurrency(
                                          boqItems.find(
                                            (item) =>
                                              item.id === revenueForm.boq_item_id
                                          )?.rate || 0
                                        )}
                                      </p>
                                    </div>
                                    <p className="text-3xl font-bold text-green-600">
                                      {formatCurrency(
                                        (parseFloat(
                                          revenueForm.quantity_done
                                        ) || 0) *
                                        (boqItems.find(
                                          (item) =>
                                            item.id === revenueForm.boq_item_id
                                        )?.rate || 0)
                                      )}
                                    </p>
                                  </div>
                                </div>
                              )}
                            <button
                              type="submit"
                              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                              Record Revenue
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  )}

                  {/* Expense Tab */}
                  {activeTab === "expenses" && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-dashed border-red-300 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📤</span>
                            <h3 className="font-semibold text-slate-800 text-lg">
                              Upload Expenses from CSV
                            </h3>
                          </div>
                          <button className="text-sm bg-white text-red-600 px-4 py-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors font-medium">
                            📥 Download Sample
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          CSV format: Date, Description, Category, Quantity,
                          Price, Unit
                        </p>
                        <div className="bg-white rounded-lg p-3 mb-4 text-xs font-mono text-slate-600 border border-red-200">
                          <div className="font-semibold text-red-700 mb-1">
                            Example CSV content:
                          </div>
                          <div>
                            Date,Description,Category,Quantity,Price,Unit
                          </div>
                          <div>
                            2025-10-01,Steel bars,Materials,10,50.00,TON
                          </div>
                          <div>2025-10-02,Workers,Labor,4,200.00,DAY</div>
                        </div>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleExpenseFileUpload}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer cursor-pointer"
                        />
                      </div>

                      {/* Manual Expense Entry */}
                      <div className="border-t pt-6">
                        <h3 className="font-semibold text-slate-800 mb-4 text-lg">
                          Add Expense Manually
                        </h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Description
                            </label>
                            <input
                              type="text"
                              value={expenseForm.description}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="e.g., Steel reinforcement bars"
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={expenseForm.amount}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
                                  amount: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Add Expense
                          </button>
                        </form>
                      </div>
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
