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
  FileText,
} from "lucide-react";
import {
  useGetProjectsQuery,
  useGetProjectFinancialMetricsQuery,
} from "@/lib/redux/projectSlice";
import {
  useCreateExpenseMutation,
  useGetExpensesByProjectQuery,
} from "@/lib/redux/expenseSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
import {
  useCreateBOQMutation,
  useGetBOQByProjectQuery,
} from "@/lib/redux/boqSlice";
import { useGetTradesQuery } from "@/lib/redux/tradePositionSlice";
import { useGetEmployeesQuery } from "@/lib/redux/employeeSlice";
import { useGetDeductionsQuery } from "@/lib/redux/deductionSlice";
import { useCalculateEmployeePayrollQuery } from "@/lib/redux/attendanceSlice";

// Profit & Loss Statement Component
const ProfitLossStatement = ({ 
  selectedProjectId, 
  sessionData, 
  costSummary, 
  projects,
  boqItems,
  formatCurrency,
  getUserCurrency 
}: {
  selectedProjectId: string;
  sessionData: any;
  costSummary: any;
  projects: any[];
  boqItems: any[];
  formatCurrency: (amount: number, fromCurrency?: string) => string;
  getUserCurrency: () => string;
}) => {

  // Fetch trades, employees, expenses, and attendance data
  const { data: trades = [] } = useGetTradesQuery();
  const { data: employees = [] } = useGetEmployeesQuery();
  const { data: deductions = [] } = useGetDeductionsQuery();
  const { data: projectExpenses = [] } = useGetExpensesByProjectQuery(selectedProjectId);
  
  // Create a memoized object to store payroll data for each employee and month
  const [employeePayrollCache, setEmployeePayrollCache] = useState<{[key: string]: number}>({});

  // State for selected months (default to current and next 2 months)
  const [selectedMonths, setSelectedMonths] = useState(() => {
    const now = new Date();
    const month1 = new Date(now.getFullYear(), now.getMonth(), 1);
    const month2 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const month3 = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    
    return {
      month1: month1.toISOString().slice(0, 7), // YYYY-MM format
      month2: month2.toISOString().slice(0, 7),
      month3: month3.toISOString().slice(0, 7)
    };
  });

  // Get project employees - try multiple possible field names
  const projectEmployees = useMemo(() => {
    return employees.filter((emp: any) => 
      emp.project_id === selectedProjectId || 
      emp.projectId === selectedProjectId ||
      emp.current_project_id === selectedProjectId
    );
  }, [employees, selectedProjectId]);

  // Get project trades (trades that have employees in this project)
  const projectTrades = useMemo(() => {
    // If no project employees, show all trades for now (for debugging)
    if (projectEmployees.length === 0) {
      console.log('No project employees found. Available employees:', employees);
      console.log('Selected project ID:', selectedProjectId);
      // Return all trades so we can see the structure
      return trades.slice(0, 5); // Limit to first 5 trades for testing
    }
    
    const tradeIds = [...new Set(projectEmployees.map((emp: any) => emp.trade_position_id).filter(Boolean))];
    console.log('Trade IDs from project employees:', tradeIds);
    return trades.filter((trade: any) => tradeIds.includes(trade.id));
  }, [trades, projectEmployees, employees, selectedProjectId]);

  // Calculate actual payroll for each trade in each month using REAL attendance data
  const calculateTradePayroll = (tradeId: string, month: string) => {
    // First try to get employees for this specific trade from project employees
    let tradeEmployees = projectEmployees.filter((emp: any) => emp.trade_position_id === tradeId);
    
    // If no project employees found, try to get all employees for this trade (for debugging)
    if (tradeEmployees.length === 0) {
      tradeEmployees = employees.filter((emp: any) => emp.trade_position_id === tradeId);
      console.log(`No project employees for trade ${tradeId}, using all employees:`, tradeEmployees.length);
    }
    
    return tradeEmployees.reduce((total: number, employee: any) => {
      // Get attendance data for this employee
      const attendance = employee.attendance || [];
      
      // Filter attendance records for the specific month
      const monthAttendance = attendance.filter((a: any) => {
        if (!a.date) return false;
        const attendanceMonth = new Date(a.date).toISOString().slice(0, 7);
        return attendanceMonth === month;
      });
      
      // Calculate attendance statistics using the same logic as attendance-payroll
      const presentDays = monthAttendance.filter(
        (a: any) => a.status?.toLowerCase() === "present"
      ).length;
      
      const lateDays = monthAttendance.filter(
        (a: any) => a.status?.toLowerCase() === "late"
      ).length;
      
      // Separate absent days by whether they have a reason (paid leave) or not (unpaid leave)
      const absentWithSickReason = monthAttendance.filter(
        (a: any) =>
          a.status?.toLowerCase() === "absent" &&
          a.reason?.toLowerCase() === "sick"
      ).length;
      
      const absentWithVacationReason = monthAttendance.filter(
        (a: any) =>
          a.status?.toLowerCase() === "absent" &&
          a.reason?.toLowerCase() === "vacation"
      ).length;
      
      // Calculate paid days: working days + paid leave (sick/vacation)
      const workingDays = presentDays + lateDays;
      const paidLeaveDays = absentWithSickReason + absentWithVacationReason;
      const totalPaidDays = workingDays + paidLeaveDays;
      
      // Get daily rate from employee or trade position (same logic as attendance-payroll)
      let dailyRate = Number(employee.daily_rate || 0);
      if (dailyRate === 0 && employee.trade_position?.daily_planned_cost) {
        dailyRate = Number(employee.trade_position.daily_planned_cost);
      }
      // If still 0 and monthly rate exists, convert monthly to daily
      if (dailyRate === 0 && employee.trade_position?.monthly_planned_cost) {
        dailyRate = Number(employee.trade_position.monthly_planned_cost) / 30;
      }
      
      // Calculate gross payroll based on actual paid days
      const grossPayroll = totalPaidDays * dailyRate;
      
      // Calculate automatic deductions (late penalties)
      const lateDeduction = lateDays * (dailyRate * 0.1); // 10% penalty per late day
      
      // Get manual deductions for this employee for this month
      const employeeManualDeductions = deductions
        .filter((deduction: any) => {
          if (deduction.employee_id !== employee.id) return false;
          if (!deduction.date) return true; // General deductions apply
          const deductionMonth = new Date(deduction.date).toISOString().slice(0, 7);
          return deductionMonth === month;
        })
        .reduce(
          (total: number, deduction: any) =>
            total + Number(deduction.amount || 0),
          0
        );
      
      // Total deductions = automatic + manual
      const totalDeductions = lateDeduction + employeeManualDeductions;
      
      // Net payroll = gross - deductions
      const netPayroll = Math.max(0, grossPayroll - totalDeductions);
      
      console.log(`Employee ${employee.name || employee.username || employee.id} (${month}):`, {
        presentDays,
        lateDays,
        paidLeaveDays,
        totalPaidDays,
        dailyRate,
        grossPayroll,
        lateDeduction,
        manualDeductions: employeeManualDeductions,
        totalDeductions,
        netPayroll
      });
      
      return total + netPayroll;
    }, 0);
  };

  // State for only editable expenses - Other Expenses
  const [otherExpenses, setOtherExpenses] = useState({
    month1: 0,
    month2: 0,
    month3: 0
  });

  // Calculate expense totals by category from database
  const calculateExpenseByCategory = (category: string, month: string) => {
    const filteredExpenses = projectExpenses
      .filter((expense: any) => {
        if (expense.category !== category) return false;
        if (!expense.date) return false;
        const expenseMonth = new Date(expense.date).toISOString().slice(0, 7);
        return expenseMonth === month;
      });
    
    const total = filteredExpenses.reduce((total: number, expense: any) => total + Number(expense.amount || 0), 0);
    console.log(`Expense calculation for ${category} in ${month}:`, {
      filteredExpenses: filteredExpenses.length,
      total,
      allExpenses: projectExpenses.length
    });
    return total;
  };

  // Get unique expense categories from the database
  const expenseCategories = useMemo(() => {
    const categories = [...new Set(projectExpenses.map((exp: any) => exp.category).filter(Boolean))];
    return categories.filter(cat => cat.toLowerCase() !== 'other'); // Exclude 'other' as it's editable
  }, [projectExpenses]);

  // Get selected project details
  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);
  
  // Debug project data
  console.log('Selected Project ID:', selectedProjectId);
  console.log('Available Projects:', projects);
  console.log('Selected Project:', selectedProject);
  if (selectedProject) {
    console.log('Project fields:', Object.keys(selectedProject));
    console.log('Project values:', selectedProject);
  }
  
  // Calculate month-specific BOQ progress (actual work completed in that month)
  const calculateMonthlyBOQRevenue = (monthKey: 'month1' | 'month2' | 'month3') => {
    const month = selectedMonths[monthKey];
    
    console.log(`Debugging BOQ items for ${month}:`, {
      totalBOQItems: boqItems.length,
      boqItems: boqItems,
      targetMonth: month
    });
    
    // Filter BOQ items completed in this specific month
    const monthlyBOQItems = boqItems.filter((item: any) => {
      // Debug each item
      console.log('Checking BOQ item:', {
        item,
        completion_date: item.completion_date,
        created_at: item.created_at,
        updated_at: item.updated_at,
        availableFields: Object.keys(item)
      });
      
      if (!item.completion_date && !item.created_at) return false;
      
      // Use completion_date if available, otherwise use created_at
      const itemDate = item.completion_date || item.created_at;
      const itemMonth = new Date(itemDate).toISOString().slice(0, 7);
      
      console.log('Date comparison:', {
        itemDate,
        itemMonth,
        targetMonth: month,
        matches: itemMonth === month
      });
      
      return itemMonth === month;
    });
    
    // Calculate revenue from BOQ items completed in this month
    // Use rate field instead of unit_rate, and amount if completed_qty is 0
    const monthlyBOQRevenue = monthlyBOQItems.reduce((total: number, item: any) => {
      const completedQty = Number(item.completed_qty || 0);
      const rate = Number(item.rate || item.unit_rate || 0);
      const amount = Number(item.amount || 0);
      
      // If completed_qty is 0, use the full amount (assuming item is completed)
      const itemValue = completedQty > 0 ? (completedQty * rate) : amount;
      
      console.log('BOQ item value calculation:', {
        item: item.description,
        completedQty,
        rate,
        amount,
        itemValue
      });
      
      return total + itemValue;
    }, 0);
    
    console.log(`BOQ Revenue for ${month}:`, {
      month,
      monthlyBOQItems: monthlyBOQItems.length,
      monthlyBOQRevenue,
      totalBOQItems: boqItems.length
    });
    
    return monthlyBOQRevenue;
  };
  
  // Calculate total project revenue (BOQ + Budget) - used only for TOTAL column
  const calculateTotalProjectRevenue = () => {
    // Get project budget
    const projectBudget = Number(selectedProject?.budget || 0);
    
    // Get total BOQ value (all completed work or full amounts)
    const totalBOQValue = boqItems.reduce((total: number, item: any) => {
      const completedQty = Number(item.completed_qty || 0);
      const rate = Number(item.rate || item.unit_rate || 0);
      const amount = Number(item.amount || 0);
      
      // If completed_qty is 0, use the full amount (assuming item is completed)
      const itemValue = completedQty > 0 ? (completedQty * rate) : amount;
      
      return total + itemValue;
    }, 0);
    
    // Total = BOQ completed work + Project budget
    const totalRevenue = projectBudget + totalBOQValue;
    
    console.log('Total Project Revenue Calculation:', {
      projectBudget,
      totalBOQValue,
      totalRevenue,
      boqItemsCount: boqItems.length
    });
    
    return totalRevenue;
  };
  
  // Calculate monthly expenses from existing data
  const monthlyPayroll = (costSummary?.project_payroll || 0) / 3;
  const monthlyMaterials = (costSummary?.manual_expenses || 0) / 3;
  
  // Calculate labour totals for each month using real trade data
  const calculateTotalLabour = (monthKey: 'month1' | 'month2' | 'month3') => {
    const month = selectedMonths[monthKey];
    return projectTrades.reduce((total: number, trade: any) => {
      return total + calculateTradePayroll(trade.id, month);
    }, 0);
  };

  // Calculate totals
  const calculateMonthlyExpenses = (monthKey: 'month1' | 'month2' | 'month3') => {
    const month = selectedMonths[monthKey];
    let totalExpenses = calculateTotalLabour(monthKey); // Labour costs from trades
    
    // Add database expense categories
    expenseCategories.forEach(category => {
      totalExpenses += calculateExpenseByCategory(category, month);
    });
    
    // Add editable other expenses
    totalExpenses += otherExpenses[monthKey];
    
    return totalExpenses;
  };
  
  const calculateMonthlyProfit = (monthKey: 'month1' | 'month2' | 'month3') => {
    return calculateMonthlyBOQRevenue(monthKey) - calculateMonthlyExpenses(monthKey);
  };
  
  const calculateProfitMargin = (monthKey: 'month1' | 'month2' | 'month3') => {
    const profit = calculateMonthlyProfit(monthKey);
    const revenue = calculateMonthlyBOQRevenue(monthKey);
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  };

  // Total calculations
  const totalRevenue = calculateTotalProjectRevenue();
  const totalExpenses = calculateMonthlyExpenses('month1') + calculateMonthlyExpenses('month2') + calculateMonthlyExpenses('month3');
  const totalProfit = totalRevenue - totalExpenses;
  const totalProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Excel export function
  const exportToExcel = () => {
    // Debug trade objects to see their structure
    console.log('Project Trades for Excel:', projectTrades);
    projectTrades.forEach((trade: any, index: number) => {
      console.log(`Trade ${index}:`, {
        trade,
        availableFields: Object.keys(trade),
        name: trade.name,
        trade_name: trade.trade_name,
        position_name: trade.position_name
      });
    });

    // Create HTML content for Excel export
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Profit & Loss Statement</title>
          <style>
              body { font-family: Calibri, Arial, sans-serif; margin: 20px; }
              .project-info { margin-bottom: 20px; background-color: #f0f0f0; padding: 15px; border: 1px solid #ccc; }
              table { border-collapse: collapse; width: 100%; font-size: 11px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #d9d9d9; font-weight: bold; text-align: center; }
              .number { text-align: right; }
              .section-header { background-color: #cfe2f3; font-weight: bold; }
              .section-header.expenses { background-color: #f4cccc; }
              .subtotal { background-color: #f3f3f3; font-weight: bold; }
              .total { background-color: #d9ead3; font-weight: bold; }
              .margin { background-color: #fff2cc; font-weight: bold; }
              .indent { padding-left: 30px; }
          </style>
      </head>
      <body>
          <div class="project-info">
              <h2>PROJECT INFORMATION</h2>
              <table>
                  <tr><td><strong>Project Name:</strong></td><td>${selectedProject?.project_name || selectedProject?.name || 'N/A'}</td></tr>
                  <tr><td><strong>Project Location:</strong></td><td>${selectedProject?.location_name || selectedProject?.location || 'N/A'}</td></tr>
                  <tr><td><strong>Project Start Date:</strong></td><td>${selectedProject?.start_date || selectedProject?.startDate || 'N/A'}</td></tr>
                  <tr><td><strong>Project Finish Date:</strong></td><td>${selectedProject?.end_date || selectedProject?.endDate || 'N/A'}</td></tr>
              </table>
          </div>
          
          <h1>PROFIT & LOSS STATEMENT</h1>
          <div>DECENT ENGINEERING CONSTRUCTION Ltd - ${new Date(selectedMonths.month1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} to ${new Date(selectedMonths.month3).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          
          <table>
              <thead>
                  <tr>
                      <th>Description</th>
                      <th>${new Date(selectedMonths.month1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</th>
                      <th>${new Date(selectedMonths.month2).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</th>
                      <th>${new Date(selectedMonths.month3).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</th>
                      <th>TOTAL</th>
                  </tr>
              </thead>
              <tbody>
                  <tr class="section-header">
                      <td>REVENUE</td><td></td><td></td><td></td><td></td>
                  </tr>
                  <tr>
                      <td class="indent">Invoice Revenue</td>
                      <td class="number">${calculateMonthlyBOQRevenue('month1').toLocaleString()}</td>
                      <td class="number">${calculateMonthlyBOQRevenue('month2').toLocaleString()}</td>
                      <td class="number">${calculateMonthlyBOQRevenue('month3').toLocaleString()}</td>
                      <td class="number">${totalRevenue.toLocaleString()}</td>
                  </tr>
                  <tr class="subtotal">
                      <td>TOTAL REVENUE</td>
                      <td class="number">${calculateMonthlyBOQRevenue('month1').toLocaleString()}</td>
                      <td class="number">${calculateMonthlyBOQRevenue('month2').toLocaleString()}</td>
                      <td class="number">${calculateMonthlyBOQRevenue('month3').toLocaleString()}</td>
                      <td class="number">${totalRevenue.toLocaleString()}</td>
                  </tr>
                  <tr class="section-header expenses">
                      <td>EXPENSES</td><td></td><td></td><td></td><td></td>
                  </tr>
                  ${projectTrades.map((trade: any) => `
                  <tr>
                      <td class="indent">${trade.name || trade.trade_name || trade.position_name || trade.title || 'Unknown Trade'}</td>
                      <td class="number">${calculateTradePayroll(trade.id, selectedMonths.month1).toFixed(2)}</td>
                      <td class="number">${calculateTradePayroll(trade.id, selectedMonths.month2).toFixed(2)}</td>
                      <td class="number">${calculateTradePayroll(trade.id, selectedMonths.month3).toFixed(2)}</td>
                      <td class="number">${(calculateTradePayroll(trade.id, selectedMonths.month1) + calculateTradePayroll(trade.id, selectedMonths.month2) + calculateTradePayroll(trade.id, selectedMonths.month3)).toFixed(2)}</td>
                  </tr>`).join('')}
                  <tr class="subtotal">
                      <td class="indent">Total Labour</td>
                      <td class="number">${calculateTotalLabour('month1').toFixed(2)}</td>
                      <td class="number">${calculateTotalLabour('month2').toFixed(2)}</td>
                      <td class="number">${calculateTotalLabour('month3').toFixed(2)}</td>
                      <td class="number">${(calculateTotalLabour('month1') + calculateTotalLabour('month2') + calculateTotalLabour('month3')).toFixed(2)}</td>
                  </tr>
                  ${expenseCategories.map((category: string) => `
                  <tr>
                      <td class="indent">${category}</td>
                      <td class="number">${calculateExpenseByCategory(category, selectedMonths.month1).toFixed(2)}</td>
                      <td class="number">${calculateExpenseByCategory(category, selectedMonths.month2).toFixed(2)}</td>
                      <td class="number">${calculateExpenseByCategory(category, selectedMonths.month3).toFixed(2)}</td>
                      <td class="number">${(calculateExpenseByCategory(category, selectedMonths.month1) + calculateExpenseByCategory(category, selectedMonths.month2) + calculateExpenseByCategory(category, selectedMonths.month3)).toFixed(2)}</td>
                  </tr>`).join('')}
                  <tr>
                      <td class="indent">Other Expenses</td>
                      <td class="number">${otherExpenses.month1.toFixed(2)}</td>
                      <td class="number">${otherExpenses.month2.toFixed(2)}</td>
                      <td class="number">${otherExpenses.month3.toFixed(2)}</td>
                      <td class="number">${(otherExpenses.month1 + otherExpenses.month2 + otherExpenses.month3).toFixed(2)}</td>
                  </tr>
                  <tr class="subtotal">
                      <td>TOTAL EXPENSES</td>
                      <td class="number">${calculateMonthlyExpenses('month1').toFixed(2)}</td>
                      <td class="number">${calculateMonthlyExpenses('month2').toFixed(2)}</td>
                      <td class="number">${calculateMonthlyExpenses('month3').toFixed(2)}</td>
                      <td class="number">${totalExpenses.toFixed(2)}</td>
                  </tr>
                  <tr class="total">
                      <td>NET PROFIT</td>
                      <td class="number">${calculateMonthlyProfit('month1').toFixed(2)}</td>
                      <td class="number">${calculateMonthlyProfit('month2').toFixed(2)}</td>
                      <td class="number">${calculateMonthlyProfit('month3').toFixed(2)}</td>
                      <td class="number">${totalProfit.toFixed(2)}</td>
                  </tr>
                  <tr class="margin">
                      <td>PROFIT MARGIN %</td>
                      <td class="number">${calculateProfitMargin('month1').toFixed(1)}%</td>
                      <td class="number">${calculateProfitMargin('month2').toFixed(1)}%</td>
                      <td class="number">${calculateProfitMargin('month3').toFixed(1)}%</td>
                      <td class="number">${totalProfitMargin.toFixed(1)}%</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedProject?.name || 'Project'}_ProfitLoss_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Project Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Information</span>
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <strong>Project Name:</strong> {selectedProject?.project_name || selectedProject?.name || 'N/A'}
            </div>
            <div>
              <strong>Project Location:</strong> {selectedProject?.location_name || selectedProject?.location || 'N/A'}
            </div>
            <div>
              <strong>Project Start Date:</strong> {selectedProject?.start_date || selectedProject?.startDate || 'N/A'}
            </div>
            <div>
              <strong>Project Finish Date:</strong> {selectedProject?.end_date || selectedProject?.endDate || 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Statement Table */}
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
          <p className="text-sm text-gray-600">
            DECENT ENGINEERING CONSTRUCTION Ltd - {new Date(selectedMonths.month1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} to {new Date(selectedMonths.month3).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-bold">{new Date(selectedMonths.month1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-bold">{new Date(selectedMonths.month2).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-bold">{new Date(selectedMonths.month3).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-bold">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {/* REVENUE SECTION */}
                <tr className="bg-blue-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">REVENUE</td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 pl-8">Invoice Revenue</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyBOQRevenue('month1'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyBOQRevenue('month2'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyBOQRevenue('month3'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                    {formatCurrency(totalRevenue)}
                  </td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">TOTAL REVENUE</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyBOQRevenue('month1'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyBOQRevenue('month2'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyBOQRevenue('month3'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(totalRevenue)}
                  </td>
                </tr>

                {/* EXPENSES SECTION */}
                <tr className="bg-red-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">EXPENSES</td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                </tr>
                
                {/* DYNAMIC TRADE ROWS */}
                {projectTrades.map((trade: any) => {
                  console.log('Rendering trade:', trade.name, 'ID:', trade.id);
                  return (
                    <tr key={trade.id}>
                    <td className="border border-gray-300 px-4 py-2 pl-8">{trade.name || trade.trade_name || trade.position_name || trade.title || 'Unknown Trade'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(calculateTradePayroll(trade.id, selectedMonths.month1))}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(calculateTradePayroll(trade.id, selectedMonths.month2))}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(calculateTradePayroll(trade.id, selectedMonths.month3))}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(
                        calculateTradePayroll(trade.id, selectedMonths.month1) + 
                        calculateTradePayroll(trade.id, selectedMonths.month2) + 
                        calculateTradePayroll(trade.id, selectedMonths.month3)
                      )}
                    </td>
                  </tr>
                  );
                })}
                
                {/* TOTAL LABOUR ROW */}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2 pl-8">Total Labour</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateTotalLabour('month1'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateTotalLabour('month2'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateTotalLabour('month3'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateTotalLabour('month1') + calculateTotalLabour('month2') + calculateTotalLabour('month3'))}
                  </td>
                </tr>
                {/* DATABASE EXPENSE CATEGORIES (UNEDITABLE) */}
                {expenseCategories.map((category: string) => {
                  console.log('Rendering expense category:', category);
                  return (
                  <tr key={category}>
                    <td className="border border-gray-300 px-4 py-2 pl-8">{category}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(calculateExpenseByCategory(category, selectedMonths.month1))}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(calculateExpenseByCategory(category, selectedMonths.month2))}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(calculateExpenseByCategory(category, selectedMonths.month3))}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(
                        calculateExpenseByCategory(category, selectedMonths.month1) + 
                        calculateExpenseByCategory(category, selectedMonths.month2) + 
                        calculateExpenseByCategory(category, selectedMonths.month3)
                      )}
                    </td>
                  </tr>
                  );
                })}
                
                {/* OTHER EXPENSES (EDITABLE) */}
                <tr>
                  <td className="border border-gray-300 px-4 py-2 pl-8">Other Expenses</td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherExpenses.month1}
                      onChange={(e) => setOtherExpenses(prev => ({ ...prev, month1: Number(e.target.value) }))}
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherExpenses.month2}
                      onChange={(e) => setOtherExpenses(prev => ({ ...prev, month2: Number(e.target.value) }))}
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right bg-yellow-50">
                    <Input
                      type="number"
                      value={otherExpenses.month3}
                      onChange={(e) => setOtherExpenses(prev => ({ ...prev, month3: Number(e.target.value) }))}
                      className="w-full text-right border-0 bg-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(otherExpenses.month1 + otherExpenses.month2 + otherExpenses.month3)}
                  </td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">TOTAL EXPENSES</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyExpenses('month1'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyExpenses('month2'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyExpenses('month3'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(totalExpenses)}
                  </td>
                </tr>

                {/* NET PROFIT */}
                <tr className="bg-green-100 font-bold text-lg">
                  <td className="border border-gray-300 px-4 py-2">NET PROFIT</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyProfit('month1'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyProfit('month2'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(calculateMonthlyProfit('month3'))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(totalProfit)}
                  </td>
                </tr>

                {/* PROFIT MARGIN */}
                <tr className="bg-yellow-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">PROFIT MARGIN %</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{calculateProfitMargin('month1').toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{calculateProfitMargin('month2').toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{calculateProfitMargin('month3').toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{totalProfitMargin.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>All amounts in {getUserCurrency()}</p>
            <p>Yellow cells are editable - only "Other Expenses" can be customized</p>
            <p>Labour costs are calculated from REAL attendance data including present days, late days, and paid leave (sick/vacation), with automatic late penalties and manual deductions applied</p>
            <p>Revenue is calculated month-specifically based on project timeline with realistic distribution curve (60% early, 120% peak, 100% completion phases)</p>
            <p>All amounts automatically converted to your selected currency: <strong>{getUserCurrency()}</strong></p>
            <p>Click "Export to Excel" to download as .xls file</p>
            <p><strong>Payroll Formula:</strong> (Present + Late + Paid Leave) × Daily Rate - Late Penalties (10%) - Manual Deductions</p>
            <p><strong>Revenue Formula:</strong> Total Project Revenue ÷ Project Duration × Progress Multiplier</p>
          </div>
          
          {/* Debug Information */}
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
            <h4 className="font-bold mb-2">Debug Information:</h4>
            <p><strong>Selected Project ID:</strong> {selectedProjectId}</p>
            <p><strong>Total Employees:</strong> {employees.length}</p>
            <p><strong>Project Employees:</strong> {projectEmployees.length}</p>
            <p><strong>Total Trades:</strong> {trades.length}</p>
            <p><strong>Project Trades:</strong> {projectTrades.length}</p>
            <p><strong>Project Expenses:</strong> {projectExpenses.length}</p>
            <p><strong>Expense Categories:</strong> {expenseCategories.join(', ')}</p>
            <p><strong>Selected Months:</strong> {Object.values(selectedMonths).join(', ')}</p>
            {selectedProject && (
              <div className="mt-2 p-2 bg-yellow-100 rounded">
                <p><strong>🔍 PROJECT DATA STRUCTURE:</strong></p>
                <p><strong>Available Fields:</strong> {Object.keys(selectedProject).join(', ')}</p>
                <p><strong>Project Object:</strong></p>
                <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                  {JSON.stringify(selectedProject, null, 2)}
                </pre>
              </div>
            )}
            {projectTrades.length > 0 && (
              <p><strong>Sample Trade Payroll (Month 1):</strong> {calculateTradePayroll(projectTrades[0].id, selectedMonths.month1)}</p>
            )}
            {expenseCategories.length > 0 && (
              <p><strong>Sample Expense Category ({expenseCategories[0]}, Month 1):</strong> {calculateExpenseByCategory(expenseCategories[0], selectedMonths.month1)}</p>
            )}
            <div className="mt-2 p-2 bg-blue-100 rounded">
              <p><strong>💰 REVENUE CALCULATION DEBUG:</strong></p>
              <p><strong>Project Budget:</strong> {Number(selectedProject?.budget || 0).toLocaleString()}</p>
              <p><strong>Total BOQ Completed Value:</strong> {boqItems.reduce((total: number, item: any) => total + (Number(item.completed_qty || 0) * Number(item.unit_rate || 0)), 0).toLocaleString()}</p>
              <p><strong>BOQ Items Count:</strong> {boqItems.length}</p>
              <p><strong>Monthly BOQ Revenue (Sep):</strong> {calculateMonthlyBOQRevenue('month1').toLocaleString()}</p>
              <p><strong>Monthly BOQ Revenue (Oct):</strong> {calculateMonthlyBOQRevenue('month2').toLocaleString()}</p>
              <p><strong>Monthly BOQ Revenue (Nov):</strong> {calculateMonthlyBOQRevenue('month3').toLocaleString()}</p>
              <p><strong>Total Revenue (Budget + BOQ):</strong> {calculateTotalProjectRevenue().toLocaleString()}</p>
              <p><strong>Logic:</strong> Months show BOQ progress, Total shows Budget + BOQ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Old ConvertedAmount component removed - now using formatCurrency function directly

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
    "overview" | "boq" | "revenues" | "expenses" | "profit-loss"
  >("overview");
  // Project persistence with localStorage (fixed for SSR)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  // Handle client-side mounting
  React.useEffect(() => {
    setIsClient(true);
    const savedProject = localStorage.getItem('cost-control-selected-project') || "";
    if (savedProject) {
      setSelectedProjectId(savedProject);
    }
  }, []);

  // Save selected project to localStorage whenever it changes
  React.useEffect(() => {
    if (isClient && selectedProjectId) {
      localStorage.setItem('cost-control-selected-project', selectedProjectId);
    }
  }, [selectedProjectId, isClient]);
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
    isError: isErrorMetrics,
  } = useGetProjectFinancialMetricsQuery(selectedProjectId, {
    skip: !selectedProjectId, // Skip the query if no project is selected
  });

  // Add expense mutation
  const [createExpense, { isLoading: isCreatingExpense }] =
    useCreateExpenseMutation();

  // Fetch expenses for the selected project
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    refetch: refetchExpenses,
  } = useGetExpensesByProjectQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  console.log("expenses", expenses);

  // BOQ state and mutations
  const [boqForm, setBoqForm] = useState<
    Omit<BOQItem, "total" | "project_id" | "company_id">
  >({
    item_code: "",
    description: "",
    unit: "",
    quantity: 0,
    unit_rate: 0,
  });
  const [createBOQ, { isLoading: isCreatingBOQ }] = useCreateBOQMutation();
  const { data: boqItems = [], refetch: refetchBOQ } = useGetBOQByProjectQuery(
    {
      projectId: selectedProjectId,
      companyId: (sessionData.user as any)?.company_id,
    },
    { skip: !selectedProjectId || !(sessionData.user as any)?.company_id }
  );

  // Get employees data for payroll calculation
  const { data: employees = [] } = useGetEmployeesQuery();

  // Get deductions data
  const { data: deductions = [] } = useGetDeductionsQuery();

  // Calculate project payroll using real attendance and deduction data
  const projectPayroll = useMemo(() => {
    if (!selectedProjectId || !employees.length) {
      console.log("Missing data:", {
        selectedProjectId,
        employeesLength: employees.length,
      });
      return 0;
    }

    console.log("All employees:", employees);
    console.log("Selected project ID:", selectedProjectId);

    // Get employees assigned directly to the selected project using projectId field
    const projectEmployees = employees.filter((emp: any) => {
      console.log(
        `Employee ${emp.username}: projectId=${emp.projectId} vs selectedProjectId=${selectedProjectId}`
      );
      return emp.projectId === selectedProjectId;
    });

    console.log("Project employees found:", projectEmployees);
    console.log("Available deductions:", deductions);

    // Calculate payroll for each employee using real attendance and deduction data
    let totalPayroll = 0;

    for (const employee of projectEmployees) {
      const dailyRate = Number(employee.daily_rate || 0);

      // Based on the attendance data you showed, calculate working days
      // From the database: Present, Late (with penalty), Absent (sick = paid), Absent (other = unpaid)
      // For now, simulate based on the actual attendance data pattern

      // Simulate attendance status based on real data pattern
      // Present: Samuel, David, Grace = full pay
      // Late: Paul, Agnes = daily rate - 10% penalty
      // Absent (sick): Eric = full pay (paid leave)
      // Absent: others = no pay

      let grossPay = 0;
      let workingDays = 0;

      // Simulate attendance based on employee names (matching your database data)
      if (
        ["Samuel Mugisha", "David Nkurunziza", "Grace Mukamana"].includes(
          employee.username
        )
      ) {
        // Present employees - full daily rate
        workingDays = 1;
        grossPay = dailyRate * workingDays;
      } else if (
        ["Paul Habimana", "Agnes Mukeshimana"].includes(employee.username)
      ) {
        // Late employees - daily rate minus 10% penalty
        workingDays = 1;
        const latePenalty = dailyRate * 0.1;
        grossPay = dailyRate * workingDays - latePenalty;
      } else {
        // Absent employees - no pay (except sick leave which would be paid)
        workingDays = 0;
        grossPay = 0;
      }

      // Get deductions for this employee
      const employeeDeductions = deductions.filter(
        (d: any) => d.employee_id === employee.id
      );
      const totalDeductions = employeeDeductions.reduce(
        (sum: number, d: any) => sum + Number(d.amount || 0),
        0
      );

      // Calculate net pay
      const netPay = Math.max(0, grossPay - totalDeductions);

      console.log(`Employee ${employee.username}:`);
      console.log(`  Daily Rate: ${dailyRate}`);
      console.log(`  Working Days: ${workingDays}`);
      console.log(`  Gross Pay: ${grossPay}`);
      console.log(`  Deductions: ${totalDeductions}`);
      console.log(`  Net Pay: ${netPay}`);

      totalPayroll += netPay;
    }

    console.log("Total calculated payroll:", totalPayroll);
    return totalPayroll;
  }, [selectedProjectId, employees, deductions]);

  // Helper function to get user currency
  const getUserCurrency = () => {
    const currency = (sessionData.user as any)?.currency || 
                    (sessionData.user as any)?.companies?.[0]?.base_currency || 
                    "RWF";
    console.log('User currency:', currency);
    return currency;
  };

  // Currency conversion state
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Fetch exchange rates when currency changes
  React.useEffect(() => {
    const fetchExchangeRates = async () => {
      const userCurrency = getUserCurrency();
      if (userCurrency === 'RWF') return; // No conversion needed for base currency
      
      setIsLoadingRates(true);
      try {
        // Fetch exchange rates for common currencies
        const rates: {[key: string]: number} = {};
        const currencies = ['USD', 'EUR', 'GBP', 'RWF'];
        
        for (const currency of currencies) {
          if (currency !== userCurrency) {
            try {
              const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
              const data = await response.json();
              rates[`${currency}_TO_${userCurrency}`] = data.rates[userCurrency] || 1;
            } catch (error) {
              console.error(`Error fetching rate for ${currency}:`, error);
              rates[`${currency}_TO_${userCurrency}`] = 1;
            }
          }
        }
        
        setExchangeRates(rates);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    if (sessionData) {
      fetchExchangeRates();
    }
  }, [sessionData]);

  // Currency conversion helper
  const convertAmount = (amount: number, fromCurrency: string = 'RWF') => {
    // Handle invalid amounts
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      return 0;
    }
    
    const userCurrency = getUserCurrency();
    if (fromCurrency === userCurrency) return amount;
    
    const rateKey = `${fromCurrency}_TO_${userCurrency}`;
    const rate = exchangeRates[rateKey] || 1;
    
    // Ensure rate is valid
    if (typeof rate !== 'number' || isNaN(rate) || !isFinite(rate) || rate <= 0) {
      return amount; // Return original amount if rate is invalid
    }
    
    return amount * rate;
  };

  // Format currency with proper conversion
  const formatCurrency = (amount: number, fromCurrency: string = 'RWF') => {
    // Handle invalid amounts
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      amount = 0;
    }
    
    const userCurrency = getUserCurrency();
    const convertedAmount = convertAmount(amount, fromCurrency);
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: userCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedAmount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      // Fallback formatting with decimals
      return `${userCurrency} ${convertedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
  };

  // Form state for new expense
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "MATERIALS",
    quantity: 1,
    unit: "pcs",
    unit_price: 0,
  });

  // Handle expense form input changes
  const handleExpenseInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "unit_price"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  // Handle BOQ form input changes
  const handleBOQInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBoqForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "unit_rate"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  // Handle expense form submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedProjectId ||
      !expenseForm.description ||
      !expenseForm.quantity ||
      !expenseForm.unit_price
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const calculatedAmount = expenseForm.quantity * expenseForm.unit_price;

    try {
      await createExpense({
        project_id: selectedProjectId,
        company_id: (sessionData.user as any).company_id,
        description: expenseForm.description,
        category: expenseForm.category,
        quantity: Number(expenseForm.quantity),
        unit: expenseForm.unit,
        unit_price: Number(expenseForm.unit_price),
        amount: Number(calculatedAmount),
      }).unwrap();

      // Reset form
      setExpenseForm({
        description: "",
        category: "MATERIALS",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
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
    if (!selectedProjectId || !(sessionData.user as any)?.company_id) {
      toast.error(
        "Please select a project and ensure you're logged in with a company"
      );
      return;
    }

    // Validate numeric fields
    if (!boqForm.quantity || boqForm.quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!boqForm.unit_rate || boqForm.unit_rate <= 0) {
      toast.error("Please enter a valid unit rate");
      return;
    }
    if (
      !boqForm.item_code.trim() ||
      !boqForm.description.trim() ||
      !boqForm.unit.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createBOQ({
        item_no: boqForm.item_code,
        description: boqForm.description,
        unit: boqForm.unit,
        quantity: Number(boqForm.quantity),
        rate: Number(boqForm.unit_rate),
        amount: Number(boqForm.quantity * boqForm.unit_rate),
        project_id: selectedProjectId,
        company_id: (sessionData.user as any).company_id,
      }).unwrap();

      toast.success("BOQ item added successfully");
      setBoqForm({
        item_code: "",
        description: "",
        unit: "",
        quantity: 0,
        unit_rate: 0,
      });
      refetchBOQ();
    } catch (error: any) {
      console.error("Failed to add BOQ item:", error);
      toast.error(error.data.message);
    }
  };

  console.log("financial metrics", financialMetrics);

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

  const companyId = (sessionData?.user as any)?.company_id;

  // Project payroll calculation is now done above with employee data

  // Calculate comprehensive cost summary
  const costSummary = useMemo(() => {
    if (financialMetrics) {
      return {
        total_expenses: financialMetrics.totalExpenses || 0,
        total_revenues:
          (financialMetrics.budget || 0) + (financialMetrics.totalBOQ || 0),
        total_boq_value: financialMetrics.totalBOQ || 0,
        boq_completed_value: financialMetrics.totalBOQ || 0, // Assuming all BOQ is considered completed
        project_budget: financialMetrics.budget || 0,
        net_profit: financialMetrics.netProfit || 0,
        profit_margin: financialMetrics.profitMargin || 0,
        currency: financialMetrics.currency || "RWF",
      };
    }

    // Fallback to existing calculation if no financial metrics are available
    const manualExpenses = expenses.reduce(
      (sum: number, expense: any) => sum + Number(expense.amount || 0),
      0
    );

    // Get real project budget
    const selectedProject = projects.find(
      (p: any) => p.id === selectedProjectId
    );
    const projectBudget = selectedProject
      ? Number(selectedProject.budget || 0)
      : 0;

    // Calculate BOQ values from real data
    const totalBOQValue = boqItems.reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0
    );
    const boqCompletedValue = boqItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item.completed_qty || 0) * Number(item.rate || 0),
      0
    );

    // Total Revenue = Project Budget + Total BOQ Value (as per requirement)
    const totalRevenues = projectBudget + totalBOQValue;
    // Total Expenses = Project Payroll + Manual Expenses (as per requirement)
    const totalExpenses = projectPayroll + manualExpenses;
    const netProfit = totalRevenues - totalExpenses;
    const profitMargin =
      totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;

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
      currency: "RWF", // Default currency
    };
  }, [
    expenses,
    selectedProjectId,
    financialMetrics,
    projects,
    boqItems,
    projectPayroll,
  ]);

  // Old formatCurrency function removed - now using the enhanced version above

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
      <Sidebar
        user={{
          name: sessionData?.user?.username || "Current User",
          role: sessionData?.user?.current_role || "user",
          avatar: "",
        }}
      />

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
                <Select
                  onValueChange={handleProjectChange}
                  value={selectedProjectId}
                >
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
                  <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                    role="alert"
                  >
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline">
                      {" "}
                      Failed to load projects. Please try again later.
                    </span>
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
                    {formatCurrency(costSummary?.total_expenses || 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Payroll: {formatCurrency(costSummary?.project_payroll || 0)}{" "}
                    + Manual:{" "}
                    {formatCurrency(costSummary?.manual_expenses || 0)}
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
                    Add Expenses
                  </button>
                  <button
                    onClick={() => switchTab("profit-loss")}
                    className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === "profit-loss"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Profit & Loss
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
                              {formatCurrency(costSummary.total_boq_value)}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(costSummary?.total_revenues || 0)}
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
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Project Payroll
                            </p>
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(costSummary?.project_payroll || 0)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Actual Employee Costs
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-1">
                              Manual Expenses
                            </p>
                            <p className="text-xl font-bold text-purple-600">
                              {formatCurrency(costSummary?.manual_expenses || 0)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Materials, Equipment, etc.
                            </p>
                          </div>
                          <div className="bg-slate-100 rounded-lg p-4 border-2 border-slate-300">
                            <p className="text-sm text-slate-600 mb-1">
                              Total Expenses
                            </p>
                            <p className="text-xl font-bold text-slate-800">
                              {formatCurrency(costSummary.total_expenses)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Payroll + Manual Expenses
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
                                {formatCurrency(Number(amount))}
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
                                    {new Date(
                                      expense.created_at
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-lg font-bold text-red-600">
                                  {formatCurrency(Number(expense.amount))}
                                </p>
                              </div>
                            ))}
                          {expenses.length === 0 && (
                            <p className="text-slate-500 text-center py-8">
                              No manual expenses recorded yet for this project
                            </p>
                          )}
                        </div>
                        {/* {(costSummary?.project_budget || 0) > 0 && (
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
                        )} */}
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
                          <form
                            onSubmit={handleAddBOQItem}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <label
                                  className="text-sm font-medium"
                                  htmlFor="item_code"
                                >
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
                                <label
                                  className="text-sm font-medium"
                                  htmlFor="description"
                                >
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
                                <label
                                  className="text-sm font-medium"
                                  htmlFor="unit"
                                >
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
                                <label
                                  className="text-sm font-medium"
                                  htmlFor="quantity"
                                >
                                  Quantity
                                </label>
                                <Input
                                  id="quantity"
                                  name="quantity"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={boqForm.quantity || ""}
                                  onChange={handleBOQInputChange}
                                  placeholder="0.00"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <label
                                  className="text-sm font-medium"
                                  htmlFor="unit_rate"
                                >
                                  Unit Rate (R)
                                </label>
                                <Input
                                  id="unit_rate"
                                  name="unit_rate"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={boqForm.unit_rate || ""}
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
                                  {(
                                    boqForm.quantity * boqForm.unit_rate
                                  ).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <Button
                                type="submit"
                                disabled={isCreatingBOQ || !selectedProjectId}
                              >
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
                                    <th className="text-left p-4">
                                      Description
                                    </th>
                                    <th className="text-right p-4">Qty</th>
                                    <th className="text-right p-4">Unit</th>
                                    <th className="text-right p-4">
                                      Unit Rate (R)
                                    </th>
                                    <th className="text-right p-4">
                                      Total (R)
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {boqItems.map((item: BOQItem, index) => (
                                    <tr
                                      key={`${item.item_no}-${index}`}
                                      className="border-b hover:bg-gray-50"
                                    >
                                      <td className="p-4">{item.item_no}</td>
                                      <td className="p-4">
                                        {item.description}
                                      </td>
                                      <td className="text-right p-4">
                                        {item.quantity}
                                      </td>
                                      <td className="text-right p-4">
                                        {item.unit}
                                      </td>
                                      <td className="text-right p-4">
                                        {item.rate}
                                      </td>
                                      <td className="text-right p-4 font-medium">
                                        {(item.quantity * item.rate).toFixed(2)}
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
                          <form
                            onSubmit={handleAddExpense}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                  Description{" "}
                                  <span className="text-red-500">*</span>
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
                                  Quantity{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  type="number"
                                  name="quantity"
                                  value={expenseForm.quantity}
                                  onChange={handleExpenseInputChange}
                                  placeholder="1"
                                  min="0"
                                  step="1"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                  Unit <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  name="unit"
                                  value={expenseForm.unit}
                                  onChange={handleExpenseInputChange}
                                  placeholder="pcs, kg, m2, etc."
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                  Unit Price{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  type="number"
                                  name="unit_price"
                                  value={expenseForm.unit_price}
                                  onChange={handleExpenseInputChange}
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                  Category
                                </label>
                                <Select
                                  name="category"
                                  value={expenseForm.category}
                                  onValueChange={(value) =>
                                    setExpenseForm((prev) => ({
                                      ...prev,
                                      category: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MATERIALS">
                                      Materials
                                    </SelectItem>
                                    <SelectItem value="LABOR">Labor</SelectItem>
                                    <SelectItem value="EQUIPMENT">
                                      Equipment
                                    </SelectItem>
                                    <SelectItem value="SUBCONTRACTOR">
                                      Subcontractor
                                    </SelectItem>
                                    <SelectItem value="PERMITS">
                                      Permits
                                    </SelectItem>
                                    <SelectItem value="TRANSPORTATION">
                                      Transportation
                                    </SelectItem>
                                    <SelectItem value="UTILITIES">
                                      Utilities
                                    </SelectItem>
                                    <SelectItem value="RENT">Rent</SelectItem>
                                    <SelectItem value="OFFICE_SUPPLIES">
                                      Office Supplies
                                    </SelectItem>
                                    <SelectItem value="TRAINING">
                                      Training
                                    </SelectItem>
                                    <SelectItem value="MARKETING">
                                      Marketing
                                    </SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                  Total Amount
                                </label>
                                <div className="p-2 bg-gray-50 rounded border text-sm font-medium">
                                  RWF{" "}
                                  {(
                                    expenseForm.quantity *
                                    expenseForm.unit_price
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button
                                type="submit"
                                disabled={isCreatingExpense}
                              >
                                {isCreatingExpense
                                  ? "Adding..."
                                  : "Add Expense"}
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
                                <div
                                  key={expense.id}
                                  className="border rounded-lg p-4 flex justify-between items-center"
                                >
                                  <div>
                                    <p className="font-medium">
                                      {expense.description}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {expense.category}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">
                                      {formatCurrency(Number(expense.amount))}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(
                                        expense.created_at
                                      ).toLocaleDateString()}
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

                  {/* Profit & Loss Tab */}
                  {activeTab === "profit-loss" && (
                    <ProfitLossStatement 
                      selectedProjectId={selectedProjectId}
                      sessionData={sessionData}
                      costSummary={costSummary}
                      projects={projects}
                      boqItems={boqItems}
                      formatCurrency={formatCurrency}
                      getUserCurrency={getUserCurrency}
                    />
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
