"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Building2, Plus, MapPin, DollarSign, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardHeader from "@/components/DashboardHeader"
import { useToast } from "@/hooks/use-toast"

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

export default function BusinessSetup() {
  const { toast } = useToast()
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [activeTab, setActiveTab] = useState("locations")
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [newLocation, setNewLocation] = useState({ name: "" })
  const [newTrade, setNewTrade] = useState({ name: "", location: "", dailyRate: "" })
  const [newProject, setNewProject] = useState({
    name: "",
    location: "",
    currency: "USD",
    startDate: "",
    endDate: "",
  })

  // Data states
  const [locations, setLocations] = useState<Location[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  // Fetch business setup data
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // In a real implementation, this would be:
        // const locationsResponse = await fetch('/api/business/locations');
        // const tradesResponse = await fetch('/api/business/trades');
        // const projectsResponse = await fetch('/api/business/projects');
        // setLocations(await locationsResponse.json());
        // setTrades(await tradesResponse.json());
        // setProjects(await projectsResponse.json());

        // Sample data for now
        setLocations([
          { id: 1, name: "Main Office" },
          { id: 2, name: "Site A" },
          { id: 3, name: "Site B" },
          { id: 4, name: "Site C" },
        ])

        setTrades([
          { id: 1, name: "Electricians", location: "Main Office", dailyRate: 120, icon: "⚡" },
          { id: 2, name: "Technicians", location: "Site A", dailyRate: 100, icon: "🔧" },
          { id: 3, name: "HR & Admin", location: "Site B", dailyRate: 90, icon: "👨‍💼" },
          { id: 4, name: "Supervisors", location: "Site C", dailyRate: 120, icon: "👷" },
        ])

        setProjects([
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
            name: "Project D",
            location: "Site C",
            currency: "USD",
            startDate: "15-Apr-2025",
            endDate: "15-Oct-2025",
          },
        ])

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching business data:", error)
        toast({
          title: "Error",
          description: "Failed to load business data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchBusinessData()
  }, [toast])

  const handleAddLocation = async () => {
    try {
      if (!newLocation.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Location name is required.",
          variant: "destructive",
        })
        return
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // In a real implementation, this would be:
      // const response = await fetch('/api/business/locations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newLocation),
      // });
      // const data = await response.json();

      // Add new location to state
      const newId = Math.max(...locations.map((loc) => loc.id), 0) + 1
      setLocations([...locations, { id: newId, name: newLocation.name }])

      setShowAddLocation(false)
      setNewLocation({ name: "" })

      toast({
        title: "Location Added",
        description: `Location ${newLocation.name} has been added successfully.`,
      })
    } catch (error) {
      console.error("Error adding location:", error)
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddTrade = async () => {
    try {
      if (!newTrade.name.trim() || !newTrade.location.trim() || !newTrade.dailyRate.trim()) {
        toast({
          title: "Validation Error",
          description: "All trade fields are required.",
          variant: "destructive",
        })
        return
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // In a real implementation, this would be:
      // const response = await fetch('/api/business/trades', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newTrade),
      // });
      // const data = await response.json();

      // Add new trade to state
      const newId = Math.max(...trades.map((trade) => trade.id), 0) + 1
      const icon = getIconForTrade(newTrade.name)
      setTrades([
        ...trades,
        {
          id: newId,
          name: newTrade.name,
          location: newTrade.location,
          dailyRate: Number(newTrade.dailyRate),
          icon,
        },
      ])

      setShowAddTrade(false)
      setNewTrade({ name: "", location: "", dailyRate: "" })

      toast({
        title: "Trade Added",
        description: `${newTrade.name} has been added successfully.`,
      })
    } catch (error) {
      console.error("Error adding trade:", error)
      toast({
        title: "Error",
        description: "Failed to add trade. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddProject = async () => {
    try {
      if (!newProject.name.trim() || !newProject.location.trim() || !newProject.startDate || !newProject.endDate) {
        toast({
          title: "Validation Error",
          description: "All project fields are required.",
          variant: "destructive",
        })
        return
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // In a real implementation, this would be:
      // const response = await fetch('/api/business/projects', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newProject),
      // });
      // const data = await response.json();

      // Add new project to state
      const newId = Math.max(...projects.map((project) => project.id), 0) + 1
      setProjects([
        ...projects,
        {
          id: newId,
          name: newProject.name,
          location: newProject.location,
          currency: newProject.currency,
          startDate: newProject.startDate,
          endDate: newProject.endDate,
        },
      ])

      setShowAddProject(false)
      setNewProject({
        name: "",
        location: "",
        currency: "USD",
        startDate: "",
        endDate: "",
      })

      toast({
        title: "Project Added",
        description: `${newProject.name} has been added successfully.`,
      })
    } catch (error) {
      console.error("Error adding project:", error)
      toast({
        title: "Error",
        description: "Failed to add project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getIconForTrade = (tradeName: string): string => {
    const tradeIcons: Record<string, string> = {
      Electricians: "⚡",
      Technicians: "🔧",
      "HR & Admin": "👨‍💼",
      Supervisors: "👷",
    }

    return tradeIcons[tradeName] || "👤"
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

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
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  onChange={() => {
                    toast({
                      title: "Select All",
                      description: "All items selected",
                    })
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
                      })
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
                      })
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
    )
  }

  if (isLoading) {
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
    )
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
                  {activeTab === "locations" && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Work Locations</h2>
                          <p className="text-sm text-gray-500">Define different locations where employees work.</p>
                        </div>
                        <Button onClick={() => setShowAddLocation(true)} className="bg-orange-400 hover:bg-orange-500">
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
                        <Button onClick={() => setShowAddTrade(true)} className="bg-orange-400 hover:bg-orange-500">
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
                        <Button onClick={() => setShowAddProject(true)} className="bg-orange-400 hover:bg-orange-500">
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
                <Input
                  placeholder="Main Office"
                  className="pl-10"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ name: e.target.value })}
                />
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleAddLocation}>
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
                <Input
                  placeholder="Electricians"
                  className="pl-10"
                  value={newTrade.name}
                  onChange={(e) => setNewTrade({ ...newTrade, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location Name</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Main Office"
                  className="pl-10"
                  value={newTrade.location}
                  onChange={(e) => setNewTrade({ ...newTrade, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Rate</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter rate"
                  className="pl-10"
                  value={newTrade.dailyRate}
                  onChange={(e) => setNewTrade({ ...newTrade, dailyRate: e.target.value })}
                />
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleAddTrade}>
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
              <Input
                placeholder="Construction A"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Location</label>
              <Select
                value={newProject.location}
                onValueChange={(value) => setNewProject({ ...newProject, location: value })}
              >
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
              <Select
                value={newProject.currency}
                onValueChange={(value) => setNewProject({ ...newProject, currency: value })}
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
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                />
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleAddProject}>
              Add Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

