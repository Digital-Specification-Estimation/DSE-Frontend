"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Save, Loader2, Plus } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { useSessionQuery } from "@/lib/redux/authSlice";
import {
  useEditCompanyMutation,
  useGetCompanyQuery,
} from "@/lib/redux/companySlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetPrevielegesQuery,
  useUpdatePrevielegesMutation,
  useUpdateUserMutation,
} from "@/lib/redux/userSlice";
export default function Settings() {
  const [updateUser] = useUpdateUserMutation();
  const [updatePrevielges] = useUpdatePrevielegesMutation();
  const [userData, setUserData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [newPrivilege, setNewPrivilege] = useState<string>("");
  const [availablePrivileges] = useState([
    "Full access",
    "Approve attendance",
    "Manage payroll",
    "View reports",
    "Approve leaves",
    "View payslips",
    "Mark attendance",
    "Manage employees",
    "Generate reports",
  ]);

  const {
    data: sessionData = { user: { companies: [] } },
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
  const { data: previelegesFetched } = useGetPrevielegesQuery();

  // Get the first company ID from the session data
  const companyId = sessionData?.user?.companies?.[0]?.id || "default";

  // RTK Query hooks
  const { data: companyData, isLoading: isCompanyLoading } = useGetCompanyQuery(
    companyId,
    {
      skip: !companyId || companyId === "default",
    }
  );

  const [updateCompany, { isLoading: isUpdating }] = useEditCompanyMutation();

  const { toast } = useToast();
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });
  console.log("previelegesFetched", previelegesFetched);
  const [userSettings, setUserSettings] = useState([]);
  useEffect(() => {
    if (previelegesFetched) {
      setUserSettings(previelegesFetched);
    }
  }, [previelegesFetched]);
  console.log("user settings check", userSettings);

  const [activeTab, setActiveTab] = useState("company");
  const [isLoading, setIsLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState({
    companyName: "",
    businessType: "",
    holidays: [] as string[],
    workHours: "",
    weeklyWorkLimit: "",
    overtimeRate: "",
  });

  const [payrollSettings, setPayrollSettings] = useState({
    salary_calculation: "daily rate",
    currency: "USD1",
    payslip_format: "PDF",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    send_email_alerts: true,
    remind_approvals: false,
    deadline_notify: true,
  });

  // Update local state when company data is loaded
  useEffect(() => {
    if (companyData) {
      setCompanySettings({
        companyName: companyData.company_name,
        businessType: companyData.business_type,
        holidays: companyData.holidays,
        workHours: companyData.standard_work_hours,
        weeklyWorkLimit: companyData.weekly_work_limit,
        overtimeRate: companyData.overtime_rate,
      });
      if (companyData.company_profile) {
        console.log(`http://localhost:4000/${companyData.company_profile}`);
        setCompanyLogo(`http://localhost:4000/${companyData.company_profile}`);
      }
    }
  }, [companyData]);

  // Update local state from session data
  useEffect(() => {
    if (sessionData && sessionData.user) {
      setUserData(sessionData.user);
    }
    console.log(sessionData.user);
    setPayrollSettings({
      salary_calculation: sessionData.user?.salary_calculation
        ? sessionData.user?.salary_calculation
        : "daily rate",
      payslip_format: sessionData.user?.payslip_format
        ? sessionData.user?.payslip_format
        : "PDF",
      currency: sessionData.user?.currency
        ? sessionData.user?.currency
        : "USD1",
    });
    setNotificationSettings({
      send_email_alerts: sessionData.user?.send_email_alerts
        ? sessionData.user?.send_email_alerts
        : false,
      deadline_notify: sessionData.user?.deadline_notify
        ? sessionData.user?.deadline_notify
        : false,
      remind_approvals: sessionData.user?.remind_approvals
        ? sessionData.user?.remind_approvals
        : false,
    });
    if (sessionData.user?.companies?.length > 0) {
      const company = sessionData.user.companies[0];
      setCompanySettings({
        companyName: company.company_name,
        businessType: company.business_type,
        holidays: company.holidays || [],
        workHours: company.standard_work_hours,
        weeklyWorkLimit: company.weekly_work_limit,
        overtimeRate: company.overtime_rate,
      });
      if (company.company_profile) {
        console.log(`http://localhost:4000/${company.company_profile}`);
        setCompanyLogo(`http://localhost:4000/${company.company_profile}`);
      }
    }

    setIsLoading(false);
  }, [sessionData]);
  const splitCurrencyValue = (str: string | undefined | null) => {
    if (!str) return null; // return early if str is undefined or null
    const match = str.match(/^([A-Z]+)([\d.]+)$/);
    if (!match) return null;
    return {
      currency: match[1],
      value: match[2],
    };
  };

  const currencyVaue = Number(
    splitCurrencyValue(sessionData.user.currency)?.value
  );
  // console.log("user currency", sessionData.user.currency);
  const handleSaveSettings = async () => {
    try {
      // Create a FormData object to handle file upload
      const formData = new FormData();

      // Add all company settings to the FormData
      formData.append("id", companyId);
      formData.append("company_name", companySettings.companyName);
      formData.append("business_type", companySettings.businessType);
      companySettings.holidays.forEach((holiday: any) => {
        formData.append("holidays", holiday);
      });
      formData.append("standard_work_hours", companySettings.workHours);
      formData.append("weekly_work_limit", companySettings.weeklyWorkLimit);
      formData.append("overtime_rate", companySettings.overtimeRate);

      // Add the logo file if it exists
      if (logoFile) {
        formData.append("image", logoFile);
      }
      console.log(
        "notification settings on handle save ",
        notificationSettings
      );
      await updatePrevielges(userSettings);
      await updateUser({ ...payrollSettings, id: sessionData.user.id });
      await updateUser({ ...notificationSettings, id: sessionData.user.id });
      // Call the RTK Query mutation
      const result = await updateCompany(formData).unwrap();

      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveHoliday = (holiday: string) => {
    setCompanySettings({
      ...companySettings,
      holidays: companySettings.holidays.filter((h) => h !== holiday),
    });
    toast({
      title: "Holiday Removed",
      description: `${holiday} has been removed from holidays.`,
    });
  };
  function formatSnakeCase(str: string): string {
    return str
      .trim() // remove leading/trailing spaces
      .split("_") // split by underscore
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize first letter
      .join(" "); // join with space
  }

  const handleAddHoliday = () => {
    if (!newHoliday.trim()) {
      toast({
        title: "Error",
        description: "Please enter a holiday name",
        variant: "destructive",
      });
      return;
    }

    // Check if the holiday already exists
    if (companySettings.holidays.includes(newHoliday)) {
      toast({
        title: "Error",
        description: "This holiday already exists",
        variant: "destructive",
      });
      return;
    }

    // Add the new holiday to the array
    setCompanySettings({
      ...companySettings,
      holidays: [...companySettings.holidays, newHoliday],
    });

    // Clear the input
    setNewHoliday("");

    toast({
      title: "Holiday Added",
      description: `${newHoliday} has been added to holidays.`,
    });
  };
  console.log("user settings", userSettings);
  const handleRemovePermission = (role: string, permission: string) => {
    const updatedSettings = userSettings.map((setting) => {
      if (setting.role === role) {
        return {
          ...setting,
          permissions: setting.permissions.filter((p) => p !== permission),
        };
      }
      return setting;
    });

    setUserSettings(updatedSettings);

    toast({
      title: "Permission Removed",
      description: `"${permission}" permission removed from ${role} role.`,
    });
  };

  const handleAddPrivilege = (role: string) => {
    if (!newPrivilege.trim()) {
      toast({
        title: "Error",
        description: "Please select a privilege to add",
        variant: "destructive",
      });
      console.log("new previelege on adding ", newPrivilege);
      return;
    }

    // Find the role in userSettings
    const updatedSettings = userSettings.map((setting) => {
      if (setting.role === role) {
        // Check if the privilege already exists
        if (setting.permissions.includes(newPrivilege)) {
          toast({
            title: "Error",
            description: "This privilege already exists for this role",
            variant: "destructive",
          });
          return setting;
        }

        // Add the new privilege
        return {
          ...setting,
          permissions: [...setting.permissions, newPrivilege],
        };
      }
      return setting;
    });

    // Update the state
    setUserSettings(updatedSettings);
    setNewPrivilege("");
    setSelectedRole(null);

    toast({
      title: "Privilege Added",
      description: `"${newPrivilege}" privilege added to ${role} role.`,
    });
  };

  const handleToggleNotification = (
    setting: keyof typeof notificationSettings
  ) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1MB max)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 1MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.match("image/jpeg|image/png")) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image",
        variant: "destructive",
      });
      return;
    }

    // Store the file for later upload
    setLogoFile(file);

    // Create object URL for preview
    const imageUrl = URL.createObjectURL(file);
    setCompanyLogo(imageUrl);

    toast({
      title: "Image Selected",
      description:
        "Company logo has been selected and will be saved with your changes.",
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (isLoading || isCompanyLoading) {
    return (
      <div className="flex h-screen bg-[#FAFAFA]">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm text-gray-500">Loading settings...</p>
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
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto py-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[22px] font-semibold text-gray-900">
                Settings & User Management
              </h1>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => {
                    toast({
                      title: "Changes Discarded",
                      description: "Your changes have been discarded.",
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm flex items-center gap-2"
                  onClick={handleSaveSettings}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Change
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-60 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "company"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("company")}
                >
                  Company Settings
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "user"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("user")}
                >
                  User Settings
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "payroll"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("payroll")}
                >
                  Payroll & Attendance
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "notifications"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("notifications")}
                >
                  Notifications
                </button>
              </div>

              <div className="flex-1">
                {activeTab === "company" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Company Settings
                      </h2>
                      <p className="text-sm text-gray-500">
                        Set up and manage your company settings
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between border-b border-t border-gray-200 items-center h-16">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">
                          Company Profile
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border overflow-hidden">
                            {companyLogo ? (
                              <img
                                src={companyLogo || "/placeholder.svg"}
                                alt="Company Logo"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img src="./diamond.png" alt="Default Logo" />
                            )}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg, image/png"
                            onChange={handleFileChange}
                          />
                          <button
                            className="px-4 py-2 text-sm border border-gray-200 rounded-3xl hover:bg-gray-50"
                            onClick={triggerFileInput}
                          >
                            Choose
                          </button>
                          <span className="text-sm text-gray-500">
                            JPG or PNG: 1MB max
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex h-20 justify-between items-center border-b-2 border-gray-300">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Company Name{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={companySettings.companyName}
                              onChange={(e) =>
                                setCompanySettings({
                                  ...companySettings,
                                  companyName: e.target.value,
                                })
                              }
                              className="w-[400px] px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>

                        <div className="flex h-20 justify-between items-center border-b-2 border-gray-300">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Business Type{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={companySettings.businessType}
                              onChange={(e) =>
                                setCompanySettings({
                                  ...companySettings,
                                  businessType: e.target.value,
                                })
                              }
                              className="w-[400px] px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col justify-between border-b-2 border-gray-300 py-4">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                            Holidays{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2 border border-gray-200 min-h-10 p-2 rounded-lg w-full mb-3">
                            {companySettings.holidays.map((date, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-md text-sm border border-gray-300"
                              >
                                {date}
                                <button
                                  className="text-red-500 hover:text-gray-600"
                                  onClick={() => handleRemoveHoliday(date)}
                                  type="button"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* New holiday input field */}
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={newHoliday}
                              onChange={(e) => setNewHoliday(e.target.value)}
                              placeholder="Add new holiday"
                              className="flex-1 px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                              type="button"
                              onClick={handleAddHoliday}
                              className="px-3 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-b-2 border-gray-300 h-16">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Standard Work Hours{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="flex items-center gap-2 w-[400px]">
                            <div className="relative w-[120px] flex gap-3">
                              <input
                                type="number"
                                value={companySettings.workHours}
                                onChange={(e) =>
                                  setCompanySettings({
                                    ...companySettings,
                                    workHours: e.target.value,
                                  })
                                }
                                className="w-[196px] pl-3 pr-10 h-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-b-2 border-gray-300 h-16">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weekly Work Limit
                          </label>
                          <div className="flex justify-between items-center gap-2 border border-gray-300 rounded-md text-sm w-[400px] pr-3">
                            <input
                              type="text"
                              value={companySettings.weeklyWorkLimit}
                              onChange={(e) =>
                                setCompanySettings({
                                  ...companySettings,
                                  weeklyWorkLimit: e.target.value,
                                })
                              }
                              className="w-[120px] px-3 h-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-500">hours</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-b-2 border-gray-300 h-16">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Overtime Rate
                          </label>
                          <div className="flex items-center gap-2 border border-gray-300 rounded-md text-sm w-[400px] pr-3">
                            <div className="w-[200px] flex items-center px-3 h-10 focus:outline-none focus:ring-2 focus:ring-orange-500">
                              {companySettings.overtimeRate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "user" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        User Settings
                      </h2>
                      <p className="text-sm text-gray-500">
                        Set up and manage your user settings
                      </p>
                    </div>

                    <div className="space-y-6">
                      {userSettings.map((user, index) => (
                        <div
                          key={index}
                          className="flex flex-col border-b-2 border-gray-300 py-4"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <label className="flex items-center text-sm font-medium text-gray-700">
                              {user.role}{" "}
                              <span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <button
                              onClick={() =>
                                setSelectedRole(
                                  selectedRole === user.role ? null : user.role
                                )
                              }
                              className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                            >
                              {selectedRole === user.role
                                ? "Cancel"
                                : "Add Privilege"}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 border border-gray-200 min-h-10 p-2 rounded-lg w-full mb-3">
                            {user.permissions.map(
                              (permission: any, idx: any) => (
                                <div
                                  key={`${index}-${idx}`}
                                  className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-md text-sm border border-gray-300"
                                >
                                  {formatSnakeCase(permission)}
                                  <button
                                    className="text-red-500 hover:text-gray-600"
                                    onClick={() =>
                                      handleRemovePermission(
                                        user.role,
                                        permission
                                      )
                                    }
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )
                            )}
                          </div>

                          {selectedRole === user.role && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="relative flex-1">
                                <select
                                  value={newPrivilege}
                                  onChange={(e) =>
                                    setNewPrivilege(e.target.value)
                                  }
                                  className="w-full px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                                >
                                  <option value="">Select a privilege</option>
                                  {availablePrivileges.map((privilege) => (
                                    <option key={privilege} value={privilege}>
                                      {privilege}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddPrivilege(user.role)}
                                className="px-3 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "payroll" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Payroll & Attendance Settings
                      </h2>
                      <p className="text-sm text-gray-500">
                        Set up and manage your Payroll & Attendance Settings
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex h-20 justify-between items-center border-b-2 border-gray-300">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Salary Calculation{" "}
                          <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="w-[400px]">
                          <Select
                            value={payrollSettings.salary_calculation}
                            onValueChange={(value) =>
                              setPayrollSettings({
                                ...payrollSettings,
                                salary_calculation: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily rate">
                                Daily rate
                              </SelectItem>

                              <SelectItem value="monthly rate">
                                Monthly rate
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex h-20 justify-between items-center border-b-2 border-gray-300">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Currency{" "}
                          <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="w-[400px]">
                          <Select
                            value={payrollSettings.currency}
                            onValueChange={(value) =>
                              setPayrollSettings({
                                ...payrollSettings,
                                currency: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD1">USD</SelectItem>
                              <SelectItem value="RWF1251.00">RWF</SelectItem>
                              <SelectItem value="EUR0.9200">EUR</SelectItem>
                              <SelectItem value="GBP0.7508">GBP</SelectItem>
                              <SelectItem value="JPY142.7850">JPY</SelectItem>
                              <SelectItem value="CNY7.2893">CNY</SelectItem>
                              <SelectItem value="INR85.36">INR</SelectItem>
                              <SelectItem value="ZAR18.7066">ZAR</SelectItem>
                              <SelectItem value="KES129.3550">KES</SelectItem>
                              <SelectItem value="UGX3664.42">UGX</SelectItem>
                              <SelectItem value="TZS2673.02">TZS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex h-20 justify-between items-center border-b-2 border-gray-300">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Payslip Format{" "}
                          <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={payrollSettings.payslip_format}
                            onChange={(e) =>
                              setPayrollSettings({
                                ...payrollSettings,
                                payslip_format: e.target.value,
                              })
                            }
                            className="w-[400px] px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            readOnly
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Content */}
                {activeTab === "notifications" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Notifications & Alerts
                      </h2>
                      <p className="text-sm text-gray-500">
                        Manage notification and alerts for your system.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Email Alerts
                          </h3>
                          <p className="text-sm text-gray-500">
                            Send email alerts for late attendance
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.send_email_alerts}
                            onChange={() =>
                              handleToggleNotification("send_email_alerts")
                            }
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Reminder
                          </h3>
                          <p className="text-sm text-gray-500">
                            Remind employees of pending approvals
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.remind_approvals}
                            onChange={() =>
                              handleToggleNotification("remind_approvals")
                            }
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Deadline
                          </h3>
                          <p className="text-sm text-gray-500">
                            Notify HR of payroll processing deadline
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.deadline_notify}
                            onChange={() =>
                              handleToggleNotification("deadline_notify")
                            }
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
