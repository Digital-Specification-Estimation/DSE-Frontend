"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type React from "react";
export type NewProject = {
  project_name?: string;
  location_name?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
};
export type NewTrade = {
  trade_name?: string;
  monthly_planned_cost?: number;
  location_name?: string;
  daily_planned_cost?: number;
};
export type NewLocation = {
  location_name?: string;
};
import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  MapPin,
  DollarSign,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronDown,
  AlertTriangle,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import {
  useAddLocationMutation,
  useGetLocationsQuery,
  useEditLocationMutation,
  useDeleteLocationMutation,
} from "@/lib/redux/locationSlice";
import {
  useAddTradeMutation,
  useGetTradesQuery,
  useEditTradeMutation,
  useDeleteTradeMutation,
} from "@/lib/redux/tradePositionSlice";
import {
  useAddProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "@/lib/redux/projectSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { convertCurrency, getExchangeRate } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import EnhancedProjectForm from "@/components/project/EnhancedProjectForm";

function LocationForm({
  onClose,
  refetchLocations,
}: {
  onClose: () => void;
  refetchLocations: () => void;
}) {
  const { toast } = useToast();
  const [newLocation, setNewLocation] = useState<NewLocation>({
    location_name: "",
  });
  const [addLocation, { isLoading: isAddingLocation }] =
    useAddLocationMutation();

  const handleAddLocation = async () => {
    try {
      if (!newLocation.location_name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Location name is required.",
          variant: "destructive",
        });
        return;
      }

      // Use RTK Query mutation
      await addLocation(newLocation).unwrap();

      // Explicitly refetch locations after successful addition
      refetchLocations();

      setNewLocation({ location_name: "" });
      onClose();

      toast({
        title: "Location Added",
        description: `Location ${newLocation.location_name} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error adding location:", error);
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Main Office"
            className="pl-10"
            value={newLocation.location_name}
            onChange={(e) => setNewLocation({ location_name: e.target.value })}
          />
        </div>
      </div>
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600"
        onClick={handleAddLocation}
        disabled={isAddingLocation}
      >
        {isAddingLocation ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Location"
        )}
      </Button>
    </div>
  );
}

// Separate Trade Form Component
function TradeForm({
  onClose,
  refetchTrades,
  sessionData,
}: {
  onClose: () => void;
  refetchTrades: () => void;
  sessionData: any;
}) {
  const { toast } = useToast();
  const [newTrade, setNewTrade] = useState({
    location_name: "",
    monthly_planned_cost: "",
    daily_planned_cost: "",
    trade_name: "",
  });

  const { data: locations = [] } = useGetLocationsQuery();
  const [addTrade, { isLoading: isAddingTrade }] = useAddTradeMutation();

  const handleAddTrade = async () => {
    try {
      if (!newTrade.location_name?.trim() || !newTrade.trade_name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Trade name and location are required.",
          variant: "destructive",
        });
        return;
      }

      // Check if the rate field is filled based on salary calculation type
      if (
        (sessionData?.user?.salary_calculation === "monthly rate" &&
          !newTrade.monthly_planned_cost) ||
        (sessionData?.user?.salary_calculation !== "monthly rate" &&
          !newTrade.daily_planned_cost)
      ) {
        toast({
          title: "Validation Error",
          description: `${
            sessionData?.user?.salary_calculation === "monthly rate"
              ? "Monthly"
              : "Daily"
          } rate is required.`,
          variant: "destructive",
        });
        return;
      }
      let exchangeRate = await getExchangeRate(
        sessionData.user.currency,
        sessionData.user.companies?.[0]?.base_currency
      );
      let monthlyPlannedCost = newTrade.monthly_planned_cost || 0;
      let dailyPlannedCost = newTrade.daily_planned_cost || 0;
      // If the currency is not RWF, convert the values
      monthlyPlannedCost = Number(monthlyPlannedCost) * Number(exchangeRate);
      dailyPlannedCost = Number(dailyPlannedCost) * Number(exchangeRate);

      const newTradeToAdd: any = {
        location_name: newTrade.location_name,
        trade_name: newTrade.trade_name,
        monthly_planned_cost: monthlyPlannedCost.toString(),
        daily_planned_cost: dailyPlannedCost.toString(),
      };

      // Use RTK Query mutation
      await addTrade(newTradeToAdd).unwrap();

      // Explicitly refetch trades after successful addition
      refetchTrades();

      setNewTrade({
        location_name: "",
        monthly_planned_cost: "",
        daily_planned_cost: "",
        trade_name: "",
      });
      onClose();

      toast({
        title: "Trade Added",
        description: `${newTrade.trade_name} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error adding trade:", error);
      toast({
        title: "Error",
        description: "Failed to add trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Electricians"
            className="pl-10"
            value={newTrade.trade_name}
            onChange={(e) =>
              setNewTrade({ ...newTrade, trade_name: e.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Location Name</label>
        <Select
          value={newTrade.location_name}
          onValueChange={(value) =>
            setNewTrade({ ...newTrade, location_name: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location: any) => (
              <SelectItem key={location.id} value={location.location_name}>
                {location.location_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {sessionData?.user?.salary_calculation === "monthly rate"
            ? "Monthly Rate"
            : "Daily Rate"}
        </label>
        <div className="relative">
          <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-400">
            {sessionData?.user?.currency}
          </p>{" "}
          <Input
            placeholder="Enter rate"
            type="number"
            step="0.01"
            min="0"
            className="pl-10"
            value={
              sessionData?.user?.salary_calculation === "monthly rate"
                ? newTrade.monthly_planned_cost
                : newTrade.daily_planned_cost
            }
            onChange={(e) =>
              sessionData?.user?.salary_calculation === "monthly rate"
                ? setNewTrade({
                    ...newTrade,
                    monthly_planned_cost: e.target.value,
                  })
                : setNewTrade({
                    ...newTrade,
                    daily_planned_cost: e.target.value,
                  })
            }
            onKeyDown={(e) => {
              // Prevent negative numbers and multiple decimal points
              if (
                e.key === "-" ||
                (e.key === "." &&
                  (sessionData?.user?.salary_calculation === "monthly rate"
                    ? newTrade.monthly_planned_cost
                    : newTrade.daily_planned_cost
                  ).includes("."))
              ) {
                e.preventDefault();
              }
            }}
          />
        </div>
      </div>
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600"
        onClick={handleAddTrade}
        disabled={isAddingTrade}
      >
        {isAddingTrade ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Trade"
        )}
      </Button>
    </div>
  );
}

// Separate Project Form Component
function ProjectForm({
  onClose,
  refetchProjects,
  sessionData,
}: {
  onClose: () => void;
  refetchProjects: () => void;
  sessionData: any;
}) {
  const { toast } = useToast();
  const [newProject, setNewProject] = useState<any>({
    project_name: "",
    location_name: "",
    start_date: "",
    end_date: "",
  });

  const { data: locations = [] } = useGetLocationsQuery();
  const [addProject, { isLoading: isAddingProject }] = useAddProjectMutation();

  const handleAddProject = async () => {
    try {
      if (
        !newProject.project_name?.trim() ||
        !newProject.location_name?.trim() ||
        !newProject.start_date ||
        !newProject.end_date
      ) {
        toast({
          title: "Validation Error",
          description: "All project fields are required.",
          variant: "destructive",
        });
        return;
      }

      let budget = newProject.budget || 0;
      const exchangeRate = await getExchangeRate(
        sessionData?.user?.currency,
        sessionData?.user?.companies?.[0]?.base_currency
      );
      // Convert the budget to RWF if needed
      budget = budget * exchangeRate;

      // Use RTK Query mutation
      await addProject({
        ...newProject,
        budget: budget,
      }).unwrap();

      // Explicitly refetch projects after successful addition
      refetchProjects();

      setNewProject({
        project_name: "",
        location_name: "",
        start_date: "",
        end_date: "",
      });
      onClose();

      toast({
        title: "Project Added",
        description: `${newProject.project_name} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description: "Failed to add project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Project Name</label>
        <Input
          placeholder="Construction A"
          value={newProject.project_name}
          onChange={(e) =>
            setNewProject({ ...newProject, project_name: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Location</label>
        <Select
          value={newProject.location_name}
          onValueChange={(value) =>
            setNewProject({ ...newProject, location_name: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location: any) => (
              <SelectItem key={location.id} value={location.location_name}>
                {location.location_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Input
            name="start_date"
            id="start_date"
            type="date"
            value={newProject.start_date}
            onChange={(e) =>
              setNewProject({ ...newProject, start_date: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="date"
            value={newProject.end_date}
            onChange={(e) =>
              setNewProject({ ...newProject, end_date: e.target.value })
            }
          />
        </div>
      </div>
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600"
        onClick={handleAddProject}
        disabled={isAddingProject}
      >
        {isAddingProject ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Project"
        )}
      </Button>
    </div>
  );
}

// Table Component
function DataTable({
  headers,
  data,
  renderRow,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onEditBudget,
  onEditRate,
  sessionData,
  activeTab,
  selectedIds,
  onSelectAll,
  onToggleSelect,
}: {
  headers: string[];
  data: any[];
  renderRow: (item: any) => React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onEditBudget: (item: any) => void;
  onEditRate: (item: any) => void;
  sessionData: any;
  activeTab: string;
  selectedIds?: string[];
  onSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSelect?: (id: string) => void;
}) {
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-gray-700">Failed to load data</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const renderCurrency = async (value: number) => {
    if (!value) return "0";
    if (sessionData?.user?.currency === "RWF") return value.toLocaleString();

    try {
      const converted = await convertCurrency(
        value,
        sessionData.user.currency,
        sessionData.user.company.base_currency
      );
      return converted.toLocaleString();
    } catch (error) {
      console.error("Error converting currency:", error);
      return value.toLocaleString();
    }
  };

  const allSelected =
    selectedIds && selectedIds.length === data.length && data.length > 0;

  return (
    <div className="shadow-sm border max-sm:w-full max-sm:overflow-x-auto border-gray-200 rounded-lg">
      <table className="w-full max-sm:overflow-x-auto sm:table-fixed">
        <thead className="bg-gray-50 max-sm:overflow-x-auto max-sm:w-full">
          <tr className="border-b text-sm text-gray-600 font-medium">
            <th className="w-10 px-2 py-3 text-left">
              {onSelectAll && (
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={allSelected}
                  onChange={onSelectAll}
                />
              )}
            </th>
            <th className="w-12 px-2 py-3 text-left text-sm">SN</th>
            {headers.map((header, index) => {
              // Define specific widths for each column based on content and tab
              let columnClass = "px-2 py-3 text-left text-sm font-medium";

              // Projects tab column widths
              if (activeTab === "projects") {
                if (header === "Project Name")
                  columnClass += " w-[28%] max-sm:w-fit";
                else if (header === "Location Name")
                  columnClass += " w-[22%] max-sm:w-fit";
                else if (header === "Start Date")
                  columnClass += " w-[16%] max-sm:w-fit";
                else if (header === "End Date")
                  columnClass += " w-[16%] max-sm:w-fit";
                else if (header === "Budget")
                  columnClass += " w-[18%] max-sm:w-fit";
                else columnClass += " flex-1 max-sm:w-fit";
              }
              // Trades tab column widths - Location Name gets more space
              else if (activeTab === "trades") {
                if (header === "Role/Trade")
                  columnClass += " w-[25%] max-sm:w-fit";
                else if (header === "Location Name")
                  columnClass += " w-[35%] max-sm:w-fit";
                // Wider for full visibility
                else if (header === "Daily Rate")
                  columnClass += " w-[20%] max-sm:w-fit";
                else if (header === "Monthly Rate")
                  columnClass += " w-[20%] max-sm:w-fit";
                else columnClass += " flex-1 max-sm:w-fit";
              }
              // Default for other tabs
              else {
                if (header === "Location Name")
                  columnClass += " w-[60%]"; // Locations tab
                else columnClass += " flex-1";
              }

              return (
                <th key={index} className={columnClass}>
                  {header}
                </th>
              );
            })}
            <th className="w-20 px-2 py-3 text-left text-sm">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-2 py-3">
                {onToggleSelect && (
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={selectedIds?.includes(item.id) || false}
                    onChange={() => onToggleSelect(item.id)}
                  />
                )}
              </td>
              <td className="px-2 py-3 text-gray-900 font-medium text-sm">
                {index + 1}
              </td>
              {renderRow(item)}
              <td className="px-2 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white hover:text-white px-2 py-1 text-xs"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {activeTab === "projects" && onEditBudget && (
                      <DropdownMenuItem onClick={() => onEditBudget(item)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Edit Budget
                      </DropdownMenuItem>
                    )}
                    {activeTab === "trades" && onEditRate && (
                      <DropdownMenuItem onClick={() => onEditRate(item)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Edit Rate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(item)}>
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
    </div>
  );
}

// Edit Location Form
function EditLocationForm({
  location,
  onClose,
  refetchLocations,
}: {
  location: any;
  onClose: () => void;
  refetchLocations: () => void;
}) {
  const { toast } = useToast();
  const [editedLocation, setEditedLocation] = useState<NewLocation>({
    location_name: location.location_name,
  });
  const [updateLocation, { isLoading: isUpdatingLocation }] =
    useEditLocationMutation();

  const handleUpdateLocation = async () => {
    try {
      if (!editedLocation.location_name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Location name is required.",
          variant: "destructive",
        });
        return;
      }

      await updateLocation({ id: location.id, ...editedLocation }).unwrap();
      refetchLocations();
      onClose();

      toast({
        title: "Location Updated",
        description: `Location has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Main Office"
            className="pl-10"
            value={editedLocation.location_name}
            onChange={(e) =>
              setEditedLocation({ location_name: e.target.value })
            }
          />
        </div>
      </div>
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600"
        onClick={handleUpdateLocation}
        disabled={isUpdatingLocation}
      >
        {isUpdatingLocation ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Location"
        )}
      </Button>
    </div>
  );
}

// Delete Location Confirmation
function DeleteLocationConfirmation({
  location,
  onClose,
  refetchLocations,
}: {
  location: any;
  onClose: () => void;
  refetchLocations: () => void;
}) {
  const { toast } = useToast();
  const [deleteLocation, { isLoading: isDeletingLocation }] =
    useDeleteLocationMutation();

  const handleDeleteLocation = async () => {
    try {
      await deleteLocation(location.id).unwrap();
      refetchLocations();
      onClose();

      toast({
        title: "Location Deleted",
        description: `Location has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <p>
        Are you sure you want to delete the location "{location.location_name}"?
      </p>
      <p className="text-sm text-gray-500">This action cannot be undone.</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDeleteLocation}
          disabled={isDeletingLocation}
        >
          {isDeletingLocation ? (
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
  );
}

// Edit Trade Form
function EditTradeForm({
  trade,
  onClose,
  refetchTrades,
  sessionData,
}: {
  trade: any;
  onClose: () => void;
  refetchTrades: () => void;
  sessionData: any;
}) {
  const { toast } = useToast();
  const [editedTrade, setEditedTrade] = useState({
    location_name: trade.location_name,
    trade_name: trade.trade_name,
  });

  const { data: locations = [] } = useGetLocationsQuery();
  const [updateTrade, { isLoading: isUpdatingTrade }] = useEditTradeMutation();

  const handleUpdateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editedTrade.trade_name?.trim()) {
        toast({
          title: "Error",
          description: "Trade name is required.",
          variant: "destructive",
        });
        return;
      }

      const tradeToUpdate = {
        id: trade.id,
        trade_name: editedTrade.trade_name,
        location_name: editedTrade.location_name,
      };

      await updateTrade(tradeToUpdate).unwrap();

      toast({
        title: "Success",
        description: "Trade updated successfully",
      });

      refetchTrades();
      onClose();
    } catch (error: any) {
      console.error("Error updating trade:", error);
      toast({
        title: "Error",
        description: error?.data?.message?.[0] || "Failed to update trade.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Electricians"
            className="pl-10"
            value={editedTrade.trade_name}
            onChange={(e) =>
              setEditedTrade({ ...editedTrade, trade_name: e.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Location Name</label>
        <Select
          value={editedTrade.location_name}
          onValueChange={(value) =>
            setEditedTrade({ ...editedTrade, location_name: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location: any) => (
              <SelectItem key={location.id} value={location.location_name}>
                {location.location_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600"
        onClick={handleUpdateTrade}
        disabled={isUpdatingTrade}
      >
        {isUpdatingTrade ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Trade"
        )}
      </Button>
    </div>
  );
}

// Delete Trade Confirmation
function DeleteTradeConfirmation({
  trade,
  onClose,
  refetchTrades,
}: {
  trade: any;
  onClose: () => void;
  refetchTrades: () => void;
}) {
  const { toast } = useToast();
  const [deleteTrade, { isLoading: isDeletingTrade }] =
    useDeleteTradeMutation();

  const handleDeleteTrade = async () => {
    try {
      await deleteTrade(trade.id).unwrap();
      refetchTrades();
      onClose();

      toast({
        title: "Trade Deleted",
        description: `Trade has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast({
        title: "Error",
        description: "Failed to delete trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <p>Are you sure you want to delete the trade "{trade.trade_name}"?</p>
      <p className="text-sm text-gray-500">This action cannot be undone.</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDeleteTrade}
          disabled={isDeletingTrade}
        >
          {isDeletingTrade ? (
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
  );
}

// Edit Project Form
function EditProjectForm({
  project,
  onClose,
  refetchProjects,
  sessionData,
}: {
  project: any;
  onClose: () => void;
  refetchProjects: () => void;
  sessionData: any;
}) {
  const { toast } = useToast();
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editedProject, setEditedProject] = useState<NewProject>({
    project_name: project.project_name,
    location_name: project.location_name,
    start_date: formatDateForInput(project.start_date),
    end_date: formatDateForInput(project.end_date),
  });

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const rate = await getExchangeRate(
          sessionData.user.currency,
          sessionData.user.companies?.[0]?.base_currency
        );
        setExchangeRate(rate);
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
        toast({
          title: "Error",
          description: "Failed to load exchange rate. Using default rate of 1.",
          variant: "destructive",
        });
        setExchangeRate(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRate();
  }, [sessionData.user.currency, toast]);

  const { data: locations = [] } = useGetLocationsQuery();
  const [updateProject, { isLoading: isUpdatingProject }] =
    useUpdateProjectMutation();

  const handleUpdateProject = async () => {
    try {
      if (
        !editedProject.project_name?.trim() ||
        !editedProject.location_name?.trim() ||
        !editedProject.start_date ||
        !editedProject.end_date
      ) {
        toast({
          title: "Validation Error",
          description: "All project fields are required.",
          variant: "destructive",
        });
        return;
      }

      // Format dates for API
      const formattedStartDate = formatDateForApi(editedProject.start_date);
      const formattedEndDate = formatDateForApi(editedProject.end_date);
      // Create date objects for validation
      const startDate = new Date(formattedStartDate);
      const endDate = new Date(formattedEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast({
          title: "Invalid Date",
          description: "Please enter valid dates.",
          variant: "destructive",
        });
        return;
      }

      if (startDate < today) {
        toast({
          title: "Invalid Start Date",
          description: "Start date cannot be in the past.",
          variant: "destructive",
        });
        return;
      }

      if (endDate <= startDate) {
        toast({
          title: "Invalid Date Range",
          description: "End date must be after start date.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        id: project.id,
        project_name: editedProject.project_name,
        location_name: editedProject.location_name,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
      };

      await updateProject(payload).unwrap();
      refetchProjects();
      onClose();

      toast({
        title: "Project Updated",
        description: `${editedProject.project_name} has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Project Name</label>
        <Input
          placeholder="Construction A"
          value={editedProject.project_name}
          onChange={(e) =>
            setEditedProject({ ...editedProject, project_name: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Location</label>
        <Select
          value={editedProject.location_name}
          onValueChange={(value) =>
            setEditedProject({ ...editedProject, location_name: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location: any) => (
              <SelectItem key={location.id} value={location.location_name}>
                {location.location_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>

          <input
            id="edit-start-date"
            name="start_date"
            type="date"
            value={
              editedProject.start_date
                ? formatDateForInput(editedProject.start_date)
                : ""
            }
            onChange={(e) =>
              setEditedProject({ ...editedProject, start_date: e.target.value })
            }
            className="w-full pl-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>

          <input
            id="edit-end-date"
            name="end_date"
            type="date"
            value={
              editedProject.end_date
                ? formatDateForInput(editedProject.end_date)
                : ""
            }
            onChange={(e) =>
              setEditedProject({ ...editedProject, end_date: e.target.value })
            }
            className="w-full pl-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600"
        onClick={handleUpdateProject}
        disabled={isUpdatingProject}
      >
        {isUpdatingProject ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Project"
        )}
      </Button>
    </div>
  );
}

// Delete Project Confirmation
function DeleteProjectConfirmation({
  project,
  onClose,
  refetchProjects,
}: {
  project: any;
  onClose: () => void;
  refetchProjects: () => void;
}) {
  const { toast } = useToast();
  const [deleteProject, { isLoading: isDeletingProject }] =
    useDeleteProjectMutation();

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id).unwrap();
      refetchProjects();
      onClose();

      toast({
        title: "Project Deleted",
        description: `Project has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <p>
        Are you sure you want to delete the project "{project.project_name}"?
      </p>
      <p className="text-sm text-gray-500">This action cannot be undone.</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDeleteProject}
          disabled={isDeletingProject}
        >
          {isDeletingProject ? (
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
  );
}

// Edit Trade Rate Form
function EditTradeRateForm({
  trade,
  onClose,
  refetchTrades,
  sessionData,
}: {
  trade: any;
  onClose: () => void;
  refetchTrades: () => void;
  sessionData: any;
}) {
  const { toast } = useToast();
  const [editedRate, setEditedRate] = useState(
    sessionData?.user?.salary_calculation === "monthly rate" ? "" : ""
  );

  const [updateTradeRate, { isLoading: isUpdatingRate }] =
    useEditTradeMutation();

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editedRate) {
        toast({
          title: "Error",
          description: `${
            sessionData?.user?.salary_calculation === "monthly rate"
              ? "Monthly"
              : "Daily"
          } rate is required.`,
          variant: "destructive",
        });
        return;
      }

      // Get exchange rate if needed
      let exchangeRate = await getExchangeRate(
        sessionData.user.currency,
        sessionData.user.companies?.[0]?.base_currency
      );
      let updatedRate = Number(editedRate) * Number(exchangeRate);

      const tradeToUpdate: any = {
        id: trade.id,
      };

      if (sessionData?.user?.salary_calculation === "monthly rate") {
        tradeToUpdate.monthly_planned_cost = updatedRate.toString();
      } else {
        tradeToUpdate.daily_planned_cost = updatedRate.toString();
      }

      await updateTradeRate(tradeToUpdate).unwrap();

      toast({
        title: "Success",
        description: "Trade rate updated successfully",
      });

      refetchTrades();
      onClose();
    } catch (error: any) {
      console.error("Error updating trade rate:", error);
      toast({
        title: "Error",
        description:
          error?.data?.message?.[0] || "Failed to update trade rate.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {sessionData?.user?.salary_calculation === "monthly rate"
            ? "Monthly Rate"
            : "Daily Rate"}
        </label>
        <div className="relative">
          <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-400">
            {sessionData?.user?.currency}
          </p>
          <Input
            placeholder="Enter rate"
            type="number"
            step="0.01"
            min="0"
            className="pl-10"
            value={editedRate}
            onChange={(e) => {
              const value = e.target.value;
              // Only update if the value is a valid number or empty string
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setEditedRate(value);
              }
            }}
            onKeyDown={(e) => {
              // Prevent negative numbers and multiple decimal points
              if (
                e.key === "-" ||
                (e.key === "." && editedRate.includes("."))
              ) {
                e.preventDefault();
              }
            }}
          />
        </div>
      </div>
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600"
        onClick={handleUpdateRate}
        disabled={isUpdatingRate}
      >
        {isUpdatingRate ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Rate"
        )}
      </Button>
    </div>
  );
}

// Format date for display in the input field (YYYY-MM-DD to YYYY-MM-DD - no conversion needed)
const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  // If the date is already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // If the date is in DD/MM/YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return "";
};

// Format date for API (to ISO string with timezone)
const formatDateForApi = (dateString: string) => {
  if (!dateString) return "";
  let date: Date;

  // If the date is in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    date = new Date(dateString);
  }
  // If the date is in DD/MM/YYYY format
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split("/");
    date = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
  }
  // If it's already in ISO format
  else if (dateString.includes("T")) {
    date = new Date(dateString);
  }
  // If we can't parse it, return as is
  else {
    return dateString;
  }

  // Return in ISO format with timezone (e.g., "2025-09-24T00:00:00.000Z")
  return date.toISOString();
};

function EditBudgetModal({
  project,
  onClose,
  onSave,
  currency,
}: {
  project: any;
  onClose: () => void;
  onSave: (projectId: string, budget: number) => Promise<void>;
  currency: string;
}) {
  const [budget, setBudget] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      try {
        const response = await onSave(project.id, budget);
        setBudget(0);
      } catch (error) {
        console.error("Error updating budget:", error);
        toast({
          title: "Error",
          description: "Failed to update budget",
          variant: "destructive",
        });
      }
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Budget for {project.project_name}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget ({currency})</Label>
          <Input
            id="budget"
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            min={0}
            step="0.01"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// Main Business Setup Component
export default function BusinessSetup() {
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

  // Format date for display in table
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";

    try {
      let date;
      if (typeof dateString === "string") {
        if (dateString.includes("/")) {
          // Handle dd/MM/yyyy format (old format)
          const [day, month, year] = dateString.split("/");
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Handle ISO string format (new format)
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return dateString; // Return original if invalid

      // Format as DD/MM/YYYY for display
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  const { toast } = useToast();

  // Delete mutations
  const [deleteLocation] = useDeleteLocationMutation();
  const [deleteTrade] = useDeleteTradeMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });

  const [activeTab, setActiveTab] = useState("locations");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  // First, add state for edit and delete modals and selected item
  // Add these state variables in the BusinessSetup component:
  const [showEditLocation, setShowEditLocation] = useState(false);
  const [showDeleteLocation, setShowDeleteLocation] = useState(false);
  const [showEditTrade, setShowEditTrade] = useState(false);
  const [showDeleteTrade, setShowDeleteTrade] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [showEditTradeRate, setShowEditTradeRate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Bulk delete states
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Expired projects management states
  const [showExpiredProjects, setShowExpiredProjects] = useState(false);
  const [expiredProjectIds, setExpiredProjectIds] = useState<string[]>([]);
  const [showExpiredDeleteConfirm, setShowExpiredDeleteConfirm] =
    useState(false);

  function ConvertedAmount({
    amount,
    currency,
    showCurrency = true,
  }: {
    amount: number;
    currency: string;
    showCurrency?: boolean;
  }) {
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
    }, [amount, currency]);
    return (
      <>
        {showCurrency
          ? `${currency} ${Number(convertedAmount).toLocaleString()}`
          : Number(convertedAmount).toLocaleString()}
      </>
    );
  }

  // RTK Query hooks
  const {
    data: locations = [],
    isLoading: isLoadingLocations,
    isError: isErrorLocations,
    refetch: refetchLocations,
  } = useGetLocationsQuery();

  const {
    data: trades = [],
    isLoading: isLoadingTrades,
    isError: isErrorTrades,
    refetch: refetchTrades,
  } = useGetTradesQuery();

  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    refetch: refetchProjects,
  } = useGetProjectsQuery();

  // Check if any data is loading
  const isLoading = isLoadingLocations || isLoadingTrades || isLoadingProjects;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Refresh data based on active tab
  const handleRefresh = () => {
    switch (activeTab) {
      case "locations":
        refetchLocations();
        break;
      case "trades":
        refetchTrades();
        break;
      case "projects":
        refetchProjects();
        break;
    }

    toast({
      title: "Refreshing Data",
      description: `Refreshing ${activeTab} data...`,
    });
  };

  // Bulk delete handlers
  const handleSelectAllLocations = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLocationIds(locations.map((loc: any) => loc.id));
    } else {
      setSelectedLocationIds([]);
    }
  };

  const handleSelectAllTrades = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTradeIds(trades.map((trade: any) => trade.id));
    } else {
      setSelectedTradeIds([]);
    }
  };

  const handleSelectAllProjects = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProjectIds(projects.map((proj: any) => proj.id));
    } else {
      setSelectedProjectIds([]);
    }
  };

  const toggleLocationSelect = (id: string) => {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleTradeSelect = (id: string) => {
    setSelectedTradeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleProjectSelect = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    try {
      let idsToDelete: string[] = [];
      let deleteFunction: any;
      let entityName = "";

      switch (activeTab) {
        case "locations":
          idsToDelete = selectedLocationIds;
          deleteFunction = deleteLocation;
          entityName = "location";
          break;
        case "trades":
          idsToDelete = selectedTradeIds;
          deleteFunction = deleteTrade;
          entityName = "trade";
          break;
        case "projects":
          idsToDelete = selectedProjectIds;
          deleteFunction = deleteProject;
          entityName = "project";
          break;
      }

      for (const id of idsToDelete) {
        await deleteFunction(id).unwrap();
      }

      // Clear selections
      setSelectedLocationIds([]);
      setSelectedTradeIds([]);
      setSelectedProjectIds([]);
      setShowBulkDeleteConfirm(false);

      toast({
        title: "Success",
        description: `${idsToDelete.length} ${entityName}(s) deleted successfully!`,
      });

      // Refresh data
      handleRefresh();
    } catch (error) {
      console.error("Failed to delete items:", error);
      toast({
        title: "Error",
        description: "Failed to delete some items",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBudget = async (projectId: string, budget: number) => {
    let exchangeRate = await getExchangeRate(
      sessionData.user.currency,
      sessionData.user.companies?.[0]?.base_currency
    );
    budget = budget * exchangeRate;
    const body = {
      budget: budget.toString(), // Convert number to string to match IsDecimal()
      projectId: projectId.toString(), // Ensure projectId is a string
    };
    try {
      const response = await fetch(
        `https://dse-backend-uv5d.onrender.com/project/budget`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      refetchProjects();
    } catch (error) {
      console.error("Error updating budget:", error);
      throw error;
    }
  };

  // Get projects with expired end dates
  const getExpiredProjects = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    return projects.filter((project: any) => {
      if (!project.end_date) return false;

      // Handle different date formats that might come from backend
      let projectEndDate;
      try {
        if (typeof project.end_date === "string") {
          // Handle different string formats
          if (project.end_date.includes("/")) {
            // Handle dd/MM/yyyy format (old format)
            const [day, month, year] = project.end_date.split("/");
            projectEndDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
          } else {
            // Handle ISO string format (new format)
            projectEndDate = new Date(project.end_date);
          }
        } else if (project.end_date instanceof Date) {
          // If it's already a Date object
          projectEndDate = new Date(project.end_date);
        } else {
          // If it's something else, try to convert
          projectEndDate = new Date(project.end_date);
        }

        // Check if the date is valid
        if (isNaN(projectEndDate.getTime())) return false;

        projectEndDate.setHours(0, 0, 0, 0);
      } catch (error) {
        return false;
      }

      return projectEndDate < today;
    });
  };

  // Get projects with end dates expiring soon (within 30 days)
  const getExpiringSoonProjects = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(0, 0, 0, 0);

    return projects.filter((project: any) => {
      if (!project.end_date) return false;

      let projectEndDate;
      try {
        if (typeof project.end_date === "string") {
          // Handle different string formats
          if (project.end_date.includes("/")) {
            // Handle dd/MM/yyyy format (old format)
            const [day, month, year] = project.end_date.split("/");
            projectEndDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
          } else {
            // Handle ISO string format (new format)
            projectEndDate = new Date(project.end_date);
          }
        } else {
          projectEndDate = new Date(project.end_date);
        }

        if (isNaN(projectEndDate.getTime())) return false;
        projectEndDate.setHours(0, 0, 0, 0);

        return projectEndDate >= today && projectEndDate <= thirtyDaysFromNow;
      } catch (error) {
        return false;
      }
    });
  };

  // Calculate days until project expiry
  const getDaysUntilExpiry = (endDate: string) => {
    if (!endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let projectEndDate;
    try {
      if (typeof endDate === "string") {
        if (endDate.includes("/")) {
          // Handle dd/MM/yyyy format (old format)
          const [day, month, year] = endDate.split("/");
          projectEndDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
        } else {
          // Handle ISO string format (new format)
          projectEndDate = new Date(endDate);
        }
      } else {
        projectEndDate = new Date(endDate);
      }

      if (isNaN(projectEndDate.getTime())) return null;
      projectEndDate.setHours(0, 0, 0, 0);

      const timeDiff = projectEndDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return daysDiff;
    } catch (error) {
      return null;
    }
  };

  // Handle bulk deletion of expired projects
  const handleBulkDeleteExpired = async () => {
    if (expiredProjectIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select projects to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      let successCount = 0;
      let failedProjects: string[] = [];

      // Delete projects one by one and track results
      for (const projectId of expiredProjectIds) {
        try {
          await deleteProject(projectId).unwrap();
          successCount++;
        } catch (error) {
          console.error(`Failed to delete project ${projectId}:`, error);
          const project = projects.find((proj: any) => proj.id === projectId);
          failedProjects.push(project?.project_name || `ID: ${projectId}`);
        }
      }

      // Show appropriate success/error messages
      if (successCount === expiredProjectIds.length) {
        toast({
          title: "Success",
          description: `${successCount} expired project(s) deleted successfully`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial Success",
          description: `${successCount} project(s) deleted successfully. ${failedProjects.length} failed to delete.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to delete projects: ${failedProjects.join(
            ", "
          )}`,
          variant: "destructive",
        });
      }

      // Reset selections and close modal
      setExpiredProjectIds([]);
      setShowExpiredDeleteConfirm(false);
      setShowExpiredProjects(false);

      // Refresh project data to reflect changes
      refetchProjects();
    } catch (error) {
      console.error("Error during bulk deletion:", error);
      toast({
        title: "Error",
        description:
          "An unexpected error occurred during deletion. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading && !locations.length && !trades.length && !projects.length) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-gray-500">Loading business data...</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-4 max-sm:py-[10px] px-3 sm:py-6 sm:px-4 max-sm:px-2 lg:py-8 lg:px-6 max-w-[1400px]">
      <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-gray-900">
          Business Setup
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Navigation */}
        <div className="w-full lg:w-44 xl:w-48 bg-white rounded-lg border border-gray-200 overflow-hidden p-2 sm:p-3 flex-shrink-0">
          <button
            className={`w-full px-3 py-2.5 text-xs sm:text-sm text-left transition-colors rounded-lg ${
              activeTab === "locations"
                ? "text-gray-900 font-medium border border-gray-300 rounded-2xl bg-gray-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => handleTabChange("locations")}
          >
            Locations
          </button>
          <button
            className={`w-full px-3 py-2.5 text-xs sm:text-sm text-left transition-colors rounded-lg ${
              activeTab === "trades"
                ? "text-gray-900 font-medium border border-gray-300 rounded-2xl bg-gray-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => handleTabChange("trades")}
          >
            Trades
          </button>
          <button
            className={`w-full px-3 py-2.5 text-xs sm:text-sm text-left transition-colors rounded-lg ${
              activeTab === "projects"
                ? "text-gray-900 font-medium border border-gray-300 rounded-2xl bg-gray-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => handleTabChange("projects")}
          >
            Projects
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
            {/* Locations Tab */}
            {activeTab === "locations" && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      Work Locations
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Define different locations where employees work.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {selectedLocationIds.length > 0 && (
                      <Button
                        variant="destructive"
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected ({selectedLocationIds.length})
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowAddLocation(true)}
                      className="bg-orange-400 hover:bg-orange-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Location
                    </Button>
                  </div>
                </div>
                <DataTable
                  headers={["Location Name"]}
                  data={locations}
                  isLoading={isLoadingLocations}
                  isError={isErrorLocations}
                  onRetry={refetchLocations}
                  onEdit={(location) => {
                    setSelectedItem(location);
                    setShowEditLocation(true);
                  }}
                  onDelete={(location) => {
                    setSelectedItem(location);
                    setShowDeleteLocation(true);
                  }}
                  onEditBudget={() => {}}
                  onEditRate={() => {}}
                  renderRow={(location) => (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {location.location_name}
                      </div>
                    </td>
                  )}
                  sessionData={sessionData}
                  activeTab={activeTab}
                  selectedIds={selectedLocationIds}
                  onSelectAll={handleSelectAllLocations}
                  onToggleSelect={toggleLocationSelect}
                />
              </>
            )}

            {/* Trades Tab */}
            {activeTab === "trades" && (
              <>
                <div className="flex justify-between max-sm:items-end max-sm:flex-col items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Trade/Job Role & Daily Rates
                    </h2>
                    <p className="text-sm text-gray-500">
                      Define different roles and set daily rates for each.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedTradeIds.length > 0 && (
                      <Button
                        variant="destructive"
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected ({selectedTradeIds.length})
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowAddTrade(true)}
                      className="bg-orange-400 hover:bg-orange-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Trade
                    </Button>
                  </div>
                </div>
                <DataTable
                  headers={[
                    "Role/Trade",
                    "Location Name",
                    `${
                      sessionData?.user?.salary_calculation === "monthly rate"
                        ? "Monthly"
                        : "Daily"
                    } Rate (${sessionData?.user?.currency})`,
                  ]}
                  data={trades}
                  isLoading={isLoadingTrades}
                  isError={isErrorTrades}
                  onRetry={refetchTrades}
                  onEdit={(trade) => {
                    setSelectedItem(trade);
                    setShowEditTrade(true);
                  }}
                  onDelete={(trade) => {
                    setSelectedItem(trade);
                    setShowDeleteTrade(true);
                  }}
                  onEditRate={(trade) => {
                    setSelectedItem(trade);
                    setShowEditTradeRate(true);
                  }}
                  onEditBudget={() => {}}
                  sessionData={sessionData}
                  activeTab={activeTab}
                  selectedIds={selectedTradeIds}
                  onSelectAll={handleSelectAllTrades}
                  onToggleSelect={toggleTradeSelect}
                  renderRow={(trade: NewTrade) => (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                            {/* {trade.icon} */}
                          </div>
                          {trade.trade_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">{trade.location_name}</td>
                      <td className="px-4 py-3">
                        {currencyShort}
                        {sessionData?.user?.salary_calculation ===
                        "monthly rate" ? (
                          <ConvertedAmount
                            amount={trade.monthly_planned_cost || 0}
                            currency={sessionData.user.currency}
                          />
                        ) : (
                          <ConvertedAmount
                            amount={trade.daily_planned_cost || 0}
                            currency={sessionData.user.currency}
                          />
                        )}
                      </td>
                    </>
                  )}
                />
              </>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      Company Projects
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Set up projects and assign locations.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {selectedProjectIds.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">
                          Delete Selected
                        </span>
                        <span className="sm:hidden">Delete</span> (
                        {selectedProjectIds.length})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 relative text-xs sm:text-sm flex-1 sm:flex-initial whitespace-nowrap"
                      onClick={() => setShowExpiredProjects(true)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Expired Projects</span>
                      <span className="sm:hidden">Expired</span> (
                      {getExpiredProjects().length})
                      {getExpiredProjects().length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {getExpiredProjects().length}
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowAddProject(true)}
                      size="sm"
                      className="bg-orange-400 hover:bg-orange-500 gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Add New Project</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </div>
                <DataTable
                  headers={[
                    "Project Name",
                    "Location Name",
                    "Start Date",
                    "End Date",
                    "Budget",
                  ]}
                  data={projects}
                  isLoading={isLoadingProjects}
                  isError={isErrorProjects}
                  onRetry={refetchProjects}
                  onEdit={(project) => {
                    setSelectedItem(project);
                    setShowEditProject(true);
                  }}
                  onDelete={(project) => {
                    setSelectedItem(project);
                    setShowDeleteProject(true);
                  }}
                  onEditBudget={(project) => {
                    setSelectedItem(project);
                    setShowEditBudget(true);
                  }}
                  onEditRate={() => {}}
                  sessionData={sessionData}
                  activeTab={activeTab}
                  selectedIds={selectedProjectIds}
                  onSelectAll={handleSelectAllProjects}
                  onToggleSelect={toggleProjectSelect}
                  renderRow={(project: NewProject) => (
                    <>
                      <td className="px-2 py-3">
                        <div className="text-sm font-medium text-gray-900 break-words leading-snug">
                          {project.project_name}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-sm text-gray-700 break-words leading-snug">
                          {project.location_name}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-sm text-gray-700 whitespace-nowrap">
                          {formatDateForDisplay(project.start_date || "")}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-sm text-gray-700 whitespace-nowrap">
                          {formatDateForDisplay(project.end_date || "")}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-sm font-medium text-gray-900 break-words leading-snug">
                          <ConvertedAmount
                            amount={project.budget || 0}
                            currency={sessionData.user.currency}
                          />
                        </div>
                      </td>
                    </>
                  )}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adding New Location</DialogTitle>
          </DialogHeader>
          <LocationForm
            onClose={() => setShowAddLocation(false)}
            refetchLocations={refetchLocations}
          />
        </DialogContent>
      </Dialog>

      {/* Add Trade Modal */}
      <Dialog open={showAddTrade} onOpenChange={setShowAddTrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adding New Trade</DialogTitle>
          </DialogHeader>
          <TradeForm
            onClose={() => setShowAddTrade(false)}
            refetchTrades={refetchTrades}
            sessionData={sessionData}
          />
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <EnhancedProjectForm
        isOpen={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSuccess={refetchProjects}
        mode="create"
      />

      {/* Edit Location Modal */}
      <Dialog open={showEditLocation} onOpenChange={setShowEditLocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <EditLocationForm
              location={selectedItem}
              onClose={() => setShowEditLocation(false)}
              refetchLocations={refetchLocations}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Location Modal */}
      <Dialog open={showDeleteLocation} onOpenChange={setShowDeleteLocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <DeleteLocationConfirmation
              location={selectedItem}
              onClose={() => setShowDeleteLocation(false)}
              refetchLocations={refetchLocations}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Trade Modal */}
      <Dialog open={showEditTrade} onOpenChange={setShowEditTrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <EditTradeForm
              trade={selectedItem}
              onClose={() => setShowEditTrade(false)}
              refetchTrades={refetchTrades}
              sessionData={sessionData}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Trade Modal */}
      <Dialog open={showDeleteTrade} onOpenChange={setShowDeleteTrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trade</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <DeleteTradeConfirmation
              trade={selectedItem}
              onClose={() => setShowDeleteTrade(false)}
              refetchTrades={refetchTrades}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <EnhancedProjectForm
        isOpen={showEditProject}
        onClose={() => setShowEditProject(false)}
        onSuccess={refetchProjects}
        editingProject={selectedItem}
        mode="edit"
      />

      {/* Delete Project Modal */}
      <Dialog open={showDeleteProject} onOpenChange={setShowDeleteProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <DeleteProjectConfirmation
              project={selectedItem}
              onClose={() => setShowDeleteProject(false)}
              refetchProjects={refetchProjects}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Budget Modal */}
      <Dialog open={showEditBudget} onOpenChange={setShowEditBudget}>
        {selectedItem && (
          <EditBudgetModal
            project={selectedItem}
            onClose={() => setShowEditBudget(false)}
            onSave={handleUpdateBudget}
            currency={sessionData?.user?.currency || "RWF"}
          />
        )}
      </Dialog>

      {/* Edit Trade Rate Modal */}
      <Dialog open={showEditTradeRate} onOpenChange={setShowEditTradeRate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedItem?.trade_name} Rate</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <EditTradeRateForm
              trade={selectedItem}
              onClose={() => setShowEditTradeRate(false)}
              refetchTrades={refetchTrades}
              sessionData={sessionData}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            {activeTab === "locations" &&
              `${selectedLocationIds.length} location(s)`}
            {activeTab === "trades" && `${selectedTradeIds.length} trade(s)`}
            {activeTab === "projects" &&
              `${selectedProjectIds.length} project(s)`}
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expired Projects Modal */}
      <Dialog open={showExpiredProjects} onOpenChange={setShowExpiredProjects}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Project Management
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Expired Projects Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Expired Projects ({getExpiredProjects().length})
                </h3>
                {expiredProjectIds.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowExpiredDeleteConfirm(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({expiredProjectIds.length})
                  </Button>
                )}
              </div>

              {getExpiredProjects().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No expired projects found</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 border-b">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={
                          expiredProjectIds.length ===
                          getExpiredProjects().length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExpiredProjectIds(
                              getExpiredProjects().map((proj) => proj.id)
                            );
                          } else {
                            setExpiredProjectIds([]);
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">Select All</span>
                    </div>
                  </div>
                  <div className="divide-y">
                    {getExpiredProjects().map((project: any) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={expiredProjectIds.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExpiredProjectIds((prev) => [
                                  ...prev,
                                  project.id,
                                ]);
                              } else {
                                setExpiredProjectIds((prev) =>
                                  prev.filter((id) => id !== project.id)
                                );
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {project.project_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {project.location_name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">
                            Expired:{" "}
                            {new Date(project.end_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.abs(
                              getDaysUntilExpiry(project.end_date) || 0
                            )}{" "}
                            days ago
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expiring Soon Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-amber-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Expiring Soon ({getExpiringSoonProjects().length})
              </h3>

              {getExpiringSoonProjects().length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No projects expiring in the next 30 days</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="divide-y">
                    {getExpiringSoonProjects().map((project: any) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {project.project_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {project.location_name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-amber-600">
                            Expires:{" "}
                            {new Date(project.end_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getDaysUntilExpiry(project.end_date)} days
                            remaining
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowExpiredProjects(false);
                setExpiredProjectIds([]);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expired Projects Delete Confirmation Modal */}
      <Dialog
        open={showExpiredDeleteConfirm}
        onOpenChange={setShowExpiredDeleteConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Expired Projects
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete {expiredProjectIds.length} expired
              project(s)?
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ This action cannot be undone
              </p>
              <p className="text-sm text-red-700">
                All project data, associated employees, and related information
                will be permanently deleted.
              </p>
            </div>

            <div className="max-h-32 overflow-y-auto">
              <p className="text-sm font-medium mb-2">
                Projects to be deleted:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {expiredProjectIds.map((id) => {
                  const project = projects.find((proj: any) => proj.id === id);
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <X className="h-3 w-3 text-red-500" />
                      {project?.project_name || `Project ID: ${id}`}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExpiredDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteExpired}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete {expiredProjectIds.length} Project(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
