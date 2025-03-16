"use client"

import { useState, useRef, useEffect } from "react"
import { Search, RefreshCw, FileText, ChevronDown, Plus, ChevronUp, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Types
interface Trade {
  id: number
  role: string
  icon: string
  employeesNumber: number
  workDays: number
  plannedSalary: number
  actualCost?: number
}

interface Project {
  id: number
  name: string
  budget: number
  trades: Trade[]
  isExpanded?: boolean
}

// Sample data
const initialProjects: Project[] = [
  {
    id: 1,
    name: "Project A",
    budget: 32000,
    isExpanded: true,
    trades: [
      {
        id: 1,
        role: "Electricians",
        icon: "⚡",
        employeesNumber: 10,
        workDays: 22,
        plannedSalary: 5000,
        actualCost: 5500,
      },
      {
        id: 2,
        role: "Technicians",
        icon: "🔧",
        employeesNumber: 8,
        workDays: 22,
        plannedSalary: 3200,
        actualCost: 4100,
      },
      {
        id: 3,
        role: "HR & Admin",
        icon: "👨‍💼",
        employeesNumber: 4,
        workDays: 22,
        plannedSalary: 4000,
        actualCost: 6500,
      },
      {
        id: 4,
        role: "Supervisors",
        icon: "👷",
        employeesNumber: 6,
        workDays: 22,
        plannedSalary: 6500,
        actualCost: 3700,
      },
    ],
  },
  {
    id: 2,
    name: "Project B",
    budget: 32000,
    isExpanded: false,
    trades: [
      {
        id: 5,
        role: "Electricians",
        icon: "⚡",
        employeesNumber: 8,
        workDays: 22,
        plannedSalary: 5000,
        actualCost: 4800,
      },
      {
        id: 6,
        role: "Technicians",
        icon: "🔧",
        employeesNumber: 6,
        workDays: 22,
        plannedSalary: 4200,
        actualCost: 4100,
      },
    ],
  },
]

export default function BudgetPlanning() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [activeTab, setActiveTab] = useState("plan")
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [showEditTrade, setShowEditTrade] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("This Month")

  const chartRef = useRef<HTMLDivElement>(null)

  // Calculate totals for the cost trend view
  const totalPlannedCost = projects.reduce(
    (sum, project) => sum + project.trades.reduce((s, trade) => s + trade.plannedSalary, 0),
    0,
  )

  const totalActualCost = projects.reduce(
    (sum, project) => sum + project.trades.reduce((s, trade) => s + (trade.actualCost || 0), 0),
    0,
  )

  // New trade form state
  const [newTrade, setNewTrade] = useState({
    role: "",
    employeesNumber: "",
    workDays: "22",
    plannedSalary: "",
    projectId: "",
  })

  // Edit trade form state
  const [editTrade, setEditTrade] = useState({
    id: 0,
    role: "",
    employeesNumber: "",
    workDays: "",
    plannedSalary: "",
  })

  const handleAddTrade = () => {
    const projectId = Number.parseInt(newTrade.projectId)
    const project = projects.find((p) => p.id === projectId)

    if (project) {
      const updatedProjects = projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            trades: [
              ...p.trades,
              {
                id: Math.max(...projects.flatMap((p) => p.trades.map((t) => t.id))) + 1,
                role: newTrade.role,
                icon: getIconForRole(newTrade.role),
                employeesNumber: Number.parseInt(newTrade.employeesNumber),
                workDays: Number.parseInt(newTrade.workDays),
                plannedSalary: Number.parseInt(newTrade.plannedSalary),
                actualCost: 0,
              },
            ],
          }
        }
        return p
      })

      setProjects(updatedProjects)
      setShowAddTrade(false)
      setNewTrade({
        role: "",
        employeesNumber: "",
        workDays: "22",
        plannedSalary: "",
        projectId: "",
      })
    }
  }

  const handleEditTrade = () => {
    const updatedProjects = projects.map((project) => {
      const updatedTrades = project.trades.map((trade) => {
        if (trade.id === editTrade.id) {
          return {
            ...trade,
            role: editTrade.role,
            employeesNumber: Number.parseInt(editTrade.employeesNumber),
            workDays: Number.parseInt(editTrade.workDays),
            plannedSalary: Number.parseInt(editTrade.plannedSalary),
          }
        }
        return trade
      })

      return {
        ...project,
        trades: updatedTrades,
      }
    })

    setProjects(updatedProjects)
    setShowEditTrade(false)
  }

  const handleTradeAction = (action: string, trade: Trade, projectId: number) => {
    if (action === "edit") {
      setEditTrade({
        id: trade.id,
        role: trade.role,
        employeesNumber: trade.employeesNumber.toString(),
        workDays: trade.workDays.toString(),
        plannedSalary: trade.plannedSalary.toString(),
      })
      setSelectedTrade(trade)
      setShowEditTrade(true)
    } else if (action === "delete") {
      const updatedProjects = projects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            trades: project.trades.filter((t) => t.id !== trade.id),
          }
        }
        return project
      })
      setProjects(updatedProjects)
    }
  }

  const toggleProjectExpansion = (projectId: number) => {
    setProjects(
      projects.map((project) => (project.id === projectId ? { ...project, isExpanded: !project.isExpanded } : project)),
    )
  }

  const getIconForRole = (role: string) => {
    switch (role) {
      case "Electricians":
        return "⚡"
      case "Technicians":
        return "🔧"
      case "HR & Admin":
        return "👨‍💼"
      case "Supervisors":
        return "👷"
      default:
        return "👤"
    }
  }

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) => {
    if (!searchTerm) return true

    // Check if project name matches
    if (project.name.toLowerCase().includes(searchTerm.toLowerCase())) return true

    // Check if any trade in the project matches
    return project.trades.some((trade) => trade.role.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  // Create interactive chart
  useEffect(() => {
    if (activeTab === "costs" && chartRef.current) {
      // In a real implementation, you would use a charting library like Chart.js or Recharts
      // This is a simplified version for demonstration purposes
    }
  }, [activeTab, projects])

  // Get all unique trade roles across all projects
  const allTrades = Array.from(new Set(projects.flatMap((p) => p.trades.map((t) => t.role))))

  // Calculate planned and actual costs for each trade role
  const tradeData = allTrades.map((role) => {
    const plannedCost = projects.reduce(
      (sum, project) => sum + project.trades.filter((t) => t.role === role).reduce((s, t) => s + t.plannedSalary, 0),
      0,
    )

    const actualCost = projects.reduce(
      (sum, project) =>
        sum + project.trades.filter((t) => t.role === role).reduce((s, t) => s + (t.actualCost || 0), 0),
      0,
    )

    return { role, plannedCost, actualCost, difference: actualCost - plannedCost }
  })

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search" className="pl-10 h-9 w-full" />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button className="bg-blue-700 hover:bg-blue-800 text-white rounded-full flex items-center gap-2">
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 6V18M18 12H6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Total Payroll $25,000
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Budget Planning & Cost Comparison</h1>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 h-12 rounded-full">
                <FileText className="h-4 w-4" />
                Export Report
              </Button>
              <Button onClick={() => setShowAddTrade(true)} className="bg-orange-400 hover:bg-orange-500 gap-2  h-12 rounded-full">
                <Plus className="h-4 w-4" />
                Add New Trade
              </Button>
            </div>
          </div>

          <Tabs defaultValue="plan" value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b mb-6">
              <TabsList className="p-0 h-auto bg-transparent">
                <TabsTrigger
                  value="plan"
                  className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Plan Budget
                </TabsTrigger>
                <TabsTrigger
                  value="costs"
                  className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Costs Trend
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Plan Budget Tab */}
            <TabsContent value="plan" className="p-0 mt-0">
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="This Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="This Month">This Month</SelectItem>
                      <SelectItem value="Last Month">Last Month</SelectItem>
                      <SelectItem value="This Quarter">This Quarter</SelectItem>
                      <SelectItem value="This Year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search project..."
                    className="pl-10 h-9 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg border mb-4">
                  <div
                    className="flex items-center p-4 cursor-pointer"
                    onClick={() => toggleProjectExpansion(project.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center text-white">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M3 9L12 5L21 9M3 9V17L12 21M3 9L12 13M12 21L21 17V9M12 21V13M21 9L12 13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span className="font-medium">{project.name}</span>
                      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full">
                        ${project.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="ml-auto">
                      {project.isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {project.isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-t border-b text-sm text-muted-foreground">
                            <th className="px-4 py-3 text-left">SN</th>
                            <th className="px-4 py-3 text-left">Role/Trade</th>
                            <th className="px-4 py-3 text-left">Employees Number</th>
                            <th className="px-4 py-3 text-left">Work Days</th>
                            <th className="px-4 py-3 text-left">Planned Salary ($)</th>
                            <th className="w-10 px-4 py-3 text-left"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.trades.map((trade, index) => (
                            <tr key={trade.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3">{index + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                                    {trade.icon}
                                  </div>
                                  <span className="font-medium">{trade.role}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">{trade.employeesNumber}</td>
                              <td className="px-4 py-3">{trade.workDays}</td>
                              <td className="px-4 py-3">${trade.plannedSalary.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleTradeAction("edit", trade, project.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleTradeAction("delete", trade, project.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            {/* Costs Trend Tab */}
            <TabsContent value="costs" className="p-0 mt-0">
              <div className="bg-white rounded-lg border p-6">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium">Total Planned Cost</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-700"></div>
                        <span className="text-sm font-medium">Total Actual Cost</span>
                      </div>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-3xl font-bold">${totalPlannedCost.toLocaleString()}</div>
                      <div className="text-3xl font-bold">${totalActualCost.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <div className="relative">
                        <Input type="date" className="w-[150px]" placeholder="From Date" />
                      </div>
                      <div className="relative">
                        <Input type="date" className="w-[150px]" placeholder="To Date" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Chart */}
                <div className="h-80 relative mb-8" ref={chartRef}>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-gray-500">
                    <div>$30K</div>
                    <div>$20K</div>
                    <div>$15K</div>
                    <div>$10K</div>
                    <div>$5K</div>
                    <div>0</div>
                  </div>

                  {/* Average line */}
                  <div className="absolute left-0 top-[48%] w-full z-10">
                    <div className="relative">
                      <div className="absolute -left-10 -top-3 bg-green-700 text-white text-xs px-1.5 py-0.5 rounded">
                        Avg
                      </div>
                      <div className="border-t border-dashed border-gray-300 w-full"></div>
                    </div>
                  </div>

                  {/* Chart bars */}
                  <div className="ml-12 h-full flex items-end justify-between">
                    {allTrades.map((role, index) => {
                      const data = tradeData.find((t) => t.role === role)
                      if (!data) return null

                      const maxHeight = 240 // Maximum height in pixels
                      const maxValue = Math.max(...tradeData.map((t) => Math.max(t.plannedCost, t.actualCost)))
                      const plannedHeight = (data.plannedCost / maxValue) * maxHeight
                      const actualHeight = (data.actualCost / maxValue) * maxHeight

                      // Calculate if this bar should show the tooltip
                      const showTooltip = role === "HR & Admin"

                      return (
                        <div
                          key={role}
                          className="flex flex-col items-center gap-2 group"
                          style={{ width: `${100 / allTrades.length}%` }}
                        >
                          <div className="relative flex items-end justify-center w-full gap-1">
                            {/* Planned cost bar */}
                            <div
                              className="w-20 bg-orange-500 transition-all duration-500 ease-in-out cursor-pointer"
                              style={{ height: `${plannedHeight}px` }}
                              onMouseEnter={(e) => {
                                // Show tooltip on hover
                                const tooltip = e.currentTarget.nextElementSibling?.nextElementSibling
                                if (tooltip) {
                                  tooltip.classList.remove("opacity-0")
                                  tooltip.classList.add("opacity-100")
                                }
                              }}
                            ></div>

                            {/* Actual cost bar */}
                            <div
                              className="w-20 bg-blue-700 transition-all duration-500 ease-in-out cursor-pointer"
                              style={{ height: `${actualHeight}px` }}
                              onMouseEnter={(e) => {
                                // Show tooltip on hover
                                const tooltip = e.currentTarget.nextElementSibling
                                if (tooltip) {
                                  tooltip.classList.remove("opacity-0")
                                  tooltip.classList.add("opacity-100")
                                }
                              }}
                            ></div>

                            {/* Interactive tooltip - shown on hover or permanently for HR & Admin */}
                            <div
                              className={`absolute top-0 right-0 bg-white border rounded-md p-2 shadow-md transition-opacity duration-200 
                                ${showTooltip ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                              style={{
                                transform: "translateY(-100%)",
                                right: showTooltip ? "0" : "50%",
                                zIndex: 20,
                              }}
                              onMouseLeave={(e) => {
                                // Hide tooltip on mouse leave unless it's the permanent one
                                if (!showTooltip) {
                                  e.currentTarget.classList.remove("opacity-100")
                                  e.currentTarget.classList.add("opacity-0")
                                }
                              }}
                            >
                              <div className="text-sm font-medium">{role}</div>
                              <div className="text-sm">
                                Actual Cost <span className="font-bold">${data.actualCost.toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-green-600">
                                +${data.difference > 0 ? data.difference.toLocaleString() : 0} over budget
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{role}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Budget vs Actual Report */}
                <div>
                  <h3 className="font-medium mb-4">Budget vs Actual Report</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-t border-b text-sm text-muted-foreground">
                        <th className="px-4 py-3 text-left">Trade/Position</th>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                            Planned Budget (${totalPlannedCost.toLocaleString()})
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-700"></div>
                            Actual Cost (${totalActualCost.toLocaleString()})
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left">Difference</th>
                        <th className="w-10 px-4 py-3 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeData.map((data) => (
                        <tr key={data.role} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                                {getIconForRole(data.role)}
                              </div>
                              <span className="font-medium">{data.role}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">${data.plannedCost.toLocaleString()}</td>
                          <td className="px-4 py-3">${data.actualCost.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {data.difference > 0 ? (
                              <Badge className="bg-green-50 text-green-700">+${data.difference.toLocaleString()}</Badge>
                            ) : (
                              <Badge className="bg-red-50 text-red-700">
                                -${Math.abs(data.difference).toLocaleString()}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add Trade Sheet */}
      <Sheet open={showAddTrade} onOpenChange={setShowAddTrade}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Adding New Trade</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">Trade details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Position/Trade</label>
                    <Select onValueChange={(value) => setNewTrade({ ...newTrade, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electricians">Electricians</SelectItem>
                        <SelectItem value="Technicians">Technicians</SelectItem>
                        <SelectItem value="HR & Admin">HR & Admin</SelectItem>
                        <SelectItem value="Supervisors">Supervisors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Project</label>
                    <Select onValueChange={(value) => setNewTrade({ ...newTrade, projectId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Days</label>
                    <Input
                      type="number"
                      value={newTrade.workDays}
                      onChange={(e) => setNewTrade({ ...newTrade, workDays: e.target.value })}
                      placeholder="22"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employees Number</label>
                    <Input
                      type="number"
                      value={newTrade.employeesNumber}
                      onChange={(e) => setNewTrade({ ...newTrade, employeesNumber: e.target.value })}
                      placeholder="Enter number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Planned Salary</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        type="number"
                        className="pl-7"
                        value={newTrade.plannedSalary}
                        onChange={(e) => setNewTrade({ ...newTrade, plannedSalary: e.target.value })}
                        placeholder="5,000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleAddTrade}>
            Add Now
          </Button>
        </SheetContent>
      </Sheet>

      {/* Edit Trade Sheet */}
      <Sheet open={showEditTrade} onOpenChange={setShowEditTrade}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Position/Trade</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">Position/Trade details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Position/Trade</label>
                    <Select
                      value={editTrade.role}
                      onValueChange={(value) => setEditTrade({ ...editTrade, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electricians">Electricians</SelectItem>
                        <SelectItem value="Technicians">Technicians</SelectItem>
                        <SelectItem value="HR & Admin">HR & Admin</SelectItem>
                        <SelectItem value="Supervisors">Supervisors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employee Numbers</label>
                    <Input
                      type="number"
                      value={editTrade.employeesNumber}
                      onChange={(e) => setEditTrade({ ...editTrade, employeesNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Days</label>
                    <Input
                      type="number"
                      value={editTrade.workDays}
                      onChange={(e) => setEditTrade({ ...editTrade, workDays: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Planned Salary</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        type="number"
                        className="pl-7"
                        value={editTrade.plannedSalary}
                        onChange={(e) => setEditTrade({ ...editTrade, plannedSalary: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleEditTrade}>
            Apply Edits
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}

