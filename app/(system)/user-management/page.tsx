"use client";

import { useState, useCallback } from "react";
import { RefreshCw, Plus, Check, X, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  useGetPendingUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useApproveUserMutation,
} from "@/lib/redux/userSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ManageUsers() {
  const { toast } = useToast();

  const [currentUser] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });

  const { data: sessionData } = useSessionQuery();
  const COMPANY_ID =
    sessionData?.user?.company_id || "3a0d273c-4567-40b4-85e9-80ea8d4c7b08";

  const {
    data: users = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetPendingUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 300_000,
  });

  const [createUser] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [approveUser] = useApproveUserMutation();

  const [filters, setFilters] = useState({ role: "", search: "" });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: "",
    email: "",
    role: "",
    password: "",
    company_id: COMPANY_ID,
  });

  const handleFilterChange = (type: string, value: string) => {
    setFilters((prev) => ({ ...prev, [type]: value === "all" ? "" : value }));
  };

  const handleRefreshData = useCallback(async () => {
    try {
      toast({
        title: "Refreshing Data",
        description: "Fetching latest users...",
      });
      await refetch();
      toast({
        title: "Data Refreshed",
        description: "Users have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh users.",
        variant: "destructive",
      });
    }
  }, [refetch, toast]);

  const filteredUsers = users.filter((user: any) => {
    console.log("Checking user:", user.username);
    console.log("User role:", user.role);
    console.log("User role_request_approval:", user.role_request_approval);
    console.log("User company_id:", user.company_id);

    if (
      filters.search &&
      !user.username?.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      console.log("Excluded by search filter");
      return false;
    }

    const userRole =
      Array.isArray(user.role) && user.role.length > 0
        ? user.role[0].replace(/^{|}$/g, "")
        : "";
    if (filters.role && userRole !== filters.role) {
      console.log("Excluded by role filter");
      return false;
    }

    if (user.company_id !== COMPANY_ID) {
      console.log("Excluded by company_id filter");
      return false;
    }

    console.log("Included!");
    return true;
  });

  const handleCreateUser = async () => {
    try {
      await createUser(newUserData).unwrap();
      toast({
        title: "User Created",
        description: `Username: ${newUserData.username}`,
      });
      setShowAddUser(false);
      setNewUserData({
        username: "",
        email: "",
        role: "",
        password: "",
        company_id: COMPANY_ID,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to create user.",
        variant: "destructive",
      });
    }
  };
  const handleApproveUser = async (id: string, role: string) => {
    try {
      await approveUser({
        id,
        role, // 👈 matches UpdateRoleRequestDto
      }).unwrap();

      toast({
        title: "User Approved",
        description: `User ID ${id} approved as ${role}.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to approve user.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser({ id, company_id: COMPANY_ID }).unwrap();
      toast({ title: "User Deleted", description: `User ID ${id} removed.` });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 h-10 rounded-full"
            onClick={handleRefreshData}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            className="gap-2 h-10 rounded-full"
            onClick={() => setShowAddUser(true)}
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border mb-6 flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="flex-1"
        />
        <Select
          value={filters.role || "all"}
          onValueChange={(value) => handleFilterChange("role", value)}
        >
          <SelectTrigger className="w-[180px]">
            <span>{filters.role || "Role"}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="hr_manager">HR Manager</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="departure_manager">
              Department Manager
            </SelectItem>
          </SelectContent>
        </Select>
        {(filters.role || filters.search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ role: "", search: "" })}
            className="text-sm"
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th
                className="text-left pయ
                  p-4 font-medium text-sm text-gray-500"
              >
                User
              </th>
              <th className="text-left p-4 font-medium text-sm text-gray-500">
                Role
              </th>
              <th className="text-left p-4 font-medium text-sm text-gray-500">
                Status
              </th>
              <th className="text-left p-4 font-medium text-sm text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user: any) => {
              const userRole =
                Array.isArray(user.role) && user.role.length > 0
                  ? user.role[0].replace(/^{|}$/g, "")
                  : "N/A";
              return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.username}
                      />
                      <AvatarFallback>
                        {user.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.username}</span>
                  </td>
                  <td className="p-4">{userRole}</td>
                  <td className="p-4">{user.role_request_approval || "N/A"}</td>
                  <td className="p-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleApproveUser(user.id, userRole)}
                      title="Approve Role"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Reject Role"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No pending users found.
          </div>
        )}
      </div>

      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Input
              placeholder="Username"
              value={newUserData.username}
              onChange={(e) =>
                setNewUserData({ ...newUserData, username: e.target.value })
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={newUserData.email}
              onChange={(e) =>
                setNewUserData({ ...newUserData, email: e.target.value })
              }
            />
            <Input
              placeholder="Password"
              type="password"
              value={newUserData.password}
              onChange={(e) =>
                setNewUserData({ ...newUserData, password: e.target.value })
              }
            />
            <Select
              value={newUserData.role}
              onValueChange={(value) =>
                setNewUserData({ ...newUserData, role: value })
              }
            >
              <SelectTrigger className="w-full">
                <span>{newUserData.role || "Select Role"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hr_manager">HR Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="departure_manager">
                  Department Manager
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddUser(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
