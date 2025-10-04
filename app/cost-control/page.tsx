"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
// Placeholder for Redux hooks (to be implemented in backend integration)
import { useGetProjectsQuery } from "@/lib/redux/projectSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
// import { useGetBOQItemsByProjectQuery, useGetProjectExpensesQuery, useGetProjectRevenuesQuery, useGetProjectCostSummaryQuery, useCreateBOQItemMutation, useCreateExpenseMutation, useCreateRevenueMutation, useBulkUploadBOQMutation, useBulkUploadExpensesMutation } from "@/lib/redux/costControlSlice";
import { toast } from "sonner"; // Toast notifications

const CostControlPage = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "boq" | "revenues" | "expenses"
  >("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Materials",
    description: "",
    quantity: "",
    unit: "M",
    unit_price: "",
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

  // Auth session
  const { data: sessionData } = useSessionQuery();

  // Mock data for development (replace with actual Redux queries)
  const { data: projects } = useGetProjectsQuery();
  // Placeholder Redux queries (uncomment and implement in backend)
  /*
  const {
    data: boqItems = [],
    error: boqError,
    isLoading: boqLoading,
  } = useGetBOQItemsByProjectQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  const {
    data: expenses = [],
    error: expensesError,
    isLoading: expensesLoading,
  } = useGetProjectExpensesQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  const {
    data: revenues = [],
    error: revenuesError,
    isLoading: revenuesLoading,
  } = useGetProjectRevenuesQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  const {
    data: costSummary,
    error: summaryError,
    isLoading: summaryLoading,
  } = useGetProjectCostSummaryQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  */

  // Mock data for frontend development (replace with actual backend data)
  const boqItems: BOQItem[] = [];
  const expenses: ProjectExpense[] = [];
  const revenues: ProjectRevenue[] = [];
  const costSummary: CostSummary = {
    total_expenses: 0,
    total_revenues: 0,
    total_boq_value: 0,
    net_profit: 0,
    profit_margin: 0,
    budget_from_planning: 0,
  };
  const boqLoading = false;
  const expensesLoading = false;
  const revenuesLoading = false;
  const summaryLoading = false;

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

  // Placeholder mutations (uncomment and implement in backend)
  // const [createBOQItem] = useCreateBOQItemMutation();
  // const [createExpense] = useCreateExpenseMutation();
  // const [createRevenue] = useCreateRevenueMutation();
  // const [bulkUploadBOQ] = useBulkUploadBOQMutation();
  // const [bulkUploadExpenses] = useBulkUploadExpensesMutation();

  // Mock mutation handlers (replace with actual backend calls)
  const createBOQItem = async (data: any) => {
    console.log("Mock createBOQItem:", data);
    return { data: { id: "mock-id" } }; // Simulate successful response
  };

  const createExpense = async (data: any) => {
    console.log("Mock createExpense:", data);
    return { data: { id: "mock-id" } }; // Simulate successful response
  };

  const createRevenue = async (data: any) => {
    console.log("Mock createRevenue:", data);
    return { data: { id: "mock-id" } }; // Simulate successful response
  };

  const bulkUploadBOQ = async (data: any) => {
    console.log("Mock bulkUploadBOQ:", data);
    return { data: { success: true } }; // Simulate successful response
  };

  const bulkUploadExpenses = async (data: any) => {
    console.log("Mock bulkUploadExpenses:", data);
    return { data: { success: true } }; // Simulate successful response
  };

  // Handler functions with validation and toast notifications
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    const quantity = parseFloat(expenseForm.quantity);
    const unitPrice = parseFloat(expenseForm.unit_price);
    if (
      isNaN(quantity) ||
      isNaN(unitPrice) ||
      quantity <= 0 ||
      unitPrice <= 0
    ) {
      toast.error("Please enter valid quantity and unit price");
      return;
    }

    try {
      await createExpense({
        ...expenseForm,
        project_id: selectedProjectId,
        quantity,
        unit_price: unitPrice,
      }).unwrap();
      toast.success("Expense added successfully");
      setExpenseForm({
        date: new Date().toISOString().split("T")[0],
        category: "Materials",
        description: "",
        quantity: "",
        unit: "M",
        unit_price: "",
      });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    }
  };

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
      await createBOQItem({
        ...boqForm,
        project_id: selectedProjectId,
        quantity,
        rate,
      }).unwrap();
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
      }).unwrap();
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
      await bulkUploadBOQ({ projectId: selectedProjectId, file }).unwrap();
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
      await bulkUploadExpenses({ projectId: selectedProjectId, file }).unwrap();
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
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
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select a Project --</option>
                {projects?.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name} - {project.location_name}
                  </option>
                ))}
              </select>
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

          {/* Summary Cards */}
          {selectedProjectId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">
                    Total Revenue
                  </span>
                  <span className="text-green-500">📈</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${costSummary?.total_revenues?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-slate-500 mt-1">From BOQ progress</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">
                    Total Expenses
                  </span>
                  <span className="text-red-500">📉</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  $
                  {(
                    (costSummary?.total_expenses || 0) +
                    (costSummary?.budget_from_planning || 0)
                  ).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Manual: ${costSummary?.total_expenses?.toFixed(2) || "0.00"} +
                  Budget: $
                  {costSummary?.budget_from_planning?.toFixed(2) || "0.00"}
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
                  ${costSummary?.net_profit?.toFixed(2) || "0.00"}
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
          {selectedProjectId && (
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
                              $
                              {boqItems
                                .reduce((sum, item) => sum + item.amount, 0)
                                .toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Earned Revenue
                            </p>
                            <p className="text-xl font-bold text-green-600">
                              $
                              {revenues
                                .reduce((sum, r) => sum + r.amount, 0)
                                .toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Completion %
                            </p>
                            <p className="text-xl font-bold text-amber-600">
                              {boqItems.length > 0
                                ? (
                                    (revenues.reduce(
                                      (sum, r) => sum + r.amount,
                                      0
                                    ) /
                                      boqItems.reduce(
                                        (sum, item) => sum + item.amount,
                                        0
                                      )) *
                                    100
                                  ).toFixed(1)
                                : "0"}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Expenses Breakdown */}
                    {(expenses.length > 0 ||
                      (costSummary?.budget_from_planning || 0) > 0) && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                          Total Project Expenses
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Manual Expenses
                            </p>
                            <p className="text-xl font-bold text-red-600">
                              $
                              {expenses
                                .reduce((sum, exp) => sum + exp.amount, 0)
                                .toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500">
                              From Cost Control
                            </p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Budget Planning
                            </p>
                            <p className="text-xl font-bold text-orange-600">
                              $
                              {costSummary?.budget_from_planning?.toFixed(2) ||
                                "0.00"}
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
                              $
                              {(
                                expenses.reduce(
                                  (sum, exp) => sum + exp.amount,
                                  0
                                ) + (costSummary?.budget_from_planning || 0)
                              ).toFixed(2)}
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
                                ${amount.toFixed(2)}
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
                                  +${revenue.amount.toFixed(2)}
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
                                  {expense.unit_price.toFixed(2)}/{expense.unit}
                                </p>
                              </div>
                              <p className="text-lg font-bold text-red-600">
                                -${expense.amount.toFixed(2)}
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
                            {costSummary?.budget_from_planning?.toFixed(2)}
                            in planned expenses from the Budget Planning system,
                            which are included in the total expenses above.
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
                                setBOQForm({ ...boqForm, unit: e.target.value })
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
                                setBOQForm({ ...boqForm, rate: e.target.value })
                              }
                              placeholder="0.00"
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          ➕ Add BOQ Item
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
                                    ? (item.completed_qty / item.quantity) * 100
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
                                      ${item.rate.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-3 text-right font-semibold">
                                      ${item.amount.toFixed(2)}
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
                                  $
                                  {boqItems
                                    .reduce((sum, item) => sum + item.amount, 0)
                                    .toFixed(2)}
                                </td>
                                <td
                                  colSpan={2}
                                  className="px-3 py-3 text-right text-green-600 text-lg"
                                >
                                  Earned: $
                                  {revenues
                                    .reduce((sum, r) => sum + r.amount, 0)
                                    .toFixed(2)}
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
                            completed. Revenue will be calculated automatically
                            based on the BOQ rate.
                          </p>
                        </div>
                        <form onSubmit={handleAddRevenue} className="space-y-4">
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
                                  {item.rate}/{item.unit})
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
                                      {boqItems.find(
                                        (item) =>
                                          item.id === revenueForm.boq_item_id
                                      )?.rate || 0}
                                    </p>
                                  </div>
                                  <p className="text-3xl font-bold text-green-600">
                                    $
                                    {(
                                      (parseFloat(revenueForm.quantity_done) ||
                                        0) *
                                      (boqItems.find(
                                        (item) =>
                                          item.id === revenueForm.boq_item_id
                                      )?.rate || 0)
                                    ).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            )}
                          <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                          >
                            ➕ Record Revenue
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
                        <div>Date,Description,Category,Quantity,Price,Unit</div>
                        <div>2025-10-01,Steel bars,Materials,10,50.00,TON</div>
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
                            Date
                          </label>
                          <input
                            type="date"
                            value={expenseForm.date}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                date: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Category
                          </label>
                          <select
                            value={expenseForm.category}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                category: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Quantity
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={expenseForm.quantity}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
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
                              Unit
                            </label>
                            <select
                              value={expenseForm.unit}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
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
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Unit Price ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={expenseForm.unit_price}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                unit_price: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        {expenseForm.quantity && expenseForm.unit_price && (
                          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-red-700 font-medium">
                                  Calculated Amount
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                  {expenseForm.quantity} {expenseForm.unit} × $
                                  {expenseForm.unit_price}/{expenseForm.unit}
                                </p>
                              </div>
                              <p className="text-3xl font-bold text-red-600">
                                ${calculateExpenseAmount().toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          ➕ Add Expense
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostControlPage;
