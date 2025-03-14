"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, RefreshCw, Building2, ChevronDown, X } from "lucide-react"
import { Sidebar } from "@/components/sidebar"

export default function Settings() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [activeTab, setActiveTab] = useState("company")

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white h-[72px] px-6 flex items-center justify-between border-b border-gray-200">
          <div className="relative w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-[#FAFAFA] text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
            <button className="flex items-center gap-2 px-4 h-10 bg-[#4052FF] text-white rounded-full text-sm">
              <Building2 className="h-4 w-4" />
              Total Payroll $25,000
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto py-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[22px] font-semibold text-gray-900">Settings & User Management</h1>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">Cancel</button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm">Save Change</button>
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
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Company Settings</h2>
                      <p className="text-sm text-gray-500">Set up and manage your company settings</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Company Profile</h3>
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                            <div className="h-8 w-8">
                              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-gray-400">
                                <path d="M12 15L8.5 9L15.5 9L12 15Z" fill="currentColor" />
                              </svg>
                            </div>
                          </div>
                          <button className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">
                            Choose
                          </button>
                          <span className="text-sm text-gray-500">JPG or PNG: 1MB max</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Company Name <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <input
                            type="text"
                            defaultValue="Digital Specification Estimation"
                            className="w-full px-3 h-10 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Business Type <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <input
                            type="text"
                            defaultValue="Construction & Engineering"
                            className="w-full px-3 h-10 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Time Zone <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              defaultValue="GMT+3"
                              className="w-full pl-3 pr-10 h-10 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Holidays <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              08 August 2024
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              15 September 2024
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            Standard Work Hours <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative w-[120px]">
                              <input
                                type="text"
                                defaultValue="08"
                                className="w-full pl-3 pr-10 h-10 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500">Days</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Work Limit</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              defaultValue="40"
                              className="w-[120px] px-3 h-10 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-500">hours</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Rate</label>
                          <input
                            type="text"
                            defaultValue="1.5x after 40 hrs"
                            className="w-full px-3 h-10 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Settings Content */}
                {activeTab === "user" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">User Settings</h2>
                      <p className="text-sm text-gray-500">Set up and manage your user settings</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Admin <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <div className="flex items-center gap-2 w-full pl-3 pr-10 h-10 border border-gray-200 rounded-md">
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              Full access
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          HR Manager <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <div className="flex items-center gap-2 w-full pl-3 pr-10 h-10 border border-gray-200 rounded-md">
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              Approve attendance
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              Manage payroll
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Department Manager <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <div className="flex items-center gap-2 w-full pl-3 pr-10 h-10 border border-gray-200 rounded-md">
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              View reports
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              Approve leaves
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Employee <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <div className="flex items-center gap-2 w-full pl-3 pr-10 h-10 border border-gray-200 rounded-md">
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              View payslips
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-gray-100 rounded-full text-sm">
                              Mark attendance
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payroll Settings Content */}
                {activeTab === "payroll" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Payroll & Attendance Settings</h2>
                      <p className="text-sm text-gray-500">Set up and manage your Payroll & Attendance Settings</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Salary Calculation <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            defaultValue="Daily Rate"
                            className="w-full pl-3 pr-10 h-10 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            readOnly
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Currency <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <button className="w-full px-3 h-10 border border-gray-200 rounded-md text-sm text-left flex items-center">
                            <Image
                              src="/placeholder.svg?height=20&width=20"
                              alt="USD"
                              width={20}
                              height={20}
                              className="mr-2 rounded-full"
                            />
                            USD
                            <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Payslip Format <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            defaultValue="PDF"
                            className="w-full pl-3 pr-10 h-10 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                      <h2 className="text-lg font-semibold text-gray-900">Notifications & Alerts</h2>
                      <p className="text-sm text-gray-500">Manage notification and alerts for your system.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Email Alerts</h3>
                          <p className="text-sm text-gray-500">Send email alerts for late attendance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Reminder</h3>
                          <p className="text-sm text-gray-500">Remind employees of pending approvals</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Deadline</h3>
                          <p className="text-sm text-gray-500">Notify HR of payroll processing deadline</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
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
  )
}

