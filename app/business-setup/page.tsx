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
  currency?: string;
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
import { useState } from "react";
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
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
  currencyShort,
  currencyValue,
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
  console.log(locations);
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

      const newTradeToAdd: any = {
        location_name: newTrade.location_name,
        trade_name: newTrade.trade_name,
      };

      // Set either monthly_planned_cost or daily_planned_cost based on salary calculation type
      if (sessionData?.user?.salary_calculation === "monthly rate") {
        newTradeToAdd.monthly_planned_cost = newTrade.monthly_planned_cost;
        // newTradeToAdd.daily_planned_cost = 0; // Set default value for the other field
      } else {
        newTradeToAdd.daily_planned_cost = newTrade.daily_planned_cost;
        // newTradeToAdd.monthly_planned_cost = 0; // Set default value for the other field
      }

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
            {currencyShort}
          </p>{" "}
          <Input
            placeholder="Enter rate"
            type="decimal"
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
}: {
  onClose: () => void;
  refetchProjects: () => void;
}) {
  const { toast } = useToast();
  const [newProject, setNewProject] = useState<NewProject>({
    project_name: "",
    location_name: "",
    currency: "USD",
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

      // Use RTK Query mutation
      await addProject(newProject).unwrap();

      // Explicitly refetch projects after successful addition
      refetchProjects();

      setNewProject({
        project_name: "",
        location_name: "",
        currency: "USD",
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Currency</label>
        <Select
          value={newProject.currency}
          onValueChange={(value) =>
            setNewProject({ ...newProject, currency: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
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
}: {
  headers: string[];
  data: any[];
  renderRow: (item: any) => React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-b text-sm text-gray-500">
            <th className="w-10 px-4 py-3 text-left"></th>
            <th className="px-4 py-3 text-left">SN</th>
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-3 text-left">
                {header}
              </th>
            ))}
            <th className="w-10 px-4 py-3 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">
                {/* <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  onChange={() => {
                    toast({
                      title: "Item Selected",
                      description: `Selected item ${index + 1}`,
                    });
                  }}
                /> */}
              </td>
              <td className="px-4 py-3">{index + 1}</td>
              {renderRow(item)}
              <td className="px-4 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
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
  currencyShort,
  currencyValue,
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
    monthly_planned_cost: trade.monthly_planned_cost?.toString() || "",
    daily_planned_cost: trade.daily_planned_cost?.toString() || "",
    trade_name: trade.trade_name,
  });

  const { data: locations = [] } = useGetLocationsQuery();
  const [updateTrade, { isLoading: isUpdatingTrade }] = useEditTradeMutation();

  const handleUpdateTrade = async () => {
    try {
      if (
        !editedTrade.location_name?.trim() ||
        !editedTrade.trade_name?.trim()
      ) {
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
          !editedTrade.monthly_planned_cost) ||
        (sessionData?.user?.salary_calculation !== "monthly rate" &&
          !editedTrade.daily_planned_cost)
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

      const tradeToUpdate: any = {
        id: trade.id,
        location_name: editedTrade.location_name,
        trade_name: editedTrade.trade_name,
      };

      // Set either monthly_planned_cost or daily_planned_cost based on salary calculation type
      if (sessionData?.user?.salary_calculation === "monthly rate") {
        tradeToUpdate.monthly_planned_cost = editedTrade.monthly_planned_cost;
        // tradeToUpdate.daily_planned_cost = 0; // Set default value for the other field
      } else {
        tradeToUpdate.daily_planned_cost = editedTrade.daily_planned_cost;
        // tradeToUpdate.monthly_planned_cost = 0; // Set default value for the other field
      }

      await updateTrade(tradeToUpdate).unwrap();
      refetchTrades();
      onClose();

      toast({
        title: "Trade Updated",
        description: `${editedTrade.trade_name} has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating trade:", error);
      toast({
        title: "Error",
        description: "Failed to update trade. Please try again.",
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
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {sessionData?.user?.salary_calculation === "monthly rate"
            ? "Monthly Rate"
            : "Daily Rate"}
        </label>
        <div className="relative">
          <p className="absolute left-[5px] top-[15px] -translate-y-1/2 h-2 w-2 text-sm text-gray-400">
            {currencyShort}
          </p>
          <Input
            placeholder="Enter rate"
            type="decimal"
            className="pl-10"
            value={
              sessionData?.user?.salary_calculation === "monthly rate"
                ? editedTrade.monthly_planned_cost * currencyValue
                : editedTrade.daily_planned_cost * currencyValue
            }
            onChange={(e) =>
              sessionData?.user?.salary_calculation === "monthly rate"
                ? setEditedTrade({
                    ...editedTrade,
                    monthly_planned_cost: e.target.value,
                  })
                : setEditedTrade({
                    ...editedTrade,
                    daily_planned_cost: e.target.value,
                  })
            }
          />
        </div>
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
}: {
  project: any;
  onClose: () => void;
  refetchProjects: () => void;
}) {
  const { toast } = useToast();
  const [editedProject, setEditedProject] = useState<NewProject>({
    project_name: project.project_name,
    location_name: project.location_name,
    currency: project.currency,
    start_date: project.start_date,
    end_date: project.end_date,
  });

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

      await updateProject({ id: project.id, ...editedProject }).unwrap();
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Currency</label>
        <Select
          value={editedProject.currency}
          onValueChange={(value) =>
            setEditedProject({ ...editedProject, currency: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
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
            value={editedProject.start_date}
            onChange={(e) =>
              setEditedProject({ ...editedProject, start_date: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="date"
            value={editedProject.end_date}
            onChange={(e) =>
              setEditedProject({ ...editedProject, end_date: e.target.value })
            }
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
    console.log("project id", project.id);
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

  const { toast } = useToast();
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
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  if (isLoading && !locations.length && !trades.length && !projects.length) {
    return (
      <div className="flex h-screen bg-[#FAFAFA]">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm text-gray-500">Loading business data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto py-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[22px] font-semibold text-gray-900">
                Business Setup
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>

            <div className="flex gap-6">
              {/* Navigation */}
              <div className="w-60 bg-white rounded-lg border border-gray-200 overflow-hidden p-3">
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "locations"
                      ? "text-gray-900 font-medium border border-gray-300 rounded-2xl bg-gray-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("locations")}
                >
                  Locations
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "trades"
                      ? "text-gray-900 font-medium border border-gray-300 rounded-2xl bg-gray-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("trades")}
                >
                  Trades
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
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
              <div className="flex-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  {/* Locations Tab */}
                  {activeTab === "locations" && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            Work Locations
                          </h2>
                          <p className="text-sm text-gray-500">
                            Define different locations where employees work.
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowAddLocation(true)}
                          className="bg-orange-400 hover:bg-orange-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Location
                        </Button>
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
                        renderRow={(location) => (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {location.location_name}
                            </div>
                          </td>
                        )}
                      />
                    </>
                  )}

                  {/* Trades Tab */}
                  {activeTab === "trades" && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            Trade/Job Role & Daily Rates
                          </h2>
                          <p className="text-sm text-gray-500">
                            Define different roles and set daily rates for each.
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowAddTrade(true)}
                          className="bg-orange-400 hover:bg-orange-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Trade
                        </Button>
                      </div>
                      <DataTable
                        headers={[
                          "Role/Trade",
                          "Location Name",
                          `${
                            sessionData?.user?.salary_calculation ===
                            "monthly rate"
                              ? "Monthly"
                              : "Daily"
                          } Rate (${currencyShort})`,
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
                              "monthly rate"
                                ? (
                                    (trade.monthly_planned_cost
                                      ? trade.monthly_planned_cost
                                      : 1) * currencyValue
                                  ).toLocaleString()
                                : (
                                    (trade.daily_planned_cost
                                      ? trade.daily_planned_cost
                                      : 1) * currencyValue
                                  ).toLocaleString()}
                            </td>
                          </>
                        )}
                      />
                    </>
                  )}

                  {/* Projects Tab */}
                  {activeTab === "projects" && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            Company Projects
                          </h2>
                          <p className="text-sm text-gray-500">
                            Set up projects and assign locations.
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowAddProject(true)}
                          className="bg-orange-400 hover:bg-orange-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Project
                        </Button>
                      </div>
                      <DataTable
                        headers={[
                          "Project Name",
                          "Location Name",
                          "Currency",
                          "Start Date",
                          "End Date",
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
                        renderRow={(project: NewProject) => (
                          <>
                            <td className="px-4 py-3">
                              {project.project_name}
                            </td>
                            <td className="px-4 py-3">
                              {project.location_name}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src="/placeholder.svg?height=20&width=20"
                                  alt="USD"
                                  className="w-5 h-5 rounded-full"
                                />
                                {project.currency}
                              </div>
                            </td>
                            <td className="px-4 py-3">{project.start_date}</td>
                            <td className="px-4 py-3">{project.end_date}</td>
                          </>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
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
            currencyShort={currencyShort}
            currencyValue={currencyValue}
            sessionData={sessionData}
          />
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adding New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onClose={() => setShowAddProject(false)}
            refetchProjects={refetchProjects}
          />
        </DialogContent>
      </Dialog>

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
              currencyShort={currencyShort}
              currencyValue={currencyValue}
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
      <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <EditProjectForm
              project={selectedItem}
              onClose={() => setShowEditProject(false)}
              refetchProjects={refetchProjects}
            />
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
