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
import { useUpdateUserMutation } from "@/lib/redux/userSlice";
import {
  useGetRoleSettingsQuery,
  useUpdateUserSettingsMutation,
} from "@/lib/redux/userSettingsSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const [updateUser] = useUpdateUserMutation();
  const [userData, setUserData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [newPrivilege, setNewPrivilege] = useState<string>("");
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
  // console.log("user",localStorage.getItem("user"))

  // Role-based user settings state
  const [roleSettings, setRoleSettings] = useState({
    admin: {},
    hr_manager: {},
    departure_manager: {},
    employee: {},
  });

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

  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });

  const [userSettings, setUserSettings] = useState<any[]>([]);

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
    currency: "RWF",
    payslip_format: "PDF",
    baseCurrency: "RWF", // Add baseCurrency to payrollSettings
  });

  const [notificationSettings, setNotificationSettings] = useState({
    send_email_alerts: true,
    remind_approvals: false,
    deadline_notify: true,
  });

  // Get the first company ID from the session data
  const companyId = sessionData?.user?.companies?.[0]?.id || "default";

  // Role-based settings queries
  const { data: adminUserSettings, isLoading: isLoadingAdminRoleSettings } =
    useGetRoleSettingsQuery(
      { role: "admin", companyId },
      {
        skip: !sessionData?.user?.role || !companyId || companyId === "default",
      }
    );

  const {
    data: hrManagerUserSettings,
    isLoading: isLoadingHRManagerRoleSettings,
  } = useGetRoleSettingsQuery(
    { role: "hr_manager", companyId },
    { skip: !sessionData?.user?.role || !companyId || companyId === "default" }
  );

  const {
    data: departureManagerUserSettings,
    isLoading: isLoadingDepartureManagerRoleSettings,
  } = useGetRoleSettingsQuery(
    { role: "departure_manager", companyId },
    { skip: !sessionData?.user?.role || !companyId || companyId === "default" }
  );

  const {
    data: employeeUserSettings,
    isLoading: isLoadingEmployeeRoleSettings,
  } = useGetRoleSettingsQuery(
    { role: "employee", companyId },
    { skip: !sessionData?.user?.role || !companyId || companyId === "default" }
  );

  // Update role settings when data is fetched
  useEffect(() => {
    if (adminUserSettings) {
      setRoleSettings((prev) => ({ ...prev, admin: adminUserSettings }));
    }
    if (hrManagerUserSettings) {
      setRoleSettings((prev) => ({
        ...prev,
        hr_manager: hrManagerUserSettings,
      }));
    }
    if (departureManagerUserSettings) {
      setRoleSettings((prev) => ({
        ...prev,
        departure_manager: departureManagerUserSettings,
      }));
    }
    if (employeeUserSettings) {
      setRoleSettings((prev) => ({ ...prev, employee: employeeUserSettings }));
    }
  }, [
    adminUserSettings,
    hrManagerUserSettings,
    departureManagerUserSettings,
    employeeUserSettings,
  ]);

  // Log role settings for debugging
  useEffect(() => {
    // console.log("Admin user settings:", roleSettings.admin);
    // console.log("HR Manager user settings:", roleSettings.hr_manager);
    // console.log(
    //   "Departure Manager user settings:",
    //   roleSettings.departure_manager
    // );
    // console.log("Employee user settings:", roleSettings.employee);
  }, [roleSettings]);

  // RTK Query hooks
  const { data: companyData, isLoading: isCompanyLoading } = useGetCompanyQuery(
    companyId,
    {
      skip: !companyId || companyId === "default",
    }
  );

  const [updateCompany, { isLoading: isUpdating }] = useEditCompanyMutation();
  const [updateUserSettings, { isLoading: isUpdatingUserSettings }] =
    useUpdateUserSettingsMutation();
  const { toast } = useToast();

  useEffect(() => {
    if (sessionData?.user) {
      setUserData(sessionData.user);
      setPayrollSettings({
        salary_calculation: sessionData.user?.salary_calculation
          ? sessionData.user?.salary_calculation
          : "daily rate",
        payslip_format: sessionData.user?.payslip_format
          ? sessionData.user?.payslip_format
          : "PDF",
        currency: sessionData.user?.currency
          ? sessionData.user?.currency
          : "RWF",
        baseCurrency: sessionData?.user?.companies?.[0]?.base_currency || "RWF",
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
          console.log(`https://dse-backend-uv5d.onrender.com0/${company.company_profile}`);
          setCompanyLogo(`https://dse-backend-uv5d.onrender.com0/${company.company_profile}`);
        }
      }

      setIsLoading(false);
    }
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

  // Define all possible settings with their labels and default values
  const allSettings = [
    { key: "approve_attendance", label: "Approve Attendance" },
    { key: "approve_leaves", label: "Approve Leaves" },
    { key: "full_access", label: "Full Access" },
    { key: "generate_reports", label: "Generate Reports" },
    { key: "manage_employees", label: "Manage Employees" },
    { key: "manage_payroll", label: "Manage Payroll" },
    { key: "mark_attendance", label: "Mark Attendance" },
    { key: "view_payslip", label: "View Payslip" },
    { key: "view_reports", label: "View Reports" },
  ];

  // Get the current settings for a role with default values
  const getRoleSettings = (role: string) => {
    const settings = roleSettings[role as keyof typeof roleSettings] || {};
    // Ensure all settings have a boolean value
    return allSettings.reduce(
      (acc, setting) => ({
        ...acc,
        [setting.key]: settings[setting.key] || false,
      }),
      {}
    );
  };

  // Handle toggle for a specific setting
  const handleToggleSetting = (role: string, settingKey: string) => {
    const currentSettings = getRoleSettings(role);

    // Update role settings
    setRoleSettings((prev) => ({
      ...prev,
      [role]: {
        ...prev[role as keyof typeof prev],
        [settingKey]: !currentSettings[settingKey],
      },
    }));
  };

  // Save role settings
  const handleSaveRoleSettings = async (role: string) => {
    try {
      const id = roleSettings[role as keyof typeof roleSettings]?.id;
      if (!id) {
        toast({
          title: "Error",
          description:
            "No settings found for this role. Please ensure you have a company set up.",
          variant: "destructive",
        });
        return;
      }

      const settings = getRoleSettings(role);
      console.log(`settings role update ${role} and settings ${settings}`);
      console.log(`approve attendance ${settings.approve_attendance}`);
      console.log(`approve leaves ${settings.approve_leaves}`);
      console.log(`full access ${settings.full_access}`);
      console.log(`generate reports ${settings.generate_reports}`);
      console.log(`manage employees ${settings.manage_employees}`);
      console.log(`manage payroll ${settings.manage_payroll}`);
      console.log(`mark attendance ${settings.mark_attendance}`);
      console.log(`view payslip ${settings.view_payslip}`);
      console.log(`view reports ${settings.view_reports}`);
      console.log(`id ${id}`);
      await updateUserSettings({
        id,
        updates: settings,
      }).unwrap();
      toast({
        title: "Settings Saved",
        description: `${role.replace("_", " ")} settings have been updated.`,
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

  const handleSaveCompanySettings = async () => {
    try {
      // Create a FormData object to handle file upload
      const formData = new FormData();

      // Add company ID
      formData.append("id", companyId);

      // Only add modified fields to the FormData
      if (companyData.company_name !== companySettings.companyName) {
        formData.append("company_name", companySettings.companyName);
      }

      if (companyData.business_type !== companySettings.businessType) {
        formData.append("business_type", companySettings.businessType);
      }

      // For arrays like holidays, check if they've changed
      if (
        JSON.stringify(companyData.holidays) !==
        JSON.stringify(companySettings.holidays)
      ) {
        formData.append("holidays", JSON.stringify(companySettings.holidays));
      }

      if (companyData.standard_work_hours !== companySettings.workHours) {
        formData.append("standard_work_hours", companySettings.workHours);
      }

      if (companyData.weekly_work_limit !== companySettings.weeklyWorkLimit) {
        formData.append("weekly_work_limit", companySettings.weeklyWorkLimit);
      }

      if (companyData.overtime_rate !== companySettings.overtimeRate) {
        formData.append("overtime_rate", companySettings.overtimeRate);
      }

      // Add the logo file if it exists
      if (logoFile) {
        formData.append("image", logoFile);
      }

      // Only make the API call if there are changes
      if ([...formData.entries()].length > 1) {
        // More than just the ID
        // Call the RTK Query mutation
        const result = await updateCompany(formData).unwrap();

        toast({
          title: "Company Settings Saved",
          description: "Your company settings have been updated successfully.",
        });
      } else {
        toast({
          title: "No Changes",
          description: "No changes were detected in company settings.",
        });
      }
    } catch (error) {
      console.error("Error saving company settings:", error);
      toast({
        title: "Error",
        description: "Failed to save company settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSavePayrollSettings = async () => {
    try {
      // Create an object to hold only the modified fields
      const updatedFields: any = { id: sessionData.user.id };
      let hasChanges = false;

      // Check each field for changes
      if (
        sessionData.user.salary_calculation !==
        payrollSettings.salary_calculation
      ) {
        updatedFields.salary_calculation = payrollSettings.salary_calculation;
        hasChanges = true;
      }

      if (sessionData.user.currency !== payrollSettings.currency) {
        updatedFields.currency = payrollSettings.currency;
        hasChanges = true;
      }

      if (sessionData.user.payslip_format !== payrollSettings.payslip_format) {
        updatedFields.payslip_format = payrollSettings.payslip_format;
        hasChanges = true;
      }

      const formData = new FormData();
      if (payrollSettings.baseCurrency) {
        formData.append("base_currency", payrollSettings.baseCurrency);
        hasChanges = true;
      }
      if (hasChanges) {
        // Add company ID
        formData.append("id", companyId);
        const result = await updateCompany(formData);
        console.log("updatedFields being sent to updateUser:", updatedFields);
        try {
          const result2 = await updateUser(updatedFields);
          console.log("result2", result2);
        } catch (error) {
          console.error("Error updating user:", error);
          toast({
            title: "Error",
            description: "Failed to update user. Please try again.",
            variant: "destructive",
          });
        }
        console.log("result", result);

        toast({
          title: "Payroll Settings Saved",
          description: "Your payroll settings have been updated successfully.",
        });
      } else {
        toast({
          title: "No Changes",
          description: "No changes were detected in payroll settings.",
        });
      }
    } catch (error) {
      console.error("Error saving payroll settings:", error);
      toast({
        title: "Error",
        description: "Failed to save payroll settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      // Create an object to hold only the modified fields
      const updatedFields: any = { id: sessionData.user.id };
      let hasChanges = false;

      // Check each notification setting for changes
      if (
        sessionData.user.send_email_alerts !==
        notificationSettings.send_email_alerts
      ) {
        updatedFields.send_email_alerts =
          notificationSettings.send_email_alerts;
        hasChanges = true;
      }

      if (
        sessionData.user.remind_approvals !==
        notificationSettings.remind_approvals
      ) {
        updatedFields.remind_approvals = notificationSettings.remind_approvals;
        hasChanges = true;
      }

      if (
        sessionData.user.deadline_notify !==
        notificationSettings.deadline_notify
      ) {
        updatedFields.deadline_notify = notificationSettings.deadline_notify;
        hasChanges = true;
      }

      if (hasChanges) {
        await updateUser(updatedFields);
        toast({
          title: "Notification Settings Saved",
          description:
            "Your notification settings have been updated successfully.",
        });
      } else {
        toast({
          title: "No Changes",
          description: "No changes were detected in notification settings.",
        });
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create a new function to save all settings based on the active tab
  const handleSaveSettings = async () => {
    try {
      switch (activeTab) {
        case "company":
          await handleSaveCompanySettings();
          break;
        case "payroll":
          await handleSavePayrollSettings();
          break;
        case "notifications":
          await handleSaveNotificationSettings();
          break;
        default:
          // Save all settings if no specific tab is active
          await Promise.all([
            handleSaveCompanySettings(),
            handleSavePayrollSettings(),
            handleSaveNotificationSettings(),
          ]);

          toast({
            title: "All Settings Saved",
            description: "All your settings have been updated successfully.",
          });
      }
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

  const formatSnakeCase = (str: string): string => {
    return str
      .trim() // remove leading/trailing spaces
      .split("_") // split by underscore
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize first letter
      .join(" "); // join with space
  };

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
                      Save All Changes
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
                {/* <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "notifications"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("notifications")}
                >
                  Notifications
                </button> */}
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
                    <div className="flex justify-end mt-6">
                      <button
                        className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm flex items-center gap-2"
                        onClick={handleSaveCompanySettings}
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
                            Save Company Settings
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "user" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        User Role Permissions
                      </h2>
                      <p className="text-sm text-gray-500">
                        Configure permissions for each user role
                      </p>
                    </div>

                    {companyId === "default" ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">
                          No company found. Please create a company first to
                          manage user settings.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="border-b border-gray-200">
                          <nav className="-mb-px flex space-x-8">
                            {[
                              "admin",
                              "hr_manager",
                              "departure_manager",
                              "employee",
                            ].map((role) => (
                              <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                  selectedRole === role
                                    ? "border-orange-500 text-orange-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                              >
                                {role
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </button>
                            ))}
                          </nav>
                        </div>

                        {selectedRole && (
                          <div className="space-y-6">
                            <div className="grid gap-4">
                              {allSettings.map((setting) => {
                                const currentSettings =
                                  getRoleSettings(selectedRole);
                                const isEnabled = currentSettings[setting.key];

                                return (
                                  <div
                                    key={setting.key}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                                  >
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-900">
                                        {setting.label}
                                      </h4>
                                      <p className="text-xs text-gray-500">
                                        {isEnabled ? "Enabled" : "Disabled"}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleSetting(
                                          selectedRole,
                                          setting.key
                                        )
                                      }
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                                        isEnabled
                                          ? "bg-orange-500"
                                          : "bg-gray-200"
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                          isEnabled
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-end pt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveRoleSettings(selectedRole)
                                }
                                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm flex items-center gap-2 hover:bg-orange-600"
                              >
                                <Save className="h-4 w-4" />
                                Save{" "}
                                {selectedRole
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}{" "}
                                Settings
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                              <SelectItem value="RWF">RWF</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="JPY">JPY</SelectItem>
                              <SelectItem value="CNY">CNY</SelectItem>
                              <SelectItem value="INR">INR</SelectItem>
                              <SelectItem value="ZAR">ZAR</SelectItem>
                              <SelectItem value="KES">KES</SelectItem>
                              <SelectItem value="UGX">UGX</SelectItem>
                              <SelectItem value="TZS">TZS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex h-20 justify-between items-center border-b-2 border-gray-300">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Base Currency{" "}
                          <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="w-[400px]">
                          <Select
                            value={payrollSettings.baseCurrency}
                            onValueChange={(value) =>
                              setPayrollSettings({
                                ...payrollSettings,
                                baseCurrency: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RWF">RWF</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="JPY">JPY</SelectItem>
                              <SelectItem value="CNY">CNY</SelectItem>
                              <SelectItem value="INR">INR</SelectItem>
                              <SelectItem value="ZAR">ZAR</SelectItem>
                              <SelectItem value="KES">KES</SelectItem>
                              <SelectItem value="UGX">UGX</SelectItem>
                              <SelectItem value="TZS">TZS</SelectItem>
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
                    <div className="flex justify-end mt-6">
                      <button
                        className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm flex items-center gap-2"
                        onClick={handleSavePayrollSettings}
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
                            Save Payroll Settings
                          </>
                        )}
                      </button>
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
                    <div className="flex justify-end mt-6">
                      <button
                        className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm flex items-center gap-2"
                        onClick={handleSaveNotificationSettings}
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
                            Save Notification Settings
                          </>
                        )}
                      </button>
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
