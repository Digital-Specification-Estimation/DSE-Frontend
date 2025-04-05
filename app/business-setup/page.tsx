"use client";

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
  daily_planned_cost?: number;
  location_name?: string;
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
} from "@/lib/redux/locationSlice";
import {
  useAddTradeMutation,
  useGetTradesQuery,
} from "@/lib/redux/tradePositionSlice";
import {
  useAddProjectMutation,
  useGetProjectsQuery,
} from "@/lib/redux/projectSlice";

// Separate Location Form Component
function LocationForm({ onClose }: { onClose: () => void }) {
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
function TradeForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [newTrade, setNewTrade] = useState({
    location_name: "",
    daily_planned_cost: "",
    trade_name: "",
  });

  const { data: locations = [] } = useGetLocationsQuery();
  console.log(locations);
  const [addTrade, { isLoading: isAddingTrade }] = useAddTradeMutation();

  const handleAddTrade = async () => {
    try {
      if (
        !newTrade.location_name?.trim() ||
        !newTrade.daily_planned_cost ||
        !newTrade.trade_name?.trim()
      ) {
        toast({
          title: "Validation Error",
          description: "All trade fields are required.",
          variant: "destructive",
        });
        return;
      }
      const newTradeToAdd: any = {
        location_name: newTrade.location_name,
        daily_planned_cost: newTrade.daily_planned_cost,
        trade_name: newTrade.trade_name,
      };
      // Use RTK Query mutation
      await addTrade(newTradeToAdd).unwrap();

      setNewTrade({
        location_name: "",
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
        <label className="text-sm font-medium">Daily Rate</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Enter rate"
            type="decimal"
            className="pl-10"
            value={newTrade.daily_planned_cost}
            onChange={(e) =>
              setNewTrade({ ...newTrade, daily_planned_cost: e.target.value })
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
function ProjectForm({ onClose }: { onClose: () => void }) {
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
}: {
  headers: string[];
  data: any[];
  renderRow: (item: any) => React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
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
            <th className="w-10 px-4 py-3 text-left">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                onChange={() => {
                  toast({
                    title: "Select All",
                    description: "All items selected",
                  });
                }}
              />
            </th>
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
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  onChange={() => {
                    toast({
                      title: "Item Selected",
                      description: `Selected item ${index + 1}`,
                    });
                  }}
                />
              </td>
              <td className="px-4 py-3">{index + 1}</td>
              {renderRow(item)}
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Options",
                      description: "Item options menu opened",
                    });
                  }}
                >
                  ...
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main Business Setup Component
export default function BusinessSetup() {
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
                          "Daily Rate ($)",
                        ]}
                        data={trades}
                        isLoading={isLoadingTrades}
                        isError={isErrorTrades}
                        onRetry={refetchTrades}
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
                              ${trade.daily_planned_cost}
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
          <LocationForm onClose={() => setShowAddLocation(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Trade Modal */}
      <Dialog open={showAddTrade} onOpenChange={setShowAddTrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adding New Trade</DialogTitle>
          </DialogHeader>
          <TradeForm onClose={() => setShowAddTrade(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adding New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm onClose={() => setShowAddProject(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
