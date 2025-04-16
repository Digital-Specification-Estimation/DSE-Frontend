"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Save, Loader2, Plus } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { useSessionQuery } from "@/lib/redux/authSlice";

export default function Settings() {
  const [userData, setUserData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState<string>("");

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

  const { toast } = useToast();
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });

  const userSettings = [
    {
      label: "Admin",
      permissions: ["Full access"],
    },
    {
      label: "HR Manager",
      permissions: ["Approve attendance", "Manage payroll"],
    },
    {
      label: "Department Manager",
      permissions: ["View reports", "Approve leaves"],
    },
    {
      label: "Employee",
      permissions: ["View payslips", "Mark attendance"],
    },
  ];

  const [activeTab, setActiveTab] = useState("company");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    companyName: "",
    businessType: "",
    holidays: [],
    workHours: "",
    weeklyWorkLimit: "",
    overtimeRate: "",
  });

  useEffect(() => {
    if (sessionData && sessionData.user) {
      setUserData(sessionData.user);
    }
    sessionData.user.companies.map((company: any) => {
      setCompanySettings({
        companyName: company.company_name,
        businessType: company.business_type,
        holidays: company.holidays,
        workHours: company.standard_work_hours,
        weeklyWorkLimit: company.weekly_work_limit,
        overtimeRate: company.overtime_rate,
      });
    });
    console.log(companySettings);
  }, [sessionData]);

  const [payrollSettings, setPayrollSettings] = useState({
    salaryCalculation: "Daily Rate",
    currency: "USD",
    payslipFormat: "PDF",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    reminder: false,
    deadline: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      // Here you would add code to also upload the company logo file
      // if companyLogo state is not null
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSaving(false);
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
      setIsSaving(false);
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

  const handleRemovePermission = (role: string, permission: string) => {
    toast({
      title: "Permission Removed",
      description: `"${permission}" permission removed from ${role} role.`,
    });
  };

  const handleToggleNotification = (
    setting: keyof typeof notificationSettings
  ) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });

    toast({
      title: "Notification Setting Updated",
      description: `${setting} notifications ${
        notificationSettings[setting] ? "disabled" : "enabled"
      }.`,
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

  if (isLoading) {
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
                  disabled={isSaving}
                >
                  {isSaving ? (
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
                          className="flex justify-between items-center border-b-2 border-gray-300 h-16"
                        >
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            {user.label}{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2 border border-gray-200 h-10 rounded-lg items-center w-[400px]">
                            {user.permissions.map((permission, idx) => (
                              <div
                                key={`${index}-${idx}`}
                                className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-md text-sm border border-gray-300 ml-3"
                              >
                                {permission}
                                <button
                                  className="text-red-500 hover:text-gray-600"
                                  onClick={() =>
                                    handleRemovePermission(
                                      user.label,
                                      permission
                                    )
                                  }
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
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
                        <div className="relative">
                          <input
                            type="text"
                            value={payrollSettings.salaryCalculation}
                            onChange={(e) =>
                              setPayrollSettings({
                                ...payrollSettings,
                                salaryCalculation: e.target.value,
                              })
                            }
                            className="w-[400px] px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            readOnly
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="flex h-20 justify-between items-center border-b-2 border-gray-300">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Currency{" "}
                          <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={payrollSettings.currency}
                            onChange={(e) =>
                              setPayrollSettings({
                                ...payrollSettings,
                                currency: e.target.value,
                              })
                            }
                            className="w-[400px] px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                            value={payrollSettings.payslipFormat}
                            onChange={(e) =>
                              setPayrollSettings({
                                ...payrollSettings,
                                payslipFormat: e.target.value,
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
                            checked={notificationSettings.emailAlerts}
                            onChange={() =>
                              handleToggleNotification("emailAlerts")
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
                            checked={notificationSettings.reminder}
                            onChange={() =>
                              handleToggleNotification("reminder")
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
                            checked={notificationSettings.deadline}
                            onChange={() =>
                              handleToggleNotification("deadline")
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
