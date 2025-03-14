"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, RefreshCw, Building2, ChevronDown, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";

export default function Settings() {
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

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader/>    
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto py-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[22px] font-semibold text-gray-900">
                Settings & User Management
              </h1>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                  Cancel
                </button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm">
                  Save Change
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Settings Navigation */}
              <div className="w-60 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "company"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab("company")}
                >
                  Company Settings
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "user"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab("user")}
                >
                  User Settings
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "payroll"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab("payroll")}
                >
                  Payroll & Attendance
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "notifications"
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab("notifications")}
                >
                  Notifications
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1">
                {/* Company Settings Content */}
                {activeTab === "company" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    {/* Header */}
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Company Settings
                      </h2>
                      <p className="text-sm text-gray-500">
                        Set up and manage your company settings
                      </p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                      {/* Company Profile */}
                      <div className=" flex justify-between border-b border-t border-gray-200 items-center h-16">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">
                          Company Profile
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12  rounded-full bg-gray-100 flex items-center justify-center border">
                            <img src="./diamond.png"></img>
                          </div>
                          <button className="px-4 py-2 text-sm border border-gray-200 rounded-3xl hover:bg-gray-50">
                            Choose
                          </button>
                          <span className="text-sm text-gray-500">
                            JPG or PNG: 1MB max
                          </span>
                        </div>
                      </div>

                      {/* Input Fields */}
                      <div className="space-y-4">
                        {[
                          {
                            label: "Company Name",
                            value: "Digital Specification Estimation",
                            required: true,
                          },
                          {
                            label: "Business Type",
                            value: "Construction & Engineering",
                            required: true,
                          },
                          {
                            label: "Time Zone",
                            value: "GMT+3",
                            required: true,
                            dropdown: true,
                          },
                          {
                            label: "Overtime Rate",
                            value: "1.5x after 40 hrs",
                          },
                        ].map(({ label, value, required, dropdown }, index) => (
                          <div
                            key={index}
                            className="flex h-20 justify-between items-center border-b-2 border-gray-300"
                          >
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                              {label}{" "}
                              {required && (
                                <span className="text-red-500 ml-0.5">*</span>
                              )}
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                defaultValue={value}
                                className="w-[400px] px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              {dropdown && (
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Holidays */}
                        <div className="flex justify-between items-center border-b-2 border-gray-300 h-16">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Holidays{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2 border border-gray-200 h-10 rounded-lg items-center w-[400px]">
                            {["08 August 2024", "15 September 2024"].map(
                              (date, index) => (
                                <div
                                  key={index}
                                  className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-md text-sm border border-gray-300 ml-3"
                                >
                                  {date}
                                  <button className="text-red-500 hover:text-gray-600 ">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Standard Work Hours */}
                        <div className="flex justify-between items-center border-b-2 border-gray-300 h-16">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Standard Work Hours{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="flex items-center gap-2 w-[400px] ">
                            <div className="relative w-[120px] flex gap-3">
                              <input
                                type="number"
                                defaultValue="08"
                                className="w-[196px] pl-3 pr-10 h-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              <input
                                type="text"
                                defaultValue="Days"
                                className="w-[196px]  pl-3 pr-10 h-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              {/* <ChevronDown className="absolute ml-80 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /> */}
                            </div>
                          </div>
                        </div>

                        {/* Weekly Work Limit */}
                        <div className="flex justify-between items-center border-b-2 border-gray-300 h-16">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weekly Work Limit
                          </label>
                          <div className="flex justify-between items-center gap-2 border border-gray-300 rounded-md text-sm w-[400px] pr-3">
                            <input
                              type="text"
                              defaultValue="40"
                              className="w-[120px] px-3 h-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-500">hours</span>
                          </div>
                        </div>

                        {/* Over time rate */}
                        <div className="flex justify-between items-center border-b-2 border-gray-300 h-16">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Overtime Rate
                          </label>
                          <div className="flex  items-center gap-2 border border-gray-300 rounded-md text-sm w-[400px] pr-3">
                            {/* <input
                      type="text"
                      defaultValue="40"
                      className="w-[120px] px-3 h-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    /> */}
                            <div className="w-[200px] flex items-center  px-3 h-10 focus:outline-none focus:ring-2 focus:ring-orange-500">
                              1.5x after 40 hrs
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Settings Content */}
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
                                <button className="text-red-500 hover:text-gray-600 ">
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

                {/* Payroll Settings Content */}
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
                      {[
                        {
                          label: "Salary Calculation",
                          value: "Daily Rate",
                          required: true,
                          dropdown: true,
                        },
                        {
                          label: "Currency",
                          value: "USD",
                          required: true,
                          dropdown: true,

                        },
                        {
                          label: "Payslip Format",
                          value: "PDF",
                          required: true,
                          dropdown: true,
                        },
                      ].map(({ label, value, required, dropdown }, index) => (
                        <div
                          key={index}
                          className="flex h-20 justify-between items-center border-b-2 border-gray-300"
                        >
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            {label}{" "}
                            {required && (
                              <span className="text-red-500 ml-0.5">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              defaultValue={value}
                              className="w-[400px] px-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              readOnly={dropdown ? false : true}
                            />
                            {dropdown && (
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
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
                            defaultChecked
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
                          <input type="checkbox" className="sr-only peer" />
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
                            defaultChecked
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
