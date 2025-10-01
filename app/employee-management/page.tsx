"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { parse } from "papaparse";
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
  RefreshCw,
  ChevronUp,
  ChevronDown,
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
import { useSessionQuery } from "@/lib/redux/authSlice";
import { useGetTradesQuery } from "@/lib/redux/tradePositionSlice";
import { convertCurrency, getExchangeRate } from "@/lib/utils";

export interface NewEmployee {
  username: string;
  trade_position_id?: string;
  daily_rate?: string;
  monthly_rate?: string;
  contract_finish_date?: string;
  days_projection?: number;
  budget_baseline?: string;
  company_id?: string;
}

// Sample data for projects
const projects = ["Metro Bridge", "Mall Construction"];
function ConvertedAmount({ 
  amount, 
  currency, 
  showCurrency = true,
  sessionData
}: { 
  amount: number; 
  currency: string; 
  showCurrency?: boolean;
  sessionData: any;
}) {
  const [convertedAmount, setConvertedAmount] = useState<string>('...');

  useEffect(() => {
    const convert = async () => {
      try {
        const result = await convertCurrency(amount, currency, sessionData.user.companies[0].base_currency);
        setConvertedAmount(result);
      } catch (error) {
        console.error('Error converting currency:', error);
        setConvertedAmount('Error');
      }
    };

    if (amount !== undefined) {
      convert();
    }
  }, [amount, currency]);
console.log("convertedAmount", convertedAmount)
  return <>{showCurrency ? `${currency} ${Number(convertedAmount).toLocaleString()}` : Number(convertedAmount).toLocaleString()}</>;
}
export default function EmployeeManagement() {
  const [csvUploadModal, setCsvUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParseError, setCsvParseError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const { toast } = useToast();

  // Better RTK Query configuration for real-time data
  const {
    data: sessionData = { user: {} },
    isLoading: isSessionLoading,
    isError: isSessionError,
    refetch: sessionRefetch,
  } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: false,
  });
  console.log("sessionData",sessionData)
  console.log("settings",sessionData?.user?.settings)
  useEffect(() => {
    if (sessionData?.user?.settings && sessionData.user.current_role) {
      const userPermission = sessionData.user.settings.find(
        (setting: any) =>
          setting.company_id === sessionData.user.company_id
      && setting.role === sessionData.user.current_role
      );

      if (userPermission) {
        setPermissions(userPermission);
      }
    }
  }, [sessionData.user.settings, sessionData.user.current_role]);
  console.log("permissions", permissions);
  console.log("sessionData", sessionData);
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

  // Improved trades fetch with proper error handling
  const {
    data: tradesFetched = [],
    isLoading: isTradesLoading,
    isError: isTradesError,
    refetch: refetchTrades,
  } = useGetTradesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // State for companies data
  const [companies, setCompanies] = useState([]);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  // State for modals
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [filters, setFilters] = useState({
    trade: "",
    project: "",
    dailyRate: "",
    search: "",
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  // Enhanced employees fetch with better caching strategy and error handling
  const {
    data: employees = [],
    isLoading: isEmployeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
    isFetching: isEmployeesFetching,
  } = useGetEmployeesQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds for more real-time data
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    // Skip fetch if session isn't loaded yet to prevent unnecessary requests
    skip: isSessionLoading,
  });

  // Function to map trade names to trade_position_id from DB
  async function mapTradeToPositionId(
    tradeName: string,
    dbTrades: any[]
  ): Promise<string | null> {
    const lower = tradeName.toLowerCase().trim();

    if (!lower) return null;

    // 1. Exact match (case insensitive)
    let match = dbTrades.find(
      (t) => t.trade_name?.toLowerCase().trim() === lower
    );
    if (match) return match.id;

    // 2. Singular/plural variations and common typos
    const commonVariations: { [key: string]: string[] } = {
      porter: ["porters", "port", "ports"],
      carpenter: ["carpenters", "carpentry", "carpenterwork"],
      electrician: ["electricians", "electrical", "electric"],
      plumber: ["plumbers", "plumbing", "plumb"],
      mason: ["masons", "masonry", "bricklayer"],
      painter: ["painters", "painting", "paint"],
      welder: ["welders", "welding", "weld"],
    };

    // Check if input matches any common variations
    for (const [baseTrade, variations] of Object.entries(commonVariations)) {
      if (variations.includes(lower) || lower === baseTrade) {
        match = dbTrades.find(
          (t) => t.trade_name?.toLowerCase().trim() === baseTrade
        );
        if (match) return match.id;
      }
    }

    // 3. Contains match (input contains trade name or trade name contains input)
    match = dbTrades.find((t) => {
      const dbTradeLower = t.trade_name?.toLowerCase().trim() || "";
      return lower.includes(dbTradeLower) || dbTradeLower.includes(lower);
    });
    if (match) return match.id;

    // 4. Levenshtein distance for similar names (fuzzy match)
    // Simple implementation - check for similar starting characters
    match = dbTrades.find((t) => {
      const dbTradeLower = t.trade_name?.toLowerCase().trim() || "";
      return (
        dbTradeLower.startsWith(lower.substring(0, 3)) ||
        lower.startsWith(dbTradeLower.substring(0, 3))
      );
    });
    if (match) return match.id;

    // 5. Special case: "Porter" vs "Porters"
    if (lower === "porter" || lower === "porters") {
      match = dbTrades.find((t) => {
        const dbTradeLower = t.trade_name?.toLowerCase().trim() || "";
        return dbTradeLower === "porter" || dbTradeLower === "porters";
      });
      if (match) return match.id;
    }

    console.warn(`No trade match found for: "${tradeName}"`);
    return null;
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setIsUploading(true);
    setCsvParseError(null);

    // helper: parse dd/MM/yyyy → ISO
    function parseDate(dateStr: string): string {
      if (!dateStr) return new Date().toISOString();
      const [day, month, year] = dateStr.split("/");
      return new Date(`${year}-${month}-${day}`).toISOString();
    }

    try {
      // Use FileReader for more reliable file reading
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(csvFile);
      });

      const results = parse(text, { header: true, skipEmptyLines: true });

      if (results.errors.length > 0) {
        throw new Error(results.errors[0].message || "CSV parsing error");
      }

      // Updated required headers - changed "trade" to "trade_position_id"
      const requiredHeaders = [
        "username",
        "trade", // Fixed from "trade"
        "daily_rate",
        "contract_start_date",
        "contract_finish_date",
        "days_projection",
        "budget_baseline",
      ];

      const missingHeaders = requiredHeaders.filter(
        (h) => !results.meta.fields?.includes(h)
      );
      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing required columns: ${missingHeaders.join(", ")}`
        );
      }

      const dbTrades = tradesFetched;
      if (!dbTrades || dbTrades.length === 0) {
        if (isTradesLoading) {
          throw new Error("Trades are still loading. Please wait a moment.");
        }
        throw new Error(
          "No trade positions available. Please check your trades configuration."
        );
      }

      console.log(
        "Available trades:",
        dbTrades.map((t) => t.trade_name)
      );

      const employeesToAdd = await Promise.all(
        results.data.map(async (row: any, index: number) => {
          // Use trade_position_id instead of trade
          const tradeId = await mapTradeToPositionId(row.trade, dbTrades);

          if (!tradeId) {
            console.warn(
              `Row ${index + 1}: Could not find trade position for "${
                row.trade_position_id
              }"`
            );
            return null;
          }

          const dailyRate = parseFloat(row.daily_rate) || 0;
          const monthlyRate = dailyRate * 30;
          const daysProjection = parseInt(row.days_projection) || 0;
          const budgetBaseline = parseFloat(row.budget_baseline) || 0;

          const contractFinishDate = parseDate(row.contract_finish_date);
          const contractStartDate = parseDate(row.contract_start_date);

          return {
            username: row.username,
            trade_position_id: tradeId,
            daily_rate: dailyRate.toString(), // as string
            monthly_rate: monthlyRate.toString(), // as string
            contract_finish_date: contractFinishDate,
            contract_start_date: contractStartDate,
            days_projection: daysProjection,
            budget_baseline: budgetBaseline.toString(),
            company_id: sessionData.user.company_id, // assign from logged-in user instead of CSV
            created_date: new Date(), // real Date object
          };
        })
      );

      const validEmployees = employeesToAdd.filter(
        (emp) => emp?.trade_position_id
      );
      const invalidEmployees = employeesToAdd.filter(
        (emp) => !emp?.trade_position_id
      );

      if (invalidEmployees.length > 0) {
        console.warn(
          `${invalidEmployees.length} employees had invalid trade positions`
        );
      }

      const addedEmployees = [];
      for (const employee of validEmployees) {
        try {
          const result = await addEmployee(employee).unwrap();
          addedEmployees.push(result);
        } catch (error) {
          console.error(
            `Error adding employee ${employee.username}:`,
            JSON.stringify(error, null, 2)
          );
          if (
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as any).data === "object" &&
            (error as any).data !== null &&
            "message" in (error as any).data
          ) {
            console.error("Validation errors:", (error as any).data.message);
          }
        }
      }

      if (addedEmployees.length > 0) {
        toast({
          title: "Success",
          description: `${addedEmployees.length} employees added successfully!`,
        });
      }
      refreshAllData();

      if (invalidEmployees.length > 0) {
        toast({
          title: "Partial Success",
          description: `Added ${addedEmployees.length} employees. ${invalidEmployees.length} skipped due to invalid trade positions.`,
        });
      }

      if (addedEmployees.length === 0 && invalidEmployees.length > 0) {
        throw new Error(
          `No employees added. All ${invalidEmployees.length} employees had invalid trade positions.`
        );
      }

      setCsvUploadModal(false);
      setCsvFile(null);
      refetchEmployees();
    } catch (error: any) {
      console.error("CSV upload error:", error);
      setCsvParseError(error.message || "Failed to parse CSV file");
      toast({
        title: "Error",
        description: error.message || "Failed to upload employees from CSV",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      refreshAllData();
    }
  };

  // Improved mutations with better optimistic updates
  const [addEmployee, { isLoading: isAdding }] = useAddEmployeeMutation({
    onQueryStarted: async (newEmployeeData, { dispatch, queryFulfilled }) => {
      // Optimistic update - add temporary employee to the list with a realistic ID
      const tempId = `temp-${Date.now()}`;
      const patchResult = dispatch(
        employeeSlice.util.updateQueryData(
          "getEmployees",
          undefined,
          (draft) => {
            draft.push({
              id: tempId,
              username: newEmployeeData.username,
              trade_position_id: newEmployeeData.trade_position_id,
              trade_position: {
                trade_name:
                  tradesFetched.find(
                    (t: any) => t.id === newEmployeeData.trade_position_id
                  )?.trade_name || "Loading...",
              },
              daily_rate: newEmployeeData.daily_rate || "0",
              monthly_rate: newEmployeeData.monthly_rate || "0",
              contract_finish_date: newEmployeeData.contract_finish_date || "",
              days_projection: newEmployeeData.days_projection || 0,
              budget_baseline: newEmployeeData.budget_baseline || "0",
              company_id: newEmployeeData.company_id,
              company: {
                company_name:
                  companies.find(
                    (c: any) => c.id === newEmployeeData.company_id
                  )?.company_name || "Loading...",
              },
              _isOptimistic: true, // Flag to mark this is an optimistic entry
            });
          }
        )
      );

      try {
        const result = await queryFulfilled;
        // Success - update the optimistic entry with the real data
        dispatch(
          employeeSlice.util.updateQueryData(
            "getEmployees",
            undefined,
            (draft) => {
              const index = draft.findIndex((item) => item.id === tempId);
              if (index !== -1) {
                draft[index] = result.data;
              }
            }
          )
        );
      } catch (error) {
        // If the mutation fails, undo the optimistic update
        patchResult.undo();
        toast({
          title: "Error",
          description: "Failed to add employee. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Enhanced update mutation with optimistic update
  const [updateEmployee, { isLoading: isUpdating }] = useEditEmployeeMutation({
    onQueryStarted: async (
      updatedEmployeeData,
      { dispatch, queryFulfilled }
    ) => {
      // Optimistic update
      const patchResult = dispatch(
        employeeSlice.util.updateQueryData(
          "getEmployees",
          undefined,
          (draft) => {
            const index = draft.findIndex(
              (e) => e.id === updatedEmployeeData.id
            );
            if (index !== -1) {
              // Save the original data for rollback if needed
              const originalData = { ...draft[index] };

              // Update with new data
              draft[index] = {
                ...draft[index],
                ...updatedEmployeeData,
                trade_position: {
                  trade_name:
                    tradesFetched.find(
                      (t: any) => t.id === updatedEmployeeData.trade_position_id
                    )?.trade_name || draft[index].trade_position?.trade_name,
                },
                company: {
                  company_name:
                    companies.find(
                      (c: any) => c.id === updatedEmployeeData.company_id
                    )?.company_name || draft[index].company?.company_name,
                },
                _isUpdating: true, // Flag for UI feedback
              };
            }
          }
        )
      );

      try {
        await queryFulfilled;
        // Update successful - clean up the flag
        dispatch(
          employeeSlice.util.updateQueryData(
            "getEmployees",
            undefined,
            (draft) => {
              const index = draft.findIndex(
                (e) => e.id === updatedEmployeeData.id
              );
              if (index !== -1 && draft[index]._isUpdating) {
                const { _isUpdating, ...rest } = draft[index];
                draft[index] = rest;
              }
            }
          )
        );
        refreshAllData();
      } catch (error) {
        // Update failed - undo changes
        patchResult.undo();
        toast({
          title: "Error",
          description: "Failed to update employee. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Enhanced delete mutation with optimistic update
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation(
    {
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        // Save the employee data for possible rollback
        let employeeToDelete;
        const patchResult = dispatch(
          employeeSlice.util.updateQueryData(
            "getEmployees",
            undefined,
            (draft) => {
              const index = draft.findIndex((e) => e.id === id);
              if (index !== -1) {
                employeeToDelete = { ...draft[index] };
                draft.splice(index, 1);
              }
            }
          )
        );
        refreshAllData();

        try {
          await queryFulfilled;
          // Successful delete - no need to do anything else
        } catch (error) {
          // Delete failed - restore the employee
          patchResult.undo();
          toast({
            title: "Error",
            description: "Failed to delete employee. Please try again.",
            variant: "destructive",
          });
        }
      },
    }
  );

  // Helper function to determine if we're using monthly rate
  const isMonthlyRate = sessionData.user?.salary_calculation === "monthly rate";

  // Helper function to get the appropriate rate field name
  const getRateFieldName = () =>
    isMonthlyRate ? "monthly_rate" : "daily_rate";

  const [newEmployee, setNewEmployee] = useState({
    username: "",
    trade_position_id: "",
    daily_rate: "",
    monthly_rate: "",
    contract_start_date: "",
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
    daily_rate: 0,
    monthly_rate: 0,
    contract_finish_date: "",
    days_projection: "",
    budget_baseline: 0,
    company_id: "",
  });

  // Improved companies fetch with automatic refreshing
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const response = await fetch(
          "https://dse-backend-uv5d.onrender.com/company/companies"
        );
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

    fetchCompanies();

    // Set up a refresh interval - every 2 minutes
    const companiesInterval = setInterval(fetchCompanies, 2 * 60 * 1000);

    // Clean up function to clear the interval on component unmount
    return () => clearInterval(companiesInterval);
  }, []);

  // User data state
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
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
    if (!amount) return `${currencyShort}0.00`;
    return `${currencyShort}${Number.parseFloat(amount).toLocaleString()}`;
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

  const sortedEmployees = sortOrder
    ? [...filteredEmployees].sort((a, b) => {
        if (sortOrder === "asc") {
          return a.username.localeCompare(b.username);
        }
        return b.username.localeCompare(b.username);
      })
    : filteredEmployees;

  // Handle edit employee
  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setEditedEmployee({
      id: employee.id,
      username: employee.username,
      trade_position_id: employee.trade_position_id,
      daily_rate: employee.daily_rate ,
      monthly_rate: employee.monthly_rate ,
      contract_finish_date: formatDateForInput(employee.contract_finish_date),
      days_projection: employee.days_projection?.toString() || "",
      budget_baseline: employee.budget_baseline,
      company_id: employee.company_id,
    });
    setShowEditEmployee(true);
  };

  // Handle delete employee
  const handleDeleteEmployee = (employee: any) => {
    setSelectedIds([employee.id]);
    setShowDeleteConfirm(true);
  };

  const toggleSort = () => {
    setSortOrder((prev) =>
      prev === null ? "asc" : prev === "asc" ? "desc" : null
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredEmployees.map((e: any) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected =
    selectedIds.length === filteredEmployees.length &&
    filteredEmployees.length > 0;

  const selectedEmployees = filteredEmployees.filter((e: any) =>
    selectedIds.includes(e.id)
  );

  // Handle form submission for adding new employee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Validation ---
    if (!newEmployee.username) {
      toast({
        title: "Validation Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }
    if (!newEmployee.trade_position_id) {
      toast({
        title: "Validation Error",
        description: "Please select a trade position",
        variant: "destructive",
      });
      return;
    }

    // --- Dates ---
    const startDate = newEmployee.contract_start_date
      ? new Date(newEmployee.contract_start_date).toISOString()
      : new Date().toISOString(); // default to today

    const finishDate = newEmployee.contract_finish_date
      ? new Date(newEmployee.contract_finish_date).toISOString()
      : undefined;

    // --- Days projection ---
    let daysProjection = newEmployee.days_projection
      ? parseInt(newEmployee.days_projection.toString())
      : undefined;

    if (!daysProjection && startDate && finishDate) {
      const start = new Date(startDate);
      const finish = new Date(finishDate);
      daysProjection = Math.max(
        0,
        Math.ceil((finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
    }
      let exchangeRate = await getExchangeRate(sessionData.user.currency,sessionData.user.companies?.[0]?.base_currency);

    // --- Build employee object ---
    const employeeToAdd: NewEmployee = {
      username: newEmployee.username,
      trade_position_id: newEmployee.trade_position_id,
      [getRateFieldName()]:
        Number(newEmployee[getRateFieldName()]) > 0
          ? (Number(newEmployee[getRateFieldName()]) * exchangeRate).toString()
          : undefined,
      contract_start_date: startDate,
      contract_finish_date: finishDate,
      days_projection: daysProjection,
      budget_baseline:
        Number(newEmployee.budget_baseline) > 0
          ? (Number(newEmployee.budget_baseline) * exchangeRate).toString()
          : undefined,
      company_id: newEmployee.company_id || sessionData.user.company_id,
    };

    try {
      // --- Send to backend ---
      await addEmployee(employeeToAdd).unwrap();

      // --- Reset form ---
      setNewEmployee({
        username: "",
        trade_position_id: "",
        daily_rate: "",
        monthly_rate: "",
        contract_start_date: "",
        contract_finish_date: "",
        days_projection: "",
        budget_baseline: "",
        company_id: "",
      });

      setShowAddEmployee(false);

      // --- Success notification ---
      toast({
        title: "Success",
        description: "Employee added successfully!",
      });
      refreshAllData();
    } catch (error) {
      console.error("Failed to add employee:", error);
      toast({
        title: "Error",
        description: (error as any)?.data?.message || "Failed to add employee",
        variant: "destructive",
      });
    }
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
    let exchangeRate = await getExchangeRate(sessionData.user.currency,sessionData.user.companies?.[0]?.base_currency);


    try {
      // Create an updated employee object formatted for the API
      const employeeToUpdate: any = {
        id: editedEmployee.id,
        username: editedEmployee.username,
        trade_position_id: editedEmployee.trade_position_id || undefined,
        [getRateFieldName()]:
          (editedEmployee[getRateFieldName()] * exchangeRate).toString() ||
          undefined,
        contract_finish_date: editedEmployee.contract_finish_date
          ? new Date(editedEmployee.contract_finish_date).toISOString()
          : undefined,
        days_projection: editedEmployee.days_projection
          ? Number.parseInt(editedEmployee.days_projection)
          : undefined,
        budget_baseline:
          (editedEmployee.budget_baseline * exchangeRate).toString() ||
          undefined,
        company_id: editedEmployee.company_id || undefined,
      };

      // Send the data using RTK Query mutation
      await updateEmployee(employeeToUpdate).unwrap();

      // Close the edit modal
      setShowEditEmployee(false);

      // Show success notification
      toast({
        title: "Success",
        description: "Employee updated successfully!",
      });
    } catch (error) {
      console.error("Failed to update employee:", error);
      // Error notification is handled in the mutation now
    }
  };

  // Handle delete employee confirmation
  const handleDeleteConfirm = async () => {
    try {
      for (const id of selectedIds) {
        await deleteEmployee(id).unwrap();
      }
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      toast({
        title: "Success",
        description: "Employee(s) deleted successfully!",
      });
      refreshAllData();
    } catch (error) {
      console.error("Failed to delete employee(s):", error);
    }
  };

  // Refresh all data
  const refreshAllData = () => {
    refetchEmployees();
    sessionRefetch();
    refetchTrades();
  };
  console.log("permissions", permissions);
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
              {(permissions.generate_reports || permissions.full_access) && (
                <Button
                  variant="outline"
                  className="gap-2 h-12 rounded-full"
                  onClick={() => setCsvUploadModal(true)}
                >
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </Button>
              )}
              {(permissions.manage_employees || permissions.full_access) && (
                <Button
                  onClick={() => setShowAddEmployee(true)}
                  className="bg-orange-400 hover:bg-orange-500 gap-2 h-12 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                  Add New Employee
                </Button>
              )}
              <Button
                onClick={refreshAllData}
                variant="outline"
                className="gap-2 h-12 rounded-full"
                disabled={
                  isEmployeesFetching || isTradesLoading || isLoadingCompanies
                }
              >
                {isEmployeesFetching ||
                isTradesLoading ||
                isLoadingCompanies ? (
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              {(permissions.full_access || permissions.manage_employees) &&
                selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    className="gap-2 h-12 rounded-full"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedIds.length})
                  </Button>
                )}
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            {/* Filters */}
            <div className="p-4 flex gap-4 rounded-lg items-center">
              <div className="relative w-64 ml-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search username..."
                  className="pl-10 h-9 w-full rounded-full"
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  value={filters.search}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {sortOrder
                  ? `Sorting usernames ${sortOrder === "asc" ? "A-Z" : "Z-A"}`
                  : "Click 'Username' to sort alphabetically"}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {isEmployeesLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full mb-4"></div>
                  <p>Loading employees...</p>
                </div>
              ) : employeesError ? (
                <div className="p-8 text-center text-red-500">
                  <p className="mb-2">Error loading employees.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchEmployees()}
                  >
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
                        {(permissions.full_access ||
                          permissions.manage_employees) && (
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleSelectAll}
                          />
                        )}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-[10px] cursor-pointer flex items-center gap-1"
                        onClick={toggleSort}
                      >
                        Username
                        {sortOrder === "asc" && (
                          <ChevronUp className="h-4 w-4" />
                        )}
                        {sortOrder === "desc" && (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        Trade Position
                      </th>
                      <th className="px-4 py-3 text-left text-[10px]">
                        {isMonthlyRate ? "Monthly Rate" : "Daily Rate"}
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
                    {sortedEmployees.map((employee: any) => (
                      <tr
                        key={employee.id}
                        className={`border-b hover:bg-gray-50 ${
                          employee._isOptimistic ? "opacity-70" : ""
                        } ${employee._isUpdating ? "bg-yellow-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          {(permissions.full_access ||
                            permissions.manage_employees) && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(employee.id)}
                              onChange={() => toggleSelect(employee.id)}
                            />
                          )}
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
                              {employee._isOptimistic && (
                                <span className="ml-1 text-[9px] text-orange-500">
                                  (Adding...)
                                </span>
                              )}
                              {employee._isUpdating && (
                                <span className="ml-1 text-[9px] text-orange-500">
                                  (Updating...)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {employee.trade_position?.trade_name || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {
                            <ConvertedAmount
                              amount={employee[getRateFieldName()] ||
                              employee.daily_rate}
                              currency={sessionData.user.currency}
                              showCurrency={true}
                              sessionData={sessionData}
                            />
                          }
                        </td>
                        <td className="px-4 py-3">
                          {
                            formatDate(employee.contract_finish_date)
                          }
                        </td>
                        <td className="px-4 py-3">
                          {employee.days_projection || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <ConvertedAmount
                            amount={employee.budget_baseline}
                            currency={sessionData.user.currency}
                            showCurrency={true}
                            sessionData={sessionData}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {employee.company?.company_name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(permissions.manage_employees || permissions.full_access) &&
                            !employee._isOptimistic &&
                            !employee._isUpdating && (
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
                                    onClick={() =>
                                      handleDeleteEmployee(employee)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {isEmployeesFetching && !isEmployeesLoading && (
            <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2 border z-10">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm">Refreshing data...</span>
            </div>
          )}
        </main>
      </div>
      {csvUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Upload CSV</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCsvUploadModal(false);
                  setCsvFile(null);
                  setCsvParseError(null);
                }}
              >
                &times;
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with employee data. Download the template
                  below.
                </p>
                <a
                  href="/employee-template.csv"
                  download="employee-template.csv"
                  className="text-primary underline text-sm"
                >
                  Download CSV Template
                </a>
              </div>

              <div className="border border-dashed rounded-lg p-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground"
                />
              </div>

              {csvParseError && (
                <div className="text-red-500 text-sm">{csvParseError}</div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCsvUploadModal(false);
                    setCsvFile(null);
                    setCsvParseError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCsvUpload}
                  disabled={!csvFile || isUploading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload CSV"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                  {/* Username */}
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

                  {/* Trade Position */}
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
                      {isTradesLoading && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Loading trades...
                        </div>
                      )}
                      {isTradesError && (
                        <div className="text-xs text-red-500 mt-1">
                          Failed to load trades
                        </div>
                      )}
                      <SelectContent>
                        {tradesFetched.map((trade: any) => (
                          <SelectItem key={trade.id} value={trade.id}>
                            {trade.trade_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Daily / Monthly Rate */}
                  <div className="space-y-2">
                    <label
                      htmlFor={getRateFieldName()}
                      className="text-sm font-medium"
                    >
                      {isMonthlyRate ? "Monthly Rate" : "Daily Rate"}
                    </label>
                    <div className="relative">
                      <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-400">
                        {sessionData.user.currency}
                      </p>
                      <input
                        id={getRateFieldName()}
                        name={getRateFieldName()}
                        type="number"
                        placeholder="100.00"
                        value={newEmployee[getRateFieldName()] || ""}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            [getRateFieldName()]: e.target.value,
                          })
                        }
                        className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Contract Start Date */}
                  <div className="space-y-2">
                    <label
                      htmlFor="contract_start_date"
                      className="text-sm font-medium"
                    >
                      Contract Start Date
                    </label>
                    <div className="relative">
                      <input
                        id="contract_start_date"
                        name="contract_start_date"
                        type="date"
                        value={newEmployee.contract_start_date}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            contract_start_date: e.target.value,
                          })
                        }
                        className="w-full py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Contract Finish Date */}
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

                  {/* Budget Baseline */}
                  <div className="space-y-2">
                    <label
                      htmlFor="budget_baseline"
                      className="text-sm font-medium"
                    >
                      Budget Baseline
                    </label>
                    <div className="relative">
                      <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-400">
                        {sessionData.user.currency}
                      </p>
                      <input
                        id="budget_baseline"
                        name="budget_baseline"
                        type="number"
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
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Employee"
                )}
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
                  {tradesFetched.map((trade: any) => (
                    <SelectItem key={trade.id} value={trade.id}>
                      {trade.trade_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-daily-rate" className="text-sm font-medium">
                {isMonthlyRate ? "Monthly Rate" : "Daily Rate"}
              </label>
              <div className="relative">
                <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-400">
                  {sessionData.user.currency}
                </p>{" "}
                <input
                  id="edit-daily-rate"
                  name={getRateFieldName()}
                  type="number"
                  placeholder="100.00"
                  value={editedEmployee[getRateFieldName()] || ""}
                  onChange={(e) =>
                    setEditedEmployee({
                      ...editedEmployee,
                      [getRateFieldName()]: e.target.value,
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
                <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-400">
                  {sessionData.user.currency}
                </p>{" "}
                <input
                  id="edit-budget-baseline"
                  name="budget_baseline"
                  type="number"
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
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Employee(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedEmployees.length === 1 ? (
              <p>
                Are you sure you want to delete the employee "
                {selectedEmployees[0]?.username}"?
              </p>
            ) : (
              <p>
                Are you sure you want to delete {selectedEmployees.length}{" "}
                employees?
              </p>
            )}
            <p className="text-sm text-gray-500">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
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
