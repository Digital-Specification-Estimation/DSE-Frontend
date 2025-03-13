"use client"

import { useState } from "react"
import { Search, RefreshCw, DollarSign, ChevronDown, MoreHorizontal, Plus, Upload, User, Calendar } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Employee {
  id: number
  name: string
  avatar: string
  position: string
  dailyRate: number
}

export default function EmployeeManagement() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [employees] = useState<Employee[]>([
    {
      id: 1,
      name: "Courtney Henry",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Electrician",
      dailyRate: 120,
    },
    {
      id: 2,
      name: "Annette Black",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Electrician",
      dailyRate: 120,
    },
    {
      id: 3,
      name: "Kathryn Murphy",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "HR Manager",
      dailyRate: 200,
    },
    {
      id: 4,
      name: "Courtney Henry",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Electrician",
      dailyRate: 120,
    },
    {
      id: 5,
      name: "Brooklyn Simmons",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "HR Manager",
      dailyRate: 200,
    },
    {
      id: 6,
      name: "Marvin McKinney",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Technician",
      dailyRate: 150,
    },
    {
      id: 7,
      name: "Jane Cooper",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Construction Worker",
      dailyRate: 100,
    },
    {
      id: 8,
      name: "Kristin Watson",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Technician",
      dailyRate: 150,
    },
    {
      id: 9,
      name: "Jacob Jones",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Construction Worker",
      dailyRate: 100,
    },
    {
      id: 10,
      name: "Esther Howard",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Technician",
      dailyRate: 150,
    },
    {
      id: 11,
      name: "Arlene McCoy",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Construction Worker",
      dailyRate: 100,
    },
    {
      id: 12,
      name: "Darrell Steward",
      avatar: "/placeholder.svg?height=40&width=40",
      position: "Construction Worker",
      dailyRate: 100,
    },
  ])

  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    dailyRate: "",
    startDate: "",
    status: "",
  })

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
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
              <Button className="bg-blue-700 hover:bg-blue-800 text-white rounded-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Payroll $25,000
              </Button>
            </div>
          </div>
        </header>

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
                Add Employee
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border mb-6">
            <div className="p-4 flex gap-4">
              <div className="relative w-64">
                <div className="flex items-center border rounded-md px-3 py-2">
                  <span className="text-sm">Select by Trade</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
              </div>

              <div className="relative w-64">
                <div className="flex items-center border rounded-md px-3 py-2">
                  <span className="text-sm">Select by Daily Rate</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
              </div>

              <div className="relative w-64 ml-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search trade/position..." className="pl-10 h-9 w-full" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b text-sm text-muted-foreground">
                    <th className="w-10 px-4 py-3 text-left">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </th>
                    <th className="px-4 py-3 text-left">Employee Name</th>
                    <th className="px-4 py-3 text-left">Position/Trade</th>
                    <th className="px-4 py-3 text-left">Daily Rate</th>
                    <th className="w-10 px-4 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
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
                      <td className="px-4 py-3">${employee.dailyRate}</td>
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
        </main>
      </div>

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
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
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
                        onChange={(e) => setNewEmployee({ ...newEmployee, dailyRate: e.target.value })}
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

