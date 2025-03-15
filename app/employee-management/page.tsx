"use client"

import { useState } from "react"
import { Search, Upload, Plus, User, Calendar, ChevronDown, DollarSign } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardHeader from "@/components/DashboardHeader"

// Types
interface Employee {
  id: number
  name: string
  avatar: string
  position: string
  assignedProject: string
  contractStartDate: string
  contractEndDate: string
  dailyRate: number
  accountNumber: string
}

// Sample data
const employees: Employee[] = [
  {
    id: 1,
    name: "Courtney Henry",
    avatar: "/johndoe.jpeg",
    position: "Electrician",
    assignedProject: "Metro Bridge",
    contractStartDate: "Feb 28, 2018",
    contractEndDate: "Feb 28, 2018",
    dailyRate: 120,
    accountNumber: "12345678",
  },
  {
    id: 2,
    name: "Annette Black",
    avatar: "/johndoe.jpeg",
    position: "Electrician",
    assignedProject: "Mall Construction",
    contractStartDate: "May 31, 2015",
    contractEndDate: "May 20, 2015",
    dailyRate: 120,
    accountNumber: "87654321",
  },
  {
    id: 3,
    name: "Kathryn Murphy",
    avatar: "/johndoe.jpeg",
    position: "HR Manager",
    assignedProject: "Metro Bridge",
    contractStartDate: "May 12, 2019",
    contractEndDate: "Nov 16, 2014",
    dailyRate: 200,
    accountNumber: "12345678",
  },
  {
    id: 4,
    name: "Courtney Henry",
    avatar: "/johndoe.jpeg",
    position: "Electrician",
    assignedProject: "Mall Construction",
    contractStartDate: "Sep 9, 2013",
    contractEndDate: "May 29, 2017",
    dailyRate: 120,
    accountNumber: "87654321",
  },
  {
    id: 5,
    name: "Brooklyn Simmons",
    avatar: "/johndoe.jpeg",
    position: "HR Manager",
    assignedProject: "Metro Bridge",
    contractStartDate: "Jul 14, 2015",
    contractEndDate: "May 12, 2019",
    dailyRate: 200,
    accountNumber: "12345678",
  },
  {
    id: 6,
    name: "Marvin McKinney",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "Sep 24, 2017",
    contractEndDate: "Dec 2, 2018",
    dailyRate: 140,
    accountNumber: "87654321",
  },
  {
    id: 7,
    name: "Jane Cooper",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Mar 6, 2018",
    contractEndDate: "Apr 28, 2016",
    dailyRate: 100,
    accountNumber: "12345678",
  },
  {
    id: 8,
    name: "Kristin Watson",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "Aug 2, 2013",
    contractEndDate: "Feb 29, 2012",
    dailyRate: 140,
    accountNumber: "87654321",
  },
  {
    id: 9,
    name: "Jacob Jones",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Aug 7, 2017",
    contractEndDate: "May 31, 2015",
    dailyRate: 100,
    accountNumber: "12345678",
  },
  {
    id: 10,
    name: "Esther Howard",
    avatar: "/johndoe.jpeg",
    position: "Technician",
    assignedProject: "Mall Construction",
    contractStartDate: "May 6, 2012",
    contractEndDate: "Mar 13, 2014",
    dailyRate: 140,
    accountNumber: "87654321",
  },
  {
    id: 11,
    name: "Arlene McCoy",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Metro Bridge",
    contractStartDate: "Oct 30, 2017",
    contractEndDate: "Mar 23, 2013",
    dailyRate: 100,
    accountNumber: "12345678",
  },
  {
    id: 12,
    name: "Darrell Steward",
    avatar: "/johndoe.jpeg",
    position: "Construction Worker",
    assignedProject: "Mall Construction",
    contractStartDate: "Nov 7, 2017",
    contractEndDate: "Oct 31, 2017",
    dailyRate: 100,
    accountNumber: "87654321",
  },
]

const trades = ["Electrician", "HR Manager", "Technician", "Construction Worker"]
const projects = ["Metro Bridge", "Mall Construction"]
const dailyRates = ["$100", "$120", "$140", "$200"]

export default function EmployeeManagement() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const [filters, setFilters] = useState({
    trade: "",
    project: "",
    dailyRate: "",
    search: "",
  })

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    assignedProject: "",
    startDate: "",
    endDate: "",
    accountNumber: "",
    dailyRate: "", // Added dailyRate property
  })

  // Filter employees based on selected filters
  const filteredEmployees = employees.filter((employee) => {
    if (filters.trade && employee.position !== filters.trade) return false
    if (filters.project && employee.assignedProject !== filters.project) return false
    if (filters.dailyRate && `$${employee.dailyRate}` !== filters.dailyRate) return false
    if (filters.search && !employee.position.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    setSelectedEmployees(checked ? employees.map((e) => e.id) : [])
  }

  const handleSelectEmployee = (id: number, checked: boolean) => {
    setSelectedEmployees((prev) => (checked ? [...prev, id] : prev.filter((employeeId) => employeeId !== id)))
  }

  const handleAddEmployee = () => {
    // In a real app, you would add the employee to the database
    setShowAddEmployee(false)
    // Reset form
    setNewEmployee({
      name: "",
      position: "",
      assignedProject: "",
      startDate: "",
      endDate: "",
      accountNumber: "",
      dailyRate: "",
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Employee Management</h1>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload CSV
              </Button>
              <Button onClick={() => setShowAddEmployee(true)} className="bg-orange-500 hover:bg-orange-600 gap-2">
                <Plus className="h-4 w-4" />
                Add New Employee
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            {/* Filters */}
            <div className="p-4 flex gap-4">
              <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, trade: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Trade" />
                </SelectTrigger>
                <SelectContent>
                  {trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, project: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, dailyRate: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Daily Rate" />
                </SelectTrigger>
                <SelectContent>
                  {dailyRates.map((rate) => (
                    <SelectItem key={rate} value={rate}>
                      {rate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-64 ml-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search trade/position..."
                  className="pl-10 h-9 w-full"
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-t border-b text-sm text-muted-foreground">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedEmployees.length === employees.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px]">Employee Name</th>
                    <th className="px-4 py-3 text-left text-[10px]">Position/Trade</th>
                    <th className="px-4 py-3 text-left text-[10px]">Assigned Project</th>
                    <th className="px-4 py-3 text-left text-[10px]">Contract Start Date</th>
                    <th className="px-4 py-3 text-left text-[10px]">Contract Finish Date</th>
                    <th className="px-4 py-3 text-left text-[10px]">Daily Rate</th>
                    <th className="px-4 py-3 text-left text-[10px]">Account Number</th>
                    <th className="w-10 px-4 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee.avatar} alt={employee.name} />
                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{employee.position}</td>
                      <td className="px-4 py-3">{employee.assignedProject}</td>
                      <td className="px-4 py-3">{employee.contractStartDate}</td>
                      <td className="px-4 py-3">{employee.contractEndDate}</td>
                      <td className="px-4 py-3">${employee.dailyRate}</td>
                      <td className="px-4 py-3">{employee.accountNumber}</td>
                      <td className="px-4 py-3 text-right">...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Employee Sheet */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Employee</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddEmployee(false)}>
                  &times;
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Employee details</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Johny William"
                        value={newEmployee.name}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            name: e.target.value,
                          })
                        }
                        className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="position" className="text-sm font-medium">
                      Position/Trade
                    </label>
                    <div className="relative">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="text-sm">Select</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dailyRate" className="text-sm font-medium">
                      Daily Rate
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="dailyRate"
                        name="dailyRate"
                        type="text"
                        placeholder="Enter rate"
                        value={newEmployee.dailyRate}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            dailyRate: e.target.value,
                          })
                        }
                        className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="startDate" className="text-sm font-medium">
                      Start Date
                    </label>
                    <div className="relative">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="text-sm">Pick Date</span>
                        <Calendar className="h-4 w-4 ml-auto" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      Attendance Status
                    </label>
                    <div className="relative">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="text-sm">Select</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </div>
                    </div>
                  </div>

                  <div className="text-sm">
                    Want to upload multiple employees? Use{" "}
                    <a href="#" className="text-primary underline">
                      CSV instead
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 mt-auto">
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddEmployee(false)}>
                Add Employee
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

