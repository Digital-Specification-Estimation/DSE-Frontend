"use client"

import type React from "react"

import { useState } from "react"
import { Search, RefreshCw, Building2, Plus, MapPin, DollarSign } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardHeader from "@/components/DashboardHeader"

// Types
interface Location {
  id: number
  name: string
}

interface Trade {
  id: number
  name: string
  location: string
  dailyRate: number
  icon: string
}

interface Project {
  id: number
  name: string
  location: string
  currency: string
  startDate: string
  endDate: string
}

// Data
const locations: Location[] = [
  { id: 1, name: "Main Office" },
  { id: 2, name: "Site A" },
  { id: 3, name: "Site B" },
  { id: 4, name: "Site C" },
]

const trades: Trade[] = [
  { id: 1, name: "Electricians", location: "Main Office", dailyRate: 120, icon: "⚡" },
  { id: 2, name: "Technicians", location: "Site A", dailyRate: 100, icon: "🔧" },
  { id: 3, name: "HR & Admin", location: "Site B", dailyRate: 90, icon: "👨‍💼" },
  { id: 4, name: "Supervisors", location: "Site C", dailyRate: 120, icon: "👷" },
]

const projects: Project[] = [
  {
    id: 1,
    name: "Project A",
    location: "Site A",
    currency: "USD",
    startDate: "01-Mar-2025",
    endDate: "30-Sep-2025",
  },
  {
    id: 2,
    name: "Project B",
    location: "IT Main Office",
    currency: "USD",
    startDate: "15-Apr-2025",
    endDate: "15-Oct-2025",
  },
  {
    id: 3,
    name: "Project C",
    location: "Site B",
    currency: "USD",
    startDate: "01-Mar-2025",
    endDate: "30-Sep-2025",
  },
  {
    id: 4,
    name: "Project C",
    location: "Site C",
    currency: "USD",
    startDate: "15-Apr-2025",
    endDate: "15-Oct-2025",
  },
]

// Table Component
function DataTable({
  headers,
  data,
  renderRow,
}: {
  headers: string[]
  data: any[]
  renderRow: (item: any) => React.ReactNode
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-t border-b text-sm text-gray-500">
            <th className="w-10 px-4 py-3 text-left">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
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
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
              </td>
              <td className="px-4 py-3">{index + 1}</td>
              {renderRow(item)}
              <td className="px-4 py-3 text-right">...</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function BusinessSetup() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [activeTab, setActiveTab] = useState("locations")
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader/>
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto py-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[22px] font-semibold text-gray-900">Business Setup</h1>
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
                  onClick={() => setActiveTab("locations")}
                >
                  Locations
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "trades"
                      ? "text-gray-900 font-medium border border-gray-300 rounded-2xl bg-gray-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab("trades")}
                >
                  Trades
                </button>
                <button
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === "projects"
                      ? "text-gray-900 font-medium border border-gray-300 rounded-2xl bg-gray-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab("projects")}
                >
                  Projects
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  {activeTab === "locations" && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Work Locations</h2>
                          <p className="text-sm text-gray-500">Define different locations where employees work.</p>
                        </div>
                        <Button onClick={() => setShowAddLocation(true)} className="bg-orange-500 hover:bg-orange-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Location
                        </Button>
                      </div>
                      <DataTable
                        headers={["Location Name"]}
                        data={locations}
                        renderRow={(location) => (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {location.name}
                            </div>
                          </td>
                        )}
                      />
                    </>
                  )}

                  {activeTab === "trades" && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Trade/Job Role & Daily Rates</h2>
                          <p className="text-sm text-gray-500">Define different roles and set daily rates for each.</p>
                        </div>
                        <Button onClick={() => setShowAddTrade(true)} className="bg-orange-500 hover:bg-orange-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Trade
                        </Button>
                      </div>
                      <DataTable
                        headers={["Role/Trade", "Location Name", "Daily Rate ($)"]}
                        data={trades}
                        renderRow={(trade) => (
                          <>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                                  {trade.icon}
                                </div>
                                {trade.name}
                              </div>
                            </td>
                            <td className="px-4 py-3">{trade.location}</td>
                            <td className="px-4 py-3">${trade.dailyRate}</td>
                          </>
                        )}
                      />
                    </>
                  )}

                  {activeTab === "projects" && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Company Projects</h2>
                          <p className="text-sm text-gray-500">Set up projects and assign locations.</p>
                        </div>
                        <Button onClick={() => setShowAddProject(true)} className="bg-orange-500 hover:bg-orange-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Project
                        </Button>
                      </div>
                      <DataTable
                        headers={["Project Name", "Location Name", "Currency", "Start Date", "End Date"]}
                        data={projects}
                        renderRow={(project) => (
                          <>
                            <td className="px-4 py-3">{project.name}</td>
                            <td className="px-4 py-3">{project.location}</td>
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
                            <td className="px-4 py-3">{project.startDate}</td>
                            <td className="px-4 py-3">{project.endDate}</td>
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
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Main Office" className="pl-10" />
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddLocation(false)}>
              Add Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Trade Modal */}
      <Dialog open={showAddTrade} onOpenChange={setShowAddTrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adding New Trade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Electricians" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location Name</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Main Office" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Rate</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Enter rate" className="pl-10" />
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddTrade(false)}>
              Add Trade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adding New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input placeholder="Construction A" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Location</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Currency</label>
              <Select>
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
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" />
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddProject(false)}>
              Add Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

