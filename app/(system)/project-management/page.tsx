"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  MapPin,
  Loader2,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSessionQuery } from "@/lib/redux/authSlice";
import {
  useGetProjectsQuery,
  useDeleteProjectMutation,
  useGetProjectWithTradesQuery,
} from "@/lib/redux/projectSlice";
import EnhancedProjectForm from "@/components/project/EnhancedProjectForm";
import { format } from "date-fns";

export default function ProjectManagement() {
  const { toast } = useToast();
  const { data: sessionData } = useSessionQuery();
  const user = sessionData?.user;

  // API hooks
  const { data: projects = [], isLoading, refetch } = useGetProjectsQuery();
  const [deleteProject] = useDeleteProjectMutation();

  // Debug: Log projects data
  console.log("Project Management - Projects data:", projects);
  console.log("Project Management - Projects loading:", isLoading);

  // State
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  // Filter projects
  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch =
      project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || getProjectStatus(project) === statusFilter;
    const matchesLocation =
      locationFilter === "all" || project.location_name === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Get unique locations for filter
  const uniqueLocations = [
    ...new Set(projects.map((p: any) => p.location_name)),
  ];

  // Helper functions
  const getProjectStatus = (project: any) => {
    const now = new Date();
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);

    if (now < startDate) return "upcoming";
    if (now > endDate) return "completed";
    return "active";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setShowEditProject(true);
  };

  const handleDeleteProject = (project: any) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;

    try {
      await deleteProject(selectedProject.id).unwrap();
      toast({
        title: "Project Deleted",
        description: `${selectedProject.project_name} has been deleted successfully.`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedProject(null);
    }
  };

  const getProjectEmployeeCount = (project: any) => {
    if (!project.trade_positions) return 0;
    return project.trade_positions.reduce((total: number, trade: any) => {
      return total + (trade.employees?.length || 0);
    }, 0);
  };

  const getProjectTradeCount = (project: any) => {
    return project.trade_positions?.length || 0;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-gray-500">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto py-8 px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Project Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage projects with trade-based employee assignments
                </p>
              </div>
              <Button
                onClick={() => setShowCreateProject(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Projects
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Projects
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      projects.filter(
                        (p: any) => getProjectStatus(p) === "active"
                      ).length
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Budget
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      projects.reduce(
                        (sum: number, p: any) => sum + (p.budget || 0),
                        0
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Employees
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {projects.reduce(
                      (sum: number, p: any) => sum + getProjectEmployeeCount(p),
                      0
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Projects Table */}
            <Card>
              <CardHeader>
                <CardTitle>Projects ({filteredProjects.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No projects found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm ||
                      statusFilter !== "all" ||
                      locationFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Get started by creating your first project"}
                    </p>
                    {!searchTerm &&
                      statusFilter === "all" &&
                      locationFilter === "all" && (
                        <Button
                          onClick={() => setShowCreateProject(true)}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Project
                        </Button>
                      )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Trades</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.project_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                              {project.location_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(
                                getProjectStatus(project)
                              )}
                            >
                              {getProjectStatus(project)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1 text-gray-400" />
                              {getProjectTradeCount(project)} trades
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1 text-gray-400" />
                              {getProjectEmployeeCount(project)} employees
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(project.budget)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                {format(
                                  new Date(project.start_date),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                              <div className="text-gray-500">
                                to{" "}
                                {format(
                                  new Date(project.end_date),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditProject(project)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProject(project)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      <EnhancedProjectForm
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={() => {
          refetch();
          setShowCreateProject(false);
        }}
        mode="create"
      />

      {/* Edit Project Modal */}
      <EnhancedProjectForm
        isOpen={showEditProject}
        onClose={() => setShowEditProject(false)}
        onSuccess={() => {
          refetch();
          setShowEditProject(false);
        }}
        editingProject={selectedProject}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProject?.project_name}"?
              This action cannot be undone and will remove all associated trade
              assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
